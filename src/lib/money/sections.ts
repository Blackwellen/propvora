import "server-only"

/**
 * P5+ — MONEY SECTION DATA LAYER.
 *
 * Read-only loaders for the workspace money sub-sections that the new routes
 * render: holds, commissions, payouts, refunds, disputes. Each reads REAL rows
 * (escrow_holds, marketplace_commission_ledger, payouts, payout_ledger,
 * marketplace_disputes) and is workspace-scoped + 42P01-tolerant so a cold DB
 * degrades to an empty, coherent state rather than crashing.
 *
 * Money is integer pence; never formatted here (the UI edge formats).
 */

export interface SectionSupabase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any
}

const NOT_PROVISIONED = new Set(["42P01", "PGRST205", "PGRST204", "42703", "PGRST202"])
function isNotProvisioned(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code
  return Boolean(code && NOT_PROVISIONED.has(code))
}
function num(v: unknown): number {
  const n = typeof v === "string" ? Number(v) : (v as number)
  return Number.isFinite(n) ? Math.round(n) : 0
}

async function safe<T = Record<string, unknown>>(
  run: () => Promise<{ data: T[] | null; error: unknown }>
): Promise<{ rows: T[]; provisioned: boolean }> {
  try {
    const { data, error } = await run()
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

// ─── HOLDS ───────────────────────────────────────────────────────────────────

export interface HoldsSummary {
  provisioned: boolean
  totalHeldPence: number
  totalDeductedPence: number
  activeCount: number
  rows: Array<{
    id: string
    holdType: string
    status: string
    amountPence: number
    deductedPence: number
    remainingPence: number
    bookingId: string | null
    reason: string | null
    createdAt: string | null
  }>
}

export async function loadHolds(supabase: SectionSupabase, workspaceId: string): Promise<HoldsSummary> {
  const { rows, provisioned } = await safe(() =>
    supabase
      .from("escrow_holds")
      .select("id, hold_type, status, amount_pence, deducted_pence, booking_id, reason, created_at")
      .eq("workspace_id", workspaceId)
      .in("hold_type", ["damage", "deposit", "security", "retention"])
      .order("created_at", { ascending: false })
  )
  let held = 0
  let deducted = 0
  let active = 0
  const mapped = rows.map((r) => {
    const amount = num((r as Record<string, unknown>).amount_pence)
    const ded = num((r as Record<string, unknown>).deducted_pence)
    const status = String((r as Record<string, unknown>).status ?? "held")
    if (status === "held") {
      held += amount - ded
      active += 1
    }
    deducted += ded
    return {
      id: String((r as Record<string, unknown>).id),
      holdType: String((r as Record<string, unknown>).hold_type ?? "damage"),
      status,
      amountPence: amount,
      deductedPence: ded,
      remainingPence: Math.max(0, amount - ded),
      bookingId: ((r as Record<string, unknown>).booking_id as string | null) ?? null,
      reason: ((r as Record<string, unknown>).reason as string | null) ?? null,
      createdAt: ((r as Record<string, unknown>).created_at as string | null) ?? null,
    }
  })
  return { provisioned, totalHeldPence: held, totalDeductedPence: deducted, activeCount: active, rows: mapped }
}

// ─── COMMISSIONS ─────────────────────────────────────────────────────────────

export interface CommissionsSummary {
  provisioned: boolean
  grossCommissionPence: number
  refundedCommissionPence: number
  netCommissionPence: number
  txnCount: number
  rows: Array<{
    transactionId: string
    type: string
    grossPence: number
    platformFeePence: number
    providerFeePence: number
    sellerPayoutPence: number
    status: string
    createdAt: string | null
  }>
}

export async function loadCommissions(supabase: SectionSupabase, workspaceId: string): Promise<CommissionsSummary> {
  // Commission EARNED by the platform on transactions this workspace sells.
  const { rows, provisioned } = await safe(() =>
    supabase
      .from("marketplace_transactions")
      .select("id, transaction_type, gross_pence, platform_fee_pence, provider_fee_pence, seller_payout_pence, status, created_at")
      .eq("seller_workspace_id", workspaceId)
      .order("created_at", { ascending: false })
  )
  let gross = 0
  let refunded = 0
  const mapped = rows.map((r) => {
    const rec = r as Record<string, unknown>
    const fee = num(rec.platform_fee_pence)
    const status = String(rec.status ?? "")
    if (status === "refunded" || status === "cancelled") refunded += fee
    else gross += fee
    return {
      transactionId: String(rec.id),
      type: String(rec.transaction_type ?? "marketplace"),
      grossPence: num(rec.gross_pence),
      platformFeePence: fee,
      providerFeePence: num(rec.provider_fee_pence),
      sellerPayoutPence: num(rec.seller_payout_pence),
      status,
      createdAt: (rec.created_at as string | null) ?? null,
    }
  })
  return {
    provisioned,
    grossCommissionPence: gross,
    refundedCommissionPence: refunded,
    netCommissionPence: gross - refunded,
    txnCount: mapped.length,
    rows: mapped,
  }
}

// ─── REFUNDS ─────────────────────────────────────────────────────────────────

export interface RefundsSummary {
  provisioned: boolean
  totalRefundedPence: number
  count: number
  rows: Array<{ paymentId: string | null; amountPence: number; currency: string; createdAt: string | null }>
}

export async function loadRefunds(supabase: SectionSupabase, workspaceId: string): Promise<RefundsSummary> {
  // Refund reversals live in payout_ledger (entry_type='refund'); join to the
  // workspace via escrow_payments.
  const { rows: payments } = await safe(() =>
    supabase.from("escrow_payments").select("id").eq("workspace_id", workspaceId)
  )
  const ids = payments.map((p) => String((p as Record<string, unknown>).id)).filter(Boolean)
  if (ids.length === 0) return { provisioned: true, totalRefundedPence: 0, count: 0, rows: [] }
  const { rows, provisioned } = await safe(() =>
    supabase
      .from("payout_ledger")
      .select("payment_id, amount_pence, currency, created_at, entry_type")
      .in("payment_id", ids)
      .eq("entry_type", "refund")
      .order("created_at", { ascending: false })
  )
  let total = 0
  const mapped = rows.map((r) => {
    const rec = r as Record<string, unknown>
    const amt = Math.abs(num(rec.amount_pence))
    total += amt
    return {
      paymentId: (rec.payment_id as string | null) ?? null,
      amountPence: amt,
      currency: String(rec.currency ?? "GBP"),
      createdAt: (rec.created_at as string | null) ?? null,
    }
  })
  return { provisioned, totalRefundedPence: total, count: mapped.length, rows: mapped }
}

// ─── DISPUTES (workspace view) ───────────────────────────────────────────────

export interface DisputesSummary {
  provisioned: boolean
  openCount: number
  payoutHeldCount: number
  disputedPence: number
  rows: Array<{
    id: string
    type: string
    status: string
    priority: string
    reason: string | null
    amountDisputedPence: number
    amountRefundedPence: number
    payoutHeld: boolean
    createdAt: string | null
  }>
}

export async function loadDisputesSection(supabase: SectionSupabase, workspaceId: string): Promise<DisputesSummary> {
  const { rows, provisioned } = await safe(() =>
    supabase
      .from("marketplace_disputes")
      .select("id, dispute_type, status, priority, reason, amount_disputed_pence, amount_refunded_pence, payout_held, created_at")
      .or(`raised_by_workspace_id.eq.${workspaceId},against_workspace_id.eq.${workspaceId},workspace_id.eq.${workspaceId}`)
      .order("created_at", { ascending: false })
  )
  let open = 0
  let held = 0
  let disputed = 0
  const mapped = rows.map((r) => {
    const rec = r as Record<string, unknown>
    const status = String(rec.status ?? "open")
    const payoutHeld = Boolean(rec.payout_held)
    if (!["resolved", "closed", "settled", "refunded"].includes(status)) open += 1
    if (payoutHeld) held += 1
    disputed += num(rec.amount_disputed_pence)
    return {
      id: String(rec.id),
      type: String(rec.dispute_type ?? "marketplace"),
      status,
      priority: String(rec.priority ?? "normal"),
      reason: (rec.reason as string | null) ?? null,
      amountDisputedPence: num(rec.amount_disputed_pence),
      amountRefundedPence: num(rec.amount_refunded_pence),
      payoutHeld,
      createdAt: (rec.created_at as string | null) ?? null,
    }
  })
  return { provisioned, openCount: open, payoutHeldCount: held, disputedPence: disputed, rows: mapped }
}
