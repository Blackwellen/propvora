import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getMoneyActor, assertWorkspaceMember } from "@/lib/money/server"
import { canReleaseFunds, type ReleaseContext } from "@/lib/payments/release-blocks"
import type { JobRiskTier } from "@/lib/supplier-verification/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/* ──────────────────────────────────────────────────────────────────────────
   POST /api/money/release-check — evaluate (and record) the release-block gates
   for a payment before any payout. NEVER fails open. Returns the full gate set +
   an allowed flag. The caller (operator UI / release engine) MUST refuse to
   release when allowed=false.

   Body: { workspaceId, paymentId?, bookingId?, transactionId?, supplierJobId?,
           supplierWorkspaceId?, jobRisk?, jobCategory? }
   Authorisation: member of the owning workspace.
─────────────────────────────────────────────────────────────────────────── */

export async function POST(request: NextRequest) {
  const actor = await getMoneyActor()
  if (!actor) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  let body: Partial<ReleaseContext> & { jobRisk?: JobRiskTier }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }
  const workspaceId = body.workspaceId ?? actor.workspaceId ?? null
  if (!workspaceId) return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })

  const supabase = await createClient()
  if (!(await assertWorkspaceMember(supabase, actor.userId, workspaceId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const ctx: ReleaseContext = {
    workspaceId,
    paymentId: body.paymentId ?? null,
    bookingId: body.bookingId ?? null,
    transactionId: body.transactionId ?? null,
    supplierJobId: body.supplierJobId ?? null,
    supplierWorkspaceId: body.supplierWorkspaceId ?? null,
    jobRisk: body.jobRisk ?? null,
    jobCategory: body.jobCategory ?? null,
    evaluatedBy: actor.userId,
  }

  try {
    const decision = await canReleaseFunds(createAdminClient(), ctx)
    return NextResponse.json({
      allowed: decision.allowed,
      blocks: decision.blocks,
      activeBlocks: decision.activeBlocks,
    })
  } catch (err) {
    // A non-provisioning error means we could NOT prove the funds are clear —
    // fail closed: report not-allowed with the error surfaced.
    return NextResponse.json(
      { allowed: false, error: err instanceof Error ? err.message : "Release check failed.", blocks: [], activeBlocks: [] },
      { status: 200 }
    )
  }
}
