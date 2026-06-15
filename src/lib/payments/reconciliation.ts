/**
 * Propvora v2 — P5 Payments: RECONCILIATION (read-only).
 *
 * Cross-checks STORED records against each other — it makes ZERO Stripe calls.
 * The goal is to surface drift between:
 *   - marketplace_transactions money fields vs the sum of their
 *     marketplace_commission_ledger entries;
 *   - payout rows vs the sum of their payout_ledger entries (when provisioned);
 *   - payment rows that claim a money-bearing state but have no escrow record.
 *
 * Every read tolerates an un-provisioned table (42P01 / PGRST205) by treating
 * that data source as empty, so reconciliation degrades gracefully on a branch
 * where the sibling P5 tables are not applied yet.
 */

export interface ReconSupabase {
  from: (table: string) => any
}

const NOT_PROVISIONED = new Set(["42P01", "PGRST205", "42703"])
function isNotProvisioned(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code
  return Boolean(code && NOT_PROVISIONED.has(code))
}

/** Safe select that returns [] when the table/column isn't provisioned. */
async function safeSelect<T = Record<string, unknown>>(
  query: Promise<{ data: T[] | null; error: unknown }>
): Promise<{ rows: T[]; provisioned: boolean }> {
  try {
    const { data, error } = await query
    if (error) {
      if (isNotProvisioned(error)) return { rows: [], provisioned: false }
      throw error
    }
    return { rows: (data as T[]) ?? [], provisioned: true }
  } catch (err) {
    if (isNotProvisioned(err)) return { rows: [], provisioned: false }
    throw err
  }
}

export interface Discrepancy {
  kind:
    | "transaction_ledger_mismatch"
    | "payout_ledger_mismatch"
    | "captured_without_escrow"
    | "payout_without_transaction"
  id: string
  workspaceId: string | null
  expectedPence: number
  actualPence: number
  deltaPence: number
  detail: string
}

export interface ReconciliationReport {
  workspaceId: string | null
  checkedAt: string
  counts: {
    transactions: number
    commissionLedgerEntries: number
    payouts: number
    payoutLedgerEntries: number
    payments: number
  }
  provisioned: {
    marketplaceTransactions: boolean
    commissionLedger: boolean
    payouts: boolean
    payoutLedger: boolean
    payments: boolean
    escrowHolds: boolean
  }
  discrepancies: Discrepancy[]
  clean: boolean
}

function num(v: unknown): number {
  const n = typeof v === "string" ? Number(v) : (v as number)
  return Number.isFinite(n) ? Math.round(n) : 0
}

/**
 * reconcilePayments — read-only discrepancy report. Pass a `workspaceId` to
 * scope marketplace/payout checks to a single workspace (recommended for
 * operator-triggered runs); omit it for a platform-wide sweep (admin).
 */
export async function reconcilePayments(
  supabase: ReconSupabase,
  workspaceId?: string
): Promise<ReconciliationReport> {
  const checkedAt = new Date().toISOString()
  const discrepancies: Discrepancy[] = []

  // ── marketplace_transactions ──────────────────────────────────────────────
  let txnQuery = supabase
    .from("marketplace_transactions")
    .select(
      "id, seller_workspace_id, gross_pence, platform_fee_pence, provider_fee_pence, seller_payout_pence, currency, status"
    )
  if (workspaceId) {
    // A workspace can be buyer or seller; reconcile rows it sells.
    txnQuery = txnQuery.eq("seller_workspace_id", workspaceId)
  }
  const txns = await safeSelect(txnQuery)

  const txnIds = txns.rows.map((t: any) => t.id).filter(Boolean)
  let ledgerByTxn = new Map<string, number>()
  let commissionLedgerCount = 0
  let commissionProvisioned = true
  if (txnIds.length > 0) {
    const led = await safeSelect(
      supabase
        .from("marketplace_commission_ledger")
        .select("transaction_id, entry_type, amount_pence")
        .in("transaction_id", txnIds)
    )
    commissionProvisioned = led.provisioned
    commissionLedgerCount = led.rows.length
    for (const row of led.rows as any[]) {
      const prev = ledgerByTxn.get(row.transaction_id) ?? 0
      ledgerByTxn.set(row.transaction_id, prev + num(row.amount_pence))
    }
  }

  // Expected ledger sum per transaction = platform_fee + provider_fee +
  // seller_payout (= gross). Compare with the sum of ledger entries (which,
  // post-refund, may be net of reversals). We only flag a mismatch when the
  // ledger has at least one entry (so we don't false-positive pre-ledger rows).
  for (const t of txns.rows as any[]) {
    const expected = num(t.platform_fee_pence) + num(t.provider_fee_pence) + num(t.seller_payout_pence)
    const actual = ledgerByTxn.get(t.id)
    if (actual === undefined) continue
    // For refunded transactions a reversal makes the net differ legitimately.
    if (t.status === "refunded" || t.status === "disputed" || t.status === "cancelled") continue
    if (actual !== expected) {
      discrepancies.push({
        kind: "transaction_ledger_mismatch",
        id: t.id,
        workspaceId: t.seller_workspace_id ?? null,
        expectedPence: expected,
        actualPence: actual,
        deltaPence: actual - expected,
        detail: `commission ledger sum ${actual} ≠ expected fee+payout ${expected} (status=${t.status})`,
      })
    }
  }

  // ── payouts vs payout_ledger (sibling tables; may be absent) ──────────────
  let payoutQuery = supabase
    .from("payouts")
    .select("id, workspace_id, amount_pence, status, stripe_transfer_id")
  if (workspaceId) payoutQuery = payoutQuery.eq("workspace_id", workspaceId)
  const payouts = await safeSelect(payoutQuery)

  const payoutIds = payouts.rows.map((p: any) => p.id).filter(Boolean)
  let payoutLedgerByPayout = new Map<string, number>()
  let payoutLedgerCount = 0
  let payoutLedgerProvisioned = true
  if (payoutIds.length > 0) {
    const led = await safeSelect(
      supabase
        .from("payout_ledger")
        .select("payout_id, amount_pence, entry_type")
        .in("payout_id", payoutIds)
    )
    payoutLedgerProvisioned = led.provisioned
    payoutLedgerCount = led.rows.length
    for (const row of led.rows as any[]) {
      if (!row.payout_id) continue
      const prev = payoutLedgerByPayout.get(row.payout_id) ?? 0
      payoutLedgerByPayout.set(row.payout_id, prev + num(row.amount_pence))
    }
  }

  for (const p of payouts.rows as any[]) {
    const actual = payoutLedgerByPayout.get(p.id)
    if (actual === undefined) continue
    const expected = num(p.amount_pence)
    if (actual !== expected) {
      discrepancies.push({
        kind: "payout_ledger_mismatch",
        id: p.id,
        workspaceId: p.workspace_id ?? null,
        expectedPence: expected,
        actualPence: actual,
        deltaPence: actual - expected,
        detail: `payout ledger sum ${actual} ≠ payout amount ${expected} (status=${p.status})`,
      })
    }
  }

  // ── escrow_payments claiming a money-bearing state without a hold record ──
  let payQuery = supabase
    .from("escrow_payments")
    .select("id, workspace_id, status, currency")
    .in("status", ["captured", "released"])
  if (workspaceId) payQuery = payQuery.eq("workspace_id", workspaceId)
  const payments = await safeSelect(payQuery)

  const paymentIds = payments.rows
    .map((p: Record<string, unknown>) => p.id as string | undefined)
    .filter(Boolean) as string[]
  const escrowByPaymentId = new Set<string>()
  let escrowProvisioned = true
  if (paymentIds.length > 0) {
    // escrow_holds links to escrow_payments via payment_id.
    const esc = await safeSelect(
      supabase.from("escrow_holds").select("payment_id").in("payment_id", paymentIds)
    )
    escrowProvisioned = esc.provisioned
    for (const row of esc.rows as Array<Record<string, unknown>>) {
      if (row.payment_id) escrowByPaymentId.add(String(row.payment_id))
    }
    // Only flag missing-escrow when the holds table is actually provisioned;
    // otherwise an empty set would false-positive every captured payment.
    if (escrowProvisioned) {
      for (const p of payments.rows as Array<Record<string, unknown>>) {
        if (p.id && !escrowByPaymentId.has(String(p.id))) {
          discrepancies.push({
            kind: "captured_without_escrow",
            id: String(p.id),
            workspaceId: (p.workspace_id as string | null) ?? null,
            expectedPence: 0,
            actualPence: 0,
            deltaPence: 0,
            detail: `escrow_payment status=${p.status} has no escrow_holds row`,
          })
        }
      }
    }
  }

  return {
    workspaceId: workspaceId ?? null,
    checkedAt,
    counts: {
      transactions: txns.rows.length,
      commissionLedgerEntries: commissionLedgerCount,
      payouts: payouts.rows.length,
      payoutLedgerEntries: payoutLedgerCount,
      payments: payments.rows.length,
    },
    provisioned: {
      marketplaceTransactions: txns.provisioned,
      commissionLedger: commissionProvisioned,
      payouts: payouts.provisioned,
      payoutLedger: payoutLedgerProvisioned,
      payments: payments.provisioned,
      escrowHolds: escrowProvisioned,
    },
    discrepancies,
    clean: discrepancies.length === 0,
  }
}

export interface PayoutSummary {
  workspaceId: string
  currency: string
  pendingPence: number
  inTransitPence: number
  paidPence: number
  thisMonthPaidPence: number
  count: number
  provisioned: boolean
}

/**
 * summarisePayouts — totals for one workspace, integer pence. Read-only.
 * Tolerates the payouts table not existing (returns zeros, provisioned=false).
 */
export async function summarisePayouts(
  supabase: ReconSupabase,
  workspaceId: string
): Promise<PayoutSummary> {
  const res = await safeSelect(
    supabase
      .from("payouts")
      .select("amount_pence, status, currency, updated_at")
      .eq("workspace_id", workspaceId)
  )

  const startOfMonth = new Date()
  startOfMonth.setUTCDate(1)
  startOfMonth.setUTCHours(0, 0, 0, 0)

  let pending = 0
  const inTransit = 0 // no in-transit state in the live payouts model
  let paid = 0
  let thisMonthPaid = 0
  let currency = "GBP"

  for (const row of res.rows as Array<Record<string, unknown>>) {
    const amt = num(row.amount_pence)
    if (row.currency) currency = String(row.currency).toUpperCase()
    switch (row.status) {
      case "pending":
        pending += amt
        break
      case "paid": {
        paid += amt
        const settled = row.updated_at ? new Date(String(row.updated_at)) : null
        if (settled && settled >= startOfMonth) thisMonthPaid += amt
        break
      }
      default:
        // failed / reversed — not counted
        break
    }
  }

  return {
    workspaceId,
    currency,
    pendingPence: pending,
    inTransitPence: inTransit,
    paidPence: paid,
    thisMonthPaidPence: thisMonthPaid,
    count: res.rows.length,
    provisioned: res.provisioned,
  }
}
