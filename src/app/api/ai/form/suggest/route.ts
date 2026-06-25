/**
 * POST /api/ai/form/suggest
 *
 * Form-aware inline assistance. Given the current form id, the field being
 * edited, its value, and the other entered values, returns a single concise,
 * context-aware suggestion (an improved value, a missing detail, or a flag).
 *
 * Read-only + metered as a Conversation-class op. Auth + Scale+ gated. The
 * suggestion is advisory — applying it is a separate, permissioned action.
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { gateAiCopilot } from "@/lib/billing/gates"
import { checkRate } from "@/lib/ai/metering"
import { resolveModelChain, gatewayComplete, recordUsageEvent } from "@/lib/ai/gateway"
import { orderChainForRole } from "@/lib/ai/routing"
import { debitCredits, creditsForTokens } from "@/lib/ai/credits"
import { fenceUntrusted, SAFETY_CLAUSES } from "@/lib/ai/safety"
import { captureException, requestIdFrom } from "@/lib/observability"

export const dynamic = "force-dynamic"

const schema = z.object({
  workspaceId: z.string().min(1).max(100),
  formId: z.string().min(1).max(80),
  field: z.string().min(1).max(80),
  label: z.string().max(120).optional(),
  value: z.string().max(2000).optional(),
  values: z.record(z.string(), z.unknown()).optional(),
  contextRoute: z.string().max(200).optional(),
})

export async function POST(request: NextRequest) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
    const { workspaceId, formId, field, label, value, values, contextRoute } = parsed.data

    const { data: member } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single()
    if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const gate = await gateAiCopilot(supabase, workspaceId)
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.reason, upgrade: true, tier: gate.tier }, { status: gate.status ?? 402 })
    }
    const rate = await checkRate(supabase, workspaceId)
    if (!rate.allowed) return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 })

    // The form state is user-entered, so it is fenced + injection-sanitised.
    const formState = fenceUntrusted(
      "FORM STATE",
      `Form: ${formId}\nField being edited: ${label || field}\nCurrent value: ${value ?? "(empty)"}\nOther values: ${JSON.stringify(values ?? {}).slice(0, 1200)}`
    )

    const system = `You are the Propvora form assistant. Help the user fill the "${label || field}" field well.
${SAFETY_CLAUSES}
Reply with ONE short suggestion (max 140 characters): either an improved value, a missing/required detail to add, or a brief confirmation that the current value looks good. No preamble, no markdown, plain text only. Never invent figures, dates or legal facts.`

    const chain = orderChainForRole(await resolveModelChain(supabase), "workhorse")
    const gen = await gatewayComplete(chain, {
      maxTokens: 80,
      temperature: 0.3,
      messages: [
        { role: "system", content: `${system}\n\nPage: ${contextRoute ?? "n/a"}\n\n${formState}` },
        { role: "user", content: `Suggest for the "${label || field}" field.` },
      ],
    })

    // Meter (Conversation class) — best-effort.
    await recordUsageEvent(supabase, { workspaceId, userId: user.id, route: "ai/form/suggest", usage: gen })
    await debitCredits(supabase, {
      workspaceId,
      userId: user.id,
      operationKey: "chat.turn",
      credits: creditsForTokens(gen.tokensIn, gen.tokensOut),
      refType: "form_suggest",
      refId: formId,
    })

    return NextResponse.json({ suggestion: gen.text.trim().slice(0, 240) })
  } catch (err) {
    captureException(err, { source: "api/ai/form/suggest", requestId })
    return NextResponse.json({ error: "Could not generate a suggestion.", requestId }, { status: 500 })
  }
}
