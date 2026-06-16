import { NextResponse } from "next/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import { getStatusSummary, syncPayoutVerified, ensureVerification } from "@/lib/supplier-verification"
import { requireSupplierMember } from "../_shared"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/supplier-verification/status?workspaceId=...
 *
 * Returns the supplier verification status summary (level, honest level label,
 * evidence-reviewed badges, manual-review state, insurance/licence currency).
 * Member-gated. Syncs the Stripe Connect payout-verified state first so L3
 * reflects live Connect status.
 */
export async function GET(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const url = new URL(request.url)
    const workspaceId = url.searchParams.get("workspaceId") ?? ""
    const auth = await requireSupplierMember(workspaceId)
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

    // Sync payout-verified state from Connect (best-effort) before summarising.
    await syncPayoutVerified(workspaceId).catch(() => {})

    const summary = await getStatusSummary(workspaceId)
    return NextResponse.json({ summary })
  } catch (err) {
    captureException(err, { source: "api/supplier-verification/status", requestId })
    return NextResponse.json({ error: "Failed to load status", requestId }, { status: 500 })
  }
}

/**
 * POST /api/supplier-verification/status — { workspaceId }
 * Idempotently ensures an L0 verification record exists (start verification).
 */
export async function POST(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const body = await request.json().catch(() => ({}))
    const workspaceId = String(body.workspaceId ?? "")
    const auth = await requireSupplierMember(workspaceId)
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const rec = await ensureVerification(workspaceId, auth.userId)
    if (!rec) return NextResponse.json({ error: "Could not start verification" }, { status: 500 })

    const summary = await getStatusSummary(workspaceId)
    return NextResponse.json({ verificationId: rec.id, summary })
  } catch (err) {
    captureException(err, { source: "api/supplier-verification/status:POST", requestId })
    return NextResponse.json({ error: "Failed to start verification", requestId }, { status: 500 })
  }
}
