import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"
import { getFullWorkspaceContext, renderWorkspaceContext } from "@/lib/ai/workspace-context"
import { COPILOT_COMMANDS, getCommand } from "@/lib/ai/commands"
import { checkRate, recordUsage } from "@/lib/ai/metering"
import { checkCaps } from "@/lib/ai/caps"
import { resolveModelChain, gatewayComplete, recordUsageEvent } from "@/lib/ai/gateway"
import { SAFETY_CLAUSES, fenceUntrusted, proposeAction } from "@/lib/ai/safety"
import { getWorkspaceJurisdiction } from "@/lib/international/workspace-jurisdiction"
import { aiJurisdictionClause } from "@/lib/international/guardrails"
import { getCountryPack, aiPackTermsClause } from "@/lib/i18n/country-packs"
import { gateAiCopilot } from "@/lib/billing/gates"

const actionsSchema = z.object({
  action: z.string().min(1, "action is required").max(100),
  workspaceId: z.string().min(1, "workspaceId is required").max(100),
  recordId: z.string().min(1).max(100).optional(),
})

/* ------------------------------------------------------------------ */
/* Supported actions — sourced from the shared command registry so the   */
/* contextual-action set always matches the slash-command catalogue.     */
/*                                                                        */
/* Legacy action keys (used by older UI) are aliased onto registry slugs  */
/* so existing callers keep working while new surfaces are covered.       */
/* ------------------------------------------------------------------ */
interface ActionConfig {
  prompt: string
  requiresApproval: boolean
  mutationType?: string
  /** Capability this action needs ("always" → any workspace). */
  capability: string
}

// Legacy action key → registry slug.
const LEGACY_ALIASES: Record<string, string> = {
  "explain-portfolio": "/explain-portfolio",
  "find-missing-docs": "/find-missing-docs",
  "check-arrears": "/chase-arrears",
  "review-planning": "/review-planning",
  "upcoming-priorities": "/upcoming-priorities",
  "cashflow-forecast": "/cashflow-forecast",
  "draft-landlord-offer": "/draft-landlord-offer",
  "compliance-check": "/review-compliance",
}

function resolveAction(action: string): ActionConfig | null {
  const slug = LEGACY_ALIASES[action] ?? (action.startsWith("/") ? action : `/${action}`)
  const cmd = getCommand(slug) ?? COPILOT_COMMANDS.find((c) => c.slug === slug)
  if (!cmd) return null
  return {
    prompt: cmd.prompt,
    requiresApproval: cmd.requiresApproval,
    mutationType: cmd.mutationType,
    capability: cmd.capability,
  }
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

    const actionConfig = resolveAction(action)
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
      const capCheck = await checkCaps(supabase, workspaceId)
      if (!capCheck.allowed) {
        return NextResponse.json(
          { error: capCheck.reason, quotaExceeded: true, limit: capCheck.exceeded, tier: capCheck.tier },
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

    // 4. Build contextual system prompt with LIVE, TYPE-AWARE workspace data.
    // The context block is fenced + injection-sanitised; safety clauses override.
    const { profile, caps: wsCaps, snapshot } = await getFullWorkspaceContext(supabase, workspaceId)

    // Capability gate: an action whose module this workspace type doesn't have is
    // refused (e.g. a customer workspace asking for /draft-landlord-offer).
    if (
      actionConfig.capability !== "always" &&
      !wsCaps[actionConfig.capability as keyof typeof wsCaps]
    ) {
      return NextResponse.json(
        { error: `This action isn't available for a ${profile.type} workspace.` },
        { status: 400 }
      )
    }

    const fencedSnapshot = fenceUntrusted(
      "WORKSPACE CONTEXT",
      renderWorkspaceContext(profile, wsCaps, snapshot)
    )

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
    const countryPack = getCountryPack(jurisdiction.countryCode)
    const packTermsClause = aiPackTermsClause(countryPack)

    const systemPrompt = `You are the Propvora AI Copilot for property operations management.
You are executing a structured AI action requested by the user.
${recordId ? `Record ID context: ${recordId}` : ""}

${fencedSnapshot}

${SAFETY_CLAUSES}

${jurisdictionClause}

${packTermsClause}

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
