/**
 * P5 — Connect transfer (seller payout) layer.
 *
 * Escrow release pays the seller via a SEPARATE Stripe Transfer (funds were
 * held on the platform account; on release we move the seller's net payout to
 * their Connect account). The platform commission is simply what is NOT
 * transferred.
 *
 * `buildTransferParams` is PURE — it returns the Stripe.TransferCreateParams the
 * webhook/release layer hands to Stripe. It NEVER calls Stripe.
 * `recordPayout` inserts the `payouts` + `payout_ledger` rows in their initial
 * state ('pending'); the real transfer id + 'paid' status are written by the
 * webhook once Stripe confirms.
 *
 * REUSE of src/lib/billing/connect.ts: the seller's destination account is the
 * SAME `stripe_connect_accounts` row that connect.ts onboards
 * (statusFromAccount maps Stripe → our status fields). We re-validate via that
 * module's ConnectStatus shape and only treat charges/payouts-enabled accounts
 * as valid destinations.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import type Stripe from "stripe"
import type { ConnectStatus } from "@/lib/billing/connect"
import { statusFromAccount } from "@/lib/billing/connect"
import type { FeeBreakdown } from "@/lib/marketplace/fees"
import {
  PAYOUTS_TABLE,
  PAYOUT_LEDGER_TABLE,
  CONNECT_ACCOUNTS_TABLE,
  type PayoutRecord,
  type SellerConnectAccount,
} from "./types"

function stripeCurrency(currency: string): string {
  return (currency || "GBP").toLowerCase()
}

/** True when an error is "relation does not exist" (migration not applied). */
function isMissingTable(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null
  return e?.code === "42P01" || /does not exist/i.test(e?.message ?? "")
}

/** Arguments to {@link buildTransferParams}. */
export interface BuildTransferArgs {
  /** Seller Connect account id (acct_...) — the transfer destination. */
  destinationAccountId: string
  /** Net amount to pay the seller, in integer pence (gross − fees). */
  amountPence: number
  currency?: string
  /** The originating charge's PaymentIntent / charge id, for source_transaction. */
  sourceTransaction?: string | null
  /** Internal linkage for reconciliation. */
  paymentId?: string | null
  transactionId?: string | null
  bookingId?: string | null
  metadata?: Record<string, string>
}

/**
 * PURE: build the Stripe.TransferCreateParams that releases the seller payout.
 * Does NOT call Stripe. The amount is the seller's NET (the platform commission
 * is the remainder that stays on the platform balance).
 */
export function buildTransferParams(
  args: BuildTransferArgs
): Stripe.TransferCreateParams {
  const metadata: Record<string, string> = {
    ...(args.paymentId ? { payment_id: args.paymentId } : {}),
    ...(args.transactionId ? { transaction_id: args.transactionId } : {}),
    ...(args.bookingId ? { booking_id: args.bookingId } : {}),
    ...(args.metadata ?? {}),
  }

  const params: Stripe.TransferCreateParams = {
    amount: Math.max(0, Math.trunc(args.amountPence)),
    currency: stripeCurrency(args.currency ?? "GBP"),
    destination: args.destinationAccountId,
    metadata,
  }
  // Linking the transfer to the original charge keeps the funds traceable and
  // lets Stripe debit the held balance from that specific charge.
  if (args.sourceTransaction) {
    params.source_transaction = args.sourceTransaction
  }
  return params
}

/**
 * Convenience: derive the seller payout amount directly from a P2 FeeBreakdown.
 * Always equals `fee.sellerPayoutPence` (gross − platform fee − passed-through
 * provider fee). Kept as a named helper so callers don't recompute.
 */
export function sellerPayoutFromFee(fee: FeeBreakdown): number {
  return Math.max(0, Math.trunc(fee.sellerPayoutPence))
}

/** Arguments to {@link recordPayout}. */
export interface RecordPayoutArgs {
  /** Recipient seller/supplier workspace. */
  workspaceId: string
  amountPence: number
  currency?: string
  connectAccountId?: string | null
  paymentId?: string | null
  /** Optional ledger linkage: the gross + platform fee, to write audit rows. */
  platformFeePence?: number
  /** When true, also write a 'platform_fee' audit row (default true if fee > 0). */
  writePlatformFeeEntry?: boolean
}

/**
 * Insert a `payouts` row (status 'pending') plus its `payout_ledger` audit
 * row(s). Does NOT call Stripe; the stripe_transfer_id + 'paid' status are
 * written later by the webhook. Writes a 'transfer' ledger entry for the payout
 * amount and (optionally) a 'platform_fee' entry for the retained commission.
 *
 * Returns the created payout row.
 */
export async function recordPayout(
  supabase: SupabaseClient,
  args: RecordPayoutArgs
): Promise<PayoutRecord> {
  const currency = args.currency ?? "GBP"
  const amount = Math.max(0, Math.trunc(args.amountPence))

  const { data, error } = await supabase
    .from(PAYOUTS_TABLE)
    .insert({
      workspace_id: args.workspaceId,
      connect_account_id: args.connectAccountId ?? null,
      amount_pence: amount,
      currency,
      status: "pending",
      payment_id: args.paymentId ?? null,
    })
    .select("*")
    .single()
  if (error) throw error
  const payout = data as PayoutRecord

  // Append-only ledger: the seller transfer.
  const ledgerRows: Array<Record<string, unknown>> = [
    {
      payout_id: payout.id,
      payment_id: args.paymentId ?? null,
      entry_type: "transfer",
      amount_pence: amount,
      currency,
    },
  ]

  const fee = Math.max(0, Math.trunc(args.platformFeePence ?? 0))
  const writeFee = args.writePlatformFeeEntry ?? fee > 0
  if (writeFee && fee > 0) {
    ledgerRows.push({
      payout_id: payout.id,
      payment_id: args.paymentId ?? null,
      entry_type: "platform_fee",
      amount_pence: fee,
      currency,
    })
  }

  const { error: ledgerErr } = await supabase.from(PAYOUT_LEDGER_TABLE).insert(ledgerRows)
  if (ledgerErr) throw ledgerErr

  return payout
}

/**
 * Read the seller's Connect account (the payout destination) from the SAME
 * `stripe_connect_accounts` table that src/lib/billing/connect.ts onboards.
 * Returns null when no account / not yet usable / table missing.
 *
 * We reuse `statusFromAccount` from connect.ts to keep the status mapping
 * single-sourced: an account is a valid destination only when charges/payouts
 * are enabled (active).
 */
export async function getSellerConnectAccount(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<SellerConnectAccount | null> {
  const { data, error } = await supabase
    .from(CONNECT_ACCOUNTS_TABLE)
    .select("workspace_id, stripe_account_id, charges_enabled, payouts_enabled, status")
    .eq("workspace_id", workspaceId)
    .maybeSingle()

  if (error) {
    if (isMissingTable(error)) return null
    throw error
  }
  if (!data?.stripe_account_id) return null

  return {
    workspace_id: data.workspace_id as string,
    stripe_account_id: data.stripe_account_id as string,
    charges_enabled: !!data.charges_enabled,
    payouts_enabled: !!data.payouts_enabled,
    status: (data.status as SellerConnectAccount["status"]) ?? "pending",
  }
}

/**
 * PURE: re-derive a ConnectStatus from a live Stripe Account object using
 * connect.ts's `statusFromAccount`. Exposed so the release layer can confirm a
 * destination is payout-eligible from a freshly fetched account WITHOUT
 * duplicating the mapping logic that lives in billing/connect.ts.
 */
export function connectStatusFromStripeAccount(acct: {
  charges_enabled?: boolean
  payouts_enabled?: boolean
  details_submitted?: boolean
  requirements?: { disabled_reason?: string | null } | null
  id?: string
}): ConnectStatus {
  const s = statusFromAccount(acct)
  return {
    connected: true,
    status: s.status,
    chargesEnabled: s.charges,
    payoutsEnabled: s.payouts,
    detailsSubmitted: s.details,
    accountId: acct.id ?? null,
  }
}

/** True when a connect account is a valid transfer destination (payouts live). */
export function isPayoutEligible(acct: SellerConnectAccount | null): boolean {
  return !!acct && acct.status === "active" && acct.payouts_enabled
}
