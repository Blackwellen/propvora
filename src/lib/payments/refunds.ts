/**
 * Propvora v2 — P5 Payments: REFUNDS.
 *
 * `buildRefundParams` is a PURE function: it produces the Stripe
 * RefundCreateParams object from a stored payment row. It DOES NOT call Stripe
 * — the actual `stripe.refunds.create(...)` is performed elsewhere (a server
 * action / sibling module) using these params. Keeping it pure means it can be
 * unit-tested without any network.
 *
 * `recordRefund` writes refund state to the DB. It must ONLY be invoked from a
 * VERIFIED `charge.refunded` Stripe event (the webhook), never optimistically
 * on a refund request — money state is flipped exclusively by confirmed events.
 * It appends a reversal to the payout ledger (append-only) and tolerates
 * un-provisioned tables (no-op).
 */

import type Stripe from "stripe"

export interface RefundSupabase {
  from: (table: string) => any
}

const NOT_PROVISIONED = new Set(["42P01", "PGRST205", "42703"])
function isNotProvisioned(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code
  return Boolean(code && NOT_PROVISIONED.has(code))
}
async function tolerant(step: () => Promise<{ error: unknown } | void>): Promise<boolean> {
  try {
    const res = await step()
    const error = (res as { error?: unknown } | undefined)?.error
    if (error) {
      if (isNotProvisioned(error)) return false
      throw error
    }
    return true
  } catch (err) {
    if (isNotProvisioned(err)) return false
    throw err
  }
}

/** The minimum shape of a stored payment needed to issue a refund. */
export interface RefundablePayment {
  id: string
  /** Stripe PaymentIntent id (live column: payments.stripe_payment_id). */
  stripe_payment_id?: string | null
  /** Optional explicit charge id if the row stores one. */
  stripe_charge_id?: string | null
  currency?: string | null
  workspace_id?: string | null
}

/**
 * buildRefundParams — PURE. Builds Stripe.RefundCreateParams from a payment.
 *
 * @param payment      stored payment row (must carry a PaymentIntent or charge id)
 * @param amountPence  optional partial amount in integer minor units; omit for full refund
 * @param reason       optional Stripe refund reason
 * @throws if the payment has neither a payment_intent nor a charge id
 */
export function buildRefundParams(
  payment: RefundablePayment,
  amountPence?: number,
  reason?: Stripe.RefundCreateParams.Reason
): Stripe.RefundCreateParams {
  const params: Stripe.RefundCreateParams = {}

  if (payment.stripe_charge_id) {
    params.charge = payment.stripe_charge_id
  } else if (payment.stripe_payment_id) {
    params.payment_intent = payment.stripe_payment_id
  } else {
    throw new Error("Cannot build refund: payment has no Stripe payment_intent or charge id")
  }

  if (typeof amountPence === "number") {
    if (!Number.isInteger(amountPence) || amountPence <= 0) {
      throw new Error("Refund amount must be a positive integer number of minor units")
    }
    params.amount = amountPence
  }

  if (reason) params.reason = reason

  // Idempotency + provenance metadata (does NOT call Stripe).
  params.metadata = {
    payment_id: payment.id,
    ...(payment.workspace_id ? { workspace_id: payment.workspace_id } : {}),
  }

  return params
}

export interface RecordRefundArgs {
  /** Internal payment id (preferred locator). */
  paymentId?: string
  /** Stripe PaymentIntent id (fallback locator). */
  stripePaymentIntentId?: string
  workspaceId?: string | null
  /** Amount refunded in integer minor units (from the verified charge). */
  amountRefundedPence: number
  /** Charge total in minor units — used to decide full vs partial. */
  chargeAmountPence?: number
  currency: string
  /** The verified Stripe event id (for ledger provenance + idempotency). */
  sourceEventId: string
  /** Optional linked marketplace transaction / booking ids. */
  transactionId?: string | null
  bookingId?: string | null
}

export interface RecordRefundResult {
  paymentUpdated: boolean
  escrowUpdated: boolean
  ledgerAppended: boolean
  transactionUpdated: boolean
  bookingUpdated: boolean
}

/**
 * recordRefund — DB state for a CONFIRMED refund event ONLY.
 *
 * Idempotent: each UPDATE only advances a row that is not already 'refunded',
 * and the ledger insert is keyed (via source_event_id) so a replay that slips
 * past the webhook dedupe still records at most one reversal per event when the
 * ledger has a unique guard. Tolerates un-provisioned tables.
 */
export async function recordRefund(
  supabase: RefundSupabase,
  args: RecordRefundArgs
): Promise<RecordRefundResult> {
  const nowIso = new Date().toISOString()
  const fully =
    typeof args.chargeAmountPence === "number"
      ? args.amountRefundedPence >= args.chargeAmountPence
      : true
  const newStatus = fully ? "refunded" : "partially_refunded"

  const result: RecordRefundResult = {
    paymentUpdated: false,
    escrowUpdated: false,
    ledgerAppended: false,
    transactionUpdated: false,
    bookingUpdated: false,
  }

  // Resolve the canonical escrow_payments id (escrow_holds links via payment_id).
  let paymentId = args.paymentId ?? null
  if (!paymentId && args.stripePaymentIntentId) {
    try {
      const { data } = await supabase
        .from("escrow_payments")
        .select("id")
        .eq("stripe_payment_intent_id", args.stripePaymentIntentId)
        .maybeSingle()
      paymentId = (data as { id?: string } | null)?.id ?? null
    } catch {
      /* tolerant — table may be absent */
    }
  }

  // 1. escrow_payments → refunded / partially_refunded
  if (paymentId) {
    result.paymentUpdated = await tolerant(() =>
      supabase
        .from("escrow_payments")
        .update({ status: newStatus, updated_at: nowIso })
        .eq("id", paymentId)
        .neq("status", "refunded")
    )
  } else if (args.stripePaymentIntentId) {
    result.paymentUpdated = await tolerant(() =>
      supabase
        .from("escrow_payments")
        .update({ status: newStatus, updated_at: nowIso })
        .eq("stripe_payment_intent_id", args.stripePaymentIntentId)
        .neq("status", "refunded")
    )
  }

  // 2. escrow_holds → refunded (linked by payment_id)
  if (paymentId) {
    result.escrowUpdated = await tolerant(() =>
      supabase
        .from("escrow_holds")
        .update({ status: "refunded", updated_at: nowIso })
        .eq("payment_id", paymentId)
        .not("status", "in", "(refunded,cancelled)")
    )
  }

  // 3. payout_ledger — append-only reversal entry (only real columns)
  result.ledgerAppended = await tolerant(() =>
    supabase.from("payout_ledger").insert({
      payment_id: paymentId,
      entry_type: "refund",
      amount_pence: -Math.abs(args.amountRefundedPence),
      currency: args.currency.toUpperCase(),
      created_at: nowIso,
    })
  )

  // 4. marketplace_transactions → refunded + commission reversal
  if (args.transactionId) {
    result.transactionUpdated = await tolerant(() =>
      supabase
        .from("marketplace_transactions")
        .update({ status: "refunded" })
        .eq("id", args.transactionId)
        .neq("status", "refunded")
    )
    await tolerant(() =>
      supabase.from("marketplace_commission_ledger").insert({
        transaction_id: args.transactionId,
        entry_type: "refund",
        amount_pence: -Math.abs(args.amountRefundedPence),
        currency: args.currency.toUpperCase(),
        created_at: nowIso,
      })
    )
  }

  // 5. bookings → cancelled
  if (args.bookingId) {
    result.bookingUpdated = await tolerant(() =>
      supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", args.bookingId)
        .neq("status", "cancelled")
    )
  }

  return result
}
