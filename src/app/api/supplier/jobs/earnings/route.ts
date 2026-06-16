import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import { listSupplierJobs } from "@/lib/supplier/jobs"
import { getPayoutSummary } from "@/lib/payments/payouts"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/* ──────────────────────────────────────────────────────────────────────────
   GET /api/supplier/jobs/earnings?workspaceId=...

   Honest earnings summary for a SUPPLIER workspace. Money is reconciled to real
   `payouts` rows (integer pence in the DB) wherever possible:
     • paid_out       = Σ payouts.status='paid'
     • pending_payout = Σ payouts.status='pending'
     • total_earned   = paid_out + pending_payout
     • in_escrow      = 0 (the live payouts model has no escrow/in-transit state)
   `jobs_paid` is the count of COMPLETED job assignments for the workspace.

   Honesty rules:
     • `indicative = true` whenever the figures are NOT fully reconciled to real
       payouts — i.e. the payouts table isn't provisioned, OR the workspace has
       completed jobs but no payout rows yet (money can't be asserted from an
       assignment alone — assignments carry no amount).
     • Amounts are returned in MAJOR units (pounds) to match the UI's `money()`
       formatter, derived from the integer-pence DB values.

   Auth + supplier-workspace membership required (mirrors the sibling supplier
   routes). 42P01/PGRST205-tolerant via the libs.
─────────────────────────────────────────────────────────────────────────── */

async function isSupplierWorkspaceMember(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  userId: string
): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .maybeSingle()
    if (data) return true
  } catch {
    /* fall through */
  }
  try {
    const { data } = await supabase
      .from("supplier_workspace_members")
      .select("workspace_id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .maybeSingle()
    return Boolean(data)
  } catch {
    return false
  }
}

const penceToPounds = (pence: number): number => Math.round(pence) / 100

export async function GET(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const workspaceId = (new URL(request.url).searchParams.get("workspaceId") ?? "").trim()
    if (!workspaceId) return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
    if (!(await isSupplierWorkspaceMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    // Real money from payouts (workspace-scoped, integer pence).
    const payouts = await getPayoutSummary(supabase, workspaceId)

    // Completed jobs for context (count only — assignments carry no amount).
    let completedJobs = 0
    try {
      const completed = await listSupplierJobs(supabase, workspaceId, "supplier", {
        status: "completed",
      })
      completedJobs = completed.length
    } catch {
      completedJobs = 0
    }

    const paidOut = payouts.paidPence
    const pending = payouts.pendingPence
    const totalEarned = paidOut + pending

    // Indicative whenever figures aren't reconciled to real payouts: either the
    // payouts table is absent, or there are completed jobs but no payout rows.
    const hasPayoutRows = payouts.totalCount > 0
    const indicative = !payouts.provisioned || (completedJobs > 0 && !hasPayoutRows)

    const summary = {
      currency: payouts.currency ?? "GBP",
      total_earned: penceToPounds(totalEarned),
      pending_payout: penceToPounds(pending),
      paid_out: penceToPounds(paidOut),
      in_escrow: 0,
      platform_fee_total: 0,
      jobs_paid: completedJobs,
      indicative,
    }

    return NextResponse.json({ summary })
  } catch (err) {
    captureException(err, { source: "api/supplier/jobs/earnings GET", requestId })
    return NextResponse.json({ error: "Failed to load earnings", requestId }, { status: 500 })
  }
}
