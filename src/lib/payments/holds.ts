import "server-only"

/**
 * P5+ — DEPOSIT & DAMAGE HOLDS (escrow holds as first-class money).
 *
 * Builds on the extended `escrow_holds` table (hold_type, workspace_id,
 * booking_id, tenancy_id, deposit_id, reason, deducted_pence) and the append-only
 * `hold_ledger_entries` sub-ledger added in migration 20260617070000.
 *
 * A deposit/damage hold is money taken from a guest/tenant and HELD as a
 * liability. Movements (hold / top_up / deduct / refund / release) each append a
 * `hold_ledger_entries` row so the balance is reconstructable and immutable.
 * The balance of a hold = sum(hold + top_up) − sum(deduct + refund + release).
 *
 * Every movement is also intended to post a balanced journal entry against the
 * deposit-liability account (see src/lib/accounting/hold-journal.ts); these
 * functions return the ledger rows so the caller can post the journal in the
 * same transaction-of-work.
 *
 * NO Stripe calls. Money is integer pence. Append-only ledger (DB trigger
 * enforces immutability).
 */

export interface HoldsSupabase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any
}

export type HoldType = "payment" | "damage" | "deposit" | "security" | "retention"
export type HoldStatus = "held" | "released" | "refunded" | "cancelled"
export type HoldLedgerEntryType =
  | "hold"
  | "release"
  | "refund"
  | "deduct"
  | "top_up"
  | "adjustment"

export interface HoldRecord {
  id: string
  payment_id: string | null
  workspace_id: string | null
  booking_id: string | null
  tenancy_id: string | null
  deposit_id: string | null
  hold_type: HoldType
  amount_pence: number
  deducted_pence: number
  status: HoldStatus
  reason: string | null
  release_condition: string | null
  released_at: string | null
  created_at: string
  updated_at: string
}

export interface HoldLedgerRow {
  id: string
  workspace_id: string
  hold_id: string | null
  deposit_id: string | null
  booking_id: string | null
  entry_type: HoldLedgerEntryType
  amount_pence: number
  currency: string
  journal_entry_id: string | null
  memo: string | null
  created_at: string
}

function pence(n: number): number {
  return Math.max(0, Math.trunc(n))
}

const NOT_PROVISIONED = new Set(["42P01", "PGRST205", "PGRST204", "42703"])
function isNotProvisioned(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code
  return Boolean(code && NOT_PROVISIONED.has(code))
}

/** Append a hold-ledger row (immutable). Throws on real errors. */
async function appendHoldLedger(
  supabase: HoldsSupabase,
  row: {
    workspaceId: string
    holdId: string | null
    depositId?: string | null
    bookingId?: string | null
    entryType: HoldLedgerEntryType
    amountPence: number
    currency?: string
    memo?: string | null
    createdBy?: string | null
  }
): Promise<HoldLedgerRow | null> {
  const { data, error } = await supabase
    .from("hold_ledger_entries")
    .insert({
      workspace_id: row.workspaceId,
      hold_id: row.holdId,
      deposit_id: row.depositId ?? null,
      booking_id: row.bookingId ?? null,
      entry_type: row.entryType,
      amount_pence: Math.trunc(row.amountPence),
      currency: (row.currency ?? "GBP").toUpperCase(),
      memo: row.memo ?? null,
      created_by: row.createdBy ?? null,
    })
    .select("*")
    .single()
  if (error) {
    if (isNotProvisioned(error)) return null
    throw error
  }
  return data as HoldLedgerRow
}

export interface CreateHoldArgs {
  workspaceId: string
  amountPence: number
  holdType: HoldType
  paymentId?: string | null
  bookingId?: string | null
  tenancyId?: string | null
  depositId?: string | null
  reason?: string | null
  releaseCondition?: string | null
  currency?: string
  createdBy?: string | null
}

export interface HoldMovementResult {
  hold: HoldRecord
  ledgerEntry: HoldLedgerRow | null
}

/**
 * createDamageOrDepositHold — opens a damage/deposit/security hold in 'held'
 * state and appends the opening `hold` ledger entry. The funds are assumed
 * already captured (the linked escrow_payment, if any, is captured/authorised
 * by a verified Stripe event). This only records the HOLD bookkeeping.
 */
export async function createDamageOrDepositHold(
  supabase: HoldsSupabase,
  args: CreateHoldArgs
): Promise<HoldMovementResult> {
  const amount = pence(args.amountPence)
  const { data, error } = await supabase
    .from("escrow_holds")
    .insert({
      payment_id: args.paymentId ?? null,
      workspace_id: args.workspaceId,
      booking_id: args.bookingId ?? null,
      tenancy_id: args.tenancyId ?? null,
      deposit_id: args.depositId ?? null,
      hold_type: args.holdType,
      amount_pence: amount,
      deducted_pence: 0,
      status: "held",
      reason: args.reason ?? null,
      release_condition: args.releaseCondition ?? null,
    })
    .select("*")
    .single()
  if (error) throw error
  const hold = data as HoldRecord

  const ledgerEntry = await appendHoldLedger(supabase, {
    workspaceId: args.workspaceId,
    holdId: hold.id,
    depositId: args.depositId ?? null,
    bookingId: args.bookingId ?? null,
    entryType: "hold",
    amountPence: amount,
    currency: args.currency,
    memo: args.reason ?? `${args.holdType} hold opened`,
    createdBy: args.createdBy,
  })

  return { hold, ledgerEntry }
}

export interface DeductFromHoldArgs {
  holdId: string
  workspaceId: string
  amountPence: number
  reason: string
  currency?: string
  createdBy?: string | null
}

/**
 * deductFromHold — record a damage deduction against a held deposit. Increments
 * `deducted_pence` (never above the held amount) and appends a `deduct` ledger
 * entry. Returns the updated hold + ledger row. Does NOT move the money to the
 * landlord here (that is a separate payout/journal); it records the deduction.
 */
export async function deductFromHold(
  supabase: HoldsSupabase,
  args: DeductFromHoldArgs
): Promise<HoldMovementResult> {
  const { data: current, error: readErr } = await supabase
    .from("escrow_holds")
    .select("*")
    .eq("id", args.holdId)
    .single()
  if (readErr) throw readErr
  const hold = current as HoldRecord
  if (hold.status !== "held") {
    throw new Error(`Cannot deduct from a hold in '${hold.status}' state.`)
  }
  const remaining = pence(hold.amount_pence) - pence(hold.deducted_pence)
  const deduct = Math.min(pence(args.amountPence), remaining)
  if (deduct <= 0) throw new Error("Deduction exceeds the remaining held amount.")

  const { data: updated, error: updErr } = await supabase
    .from("escrow_holds")
    .update({
      deducted_pence: pence(hold.deducted_pence) + deduct,
      reason: args.reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", args.holdId)
    .eq("status", "held")
    .select("*")
    .single()
  if (updErr) throw updErr

  const ledgerEntry = await appendHoldLedger(supabase, {
    workspaceId: args.workspaceId,
    holdId: args.holdId,
    depositId: hold.deposit_id,
    bookingId: hold.booking_id,
    entryType: "deduct",
    amountPence: deduct,
    currency: args.currency,
    memo: args.reason,
    createdBy: args.createdBy,
  })

  return { hold: updated as HoldRecord, ledgerEntry }
}

export interface ReleaseHoldArgs {
  holdId: string
  workspaceId: string
  /** 'release' returns net to the holder; 'refund' returns to the payer. */
  mode: "release" | "refund"
  currency?: string
  createdBy?: string | null
  memo?: string | null
}

/**
 * settleHold — close a hold by returning the remaining (held − deducted) amount.
 * Appends the closing ledger entry (release or refund) for the remaining
 * balance and flips status. Idempotent: a non-held hold is a no-op return.
 */
export async function settleHold(
  supabase: HoldsSupabase,
  args: ReleaseHoldArgs
): Promise<HoldMovementResult> {
  const { data: current, error: readErr } = await supabase
    .from("escrow_holds")
    .select("*")
    .eq("id", args.holdId)
    .single()
  if (readErr) throw readErr
  const hold = current as HoldRecord
  const remaining = pence(hold.amount_pence) - pence(hold.deducted_pence)

  const newStatus: HoldStatus = args.mode === "refund" ? "refunded" : "released"
  const { data: updated, error: updErr } = await supabase
    .from("escrow_holds")
    .update({ status: newStatus, released_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", args.holdId)
    .eq("status", "held")
    .select("*")
    .single()
  if (updErr) throw updErr

  let ledgerEntry: HoldLedgerRow | null = null
  if (remaining > 0) {
    ledgerEntry = await appendHoldLedger(supabase, {
      workspaceId: args.workspaceId,
      holdId: args.holdId,
      depositId: hold.deposit_id,
      bookingId: hold.booking_id,
      entryType: args.mode === "refund" ? "refund" : "release",
      amountPence: remaining,
      currency: args.currency,
      memo: args.memo ?? `Hold ${args.mode} of remaining balance`,
      createdBy: args.createdBy,
    })
  }

  return { hold: updated as HoldRecord, ledgerEntry }
}

/** PURE: reconstruct a hold's current balance from its ledger entries. */
export function holdBalanceFromLedger(entries: HoldLedgerRow[]): {
  heldPence: number
  outPence: number
  balancePence: number
} {
  let held = 0
  let out = 0
  for (const e of entries) {
    const amt = Math.abs(Math.trunc(e.amount_pence))
    if (e.entry_type === "hold" || e.entry_type === "top_up") held += amt
    else if (e.entry_type === "deduct" || e.entry_type === "refund" || e.entry_type === "release") out += amt
    else if (e.entry_type === "adjustment") held += Math.trunc(e.amount_pence) // signed
  }
  return { heldPence: held, outPence: out, balancePence: held - out }
}

/** List holds for a workspace (optionally by type/status). */
export async function listHolds(
  supabase: HoldsSupabase,
  workspaceId: string,
  filters: { holdType?: HoldType; status?: HoldStatus; bookingId?: string } = {}
): Promise<{ items: HoldRecord[]; provisioned: boolean }> {
  try {
    let q = supabase
      .from("escrow_holds")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
    if (filters.holdType) q = q.eq("hold_type", filters.holdType)
    if (filters.status) q = q.eq("status", filters.status)
    if (filters.bookingId) q = q.eq("booking_id", filters.bookingId)
    const { data, error } = await q
    if (error) {
      if (isNotProvisioned(error)) return { items: [], provisioned: false }
      throw error
    }
    return { items: (data as HoldRecord[]) ?? [], provisioned: true }
  } catch (err) {
    if (isNotProvisioned(err)) return { items: [], provisioned: false }
    throw err
  }
}
