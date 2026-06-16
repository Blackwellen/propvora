import "server-only"

/**
 * P5+ — PAYMENTS → JOURNAL PATTERNS.
 *
 * Translates the money lifecycle (booking collected/recognised, supplier job
 * funded→released→payable→commission→payout, deposit/damage holds) into balanced
 * double-entry journal entries against the extended chart of accounts (seeded by
 * migration 20260617070000):
 *
 *   1030 Escrow / Funds Held (Clearing)   asset
 *   1040 Payouts Clearing                 asset
 *   2110 Damage / Security Holds          liability
 *   2120 Booking Deposits Payable         liability
 *   2400 Deferred Booking Revenue         liability
 *   2500 Supplier Payable                 liability
 *   4300 Booking Revenue                  income
 *   4400 Marketplace Commission Income    income
 *   6200 Payment Processing Fees          expense
 *   6300 Provider / Pass-through Fees     expense
 *   1000 Bank — Current Account           asset
 *   2100 Tenant Deposits Held             liability
 *
 * Each builder returns a PostEntryInput (draft lines) → postJournalEntry().
 * Composition is separate from posting so the UI can preview, and the DB balance
 * constraint + immutability triggers enforce correctness on post. Money is
 * integer pence. Every entry MUST balance (asserted by the ledger engine).
 */

import type { DB } from "./ledger"
import type { DraftLine, LedgerAccount, PostEntryInput } from "./types"
import { loadAccountsByCode } from "./money-mapping"

export const MONEY_ACCT = {
  BANK: "1000",
  ESCROW_CLEARING: "1030",
  PAYOUT_CLEARING: "1040",
  TENANT_DEPOSITS: "2100",
  DAMAGE_HOLDS: "2110",
  DEPOSITS_PAYABLE: "2120",
  DEFERRED_REVENUE: "2400",
  SUPPLIER_PAYABLE: "2500",
  BOOKING_REVENUE: "4300",
  COMMISSION_INCOME: "4400",
  PROCESSING_FEES: "6200",
  PROVIDER_FEES: "6300",
} as const

function acct(map: Record<string, LedgerAccount>, code: string): string {
  const a = map[code]
  if (!a) throw new Error(`Ledger account ${code} not found — run seed_money_accounts for this workspace.`)
  return a.id
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

// ─── BOOKING REVENUE: collected → deferred → recognised ──────────────────────

export interface BookingCollectedArgs {
  workspaceId: string
  bookingId: string
  /** Gross collected from the guest, integer pence. */
  grossPence: number
  /** Processing fee taken by the PSP, integer pence (optional). */
  processingFeePence?: number
  date?: string
  createdBy?: string | null
}

/**
 * Booking funds COLLECTED into escrow, recognised as DEFERRED revenue (the stay
 * has not happened yet). Funds sit in the escrow-clearing asset; the obligation
 * is a deferred-revenue liability.
 *
 *   Dr 1030 Escrow Clearing            gross − fee
 *   Dr 6200 Processing Fees            fee
 *   Cr 2400 Deferred Booking Revenue   gross
 */
export function buildBookingCollected(
  accounts: Record<string, LedgerAccount>,
  args: BookingCollectedArgs
): PostEntryInput {
  const gross = Math.max(0, Math.trunc(args.grossPence))
  const fee = Math.max(0, Math.trunc(args.processingFeePence ?? 0))
  const net = gross - fee
  const lines: DraftLine[] = [
    { account_id: acct(accounts, MONEY_ACCT.ESCROW_CLEARING), debit_pence: net, credit_pence: 0 },
  ]
  if (fee > 0) lines.push({ account_id: acct(accounts, MONEY_ACCT.PROCESSING_FEES), debit_pence: fee, credit_pence: 0 })
  lines.push({ account_id: acct(accounts, MONEY_ACCT.DEFERRED_REVENUE), debit_pence: 0, credit_pence: gross })
  return {
    workspaceId: args.workspaceId,
    date: args.date ?? today(),
    memo: `Booking ${args.bookingId.slice(0, 8)} funds collected (deferred)`,
    sourceType: "booking_collected",
    sourceId: args.bookingId,
    createdBy: args.createdBy ?? null,
    lines,
  }
}

export interface BookingRecognisedArgs {
  workspaceId: string
  bookingId: string
  /** Amount to recognise as earned revenue (usually gross), integer pence. */
  amountPence: number
  date?: string
  createdBy?: string | null
}

/**
 * Stay COMPLETED → recognise the deferred revenue as earned Booking Revenue.
 *
 *   Dr 2400 Deferred Booking Revenue   amount
 *   Cr 4300 Booking Revenue            amount
 */
export function buildBookingRecognised(
  accounts: Record<string, LedgerAccount>,
  args: BookingRecognisedArgs
): PostEntryInput {
  const amount = Math.max(0, Math.trunc(args.amountPence))
  return {
    workspaceId: args.workspaceId,
    date: args.date ?? today(),
    memo: `Booking ${args.bookingId.slice(0, 8)} revenue recognised`,
    sourceType: "booking_recognised",
    sourceId: args.bookingId,
    createdBy: args.createdBy ?? null,
    lines: [
      { account_id: acct(accounts, MONEY_ACCT.DEFERRED_REVENUE), debit_pence: amount, credit_pence: 0 },
      { account_id: acct(accounts, MONEY_ACCT.BOOKING_REVENUE), debit_pence: 0, credit_pence: amount },
    ],
  }
}

// ─── SUPPLIER JOB: funded → hold → released → payable → commission → payout ───

export interface SupplierFundedArgs {
  workspaceId: string
  jobRef: string
  /** Optional UUID linkage for source_id (e.g. payment id). */
  sourceId?: string | null
  grossPence: number
  processingFeePence?: number
  date?: string
  createdBy?: string | null
}

/**
 * Supplier job FUNDED into escrow.
 *   Dr 1030 Escrow Clearing            gross − fee
 *   Dr 6200 Processing Fees            fee
 *   Cr 2500 Supplier Payable           gross   (we owe the supplier, less commission later)
 */
export function buildSupplierFunded(
  accounts: Record<string, LedgerAccount>,
  args: SupplierFundedArgs
): PostEntryInput {
  const gross = Math.max(0, Math.trunc(args.grossPence))
  const fee = Math.max(0, Math.trunc(args.processingFeePence ?? 0))
  const net = gross - fee
  const lines: DraftLine[] = [
    { account_id: acct(accounts, MONEY_ACCT.ESCROW_CLEARING), debit_pence: net, credit_pence: 0 },
  ]
  if (fee > 0) lines.push({ account_id: acct(accounts, MONEY_ACCT.PROCESSING_FEES), debit_pence: fee, credit_pence: 0 })
  lines.push({ account_id: acct(accounts, MONEY_ACCT.SUPPLIER_PAYABLE), debit_pence: 0, credit_pence: gross })
  return {
    workspaceId: args.workspaceId,
    date: args.date ?? today(),
    memo: `Supplier job ${args.jobRef} funded into escrow`,
    sourceType: "supplier_funded",
    sourceId: args.sourceId ?? null,
    createdBy: args.createdBy ?? null,
    lines,
  }
}

export interface SupplierReleasedArgs {
  workspaceId: string
  jobRef: string
  sourceId?: string | null
  /** Gross job value, integer pence. */
  grossPence: number
  /** Platform commission retained, integer pence. */
  commissionPence: number
  /** Provider/pass-through fee, integer pence. */
  providerFeePence?: number
  date?: string
  createdBy?: string | null
}

/**
 * Supplier job RELEASED (evidence approved, blocks clear): recognise commission
 * income and move the supplier's net out of escrow into the payout clearing
 * account, settling the supplier-payable.
 *
 *   Dr 2500 Supplier Payable           gross
 *   Cr 4400 Commission Income          commission
 *   Cr 6300 Provider Fees (contra)     providerFee     (reduces payout; pass-through)
 *   Cr 1040 Payouts Clearing           gross − commission − providerFee  (net to supplier)
 *
 * The escrow-clearing asset is relieved when the payout actually settles
 * ({@link buildSupplierPayout}). This entry recognises the P&L + reclassifies the
 * liability to the payout queue. (Provider fee is credited to its expense account
 * as a pass-through recovery so net P&L = commission only.)
 */
export function buildSupplierReleased(
  accounts: Record<string, LedgerAccount>,
  args: SupplierReleasedArgs
): PostEntryInput {
  const gross = Math.max(0, Math.trunc(args.grossPence))
  const commission = Math.max(0, Math.trunc(args.commissionPence))
  const providerFee = Math.max(0, Math.trunc(args.providerFeePence ?? 0))
  const net = gross - commission - providerFee
  const lines: DraftLine[] = [
    { account_id: acct(accounts, MONEY_ACCT.SUPPLIER_PAYABLE), debit_pence: gross, credit_pence: 0 },
    { account_id: acct(accounts, MONEY_ACCT.COMMISSION_INCOME), debit_pence: 0, credit_pence: commission },
  ]
  if (providerFee > 0) lines.push({ account_id: acct(accounts, MONEY_ACCT.PROVIDER_FEES), debit_pence: 0, credit_pence: providerFee })
  lines.push({ account_id: acct(accounts, MONEY_ACCT.PAYOUT_CLEARING), debit_pence: 0, credit_pence: net })
  return {
    workspaceId: args.workspaceId,
    date: args.date ?? today(),
    memo: `Supplier job ${args.jobRef} released — commission ${commission}p`,
    sourceType: "supplier_released",
    sourceId: args.sourceId ?? null,
    createdBy: args.createdBy ?? null,
    lines,
  }
}

export interface SupplierPayoutArgs {
  workspaceId: string
  jobRef: string
  sourceId?: string | null
  /** Net amount paid to the supplier, integer pence. */
  netPence: number
  date?: string
  createdBy?: string | null
}

/**
 * Supplier PAYOUT settled (transfer paid): relieve the payout-clearing liability
 * and the escrow asset.
 *
 *   Dr 1040 Payouts Clearing           net
 *   Cr 1030 Escrow Clearing            net
 */
export function buildSupplierPayout(
  accounts: Record<string, LedgerAccount>,
  args: SupplierPayoutArgs
): PostEntryInput {
  const net = Math.max(0, Math.trunc(args.netPence))
  return {
    workspaceId: args.workspaceId,
    date: args.date ?? today(),
    memo: `Supplier job ${args.jobRef} payout settled`,
    sourceType: "supplier_payout",
    sourceId: args.sourceId ?? null,
    createdBy: args.createdBy ?? null,
    lines: [
      { account_id: acct(accounts, MONEY_ACCT.PAYOUT_CLEARING), debit_pence: net, credit_pence: 0 },
      { account_id: acct(accounts, MONEY_ACCT.ESCROW_CLEARING), debit_pence: 0, credit_pence: net },
    ],
  }
}

// ─── DEPOSIT / DAMAGE HOLDS ──────────────────────────────────────────────────

export interface HoldJournalArgs {
  workspaceId: string
  holdRef: string
  /** Optional UUID linkage for source_id (e.g. hold id). */
  sourceId?: string | null
  amountPence: number
  /** Which liability account: tenant deposit vs damage/security hold. */
  liabilityCode?: string
  date?: string
  createdBy?: string | null
}

/**
 * Deposit/damage hold TAKEN: cash held as a liability.
 *   Dr 1030 Escrow Clearing            amount
 *   Cr 2110/2100 Holds/Deposits        amount
 */
export function buildHoldTaken(
  accounts: Record<string, LedgerAccount>,
  args: HoldJournalArgs
): PostEntryInput {
  const amount = Math.max(0, Math.trunc(args.amountPence))
  const liability = args.liabilityCode ?? MONEY_ACCT.DAMAGE_HOLDS
  return {
    workspaceId: args.workspaceId,
    date: args.date ?? today(),
    memo: `Hold ${args.holdRef} taken`,
    sourceType: "hold_taken",
    sourceId: args.sourceId ?? null,
    createdBy: args.createdBy ?? null,
    lines: [
      { account_id: acct(accounts, MONEY_ACCT.ESCROW_CLEARING), debit_pence: amount, credit_pence: 0 },
      { account_id: acct(accounts, liability), debit_pence: 0, credit_pence: amount },
    ],
  }
}

/**
 * Hold DEDUCTED (damage charge kept): liability → income/receivable. We move the
 * deducted amount from the hold liability to Booking Revenue (damage recovery)
 * and out of escrow into the bank/payout clearing.
 *   Dr 2110 Damage Holds               deduct
 *   Cr 4300 Booking Revenue            deduct
 *   Dr 1040 Payouts Clearing           deduct
 *   Cr 1030 Escrow Clearing            deduct
 */
export function buildHoldDeducted(
  accounts: Record<string, LedgerAccount>,
  args: HoldJournalArgs
): PostEntryInput {
  const amount = Math.max(0, Math.trunc(args.amountPence))
  const liability = args.liabilityCode ?? MONEY_ACCT.DAMAGE_HOLDS
  return {
    workspaceId: args.workspaceId,
    date: args.date ?? today(),
    memo: `Hold ${args.holdRef} deduction`,
    sourceType: "hold_deducted",
    sourceId: args.sourceId ?? null,
    createdBy: args.createdBy ?? null,
    lines: [
      { account_id: acct(accounts, liability), debit_pence: amount, credit_pence: 0 },
      { account_id: acct(accounts, MONEY_ACCT.BOOKING_REVENUE), debit_pence: 0, credit_pence: amount },
      { account_id: acct(accounts, MONEY_ACCT.PAYOUT_CLEARING), debit_pence: amount, credit_pence: 0 },
      { account_id: acct(accounts, MONEY_ACCT.ESCROW_CLEARING), debit_pence: 0, credit_pence: amount },
    ],
  }
}

/**
 * Hold RELEASED/REFUNDED back to the payer: relieve the remaining liability and
 * the escrow asset.
 *   Dr 2110 Damage Holds               amount
 *   Cr 1030 Escrow Clearing            amount
 */
export function buildHoldReleased(
  accounts: Record<string, LedgerAccount>,
  args: HoldJournalArgs
): PostEntryInput {
  const amount = Math.max(0, Math.trunc(args.amountPence))
  const liability = args.liabilityCode ?? MONEY_ACCT.DAMAGE_HOLDS
  return {
    workspaceId: args.workspaceId,
    date: args.date ?? today(),
    memo: `Hold ${args.holdRef} released`,
    sourceType: "hold_released",
    sourceId: args.sourceId ?? null,
    createdBy: args.createdBy ?? null,
    lines: [
      { account_id: acct(accounts, liability), debit_pence: amount, credit_pence: 0 },
      { account_id: acct(accounts, MONEY_ACCT.ESCROW_CLEARING), debit_pence: 0, credit_pence: amount },
    ],
  }
}

/**
 * Convenience: load accounts + return both the builder map and the loader. Most
 * callers will `loadAccountsByCode` once then call several builders.
 */
export async function loadMoneyAccounts(db: DB, workspaceId: string): Promise<Record<string, LedgerAccount>> {
  return loadAccountsByCode(db, workspaceId)
}
