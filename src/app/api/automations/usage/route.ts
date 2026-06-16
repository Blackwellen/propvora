import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { gateAutomation, getWorkspaceTier } from "@/lib/billing/gates"
import { captureException, requestIdFrom } from "@/lib/observability"
import { resolveAuthedWorkspace } from "../_shared"
import { getPlanLimits, getUsageSnapshot } from "@/lib/automation/limits"
import { isWithinCap } from "@/lib/automation/caps"

// Usage & limits: the real per-plan governance limits + current usage for this
// workspace (active automations, webhooks, monthly run cap). Honest counts.
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const requestId = requestIdFrom(request.headers)
  try {
    const url = new URL(request.url)
    const workspaceId = url.searchParams.get("workspaceId") ?? undefined

    const auth = await resolveAuthedWorkspace(workspaceId)
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
    const { ctx } = auth
    if (!ctx.workspaceId) return NextResponse.json({ ok: true, usage: null }, { status: 200 })

    const gate = await gateAutomation(ctx.supabase, ctx.workspaceId)
    if (!gate.allowed) return NextResponse.json({ error: gate.reason, upgrade: true, tier: gate.tier }, { status: gate.status ?? 402 })

    const tier = await getWorkspaceTier(ctx.supabase, ctx.workspaceId)
    const [limits, snapshot, cap] = await Promise.all([
      getPlanLimits(ctx.supabase, tier),
      getUsageSnapshot(ctx.supabase, ctx.workspaceId),
      isWithinCap(ctx.supabase, ctx.workspaceId, tier),
    ])

    return NextResponse.json({
      ok: true,
      tier,
      limits,
      usage: {
        active: snapshot.activeCount,
        total: snapshot.totalCount,
        webhooks: snapshot.webhookCount,
        runsUsed: cap.used,
        runsLimit: cap.limit,
        runsRemaining: cap.remaining,
        runsUnlimited: cap.unlimited,
      },
    }, { status: 200 })
  } catch (err) {
    captureException(err, { source: "api/automations/usage:GET", requestId })
    return NextResponse.json({ error: "Couldn't load usage.", requestId }, { status: 500 })
  }
}
