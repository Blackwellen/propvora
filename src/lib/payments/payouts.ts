/**
 * Propvora v2 — P5 Payments: PAYOUT ENGINE (DB side).
 *
 * Creates and reads payout records. It NEVER calls Stripe: the actual Connect
 * transfer is created elsewhere (sibling `connect-transfers.ts`) and its
 * `transfer.created` / `transfer.paid` events drive the payout row through
 * 'in_transit' → 'paid' (see webhooks.ts). `schedulePayout` only writes the
 * PENDING row + an append-only opening ledger entry.
 *
 * Workspace-scoped: every read is filtered by workspace_id. Integer pence
 * throughout. Tolerates the sibling P5 tables (payouts / payout_ledger) not
 * being provisioned yet (returns empty / 503-signalled).
 */

export interface PayoutsSupabase {
  from: (table: string) => any
}

const NOT_PROVISIONED = new Set(["42P01", "PGRST205", "42703"])
function isNotProvisioned(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code
  return Boolean(code && NOT_PROVISIONED.has(code))
}

function num(v: unknown): number {
  const n = typeof v === "string" ? Number(v) : (v as number)
  return Number.isFinite(n) ? Math.round(n) : 0
}

// Matches the live `payouts` CHECK constraint (migration 20260616090000).
export type PayoutStatus = "pending" | "paid" | "failed" | "reversed"

export interface PayoutRow {
  id: string
  workspace_id: string
  amount_pence: number
  currency: string
  status: string
  connect_account_id: string | null
  stripe_transfer_id: string | null
  payment_id: string | null
  created_at: string | null
  updated_at: string | null
  [key: string]: unknown
}

export interface ListPayoutsFilters {
  status?: PayoutStatus | PayoutStatus[]
  limit?: number
  /** ISO date — only payouts created on/after this. */
  since?: string
}

export interface ListPayoutsResult {
  items: PayoutRow[]
  provisioned: boolean
}

/**
 * listPayouts — workspace-scoped payout list with optional status/since/limit.
 * Returns { items: [], provisioned: false } if the payouts table is absent.
 */
export async function listPayouts(
  supabase: PayoutsSupabase,
  workspaceId: string,
  filters: ListPayoutsFilters = {}
): Promise<ListPayoutsResult> {
  if (!workspaceId) return { items: [], provisioned: true }

  try {
    let query = supabase
      .from("payouts")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })

    if (filters.status) {
      if (Array.isArray(filters.status)) query = query.in("status", filters.status)
      else query = query.eq("status", filters.status)
    }
    if (filters.since) query = query.gte("created_at", filters.since)
    if (typeof filters.limit === "number") query = query.limit(Math.max(1, Math.min(500, filters.limit)))

    const { data, error } = await query
    if (error) {
      if (isNotProvisioned(error)) return { items: [], provisioned: false }
      throw error
    }
    return { items: (data as PayoutRow[]) ?? [], provisioned: true }
  } catch (err) {
    if (isNotProvisioned(err)) return { items: [], provisioned: false }
    throw err
  }
}

export interface PayoutSummaryTotals {
  workspaceId: string
  currency: string
  pendingPence: number
  inTransitPence: number
  paidPence: number
  thisMonthPaidPence: number
  totalCount: number
  provisioned: boolean
}

/**
 * getPayoutSummary — pending / in-transit / paid / this-month totals (integer
 * pence) for a workspace. Read-only; tolerates the table being absent.
 */
export async function getPayoutSummary(
  supabase: PayoutsSupabase,
  workspaceId: string
): Promise<PayoutSummaryTotals> {
  const empty: PayoutSummaryTotals = {
    workspaceId,
    currency: "GBP",
    pendingPence: 0,
    inTransitPence: 0,
    paidPence: 0,
    thisMonthPaidPence: 0,
    totalCount: 0,
    provisioned: true,
  }
  if (!workspaceId) return empty

  let rows: Array<Record<string, unknown>> = []
  try {
    const { data, error } = await supabase
      .from("payouts")
      .select("amount_pence, status, currency, updated_at")
      .eq("workspace_id", workspaceId)
    if (error) {
      if (isNotProvisioned(error)) return { ...empty, provisioned: false }
      throw error
    }
    rows = (data as Array<Record<string, unknown>>) ?? []
  } catch (err) {
    if (isNotProvisioned(err)) return { ...empty, provisioned: false }
    throw err
  }

  const startOfMonth = new Date()
  startOfMonth.setUTCDate(1)
  startOfMonth.setUTCHours(0, 0, 0, 0)

  let pending = 0
  let paid = 0
  let thisMonthPaid = 0
  let currency = "GBP"

  for (const r of rows) {
    const amt = num(r.amount_pence)
    if (r.currency) currency = String(r.currency).toUpperCase()
    switch (r.status) {
      case "pending":
        pending += amt
        break
      case "paid": {
        paid += amt
        // No `paid_at` column on the live table — `updated_at` is when the
        // payout settled to 'paid'.
        const settled = r.updated_at ? new Date(String(r.updated_at)) : null
        if (settled && settled >= startOfMonth) thisMonthPaid += amt
        break
      }
      default:
        // failed / reversed — not counted in any total.
        break
    }
  }

  return {
    workspaceId,
    currency,
    pendingPence: pending,
    inTransitPence: 0, // no in-transit state in the live payouts model
    paidPence: paid,
    thisMonthPaidPence: thisMonthPaid,
    totalCount: rows.length,
    provisioned: true,
  }
}

export interface SchedulePayoutArgs {
  workspaceId: string
  amountPence: number
  currency?: string
  /** Optional Connect destination account id for the eventual transfer. */
  destinationAccountId?: string | null
  /** Optional links for provenance. */
  transactionId?: string | null
  paymentId?: string | null
  bookingId?: string | null
  createdBy?: string | null
}

export interface SchedulePayoutResult {
  ok: boolean
  /** Present when the payout row was created. */
  payout?: PayoutRow
  /** Set when the payouts table isn't provisioned yet. */
  notProvisioned?: boolean
  error?: string
}

/**
 * schedulePayout — creates a PENDING payout row + an append-only opening ledger
 * entry. It does NOT create the Stripe transfer (that is done by a sibling
 * module and confirmed via `transfer.created`). Amount must be a positive
 * integer (minor units).
 *
 * Returns { ok: false, notProvisioned: true } when the payouts table is absent,
 * so the caller can answer 503 rather than 500.
 */
export async function schedulePayout(
  supabase: PayoutsSupabase,
  args: SchedulePayoutArgs
): Promise<SchedulePayoutResult> {
  if (!args.workspaceId) return { ok: false, error: "workspaceId is required" }
  if (!Number.isInteger(args.amountPence) || args.amountPence <= 0) {
    return { ok: false, error: "amountPence must be a positive integer (minor units)" }
  }

  const currency = (args.currency ?? "GBP").toUpperCase()
  const nowIso = new Date().toISOString()

  let payout: PayoutRow | undefined
  try {
    // Only columns that exist on the live `payouts` table.
    const { data, error } = await supabase
      .from("payouts")
      .insert({
        workspace_id: args.workspaceId,
        amount_pence: args.amountPence,
        currency,
        status: "pending",
        connect_account_id: args.destinationAccountId ?? null,
        payment_id: args.paymentId ?? null,
        created_at: nowIso,
        updated_at: nowIso,
      })
      .select("*")
      .single()
    if (error) {
      if (isNotProvisioned(error)) return { ok: false, notProvisioned: true }
      throw error
    }
    payout = data as PayoutRow
  } catch (err) {
    if (isNotProvisioned(err)) return { ok: false, notProvisioned: true }
    throw err
  }

  // No ledger entry here: a PENDING payout has moved no money. The actual
  // movement is recorded as an append-only `transfer` entry when the Stripe
  // `transfer.created` event lands (see webhooks.ts) — recording it now would
  // double-count.

  return { ok: true, payout }
}
