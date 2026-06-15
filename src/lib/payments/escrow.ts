/**
 * P5 — Escrow hold state.
 *
 * These functions mutate ONLY the DB. They are called by the webhook /
 * reconciliation layer (sibling agent) when a real Stripe event confirms a
 * capture/release/refund. NOTHING here is allowed to invent a money movement —
 * the caller must already hold a verified Stripe event before flipping state.
 *
 * `escrowReleaseEligible` is a PURE policy helper: given the booking /
 * transaction status, decide whether the held funds may now be released to the
 * seller. It performs no IO.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import {
  PAYMENTS_TABLE,
  ESCROW_HOLDS_TABLE,
  type EscrowHoldRecord,
} from "./types"

/** True when an error is "relation does not exist" (migration not applied). */
function isMissingTable(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null
  return e?.code === "42P01" || /does not exist/i.test(e?.message ?? "")
}

/** Arguments to {@link recordEscrowHold}. */
export interface RecordEscrowHoldArgs {
  paymentId: string
  amountPence: number
  releaseCondition?: string | null
}

/**
 * Insert an `escrow_holds` row in 'held' state. Idempotent-friendly: the caller
 * decides whether to create. Returns the created hold.
 */
export async function recordEscrowHold(
  supabase: SupabaseClient,
  args: RecordEscrowHoldArgs
): Promise<EscrowHoldRecord> {
  const { data, error } = await supabase
    .from(ESCROW_HOLDS_TABLE)
    .insert({
      payment_id: args.paymentId,
      amount_pence: Math.max(0, Math.trunc(args.amountPence)),
      status: "held",
      release_condition: args.releaseCondition ?? null,
    })
    .select("*")
    .single()
  if (error) throw error
  return data as EscrowHoldRecord
}

/**
 * Mark the active hold(s) for a payment as 'released' and stamp released_at.
 * Also advances the parent payment to 'released'. CALLED ONLY by the
 * webhook/reconciliation layer after a confirmed capture+transfer.
 */
export async function markEscrowReleased(
  supabase: SupabaseClient,
  paymentId: string
): Promise<void> {
  const releasedAt = new Date().toISOString()
  const { error: holdErr } = await supabase
    .from(ESCROW_HOLDS_TABLE)
    .update({ status: "released", released_at: releasedAt })
    .eq("payment_id", paymentId)
    .eq("status", "held")
  if (holdErr && !isMissingTable(holdErr)) throw holdErr

  const { error: payErr } = await supabase
    .from(PAYMENTS_TABLE)
    .update({ status: "released" })
    .eq("id", paymentId)
  if (payErr && !isMissingTable(payErr)) throw payErr
}

/**
 * Mark the active hold(s) for a payment as 'refunded'. Advances the parent
 * payment to `paymentStatus` (default 'refunded'; pass 'partially_refunded' for
 * a partial). CALLED ONLY by the webhook/reconciliation layer after a confirmed
 * Stripe refund.
 */
export async function markEscrowRefunded(
  supabase: SupabaseClient,
  paymentId: string,
  paymentStatus: "refunded" | "partially_refunded" = "refunded"
): Promise<void> {
  const { error: holdErr } = await supabase
    .from(ESCROW_HOLDS_TABLE)
    .update({ status: "refunded" })
    .eq("payment_id", paymentId)
    .in("status", ["held", "released"])
  if (holdErr && !isMissingTable(holdErr)) throw holdErr

  const { error: payErr } = await supabase
    .from(PAYMENTS_TABLE)
    .update({ status: paymentStatus })
    .eq("id", paymentId)
  if (payErr && !isMissingTable(payErr)) throw payErr
}

/**
 * PURE: is the escrow eligible for release given the source record's status?
 *
 * Stay bookings (P4) release on 'confirmed' or 'completed'. Marketplace
 * transactions (P2) and supplier jobs release on 'completed'/'released'/'paid'.
 * Anything pending/held/cancelled is NOT eligible. No IO.
 */
export function escrowReleaseEligible(
  sourceStatus: string | null | undefined
): boolean {
  if (!sourceStatus) return false
  const releasable = new Set([
    "confirmed",
    "completed",
    "released",
    "paid",
    "fulfilled",
  ])
  return releasable.has(sourceStatus.toLowerCase())
}
