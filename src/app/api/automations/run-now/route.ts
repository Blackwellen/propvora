import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { gateAutomation } from "@/lib/billing/gates"
import { captureException, requestIdFrom } from "@/lib/observability"
import { recordAudit } from "@/lib/audit/log"
import { enqueueDueRuns } from "@/lib/automation/enqueue"
import { drainAutomationQueue } from "@/lib/automation/executor"
import { resolveAuthedWorkspace } from "../_shared"

// Manual "Run now" — evaluate the workspace's enabled automation definitions,
// enqueue any new due matches, then drain (execute) the queued runs immediately.
//
// Safety:
//  * Membership-checked + automation-gated at the boundary (no cross-workspace).
//  * Uses the caller's RLS-scoped Supabase client, so enqueue/drain only ever
//    see and mutate THIS workspace's rows — never another tenant's.
//  * The engine is idempotent: enqueue de-dupes on (definition + entity) over a
//    30-day window and drain claims each queued run atomically, so a double-click
//    cannot create duplicate runs or double-execute an action.
//  * Review-first / governance still applies — dangerous actions are held for
//    approval rather than executed here.
export const dynamic = "force-dynamic"

const bodySchema = z.object({
  workspaceId: z.string().min(1).max(100).optional(),
})

export async function POST(request: NextRequest) {
  const requestId = requestIdFrom(request.headers)
  try {
    const body = await request.json().catch(() => ({}))
    const parsed = bodySchema.safeParse(body ?? {})
    const workspaceId = parsed.success ? parsed.data.workspaceId : undefined

    const auth = await resolveAuthedWorkspace(workspaceId)
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
    const { ctx } = auth
    if (!ctx.workspaceId) return NextResponse.json({ error: "No active workspace." }, { status: 400 })

    const gate = await gateAutomation(ctx.supabase, ctx.workspaceId)
    if (!gate.allowed) {
      return NextResponse.json(
        { error: gate.reason, upgrade: true, tier: gate.tier },
        { status: gate.status ?? 402 },
      )
    }

    // 1) Evaluate enabled definitions and enqueue any new due matches.
    const enqueueSummary = await enqueueDueRuns(ctx.supabase, ctx.workspaceId)

    // 2) Drain (execute) the queued runs for this workspace. The caller's
    //    RLS-scoped client means claimQueuedRuns only sees this workspace's
    //    queued runs, so cross-tenant drain is impossible.
    const drain = await drainAutomationQueue(ctx.supabase, { limit: 25 })

    const executed = drain.outcomes.filter((o) => o.status === "succeeded").length
    const failed = drain.outcomes.filter((o) => o.status === "failed").length
    const skipped = drain.outcomes.filter((o) => o.status === "skipped").length

    await recordAudit(ctx.supabase, {
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      action: "automation.run_now",
      resourceType: "automation",
      resourceId: ctx.workspaceId,
      metadata: {
        enqueued: enqueueSummary.enqueued,
        matches: enqueueSummary.matches,
        executed,
        failed,
        skipped,
      },
    }).catch(() => {})

    return NextResponse.json(
      {
        ok: true,
        enqueued: enqueueSummary.enqueued,
        matches: enqueueSummary.matches,
        executed,
        failed,
        skipped,
        evaluated: enqueueSummary.definitionsEvaluated,
      },
      { status: 200 },
    )
  } catch (err) {
    captureException(err, { source: "api/automations/run-now", requestId })
    return NextResponse.json(
      { error: "Couldn't run your automations right now. Please try again.", requestId },
      { status: 500 },
    )
  }
}
