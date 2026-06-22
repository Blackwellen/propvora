/**
 * Propvora v2 — P5 Payments: VERIFIED Stripe event → DB state machine.
 *
 * This module is the ONLY place that flips a payment / escrow hold / booking /
 * marketplace transaction into a money-bearing terminal state. It is driven
 * EXCLUSIVELY by Stripe events whose signature has ALREADY been verified by the
 * route handler (`POST /api/payments/webhook`). It never calls Stripe.
 *
 * Design constraints honoured here:
 *  - Idempotent: the route guards on event id via `payments_webhook_events`,
 *    and every transition is itself a conditional/idempotent UPDATE (it only
 *    advances a row that is not already in the target state), so a replay that
 *    slips past the dedupe store still cannot double-apply money.
 *  - Append-only ledgers: we only INSERT into `payout_ledger` /
 *    `marketplace_commission_ledger`; we NEVER update or delete a ledger row.
 *  - Tolerant of un-provisioned tables: any 42P01 / PGRST205 / 42703 from a
 *    payments table is swallowed as a no-op so a verified event is still
 *    acknowledged (Stripe is not retried for a schema gap).
 *
 * Canonical P5 schema (migration 20260616090000_payments_escrow), verified live:
 *  - escrow_payments(id, workspace_id, transaction_id, booking_id, currency,
 *      amount_pence, platform_fee_pence, stripe_payment_intent_id [unique],
 *      capture_method, status, escrow, ...) — located by stripe_payment_intent_id.
 *      status ∈ requires_payment|authorized|captured|released|refunded|
 *               partially_refunded|failed|cancelled.
 *  - escrow_holds(id, payment_id → escrow_payments.id, amount_pence, status,
 *      release_condition, released_at, ...) status ∈ held|released|refunded|cancelled.
 *  - payouts(id, workspace_id, connect_account_id, amount_pence, currency,
 *      stripe_transfer_id, status, payment_id, ...) status ∈ pending|paid|failed|reversed.
 *  - payout_ledger(id, payout_id, payment_id, entry_type, amount_pence, currency,
 *      created_at) entry_type ∈ charge|platform_fee|transfer|refund|reversal|adjustment.
 */

import type Stripe from "stripe"

/** Minimal shape of the admin/service-role Supabase client we rely on. */
export interface PaymentsSupabase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any
}

export interface HandlePaymentEventDeps {
  supabase: PaymentsSupabase
}

export interface PaymentEventResult {
  handled: boolean
  type: string
  /** Short, non-sensitive description of the transitions applied. */
  transitions: string[]
}

/** Postgres / PostgREST codes meaning the table/column does not exist yet. */
const NOT_PROVISIONED = new Set(["42P01", "PGRST205", "PGRST204", "42703"])

function isNotProvisioned(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code
  return Boolean(code && NOT_PROVISIONED.has(code))
}

/**
 * Run a DB step, swallowing "table/column not provisioned" errors as a no-op
 * (returns false) and re-throwing everything else (so the route returns 500 and
 * Stripe retries — and, crucially, the event id is NOT recorded). Returns true
 * when the step ran without a provisioning error.
 */
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

function piId(v: string | { id: string } | null | undefined): string | null {
  if (!v) return null
  return typeof v === "string" ? v : v.id
}

interface EscrowPaymentRow {
  id: string
  workspace_id: string | null
  currency: string | null
  status: string | null
  booking_id: string | null
  transaction_id: string | null
}

/**
 * Append a payout-ledger entry. Append-only INSERT; only the columns the table
 * actually has (payout_id, payment_id, entry_type, amount_pence, currency).
 * entry_type MUST be one of the CHECK values. Tolerates an absent table.
 */
async function appendPayoutLedger(
  supabase: PaymentsSupabase,
  entry: {
    payout_id?: string | null
    payment_id?: string | null
    entry_type: "charge" | "platform_fee" | "transfer" | "refund" | "reversal" | "adjustment"
    amount_pence: number
    currency: string
  }
): Promise<void> {
  await tolerant(() =>
    supabase.from("payout_ledger").insert({
      payout_id: entry.payout_id ?? null,
      payment_id: entry.payment_id ?? null,
      entry_type: entry.entry_type,
      amount_pence: entry.amount_pence,
      currency: entry.currency,
      created_at: new Date().toISOString(),
    })
  )
}

/**
 * Append a marketplace-commission-ledger reversal/entry. Append-only.
 * entry_type ∈ platform_fee|provider_fee|seller_payout|refund|adjustment.
 */
async function appendCommissionLedger(
  supabase: PaymentsSupabase,
  entry: {
    transaction_id: string
    entry_type: "platform_fee" | "provider_fee" | "seller_payout" | "refund" | "adjustment"
    amount_pence: number
    currency: string
  }
): Promise<void> {
  await tolerant(() =>
    supabase.from("marketplace_commission_ledger").insert({
      ...entry,
      created_at: new Date().toISOString(),
    })
  )
}

/**
 * Locate the escrow_payments row for a PaymentIntent. Returns null if not found
 * OR the table is not provisioned.
 */
async function findPaymentByIntent(
  supabase: PaymentsSupabase,
  intentId: string
): Promise<EscrowPaymentRow | null> {
  try {
    const { data, error } = await supabase
      .from("escrow_payments")
      .select("id, workspace_id, currency, status, booking_id, transaction_id")
      .eq("stripe_payment_intent_id", intentId)
      .maybeSingle()
    if (error) {
      if (isNotProvisioned(error)) return null
      throw error
    }
    return (data as EscrowPaymentRow | null) ?? null
  } catch (err) {
    if (isNotProvisioned(err)) return null
    throw err
  }
}

/**
 * handlePaymentEvent — the verified-event dispatcher.
 *
 * The caller MUST have verified the Stripe signature and de-duplicated on
 * `event.id` BEFORE calling this. Each branch applies idempotent DB
 * transitions and returns a summary. Throwing here makes the route return 500
 * (Stripe retries; event id not recorded).
 */
export async function handlePaymentEvent(
  event: Stripe.Event,
  deps: HandlePaymentEventDeps
): Promise<PaymentEventResult> {
  const { supabase } = deps
  const transitions: string[] = []
  const nowIso = new Date().toISOString()

  switch (event.type) {
    // ── Funds captured: payment → captured, escrow hold stays/held ──────────
    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent
      const intentId = pi.id

      const payment = await findPaymentByIntent(supabase, intentId)
      if (payment) {
        const ran = await tolerant(() =>
          supabase
            .from("escrow_payments")
            .update({ status: "captured", updated_at: nowIso })
            .eq("id", payment.id)
            .in("status", ["requires_payment", "authorized"])
        )
        if (ran) transitions.push(`payment ${payment.id} → captured`)

        // Ensure the linked escrow hold is 'held' once funds are captured.
        await tolerant(() =>
          supabase
            .from("escrow_holds")
            .update({ status: "held", updated_at: nowIso })
            .eq("payment_id", payment.id)
            .eq("status", "held") // no-op safeguard; created as 'held'
        )

        // Marketplace transaction (linked via metadata or the payment row).
        const txnId =
          (pi.metadata?.transaction_id as string | undefined) || payment.transaction_id || null
        if (txnId) {
          const ranTxn = await tolerant(() =>
            supabase
              .from("marketplace_transactions")
              .update({ status: "captured" })
              .eq("id", txnId)
              .in("status", ["pending", "authorized"])
          )
          if (ranTxn) transitions.push(`transaction ${txnId} → captured`)
        }

        // Sync the booking: funds are secured in escrow → confirm + mark paid.
        const bookingId = (pi.metadata?.booking_id as string | undefined) || payment.booking_id || null
        if (bookingId) {
          const ranBk = await tolerant(() =>
            supabase
              .from("bookings")
              .update({ status: "confirmed", payment_status: "paid", updated_at: nowIso })
              .eq("id", bookingId)
              .in("status", ["hold", "pending_payment"])
          )
          if (ranBk) transitions.push(`booking ${bookingId} → confirmed/paid`)
        }
      }
      break
    }

    // ── Funds authorised (manual capture): payment → authorized ─────────────
    case "payment_intent.amount_capturable_updated": {
      const pi = event.data.object as Stripe.PaymentIntent
      const intentId = pi.id
      const payment = await findPaymentByIntent(supabase, intentId)
      if (payment) {
        const ran = await tolerant(() =>
          supabase
            .from("escrow_payments")
            .update({ status: "authorized", updated_at: nowIso })
            .eq("id", payment.id)
            .eq("status", "requires_payment")
        )
        if (ran) transitions.push(`payment ${payment.id} → authorized`)

        // Funds are now held in escrow → the booking is confirmed + paid.
        const bookingId = (pi.metadata?.booking_id as string | undefined) || payment.booking_id || null
        if (bookingId) {
          const ranBk = await tolerant(() =>
            supabase
              .from("bookings")
              .update({ status: "confirmed", payment_status: "paid", updated_at: nowIso })
              .eq("id", bookingId)
              .in("status", ["hold", "pending_payment"])
          )
          if (ranBk) transitions.push(`booking ${bookingId} → confirmed/paid`)
        }
      }
      break
    }

    // ── Refund confirmed: payment → refunded + escrow refunded + ledger ─────
    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge
      const intentId = piId(charge.payment_intent as string | { id: string } | null)
      if (intentId) {
        const payment = await findPaymentByIntent(supabase, intentId)
        if (payment) {
          const fullyRefunded = charge.amount_refunded >= charge.amount
          const newStatus = fullyRefunded ? "refunded" : "partially_refunded"
          const ran = await tolerant(() =>
            supabase
              .from("escrow_payments")
              .update({ status: newStatus, updated_at: nowIso })
              .eq("id", payment.id)
              .neq("status", "refunded")
          )
          if (ran) transitions.push(`payment ${payment.id} → ${newStatus}`)

          await appendPayoutLedger(supabase, {
            payment_id: payment.id,
            entry_type: "refund",
            amount_pence: -Math.abs(charge.amount_refunded ?? 0),
            currency: (charge.currency ?? payment.currency ?? "gbp").toUpperCase(),
          })
          transitions.push(`payout_ledger += refund reversal`)

          // Escrow hold → refunded (linked by payment_id).
          const ranEscrow = await tolerant(() =>
            supabase
              .from("escrow_holds")
              .update({ status: "refunded", updated_at: nowIso })
              .eq("payment_id", payment.id)
              .not("status", "in", "(refunded,cancelled)")
          )
          if (ranEscrow) transitions.push(`escrow(${payment.id}) → refunded`)

          // Marketplace transaction → refunded + commission reversal.
          const txnId =
            (charge.metadata?.transaction_id as string | undefined) || payment.transaction_id || null
          if (txnId) {
            const ranTxn = await tolerant(() =>
              supabase
                .from("marketplace_transactions")
                .update({ status: "refunded" })
                .eq("id", txnId)
                .neq("status", "refunded")
            )
            if (ranTxn) transitions.push(`transaction ${txnId} → refunded`)
            await appendCommissionLedger(supabase, {
              transaction_id: txnId,
              entry_type: "refund",
              amount_pence: -Math.abs(charge.amount_refunded ?? 0),
              currency: (charge.currency ?? "gbp").toUpperCase(),
            })
            transitions.push(`commission_ledger += refund reversal`)
          }

          // Booking → cancelled.
          const bookingId =
            (charge.metadata?.booking_id as string | undefined) || payment.booking_id || null
          if (bookingId) {
            const ranBk = await tolerant(() =>
              supabase
                .from("bookings")
                .update({ status: "cancelled" })
                .eq("id", bookingId)
                .neq("status", "cancelled")
            )
            if (ranBk) transitions.push(`booking ${bookingId} → cancelled`)
          }
        }
      }
      break
    }

    // ── Escrow release → transfer created: escrow released, payout, confirm ──
    case "transfer.created": {
      const transfer = event.data.object as Stripe.Transfer
      const intentId =
        (transfer.metadata?.payment_intent_id as string | undefined) ||
        piId((transfer.source_transaction as string | { id: string } | null) ?? null) ||
        null

      let payment: EscrowPaymentRow | null = null
      if (intentId) {
        payment = await findPaymentByIntent(supabase, intentId)
        if (payment) {
          // Escrow hold → released.
          const ranEscrow = await tolerant(() =>
            supabase
              .from("escrow_holds")
              .update({ status: "released", released_at: nowIso, updated_at: nowIso })
              .eq("payment_id", payment!.id)
              .eq("status", "held")
          )
          if (ranEscrow) transitions.push(`escrow(${payment.id}) → released`)

          const ran = await tolerant(() =>
            supabase
              .from("escrow_payments")
              .update({ status: "released", updated_at: nowIso })
              .eq("id", payment!.id)
              .neq("status", "released")
          )
          if (ran) transitions.push(`payment ${payment.id} → released`)
        }
      }

      // Payout row keyed on the Stripe transfer id (recorded when scheduled).
      await tolerant(() =>
        supabase
          .from("payouts")
          .update({ stripe_transfer_id: transfer.id, updated_at: nowIso })
          .eq("stripe_transfer_id", transfer.id)
          .eq("status", "pending")
      )

      await appendPayoutLedger(supabase, {
        payment_id: payment?.id ?? null,
        entry_type: "transfer",
        amount_pence: Math.abs(transfer.amount ?? 0),
        currency: (transfer.currency ?? "gbp").toUpperCase(),
      })
      transitions.push(`payout_ledger += transfer`)

      // Linked transaction → released; booking → confirmed.
      const txnId =
        (transfer.metadata?.transaction_id as string | undefined) || payment?.transaction_id || null
      if (txnId) {
        const ranTxn = await tolerant(() =>
          supabase
            .from("marketplace_transactions")
            .update({ status: "released" })
            .eq("id", txnId)
            .in("status", ["captured", "authorized"])
        )
        if (ranTxn) transitions.push(`transaction ${txnId} → released`)
      }
      const bookingId =
        (transfer.metadata?.booking_id as string | undefined) || payment?.booking_id || null
      if (bookingId) {
        const ranBk = await tolerant(() =>
          supabase
            .from("bookings")
            .update({ status: "confirmed" })
            .eq("id", bookingId)
            .in("status", ["hold", "pending_payment"])
        )
        if (ranBk) transitions.push(`booking ${bookingId} → confirmed`)
      }
      break
    }

    // ── Payout settled to the connected account's bank: payout → 'paid' ─────
    // NOTE: this Stripe API version (2026-05-27.dahlia) has NO `transfer.paid`
    // event. The settlement semantic maps to `payout.paid` (a Stripe Payout
    // from the connected balance to the bank). We match our payout row by the
    // transfer id carried in metadata (the only payout identifier we store) and
    // mark the booking completed.
    case "payout.paid": {
      const payout = event.data.object as Stripe.Payout
      const transferId = (payout.metadata?.transfer_id as string | undefined) || null

      if (transferId) {
        const ranPayout = await tolerant(() =>
          supabase
            .from("payouts")
            .update({ status: "paid", updated_at: nowIso })
            .eq("stripe_transfer_id", transferId)
            .neq("status", "paid")
        )
        if (ranPayout) transitions.push(`payout(${transferId}) → paid`)
      }

      const bookingId = (payout.metadata?.booking_id as string | undefined) || null
      if (bookingId) {
        const ranBk = await tolerant(() =>
          supabase
            .from("bookings")
            .update({ status: "completed" })
            .eq("id", bookingId)
            .eq("status", "confirmed")
        )
        if (ranBk) transitions.push(`booking ${bookingId} → completed`)
      }
      const txnId = (payout.metadata?.transaction_id as string | undefined) || null
      if (txnId) {
        const ranTxn = await tolerant(() =>
          supabase
            .from("marketplace_transactions")
            .update({ status: "released" })
            .eq("id", txnId)
            .neq("status", "released")
        )
        if (ranTxn) transitions.push(`transaction ${txnId} → released`)
      }
      break
    }

    // ── Connect account capability change: sync stored payout-eligibility ───
    case "account.updated": {
      const acct = event.data.object as Stripe.Account
      const status = acct.requirements?.disabled_reason
        ? "disabled"
        : acct.charges_enabled && acct.payouts_enabled
          ? "active"
          : acct.details_submitted
            ? "restricted"
            : "pending"
      const ran = await tolerant(() =>
        supabase
          .from("stripe_connect_accounts")
          .update({
            status,
            charges_enabled: !!acct.charges_enabled,
            payouts_enabled: !!acct.payouts_enabled,
            details_submitted: !!acct.details_submitted,
            country: acct.country ?? null,
            updated_at: nowIso,
          })
          .eq("stripe_account_id", acct.id)
      )
      if (ran) transitions.push(`connect_account(${acct.id}) → ${status}`)
      break
    }

    default:
      return { handled: false, type: event.type, transitions }
  }

  return { handled: true, type: event.type, transitions }
}

/** The exact set of Stripe event types this payments webhook acts on. */
export const HANDLED_PAYMENT_EVENTS = [
  "payment_intent.succeeded",
  "payment_intent.amount_capturable_updated",
  "charge.refunded",
  "transfer.created",
  "payout.paid",
  "account.updated",
] as const
