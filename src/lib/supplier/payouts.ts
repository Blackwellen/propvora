import type { SupabaseClient } from "@supabase/supabase-js"

// ============================================================================
// Supplier WORKSPACE payouts data layer (P3 deep).
//
// Backed by the existing `payouts` table (workspace_id, amount_pence bigint,
// status, stripe_transfer_id). A payout is a real money movement to the
// supplier's connected account. Money is integer pence. Read-only from the
// supplier side (payouts are created by the platform/Stripe webhook, never by
// the supplier UI). 42P01-tolerant.
// ============================================================================

export type PayoutStatus = "pending" | "in_transit" | "paid" | "failed" | "reversed"

export interface SupplierPayout {
  id: string
  workspace_id: string
  connect_account_id: string | null
  amount_pence: number
  currency: string
  stripe_transfer_id: string | null
  status: string
  payment_id: string | null
  created_at: string
  updated_at: string
}

const PAYOUT_COLS =
  "id, workspace_id, connect_account_id, amount_pence, currency, " +
  "stripe_transfer_id, status, payment_id, created_at, updated_at"

function code(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}
function tolerable(e: unknown): boolean {
  const c = code(e)
  return c === "42P01" || c === "42703" || c === "PGRST205"
}

/** List a supplier workspace's payouts (newest first). */
export async function listPayouts(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<SupplierPayout[]> {
  if (!workspaceId) return []
  try {
    const { data, error } = await supabase
      .from("payouts")
      .select(PAYOUT_COLS)
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
    if (error) {
      if (tolerable(error)) return []
      throw error
    }
    return (data as unknown as SupplierPayout[] | null) ?? []
  } catch (e) {
    if (tolerable(e)) return []
    throw e
  }
}

/** Aggregate payout totals (pence) by paid / pending / failed. */
export function summarisePayouts(payouts: SupplierPayout[]): {
  paidPence: number
  pendingPence: number
  failedPence: number
  count: number
  currency: string
} {
  let paidPence = 0
  let pendingPence = 0
  let failedPence = 0
  const currency = payouts[0]?.currency?.toUpperCase() ?? "GBP"
  for (const p of payouts) {
    const s = (p.status ?? "").toLowerCase()
    if (s === "paid" || s === "succeeded" || s === "completed") paidPence += p.amount_pence
    else if (s === "failed" || s === "reversed" || s === "canceled" || s === "cancelled") failedPence += p.amount_pence
    else pendingPence += p.amount_pence
  }
  return { paidPence, pendingPence, failedPence, count: payouts.length, currency }
}
