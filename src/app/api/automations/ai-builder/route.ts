import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { gateAutomation, gateAiCopilot } from "@/lib/billing/gates"
import { captureException, requestIdFrom } from "@/lib/observability"
import { resolveAuthedWorkspace } from "../_shared"
import { buildFromPrompt } from "@/lib/automation/nl-builder"

// NL → constrained node-graph DRAFT (via the AI gateway). The AI may ONLY use
// catalogue node types; the result is review-required and NEVER saved, enabled,
// or run by this route. Gated by base automation + AI entitlement.
export const dynamic = "force-dynamic"

const postSchema = z.object({
  workspaceId: z.string().min(1).max(100).optional(),
  prompt: z.string().min(1, "Describe what you want to automate.").max(2000),
})

export async function POST(request: NextRequest) {
  const requestId = requestIdFrom(request.headers)
  try {
    const parsed = postSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: "Describe what you want to automate." }, { status: 400 })
    const { workspaceId, prompt } = parsed.data

    const auth = await resolveAuthedWorkspace(workspaceId)
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
    const { ctx } = auth
    if (!ctx.workspaceId) return NextResponse.json({ error: "No active workspace." }, { status: 400 })

    const baseGate = await gateAutomation(ctx.supabase, ctx.workspaceId)
    if (!baseGate.allowed) return NextResponse.json({ error: baseGate.reason, upgrade: true, tier: baseGate.tier }, { status: baseGate.status ?? 402 })
    const aiGate = await gateAiCopilot(ctx.supabase, ctx.workspaceId)
    if (!aiGate.allowed) return NextResponse.json({ error: aiGate.reason, upgrade: true, tier: aiGate.tier }, { status: aiGate.status ?? 402 })

    const result = await buildFromPrompt(ctx.supabase, ctx.workspaceId, ctx.userId, prompt)
    if (!result.ok) return NextResponse.json({ ok: false, error: result.error, notes: result.notes }, { status: 422 })

    // Audit the AI action (best-effort, never blocks the draft) — every AI action
    // must leave a trail recording who ran it, in which workspace, and the shape
    // of the generated draft. Draft-only: no records mutated, no automation run.
    try {
      await ctx.supabase.from("ai_action_logs").insert({
        workspace_id: ctx.workspaceId,
        user_id: ctx.userId,
        action_type: "automation.ai_build",
        context: { prompt_length: prompt.length },
        result: {
          node_count: result.graph?.nodes?.length ?? 0,
          edge_count: result.graph?.edges?.length ?? 0,
          compiles: result.compile?.ok ?? null,
        },
        approved: true,
      })
    } catch { /* non-fatal: audit failure must not break the draft */ }

    // Honest: returns a DRAFT only. The client must explicitly save it (which
    // creates a disabled draft). We never persist or run here.
    return NextResponse.json({
      ok: true,
      draft: true,
      name: result.name,
      description: result.description,
      graph: result.graph,
      compile: result.compile,
      notes: result.notes,
    }, { status: 200 })
  } catch (err) {
    captureException(err, { source: "api/automations/ai-builder:POST", requestId })
    return NextResponse.json({ error: "Couldn't draft the automation.", requestId }, { status: 500 })
  }
}
