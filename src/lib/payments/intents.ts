/**
 * P5 — PaymentIntent layer.
 *
 * Two responsibilities, strictly separated:
 *   1. PURE param builders (`buildPaymentIntentParams`) — produce the exact
 *      Stripe.PaymentIntentCreateParams object the API/webhook layer will hand
 *      to Stripe. NO network call happens here. The actual
 *      `stripe.paymentIntents.create(...)` is performed by a sibling
 *      (API route / webhook), never by this lib.
 *   2. DB recorders (`createPaymentRecord`, `linkStripeIntent`, `getPayment`) —
 *      insert/read the `escrow_payments` + `escrow_holds` rows in their INITIAL
 *      state (`requires_payment` / `held`). They NEVER mark anything captured.
 *
 * ESCROW MODEL: capture_method='manual'. Funds are authorized on the PLATFORM
 * account and held until release; we therefore do NOT set transfer_data on the
 * intent (the seller is paid later via a separate Transfer — see
 * connect-transfers.ts). application_fee_amount is recorded for transparency but
 * has no effect without transfer_data, so for the escrow (held) path it is
 * omitted from the intent and tracked in the DB instead.
 *
 * application_fee_amount + transfer_data.destination ARE emitted for the
 * NON-escrow "direct/automatic" path (capture happens immediately and the
 * destination splits at settlement) — kept here so the same builder serves both.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import type Stripe from "stripe"
import type { FeeBreakdown } from "@/lib/marketplace/fees"
import {
  PAYMENTS_TABLE,
  ESCROW_HOLDS_TABLE,
  type CaptureMethod,
  type PaymentRecord,
} from "./types"

/** Currency helper — Stripe wants a lowercase ISO code. */
function stripeCurrency(currency: string): string {
  return (currency || "GBP").toLowerCase()
}

/** Arguments to {@link buildPaymentIntentParams}. */
export interface BuildPaymentIntentArgs {
  /** Gross amount the buyer pays, in integer pence. */
  amountPence: number
  /** ISO currency code (e.g. "GBP"). Defaults to GBP. */
  currency?: string
  /** The resolved P2 fee breakdown (platform/provider/payout). */
  fee: FeeBreakdown
  /** Seller's Stripe Connect account id (acct_...). Required for the direct split path. */
  sellerConnectAccountId?: string | null
  /**
   * Escrow mode. true (default) ⇒ manual capture, funds held on platform, NO
   * transfer_data (seller paid later by a separate Transfer). false ⇒ direct
   * destination charge with application_fee_amount + transfer_data.
   */
  escrow?: boolean
  /** Override capture method. Defaults to 'manual' for escrow, 'automatic' otherwise. */
  captureMethod?: CaptureMethod
  /** Our internal payment row id (set once created) for metadata linkage. */
  paymentId?: string
  transactionId?: string | null
  bookingId?: string | null
  payerEmail?: string | null
  /** Extra metadata merged onto the intent. */
  metadata?: Record<string, string>
}

/**
 * PURE: build the Stripe.PaymentIntentCreateParams. Does NOT call Stripe.
 *
 * Escrow path  → capture_method 'manual', no transfer_data (held on platform).
 * Direct path  → application_fee_amount = platform fee, transfer_data.destination
 *                = seller Connect account, capture_method 'automatic'.
 */
export function buildPaymentIntentParams(
  args: BuildPaymentIntentArgs
): Stripe.PaymentIntentCreateParams {
  const escrow = args.escrow ?? true
  const captureMethod: CaptureMethod =
    args.captureMethod ?? (escrow ? "manual" : "automatic")

  const metadata: Record<string, string> = {
    escrow: String(escrow),
    platform_fee_pence: String(args.fee.platformFeePence),
    seller_payout_pence: String(args.fee.sellerPayoutPence),
    ...(args.paymentId ? { payment_id: args.paymentId } : {}),
    ...(args.transactionId ? { transaction_id: args.transactionId } : {}),
    ...(args.bookingId ? { booking_id: args.bookingId } : {}),
    ...(args.fee.appliedRuleId ? { applied_fee_rule_id: args.fee.appliedRuleId } : {}),
    ...(args.metadata ?? {}),
  }

  const params: Stripe.PaymentIntentCreateParams = {
    amount: Math.max(0, Math.trunc(args.amountPence)),
    currency: stripeCurrency(args.currency ?? "GBP"),
    capture_method: captureMethod,
    metadata,
  }

  if (args.payerEmail) {
    params.receipt_email = args.payerEmail
  }

  // Direct (non-escrow) destination charge: split at settlement.
  if (!escrow && args.sellerConnectAccountId) {
    params.application_fee_amount = Math.max(0, Math.trunc(args.fee.platformFeePence))
    params.transfer_data = { destination: args.sellerConnectAccountId }
  }

  return params
}

/** Arguments to {@link createPaymentRecord}. */
export interface CreatePaymentRecordArgs {
  workspaceId: string
  amountPence: number
  currency?: string
  platformFeePence?: number
  transactionId?: string | null
  bookingId?: string | null
  payerEmail?: string | null
  /** Escrow mode (default true). Controls capture_method + escrow flag + hold. */
  escrow?: boolean
  captureMethod?: CaptureMethod
  /** Release condition note stored on the escrow_hold (e.g. "booking_confirmed"). */
  releaseCondition?: string | null
}

/**
 * Insert an `escrow_payments` row (status 'requires_payment') and, when in
 * escrow mode, a matching `escrow_holds` row (status 'held'). Does NOT touch
 * Stripe. Returns the created payment row.
 *
 * The Stripe PaymentIntent id is linked AFTERWARDS via {@link linkStripeIntent}
 * once the API layer has actually created the intent.
 */
export async function createPaymentRecord(
  supabase: SupabaseClient,
  args: CreatePaymentRecordArgs
): Promise<PaymentRecord> {
  const escrow = args.escrow ?? true
  const captureMethod: CaptureMethod =
    args.captureMethod ?? (escrow ? "manual" : "automatic")
  const amount = Math.max(0, Math.trunc(args.amountPence))

  const { data, error } = await supabase
    .from(PAYMENTS_TABLE)
    .insert({
      workspace_id: args.workspaceId,
      transaction_id: args.transactionId ?? null,
      booking_id: args.bookingId ?? null,
      payer_email: args.payerEmail ?? null,
      amount_pence: amount,
      currency: args.currency ?? "GBP",
      platform_fee_pence: Math.max(0, Math.trunc(args.platformFeePence ?? 0)),
      capture_method: captureMethod,
      status: "requires_payment",
      escrow,
    })
    .select("*")
    .single()

  if (error) throw error
  const payment = data as PaymentRecord

  if (escrow) {
    const { error: holdErr } = await supabase.from(ESCROW_HOLDS_TABLE).insert({
      payment_id: payment.id,
      amount_pence: amount,
      status: "held",
      release_condition: args.releaseCondition ?? null,
    })
    if (holdErr) throw holdErr
  }

  return payment
}

/**
 * Attach the real Stripe PaymentIntent id to a payment row. Status is NOT
 * advanced here — it stays at whatever the webhook has set (or
 * 'requires_payment'); only the webhook flips it to authorized/captured.
 */
export async function linkStripeIntent(
  supabase: SupabaseClient,
  paymentId: string,
  intentId: string
): Promise<void> {
  const { error } = await supabase
    .from(PAYMENTS_TABLE)
    .update({ stripe_payment_intent_id: intentId })
    .eq("id", paymentId)
  if (error) throw error
}

/** Read a single payment row by id, or null if not found / table missing. */
export async function getPayment(
  supabase: SupabaseClient,
  paymentId: string
): Promise<PaymentRecord | null> {
  const { data, error } = await supabase
    .from(PAYMENTS_TABLE)
    .select("*")
    .eq("id", paymentId)
    .maybeSingle()
  if (error) {
    if (isMissingTable(error)) return null
    throw error
  }
  return (data as PaymentRecord | null) ?? null
}

/** True when an error is "relation does not exist" (migration not applied). */
function isMissingTable(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null
  return e?.code === "42P01" || /does not exist/i.test(e?.message ?? "")
}
