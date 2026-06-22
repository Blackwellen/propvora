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
 * POST /api/billing/cancel — schedule cancel-at-period-end.
 *
 * 1. Tells Stripe to set cancel_at_period_end=true on the subscription.
 * 2. Writes / upserts a workspace_cancellation_requests row (status=scheduled,
 *    effective_at + access_until = current_period_end).
 * 3. Sets workspace_subscriptions.cancel_at_period_end=true.
 * 4. Records a workspace_subscription_events row + an audit log.
 *
 * Idempotent: re-running when already scheduled returns 200 with
 * { alreadyScheduled: true } and makes no duplicate writes.
 *
 * Owner/admin only, workspace-scoped. Tolerant of missing tables (42P01).
 * Honest 404 when there is no subscription, honest 503 when Stripe is unset.
 */
export async function POST(request: NextRequest) {
  const csrf = checkBillingCsrf(request)
  if (csrf) return csrf

  const resolved = await resolveBillingContext()
  if (resolved.response) return resolved.response
  const { workspaceId, admin, secretKey, userId, actorEmail } = resolved.ctx

  let body: { reason?: string; detail?: string } = {}
  try {
    body = (await request.json()) as { reason?: string; detail?: string }
  } catch {
    /* empty body is fine */
  }
  const reason = typeof body.reason === "string" ? body.reason.slice(0, 200) : null
  const detail = typeof body.detail === "string" ? body.detail.slice(0, 2000) : null

  const sub = await getActiveSubscription(admin, workspaceId)
  const stripeRef = await resolveStripeSubscriptionId(admin, workspaceId, sub)

  if (!stripeRef) {
    return NextResponse.json(
      { error: "No active subscription to cancel for this workspace." },
      { status: 404 },
    )
  }

  // Already scheduled in our DB → idempotent no-op.
  if (sub?.cancelAtPeriodEnd) {
    return NextResponse.json({
      ok: true,
      alreadyScheduled: true,
      accessUntil: sub.currentPeriodEnd,
    })
  }

  // ── Stripe: schedule cancel-at-period-end ────────────────────────────────
  let periodEndIso: string | null = sub?.currentPeriodEnd ?? null
  try {
    const stripe = await getStripe(secretKey)
    const updated = await stripe.subscriptions.update(stripeRef.stripeSubscriptionId, {
      cancel_at_period_end: true,
    })
    periodEndIso = periodEndIsoFromSubscription(updated) ?? periodEndIso
  } catch (err) {
    console.error("[billing/cancel] stripe update failed", err)
    return NextResponse.json(
      { error: "Could not schedule cancellation with Stripe. Please try again." },
      { status: 502 },
    )
  }

  // ── DB: subscription flag (tolerant) ─────────────────────────────────────
  if (sub) {
    try {
      await admin
        .from("workspace_subscriptions")
        .update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
        .eq("id", sub.id)
        .eq("workspace_id", workspaceId)
    } catch {
      /* table missing — non-fatal */
    }
  }

  // ── DB: cancellation request (reuse a withdrawn row if present) ───────────
  try {
    const { data: existing } = await admin
      .from("workspace_cancellation_requests")
      .select("id, status")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    const payload = {
      workspace_id: workspaceId,
      subscription_id: sub?.id ?? null,
      reason,
      detail,
      effective_at: periodEndIso,
      access_until: periodEndIso,
      data_retention_days: 90,
      status: "scheduled" as const,
      created_by: userId,
      updated_at: new Date().toISOString(),
    }

    if (existing && existing.status !== "completed") {
      await admin.from("workspace_cancellation_requests").update(payload).eq("id", existing.id)
    } else {
      await admin.from("workspace_cancellation_requests").insert(payload)
    }
  } catch {
    /* table missing — non-fatal; Stripe is the source of truth */
  }

  await recordSubscriptionEvent(admin, {
    workspaceId,
    subscriptionId: sub?.id ?? null,
    eventType: "cancellation",
    summary: "Cancellation scheduled for end of current term.",
    actor: actorEmail ?? "Owner",
    metadata: { reason, accessUntil: periodEndIso },
  })

  await recordAudit(admin, {
    workspaceId,
    userId,
    action: AUDIT_ACTIONS.BILLING_SUBSCRIPTION_UPDATED,
    resourceType: "subscription",
    resourceId: stripeRef.stripeSubscriptionId,
    metadata: { event: "cancel_scheduled", accessUntil: periodEndIso },
  })

  return NextResponse.json({ ok: true, scheduled: true, accessUntil: periodEndIso })
}
