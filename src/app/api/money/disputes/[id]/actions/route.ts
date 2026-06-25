import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getAdminIdentity } from "@/lib/admin/guard"
import { getMoneyActor, assertWorkspaceMember } from "@/lib/money/server"
import { flagGate } from "@/lib/flags/api-gate"
import {
  requestEvidence,
  holdPayout,
  releasePayout,
  recordDisputeRefund,
  settleDispute,
  suspendDispute,
  escalateDispute,
  closeDispute,
  assignDispute,
  addDisputeNote,
} from "@/lib/payments/disputes"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/* ──────────────────────────────────────────────────────────────────────────
   POST /api/money/disputes/[id]/actions — unified dispute admin actions.

   Body: { action, amountPence?, detail?, resolution?, adminId? }
   action ∈ request-evidence | hold-payout | release-payout | partial-refund |
            full-refund | settle | suspend | escalate | close | assign | note

   Authorisation (fail-closed): the caller must be EITHER a platform admin OR a
   member of a workspace party to the dispute (raised_by / against / workspace).
   Money-bearing actions (refund) record DECISION + audit only — the actual card
   refund is webhook-confirmed; we never fabricate a Stripe movement here.
─────────────────────────────────────────────────────────────────────────── */

type Action =
  | "request-evidence"
  | "hold-payout"
  | "release-payout"
  | "partial-refund"
  | "full-refund"
  | "settle"
  | "suspend"
  | "escalate"
  | "close"
  | "assign"
  | "note"

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  // V2 marketplace disputes rail — 404 when the flag is off (direct-API gate).
  const gated = await flagGate("marketplaceDisputes")
  if (gated) return gated

  const { id: disputeId } = await ctx.params

  // ── AuthZ ────────────────────────────────────────────────────────────────
  const admin = await getAdminIdentity()
  const actor = admin ? { userId: admin.userId } : await getMoneyActor()
  if (!actor) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  const svc = createAdminClient()

  // Load dispute to authorise the workspace party path.
  const { data: dispute } = await svc
    .from("marketplace_disputes")
    .select("id, raised_by_workspace_id, against_workspace_id, workspace_id")
    .eq("id", disputeId)
    .maybeSingle()
  if (!dispute) return NextResponse.json({ error: "Dispute not found" }, { status: 404 })

  if (!admin) {
    const supabase = await createClient()
    const parties = [dispute.raised_by_workspace_id, dispute.against_workspace_id, dispute.workspace_id].filter(
      Boolean
    ) as string[]
    let member = false
    for (const ws of parties) {
      if (await assertWorkspaceMember(supabase, actor.userId, ws)) {
        member = true
        break
      }
    }
    if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // ── Parse ──────────────────────────────────────────────────────────────────
  let body: { action?: Action; amountPence?: number; detail?: string; resolution?: string; adminId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }
  const action = body.action
  if (!action) return NextResponse.json({ error: "action is required" }, { status: 400 })

  const actorRole = admin ? "platform_admin" : "operator"
  const base = { disputeId, actorId: actor.userId, actorRole, detail: body.detail ?? null }

  try {
    let result
    switch (action) {
      case "request-evidence":
        result = await requestEvidence(svc, base)
        break
      case "hold-payout":
        result = await holdPayout(svc, base)
        break
      case "release-payout":
        result = await releasePayout(svc, base)
        break
      case "partial-refund":
        result = await recordDisputeRefund(svc, { ...base, amountPence: body.amountPence ?? 0, partial: true })
        break
      case "full-refund":
        result = await recordDisputeRefund(svc, { ...base, amountPence: body.amountPence ?? 0, partial: false })
        break
      case "settle":
        result = await settleDispute(svc, { ...base, resolution: body.resolution ?? "Settled" })
        break
      case "suspend":
        result = await suspendDispute(svc, base)
        break
      case "escalate":
        result = await escalateDispute(svc, base)
        break
      case "close":
        result = await closeDispute(svc, base)
        break
      case "assign":
        if (!body.adminId) return NextResponse.json({ error: "adminId is required" }, { status: 400 })
        result = await assignDispute(svc, { ...base, adminId: body.adminId })
        break
      case "note":
        result = await addDisputeNote(svc, { ...base, note: body.detail ?? "" })
        break
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
    return NextResponse.json({ ok: true, dispute: result })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Action failed." },
      { status: 400 }
    )
  }
}
