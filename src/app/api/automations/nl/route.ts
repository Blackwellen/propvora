import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { resolveModelChain, gatewayComplete, recordUsageEvent } from "@/lib/ai/gateway"
import { SAFETY_CLAUSES, fenceUntrusted } from "@/lib/ai/safety"
import { gateAutomation, gateAiCopilot } from "@/lib/billing/gates"
import { captureException, requestIdFrom } from "@/lib/observability"
import {
  resolveAuthedWorkspace,
  validateDefinition,
  CATALOGUE_FOR_PROMPT,
} from "../_shared"
import type { NlDraftResponse } from "@/components/automations-builder/types"

// Natural-language → structured automation DRAFT. The AI ONLY proposes a draft
// the user must review + confirm; it never saves or runs anything.
export const dynamic = "force-dynamic"

const bodySchema = z.object({
  prompt: z.string().min(1, "Describe what you want to automate.").max(2000),
  workspaceId: z.string().min(1).max(100).optional(),
})

function buildSystemPrompt(): string {
  return `You are Propvora's automation drafting assistant. You translate a property operator's plain-English request into a STRUCTURED automation draft built ONLY from the catalogue below.

You do NOT create, save, run, or execute anything. You ONLY propose a draft that the human will review, edit, and confirm. Never say you created or activated an automation.

You MUST choose exactly one trigger type and one action type from this catalogue (use the exact "type" strings). Config keys must come from each item's "config" list. Do not invent trigger types, action types, or config keys.

CATALOGUE:
${JSON.stringify(CATALOGUE_FOR_PROMPT)}

Respond with ONLY a single JSON object (no markdown, no prose outside the JSON) of this exact shape:
{
  "name": string,                       // short human name for the automation
  "description": string,                // one sentence describing it
  "trigger_type": string,               // one catalogue trigger "type"
  "trigger_config": { [key]: value },   // only that trigger's config keys
  "conditions": [ { "key": string, "op": "lte"|"gte"|"eq", "value": string } ], // optional, keys must be trigger config keys
  "action_type": string,                // one catalogue action "type"
  "action_config": { [key]: string },   // only that action's config keys; you may use {{summary}} tokens
  "review_required": true,              // ALWAYS true — the user approves before anything happens
  "explanation": string,                // plain-language summary of what this draft would do, for the user
  "notes": [ string ]                   // anything you could not map, or assumptions you made (be honest)
}

Rules:
- review_required must always be true.
- If the request can't be mapped to the catalogue, pick the closest trigger/action and explain the gap in "notes".
- Never claim the automation is live. Never give legal, financial, or tax advice as fact.

${SAFETY_CLAUSES}`
}

/** Pull the first JSON object out of a model response, tolerating stray text/fences. */
function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced ? fenced[1] : text
  const start = candidate.indexOf("{")
  const end = candidate.lastIndexOf("}")
  if (start === -1 || end === -1 || end <= start) return null
  try {
    return JSON.parse(candidate.slice(start, end + 1))
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  const requestId = requestIdFrom(request.headers)
  try {
    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 })
    }
    const { prompt, workspaceId } = parsed.data

    const auth = await resolveAuthedWorkspace(workspaceId)
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
    const { ctx } = auth

    // Plan gate: base automation entitlement (the NL builder is part of it).
    if (ctx.workspaceId) {
      const gate = await gateAutomation(ctx.supabase, ctx.workspaceId)
      if (!gate.allowed) {
        return NextResponse.json(
          { error: gate.reason, upgrade: true, tier: gate.tier },
          { status: gate.status ?? 402 }
        )
      }
      // The NL drafting uses the AI gateway, so also require the AI entitlement.
      const aiGate = await gateAiCopilot(ctx.supabase, ctx.workspaceId)
      if (!aiGate.allowed) {
        return NextResponse.json(
          { error: aiGate.reason, upgrade: true, tier: aiGate.tier },
          { status: aiGate.status ?? 402 }
        )
      }
    }

    // The user's request is fenced as untrusted data so it can't hijack the
    // drafting instructions.
    const fencedRequest = fenceUntrusted("USER REQUEST", prompt.trim())

    const chain = await resolveModelChain(ctx.supabase)
    const result = await gatewayComplete(chain, {
      maxTokens: 800,
      temperature: 0.2,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: `${fencedRequest}\n\nProduce the JSON draft now.` },
      ],
    })

    // Meter the call (best-effort).
    if (ctx.workspaceId) {
      await recordUsageEvent(ctx.supabase, {
        workspaceId: ctx.workspaceId,
        userId: ctx.userId,
        route: "automations/nl",
        usage: {
          provider: result.provider,
          model: result.model,
          tokensIn: result.tokensIn,
          tokensOut: result.tokensOut,
          costPence: result.costPence,
        },
      })
    }

    const json = extractJson(result.text) as Record<string, unknown> | null
    const { definition, notes } = validateDefinition(json)

    if (!definition) {
      const res: NlDraftResponse = {
        ok: false,
        reviewRequired: true,
        notes,
        error: "I couldn't turn that into a valid automation draft. Try describing the trigger (what should start it) and the action (what should happen).",
      }
      return NextResponse.json(res, { status: 200 })
    }

    const explanation =
      (json && typeof json.explanation === "string" && json.explanation.trim()) ||
      `When ${definition.trigger_type.replace(/_/g, " ")}, this would ${definition.action_type.replace(/_/g, " ")}. You review and approve before anything happens.`
    const modelNotes = Array.isArray(json?.notes) ? (json!.notes as unknown[]).map(String) : []

    const res: NlDraftResponse = {
      ok: true,
      reviewRequired: true,
      draft: definition,
      explanation: String(explanation),
      notes: [...modelNotes, ...notes].filter(Boolean).slice(0, 6),
    }
    return NextResponse.json(res, { status: 200 })
  } catch (err) {
    captureException(err, { source: "api/automations/nl", requestId })
    return NextResponse.json(
      { error: "Couldn't draft the automation right now. Please try again.", requestId },
      { status: 500 }
    )
  }
}
