import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import { listPayouts, type PayoutRow } from "@/lib/payments/payouts"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/* ──────────────────────────────────────────────────────────────────────────
   GET /api/supplier/jobs/payments?workspaceId=...

   Read-only list of the supplier workspace's payout rows, mapped to the UI's
   payment-row shape. Sourced from the workspace-scoped `payouts` table (integer
   pence). The live payouts model records only the NET payout amount (no gross /
   platform-fee split), so `gross_amount` / `platform_fee_amount` are returned
   null rather than fabricated; `payout_amount` is the real figure in MAJOR units
   (pounds) to match the UI `money()` formatter.

   Auth + supplier-workspace membership required. Tolerant of the payouts table
   being absent (returns an empty list — the UI then shows a calm empty state).
─────────────────────────────────────────────────────────────────────────── */

interface PaymentRow {
  id: string
  job_reference: string | null
  job_title: string | null
  gross_amount: number | null
  platform_fee_amount: number | null
  payout_amount: number | null
  currency: string
  status: string
  created_at: string | null
}

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

const penceToPounds = (pence: number | null | undefined): number | null =>
  pence == null ? null : Math.round(Number(pence)) / 100

function mapRow(p: PayoutRow): PaymentRow {
  return {
    id: p.id,
    job_reference: null,
    job_title: null,
    gross_amount: null,
    platform_fee_amount: null,
    payout_amount: penceToPounds(p.amount_pence),
    currency: (p.currency ?? "GBP").toUpperCase(),
    status: p.status ?? "pending",
    created_at: p.created_at ?? null,
  }
}

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

    const { items } = await listPayouts(supabase, workspaceId, { limit: 200 })
    return NextResponse.json({ payments: items.map(mapRow) })
  } catch (err) {
    captureException(err, { source: "api/supplier/jobs/payments GET", requestId })
    return NextResponse.json({ error: "Failed to load payments", requestId }, { status: 500 })
  }
}
