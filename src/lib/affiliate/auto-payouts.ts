// ============================================================================
// Automated affiliate payout runner (system / cron).
//
// Runs on a schedule (see /api/cron/affiliate). For every eligible affiliate it
// creates an `affiliate_payouts` row and executes a real Stripe Connect transfer
// from the platform balance to the affiliate's connected account, then shifts
// cleared_pence → paid_pence.
//
// SAFETY (this moves real money):
//   * Gated by NEXT_PUBLIC_AFFILIATE_PAYOUTS_ENABLED (same flag as the manual door).
//   * Only pays affiliates who are enrolled + approved, are past the £50 minimum,
//     and have a connected Stripe account with payouts_enabled === true.
//   * Only pays `cleared_pence` — money that has already passed the 30-day
//     cooling-off / chargeback hold (see clearMaturedCommissions). Pending money
//     is never touched.
//   * IDEMPOTENT: each transfer uses a deterministic idempotency key derived from
//     the payout-row id, so a retry after a crash never double-pays within the
//     Stripe idempotency window.
//   * CRASH RECOVERY: rows left in `approved`/`processing` are re-driven, but only
//     while younger than the Stripe idempotency window (23h). Anything older is
//     flagged `failed` for manual admin review rather than blindly re-transferred
//     (which could double-pay once the idempotency key has expired).
//   * Never runs on the client. Requires the service-role admin client.
// ============================================================================

import type { createAdminClient } from "@/lib/supabase/admin"
import { MIN_PAYOUT_PENCE } from "@/lib/affiliate/levels"
import { isAffiliatePayoutsEnabled } from "@/lib/affiliate/payout-flag"
import { stripeSecretKey } from "@/lib/payments/stripe-keys"

type DB = ReturnType<typeof createAdminClient>

const STRIPE_API_VERSION = "2026-05-27.dahlia" as const
// Stripe idempotency keys are honoured for ~24h. Stay safely under it so we only
// ever re-drive a transfer while Stripe will still dedupe it.
const RECOVERY_WINDOW_MS = 23 * 60 * 60 * 1000

export interface AutoPayoutSummary {
  ran: boolean
  reason?: "gated" | "no_stripe" | "not_configured"
  eligible: number
  paid: number
  skipped: number
  failed: number
  recovered: number
  totalPaidPence: number
}

async function audit(
  db: DB,
  args: { workspaceId: string; action: string; resourceId: string; meta: Record<string, unknown> }
) {
  try {
    await db.from("audit_logs").insert({
      workspace_id: args.workspaceId,
      user_id: null,
      action: args.action,
      resource_type: "affiliate_payout",
      resource_id: args.resourceId,
      new_data: args.meta,
    })
  } catch {
    /* non-fatal */
  }
}

/**
 * Execute (or re-execute) the Stripe transfer for a single payout row and mark
 * it paid. Safe to call more than once for the same row: the deterministic
 * idempotency key makes Stripe return the SAME transfer instead of creating a
 * second one. Shifts cleared_pence → paid_pence exactly once (guarded on the
 * `approved` status transition).
 */
async function settlePayoutRow(
  db: DB,
  stripe: import("stripe").default,
  row: { id: string; affiliate_workspace_id: string; amount_pence: number },
  destination: string,
): Promise<"paid" | "failed"> {
  const amount = Number(row.amount_pence ?? 0)
  const wsId = row.affiliate_workspace_id
  if (amount <= 0) {
    await db.from("affiliate_payouts").update({ status: "failed", review_note: "Auto-payout: zero amount", updated_at: new Date().toISOString() }).eq("id", row.id)
    return "failed"
  }

  let transferId: string
  try {
    const transfer = await stripe.transfers.create(
      {
        amount,
        currency: "gbp",
        destination,
        description: `Propvora affiliate payout ${row.id.slice(0, 8)}`,
        metadata: { affiliate_payout_id: row.id, affiliate_workspace_id: wsId, auto: "true" },
      },
      { idempotencyKey: `affpayout_${row.id}` },
    )
    transferId = transfer.id
  } catch (e) {
    const msg = (e as { message?: string })?.message ?? "unknown"
    // Leave the row 'approved' so the next run can re-drive it (idempotent) —
    // unless it's an insufficient-balance case, which is transient and expected.
    await db
      .from("affiliate_payouts")
      .update({ review_note: `Auto-payout deferred: ${msg.slice(0, 180)}`, updated_at: new Date().toISOString() })
      .eq("id", row.id)
      .eq("status", "approved")
    return "failed"
  }

  // Flip to paid, guarded on the approved→paid transition so a concurrent run
  // can't mark it paid twice.
  const { data: updated } = await db
    .from("affiliate_payouts")
    .update({ status: "paid", paid_at: new Date().toISOString(), payout_reference: transferId, updated_at: new Date().toISOString() })
    .eq("id", row.id)
    .eq("status", "approved")
    .select("id")
    .maybeSingle()

  // Only the run that actually performed the approved→paid transition shifts the
  // balance, so cleared→paid happens exactly once even across retries.
  if (updated) {
    try {
      const { data: aff } = await db
        .from("affiliates")
        .select("cleared_pence, paid_pence")
        .eq("workspace_id", wsId)
        .maybeSingle()
      if (aff) {
        await db
          .from("affiliates")
          .update({
            cleared_pence: Math.max(0, Number(aff.cleared_pence ?? 0) - amount),
            paid_pence: Number(aff.paid_pence ?? 0) + amount,
            updated_at: new Date().toISOString(),
          })
          .eq("workspace_id", wsId)
      }
    } catch {
      /* non-fatal — row already paid; reconciliation can repair the balance */
    }
    await audit(db, {
      workspaceId: wsId,
      action: "affiliate_payout.paid",
      resourceId: row.id,
      meta: { amount_pence: amount, reference: transferId, auto: true },
    })
  }
  return "paid"
}

/**
 * Main entry point for the payout cron. Idempotent and safe to run repeatedly.
 */
export async function runAffiliateAutoPayouts(db: DB): Promise<AutoPayoutSummary> {
  const summary: AutoPayoutSummary = { ran: false, eligible: 0, paid: 0, skipped: 0, failed: 0, recovered: 0, totalPaidPence: 0 }

  if (!isAffiliatePayoutsEnabled()) return { ...summary, reason: "gated" }
  const secretKey = stripeSecretKey()
  if (!secretKey) return { ...summary, reason: "no_stripe" }

  const Stripe = (await import("stripe")).default
  const stripe = new Stripe(secretKey, { apiVersion: STRIPE_API_VERSION })
  summary.ran = true

  const nowMs = Date.now()

  // ── 1. Crash recovery: re-drive rows stuck mid-flight (transfer may or may not
  //       have completed). Within the idempotency window Stripe dedupes, so this
  //       is safe. Older rows are flagged for manual review, never blind-retried.
  try {
    const { data: stuck } = await db
      .from("affiliate_payouts")
      .select("id, affiliate_workspace_id, amount_pence, status, created_at, review_note")
      .in("status", ["approved", "processing"])
      .like("review_note", "Auto-payout%")
      .limit(200)
    for (const r of (stuck ?? []) as Array<{ id: string; affiliate_workspace_id: string; amount_pence: number; created_at: string }>) {
      const ageMs = nowMs - new Date(r.created_at).getTime()
      const { data: acct } = await db
        .from("stripe_connect_accounts")
        .select("stripe_account_id, payouts_enabled")
        .eq("workspace_id", r.affiliate_workspace_id)
        .maybeSingle()
      const dest = acct?.stripe_account_id as string | undefined
      if (!dest || acct?.payouts_enabled !== true) {
        await db.from("affiliate_payouts").update({ status: "failed", review_note: "Auto-payout: no active connected account", updated_at: new Date().toISOString() }).eq("id", r.id)
        continue
      }
      if (ageMs > RECOVERY_WINDOW_MS) {
        // Past the safe idempotency window — do NOT re-transfer (could double-pay).
        await db.from("affiliate_payouts").update({ status: "failed", review_note: "Auto-payout: stalled past idempotency window — needs manual review", updated_at: new Date().toISOString() }).eq("id", r.id)
        continue
      }
      const res = await settlePayoutRow(db, stripe, r, dest)
      if (res === "paid") { summary.recovered++; summary.paid++; summary.totalPaidPence += Number(r.amount_pence ?? 0) }
    }
  } catch {
    /* non-fatal — continue to new payouts */
  }

  // ── 2. New payouts: eligible affiliates with a cleared balance ≥ minimum and a
  //       payouts-enabled connected account, with nothing already in flight.
  let affs: Array<{ workspace_id: string; cleared_pence: number; payout_email: string | null }> = []
  try {
    const { data } = await db
      .from("affiliates")
      .select("workspace_id, cleared_pence, payout_email")
      .eq("enrolled", true)
      .eq("approved", true)
      .gte("cleared_pence", MIN_PAYOUT_PENCE)
      .limit(500)
    affs = (data as typeof affs) ?? []
  } catch {
    return summary
  }
  summary.eligible = affs.length

  for (const aff of affs) {
    const amount = Number(aff.cleared_pence ?? 0)
    if (amount < MIN_PAYOUT_PENCE) { summary.skipped++; continue }

    // Must have a connected account that can actually receive payouts.
    const { data: acct } = await db
      .from("stripe_connect_accounts")
      .select("stripe_account_id, payouts_enabled")
      .eq("workspace_id", aff.workspace_id)
      .maybeSingle()
    const destination = acct?.stripe_account_id as string | undefined
    if (!destination || acct?.payouts_enabled !== true) { summary.skipped++; continue }

    // Skip if a payout is already in flight (covers the recovery rows above too).
    const { data: open } = await db
      .from("affiliate_payouts")
      .select("id")
      .eq("affiliate_workspace_id", aff.workspace_id)
      .in("status", ["requested", "approved", "processing"])
      .limit(1)
      .maybeSingle()
    if (open) { summary.skipped++; continue }

    // Create the payout row (system-approved) BEFORE transferring, so its id is
    // the idempotency anchor.
    const nowIso = new Date().toISOString()
    const period = nowIso.slice(0, 7)
    const { data: row, error } = await db
      .from("affiliate_payouts")
      .insert({
        affiliate_workspace_id: aff.workspace_id,
        period,
        amount_pence: amount,
        cleared_snapshot_pence: amount,
        status: "approved",
        requested_at: nowIso,
        reviewed_at: nowIso,
        review_note: "Auto-payout (system)",
        payout_email: aff.payout_email ?? null,
        updated_at: nowIso,
      })
      .select("id, affiliate_workspace_id, amount_pence")
      .single()
    if (error || !row) { summary.failed++; continue }

    const res = await settlePayoutRow(db, stripe, row as { id: string; affiliate_workspace_id: string; amount_pence: number }, destination)
    if (res === "paid") { summary.paid++; summary.totalPaidPence += amount }
    else summary.failed++
  }

  return summary
}
