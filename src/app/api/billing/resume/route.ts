import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { recordAudit, AUDIT_ACTIONS } from "@/lib/audit/log"
import {
  resolveBillingContext,
  getActiveSubscription,
  resolveStripeSubscriptionId,
  getStripe,
  periodEndIsoFromSubscription,
  recordSubscriptionEvent,
  checkBillingCsrf,
} from "../_shared"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/billing/resume — clear a scheduled cancellation ("keep my plan").
 *
 * 1. Tells Stripe to set cancel_at_period_end=false on the subscription.
 * 2. Sets workspace_subscriptions.cancel_at_period_end=false.
 * 3. Marks the open workspace_cancellation_requests row status=withdrawn.
 * 4. Records a workspace_subscription_events row + an audit log.
 *
 * Idempotent: re-running when nothing is scheduled returns 200 with
 * { alreadyActive: true }.
 *
 * Owner/admin only, workspace-scoped, tolerant of missing tables (42P01).
 */
export async function POST(request: NextRequest) {
  const csrf = checkBillingCsrf(request)
  if (csrf) return csrf

  const resolved = await resolveBillingContext()
  if (resolved.response) return resolved.response
  const { workspaceId, admin, secretKey, userId, actorEmail } = resolved.ctx

  const sub = await getActiveSubscription(admin, workspaceId)
  const stripeRef = await resolveStripeSubscriptionId(admin, workspaceId, sub)

  if (!stripeRef) {
    return NextResponse.json(
      { error: "No subscription found for this workspace." },
      { status: 404 },
    )
  }

  // ── Stripe: clear cancel-at-period-end ───────────────────────────────────
  let periodEndIso: string | null = sub?.currentPeriodEnd ?? null
  try {
    const stripe = await getStripe(secretKey)
    const updated = await stripe.subscriptions.update(stripeRef.stripeSubscriptionId, {
      cancel_at_period_end: false,
    })
    periodEndIso = periodEndIsoFromSubscription(updated) ?? periodEndIso
  } catch (err) {
    console.error("[billing/resume] stripe update failed", err)
    return NextResponse.json(
      { error: "Could not resume the subscription with Stripe. Please try again." },
      { status: 502 },
    )
  }

  // ── DB: subscription flag (tolerant) ─────────────────────────────────────
  if (sub) {
    try {
      await admin
        .from("workspace_subscriptions")
        .update({
          cancel_at_period_end: false,
          cancelled_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sub.id)
        .eq("workspace_id", workspaceId)
    } catch {
      /* table missing — non-fatal */
    }
  }

  // ── DB: withdraw any open cancellation request ───────────────────────────
  let withdrew = false
  try {
    const { data: open } = await admin
      .from("workspace_cancellation_requests")
      .select("id, status")
      .eq("workspace_id", workspaceId)
      .in("status", ["scheduled", "paused"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (open) {
      await admin
        .from("workspace_cancellation_requests")
        .update({ status: "withdrawn", updated_at: new Date().toISOString() })
        .eq("id", open.id)
      withdrew = true
    }
  } catch {
    /* table missing — non-fatal */
  }

  // Idempotent signal when there was nothing to clear in DB and the sub wasn't
  // flagged. Stripe call above already ensured the canonical state regardless.
  const alreadyActive = !withdrew && !(sub?.cancelAtPeriodEnd ?? false)

  await recordSubscriptionEvent(admin, {
    workspaceId,
    subscriptionId: sub?.id ?? null,
    eventType: "reactivation",
    summary: "Scheduled cancellation withdrawn — subscription will renew.",
    actor: actorEmail ?? "Owner",
    metadata: { accessUntil: periodEndIso },
  })

  await recordAudit(admin, {
    workspaceId,
    userId,
    action: AUDIT_ACTIONS.BILLING_SUBSCRIPTION_UPDATED,
    resourceType: "subscription",
    resourceId: stripeRef.stripeSubscriptionId,
    metadata: { event: "cancel_withdrawn", accessUntil: periodEndIso },
  })

  return NextResponse.json({ ok: true, resumed: true, alreadyActive, accessUntil: periodEndIso })
}
