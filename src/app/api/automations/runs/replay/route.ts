import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { gateAutomation } from "@/lib/billing/gates"
import { captureException, requestIdFrom } from "@/lib/observability"
import { resolveAuthedWorkspace } from "../../_shared"
import { getRun, recordRun } from "@/lib/automation/runs"
import { recordRunEvent } from "@/lib/automation/approvals"

// REPLAY a recorded run: enqueue a FRESH run from the same definition + trigger
// context. The new run drains through the normal executor on the next cron pass
// (or via the runner) — it is NOT executed inline here, so all the same gates,
// caps, and approval safety apply. Never replays as a dry-run side-effect.
export const dynamic = "force-dynamic"

const postSchema = z.object({
  workspaceId: z.string().min(1).max(100).optional(),
  runId: z.string().min(1),
})

export async function POST(request: NextRequest) {
  const requestId = requestIdFrom(request.headers)
  try {
    const parsed = postSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: "A runId is required." }, { status: 400 })
    const { workspaceId, runId } = parsed.data

    const auth = await resolveAuthedWorkspace(workspaceId)
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
    const { ctx } = auth
    if (!ctx.workspaceId) return NextResponse.json({ error: "No active workspace." }, { status: 400 })

    const gate = await gateAutomation(ctx.supabase, ctx.workspaceId)
    if (!gate.allowed) return NextResponse.json({ error: gate.reason, upgrade: true, tier: gate.tier }, { status: gate.status ?? 402 })

    const original = await getRun(ctx.supabase, ctx.workspaceId, runId)
    if (!original) return NextResponse.json({ error: "Run not found." }, { status: 404 })
    if (!original.definition_id) return NextResponse.json({ error: "This run has no definition to replay." }, { status: 422 })

    const replay = await recordRun(ctx.supabase, ctx.workspaceId, {
      definitionId: original.definition_id,
      status: "queued",
      triggerContext: { ...original.trigger_context, replay_of: runId },
      isDryRun: false,
      start: false,
    })
    if (!replay) return NextResponse.json({ error: "Couldn't enqueue the replay." }, { status: 500 })

    await recordRunEvent(ctx.supabase, ctx.workspaceId, replay.id, {
      eventType: "run.replay_enqueued",
      message: `Replay of run ${runId}.`,
      data: { replay_of: runId },
    })

    return NextResponse.json({ ok: true, runId: replay.id, queued: true }, { status: 200 })
  } catch (err) {
    captureException(err, { source: "api/automations/runs/replay:POST", requestId })
    return NextResponse.json({ error: "Couldn't replay the run.", requestId }, { status: 500 })
  }
}
