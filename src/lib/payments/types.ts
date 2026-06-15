/**
 * P5 — Payments / escrow shared types.
 *
 * Money is ALWAYS integer minor units (pence). These DTOs mirror the
 * `escrow_payments` / `escrow_holds` / `payouts` / `payout_ledger` tables from
 * migration 20260616090000_payments_escrow.sql.
 *
 * HONESTY CONTRACT: the *build* helpers in this package construct Stripe params
 * and INSERT rows in their initial state only (`requires_payment` / `held` /
 * `pending`). They never mark anything captured/released/paid — those states are
 * driven exclusively by real Stripe webhook events (sibling agent).
 */

/** Lifecycle of an escrow PaymentIntent. Mirrors the DB CHECK constraint. */
export type PaymentStatus =
  | "requires_payment"
  | "authorized"
  | "captured"
  | "released"
  | "refunded"
  | "partially_refunded"
  | "failed"
  | "cancelled"

/** Lifecycle of an escrow hold. Mirrors the DB CHECK constraint. */
export type EscrowStatus = "held" | "released" | "refunded" | "cancelled"

/** Lifecycle of a Connect transfer (payout). Mirrors the DB CHECK constraint. */
export type PayoutStatus = "pending" | "paid" | "failed" | "reversed"

/** Stripe capture mode. Escrow ALWAYS uses 'manual'. */
export type CaptureMethod = "automatic" | "manual"

/** payout_ledger entry kinds. Mirrors the DB CHECK constraint. */
export type PayoutLedgerEntryType =
  | "charge"
  | "platform_fee"
  | "transfer"
  | "refund"
  | "reversal"
  | "adjustment"

/** A row of `escrow_payments`. */
export interface PaymentRecord {
  id: string
  workspace_id: string
  transaction_id: string | null
  booking_id: string | null
  payer_email: string | null
  amount_pence: number
  currency: string
  platform_fee_pence: number
  stripe_payment_intent_id: string | null
  capture_method: CaptureMethod
  status: PaymentStatus
  escrow: boolean
  created_at: string
  updated_at: string
}

/** A row of `escrow_holds`. */
export interface EscrowHoldRecord {
  id: string
  payment_id: string
  amount_pence: number
  status: EscrowStatus
  release_condition: string | null
  released_at: string | null
  created_at: string
  updated_at: string
}

/** A row of `payouts`. */
export interface PayoutRecord {
  id: string
  workspace_id: string
  connect_account_id: string | null
  amount_pence: number
  currency: string
  stripe_transfer_id: string | null
  status: PayoutStatus
  payment_id: string | null
  created_at: string
  updated_at: string
}

/** A row of `payout_ledger` (append-only). */
export interface PayoutLedgerRow {
  id: string
  payout_id: string | null
  payment_id: string | null
  entry_type: PayoutLedgerEntryType
  amount_pence: number
  currency: string
  created_at: string
}

/** The minimal seller Connect account fields needed to route a transfer. */
export interface SellerConnectAccount {
  workspace_id: string
  stripe_account_id: string
  charges_enabled: boolean
  payouts_enabled: boolean
  status: "pending" | "active" | "restricted" | "disabled"
}

/** Table name constants — kept here so libs never typo a table reference. */
export const PAYMENTS_TABLE = "escrow_payments" as const
export const ESCROW_HOLDS_TABLE = "escrow_holds" as const
export const PAYOUTS_TABLE = "payouts" as const
export const PAYOUT_LEDGER_TABLE = "payout_ledger" as const
export const CONNECT_ACCOUNTS_TABLE = "stripe_connect_accounts" as const
