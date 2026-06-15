import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"
import { getWorkspaceSnapshot, renderSnapshot } from "@/lib/ai/workspace-context"
import { checkRate, recordUsage } from "@/lib/ai/metering"
import { checkCaps } from "@/lib/ai/caps"
import { resolveModelChain, gatewayComplete, recordUsageEvent } from "@/lib/ai/gateway"
import { SAFETY_CLAUSES, fenceUntrusted, proposeAction } from "@/lib/ai/safety"
import { getWorkspaceJurisdiction } from "@/lib/international/workspace-jurisdiction"
import { aiJurisdictionClause } from "@/lib/international/guardrails"
import { gateAiCopilot } from "@/lib/billing/gates"

const actionsSchema = z.object({
  action: z.string().min(1, "action is required").max(100),
  workspaceId: z.string().min(1, "workspaceId is required").max(100),
  recordId: z.string().min(1).max(100).optional(),
})

/* ------------------------------------------------------------------ */
/* Supported action types and their prompts                            */
/* ------------------------------------------------------------------ */
type ActionType =
  | "explain-portfolio"
  | "find-missing-docs"
  | "check-arrears"
  | "review-planning"
  | "upcoming-priorities"
  | "cashflow-forecast"
  | "draft-landlord-offer"
  | "compliance-check"

interface ActionConfig {
  prompt: string
  requiresApproval: boolean
  mutationType?: string
}

const ACTION_CONFIGS: Record<ActionType, ActionConfig> = {
  "explain-portfolio": {
    prompt:
      "Provide a concise portfolio health summary for a UK property operator. Cover: total properties, estimated occupancy, gross monthly rent range, any void units or concerns. Be specific and actionable. Under 200 words.",
    requiresApproval: false,
  },
  "find-missing-docs": {
    prompt:
      "List the most common missing documents for UK rental properties and tenancies. Include: Gas Safety Certificate, EICR, EPC, signed AST, deposit protection, Right to Rent checks. Explain the legal risk of each. Under 250 words.",
    requiresApproval: false,
  },
  "check-arrears": {
    prompt:
      "Provide advice for a UK property operator checking rent arrears. Explain what to look for, legal thresholds before serving notice (Section 8), and suggest example chase message templates. End by asking: 'Would you like me to draft personalised chase messages for specific tenants?' Under 250 words.",
    requiresApproval: false,
  },
  "review-planning": {
    prompt:
      "Help a UK property operator review their planning sets (strategic acquisition/development plans). Cover: key risk areas, planning permission timelines, what documents should be in a complete planning set, common oversights. Under 250 words.",
    requiresApproval: false,
  },
  "upcoming-priorities": {
    prompt:
      "List the top weekly priorities for a UK property manager. Organise by urgency: compliance due, maintenance jobs, rent collection, tenant communications, legal deadlines. Provide a prioritised checklist format. Under 200 words.",
    requiresApproval: false,
  },
  "cashflow-forecast": {
    prompt:
      "Explain how a UK property operator should analyse their 30-day cashflow. Cover: gross rent in, mortgage payments, management fees, maintenance reserves, insurance, voids risk. Provide a simple framework and example calculation. Under 250 words.",
    requiresApproval: false,
  },
  "draft-landlord-offer": {
    prompt:
      "Draft a professional landlord acquisition offer letter for a UK property. Include: property address placeholder, offered price, proposed completion timeline, any special conditions (subject to survey, vacant possession). Make it professional and compelling. Under 300 words.",
    requiresApproval: true,
    mutationType: "document-creation",
  },
  "compliance-check": {
    prompt:
      "Provide a UK rental property compliance checklist. Cover: Gas Safety (annual), EICR (every 5 years), EPC (every 10 years, min E rating), smoke/CO alarms, Legionella risk assessment, HMO licensing if applicable, deposit protection (30 days). Include frequency and legal consequences of non-compliance. Under 300 words.",
    requiresApproval: false,
  },
}

/* ------------------------------------------------------------------ */
/* POST handler                                                         */
/* ------------------------------------------------------------------ */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Parse and validate body
    const rawBody = await request.json()
    const parseResult = actionsSchema.safeParse(rawBody)
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues }, { status: 400 })
    }
    const { action, workspaceId, recordId } = parseResult.data

    const actionConfig = ACTION_CONFIGS[action as ActionType]
    if (!actionConfig) {
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }

    // 3. Verify workspace membership (skip demo workspace)
    if (workspaceId !== "demo-workspace") {
      const { data: member } = await supabase
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", workspaceId)
        .eq("user_id", user.id)
        .single()

      if (!member) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      // Plan gate — AI Copilot is a Scale+ feature.
      const gate = await gateAiCopilot(supabase, workspaceId)
      if (!gate.allowed) {
        return NextResponse.json(
          { error: gate.reason, upgrade: true, tier: gate.tier },
          { status: gate.status ?? 402 }
        )
      }

      // HARD CAPS — fail closed. Refuse over any rolling-window or cost limit.
      const caps = await checkCaps(supabase, workspaceId)
      if (!caps.allowed) {
        return NextResponse.json(
          { error: caps.reason, quotaExceeded: true, limit: caps.exceeded, tier: caps.tier },
          { status: 429 }
        )
      }
    }

    // 3b. Burst rate limit (per workspace, best-effort)
    const rate = await checkRate(supabase, workspaceId)
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many AI actions in a short time. Please wait a moment." },
        { status: 429 }
      )
    }

    // 4. Build contextual system prompt with LIVE workspace data. The snapshot
    // is fenced + injection-sanitised; safety clauses override anything inside.
    const snapshot = await getWorkspaceSnapshot(supabase, workspaceId)
    const fencedSnapshot = fenceUntrusted("WORKSPACE DATA", renderSnapshot(snapshot))

    // Jurisdiction-aware framing. The canned actions are UK-shaped; for a
    // non-reviewed jurisdiction this clause downgrades legal/tax depth to generic
    // and adds the stronger "consult a local professional" disclaimer.
    const jurisdiction = await getWorkspaceJurisdiction(supabase, workspaceId)
    const jurisdictionClause = aiJurisdictionClause({
      countryCode: jurisdiction.countryCode,
      countryName: jurisdiction.countryName,
      status: jurisdiction.effectiveStatus,
      currency: jurisdiction.currency,
      locale: jurisdiction.locale,
    })

    const systemPrompt = `You are the Propvora AI Copilot for property operations management.
You are executing a structured AI action requested by the user.
${recordId ? `Record ID context: ${recordId}` : ""}

${fencedSnapshot}

${SAFETY_CLAUSES}

${jurisdictionClause}

Provide expert, actionable property management guidance.
Follow the JURISDICTION rules above: the action templates assume UK regulations, but if this workspace's jurisdiction is not fully reviewed you MUST keep legal/tax/compliance content generic, avoid citing jurisdiction-specific statutes, and direct the user to a qualified local professional.
Use the live workspace counts above where relevant; do not invent figures that aren't shown.
This produces guidance/draft content only — any data change is proposed for the user to approve, never executed here.`

    // 5. Call the multi-provider gateway (provider/model from the catalogue,
    // graceful fallback to OpenAI). Keys come from env only.
    const chain = await resolveModelChain(supabase)
    const result = await gatewayComplete(chain, {
      maxTokens: 600,
      temperature: 0.65,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: actionConfig.prompt },
      ],
    })
    const content = result.text || "Unable to generate a response at this time."

    // 6. Log action (best-effort) — ai_action_logs uses `approved` (no status col)
    try {
      await supabase.from("ai_action_logs").insert({
        workspace_id: workspaceId,
        user_id: user.id,
        action_type: action,
        context: { record_id: recordId ?? null },
        result: {
          content_length: content.length,
          requires_approval: actionConfig.requiresApproval,
          mutation_type: actionConfig.mutationType ?? null,
          provider: result.provider,
          model: result.model,
          tokens_in: result.tokensIn,
          tokens_out: result.tokensOut,
        },
        approved: actionConfig.requiresApproval ? false : true,
      })
    } catch {
      // Non-fatal — table may not exist in early builds
    }

    // 6b. Meter token usage — new per-call ledger + legacy tables.
    await recordUsageEvent(supabase, {
      workspaceId,
      userId: user.id,
      route: `ai/actions:${action}`,
      usage: {
        provider: result.provider,
        model: result.model,
        tokensIn: result.tokensIn,
        tokensOut: result.tokensOut,
        costPence: result.costPence,
      },
    })
    await recordUsage(supabase, {
      workspaceId,
      userId: user.id,
      actionType: `action:${action}`,
      model: result.model,
      inputTokens: result.tokensIn,
      outputTokens: result.tokensOut,
      entityType: recordId ? "record" : undefined,
      entityId: recordId,
    })

    // 6c. For mutation actions, enqueue a real approval request (source of truth
    // for the human-approval gate). Best-effort; the card still renders if absent.
    let approvalId: string | null = null
    if (actionConfig.requiresApproval) {
      try {
        const { data: q } = await supabase
          .from("ai_approval_queue")
          .insert({
            workspace_id: workspaceId,
            source: "copilot_action",
            action_type: action,
            summary: `Copilot proposed: ${action.replace(/-/g, " ")}`,
            rationale: content.slice(0, 2000),
            payload: { record_id: recordId ?? null, mutation_type: actionConfig.mutationType ?? null },
            status: "pending",
            suggested_by: user.id,
          })
          .select("id")
          .single()
        if (q) approvalId = q.id
      } catch {
        // Non-fatal — approval queue table may be unavailable
      }
    }

    // 7. Return structured response — only expose safe fields to client.
    // Mutation actions are returned as a PROPOSED action requiring explicit
    // human approval; nothing is auto-executed here.
    const proposed = actionConfig.requiresApproval
      ? proposeAction({
          actionType: action,
          summary: `Copilot proposed: ${action.replace(/-/g, " ")}`,
          rationale:
            "This proposes a draft/operation that requires your explicit approval before anything is created or changed.",
          payload: { approvalId, recordId: recordId ?? null, mutationType: actionConfig.mutationType ?? null },
        })
      : null
    return NextResponse.json({
      action,
      content,
      provider: result.provider,
      model: result.model,
      requiresApproval: actionConfig.requiresApproval,
      pendingMutation: proposed,
    })
  } catch (err: unknown) {
    console.error("[AI Actions] Error:", err)

    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    )
  }
}
