import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { gateAutomation } from "@/lib/billing/gates"
import { captureException, requestIdFrom } from "@/lib/observability"
import { resolveAuthedWorkspace } from "../_shared"
import { listApprovals, decideApproval, type ApprovalStatus } from "@/lib/automation/approvals"

// Automation approvals: list pending/decided approvals, and DECIDE one.
// Deciding records the decision ONLY — the engine never auto-executes a
// payment/legal action even after approval. Membership-checked + gated.
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const requestId = requestIdFrom(request.headers)
  try {
    const url = new URL(request.url)
    const workspaceId = url.searchParams.get("workspaceId") ?? undefined
    const status = (url.searchParams.get("status") as ApprovalStatus | null) ?? undefined

    const auth = await resolveAuthedWorkspace(workspaceId)
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
    const { ctx } = auth
    if (!ctx.workspaceId) return NextResponse.json({ ok: true, approvals: [] }, { status: 200 })

    const gate = await gateAutomation(ctx.supabase, ctx.workspaceId)
    if (!gate.allowed) return NextResponse.json({ error: gate.reason, upgrade: true, tier: gate.tier }, { status: gate.status ?? 402 })

    const approvals = await listApprovals(ctx.supabase, ctx.workspaceId, { status })
    return NextResponse.json({ ok: true, approvals }, { status: 200 })
  } catch (err) {
    captureException(err, { source: "api/automations/approvals:GET", requestId })
    return NextResponse.json({ error: "Couldn't load approvals.", requestId }, { status: 500 })
  }
}

const postSchema = z.object({
  workspaceId: z.string().min(1).max(100).optional(),
  approvalId: z.string().min(1),
  decision: z.enum(["approved", "rejected"]),
  note: z.string().max(1000).optional(),
})

export async function POST(request: NextRequest) {
  const requestId = requestIdFrom(request.headers)
  try {
    const parsed = postSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: "A decision is required." }, { status: 400 })
    const { workspaceId, approvalId, decision, note } = parsed.data

    const auth = await resolveAuthedWorkspace(workspaceId)
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
    const { ctx } = auth
    if (!ctx.workspaceId) return NextResponse.json({ error: "No active workspace." }, { status: 400 })

    const gate = await gateAutomation(ctx.supabase, ctx.workspaceId)
    if (!gate.allowed) return NextResponse.json({ error: gate.reason, upgrade: true, tier: gate.tier }, { status: gate.status ?? 402 })

    const res = await decideApproval(ctx.supabase, ctx.workspaceId, approvalId, decision, ctx.userId, note)
    if (!res.ok) return NextResponse.json({ error: res.error ?? "Couldn't record the decision." }, { status: 409 })
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err) {
    captureException(err, { source: "api/automations/approvals:POST", requestId })
    return NextResponse.json({ error: "Couldn't record the decision.", requestId }, { status: 500 })
  }
}
