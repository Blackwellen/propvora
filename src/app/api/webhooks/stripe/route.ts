import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  accrueCommissionForInvoice,
  reverseCommissionForCustomer,
  stopReferralAccrual,
} from "@/lib/affiliate/commission"
import { recordAudit, AUDIT_ACTIONS } from "@/lib/audit/log"
import { captureException, requestIdFrom } from "@/lib/observability"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const requestId = requestIdFrom(request.headers)
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 })
  }

  const sig = request.headers.get("stripe-signature")
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 })
  }

  // Read raw body — required for signature verification; do NOT use req.json()
  const body = await request.text()

  let event: import("stripe").Stripe.Event

  try {
    const Stripe = (await import("stripe")).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-05-27.dahlia" as const,
    })
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    // Log the failure for observability but never echo the signature/secret.
    captureException(err, {
      source: "api/webhooks/stripe:verify",
      requestId,
      tags: { stage: "signature" },
    })
    return NextResponse.json({ error: "Webhook signature verification failed." }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Best-effort: resolve the workspace id for a Stripe customer (for audit
  // context). Returns null on any failure — auditing never blocks processing.
  const workspaceIdForCustomer = async (
    customerId: string | null
  ): Promise<string | null> => {
    if (!customerId) return null
    try {
      const { data } = await supabase
        .from("workspaces")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .maybeSingle()
      return (data?.id as string | null) ?? null
    } catch {
      return null
    }
  }

  // ── Idempotency: Stripe delivers at-least-once and may replay events. ──────
  // If we've already recorded this event id, acknowledge without re-processing
  // (prevents double affiliate-commission accrual on invoice.paid, etc.). A
  // failed processing run below returns 500 WITHOUT recording, so Stripe's
  // retry is reprocessed. The unique index on stripe_event_id is the backstop.
  try {
    const { data: seen } = await supabase
      .from("stripe_webhook_events")
      .select("stripe_event_id")
      .eq("stripe_event_id", event.id)
      .maybeSingle()
    if (seen) {
      return NextResponse.json({ received: true, duplicate: true })
    }
  } catch {
    // Dedupe store unavailable — fail open and process (signature already valid).
  }

  try {
    switch (event.type) {
      case "customer.subscription.created": {
        const sub = event.data.object as import("stripe").Stripe.Subscription
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer.id
        const plan = stripePlanFromSubscription(sub)

        await supabase
          .from("workspaces")
          .update({
            plan,
            plan_status: "active",
            stripe_subscription_id: sub.id,
            stripe_customer_id: customerId,
          })
          .eq("stripe_customer_id", customerId)

        break
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as import("stripe").Stripe.Subscription
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer.id
        const plan = stripePlanFromSubscription(sub)
        const planStatus = stripeStatusToPlanStatus(sub.status)

        await supabase
          .from("workspaces")
          .update({
            plan,
            plan_status: planStatus,
            stripe_subscription_id: sub.id,
          })
          .eq("stripe_customer_id", customerId)

        // Reconcile the per-workspace Billing-section subscription row so the
        // Billing control centre reflects the canonical Stripe state.
        await syncWorkspaceSubscription(supabase, sub, customerId, plan, planStatus)

        await recordAudit(supabase, {
          workspaceId: await workspaceIdForCustomer(customerId),
          action: AUDIT_ACTIONS.BILLING_SUBSCRIPTION_UPDATED,
          resourceType: "subscription",
          resourceId: sub.id,
          metadata: { plan, planStatus, cancelAtPeriodEnd: !!sub.cancel_at_period_end, eventId: event.id },
        })

        break
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as import("stripe").Stripe.Subscription
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer.id

        await supabase
          .from("workspaces")
          .update({
            plan: "starter",
            plan_status: "canceled",
            stripe_subscription_id: null,
          })
          .eq("stripe_customer_id", customerId)

        // Reconcile the Billing-section row to cancelled + complete any open
        // cancellation request for this workspace.
        await syncWorkspaceSubscription(supabase, sub, customerId, "starter", "canceled")
        await completeCancellationRequest(supabase, sub.id, customerId)

        // Affiliate: stop future commission accrual for this referred customer.
        await stopReferralAccrual(supabase, { customerId })

        await recordAudit(supabase, {
          workspaceId: await workspaceIdForCustomer(customerId),
          action: AUDIT_ACTIONS.BILLING_SUBSCRIPTION_UPDATED,
          resourceType: "subscription",
          resourceId: sub.id,
          metadata: { planStatus: "canceled", eventId: event.id },
        })

        break
      }

      case "invoice.paid": {
        const invoice = event.data.object as import("stripe").Stripe.Invoice
        const customerId =
          typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id ?? null
        if (customerId && (invoice.amount_paid ?? 0) > 0) {
          // Affiliate commission accrual — source of truth is this paid invoice.
          await accrueCommissionForInvoice(supabase, {
            customerId,
            amountMinor: invoice.amount_paid ?? 0,
            currency: invoice.currency ?? "gbp",
            invoiceId: invoice.id,
          })
        }
        // Record a Billing-history row + payment event for this workspace.
        await recordBillingHistory(supabase, invoice, customerId, "paid")
        break
      }

      case "charge.refunded": {
        const charge = event.data.object as import("stripe").Stripe.Charge
        const customerId =
          typeof charge.customer === "string" ? charge.customer : charge.customer?.id ?? null
        if (customerId) {
          // Reverse the most recent pending affiliate commission for this customer.
          await reverseCommissionForCustomer(supabase, { customerId })
        }
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as import("stripe").Stripe.Invoice
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id ?? null

        if (customerId) {
          await supabase
            .from("workspaces")
            .update({ plan_status: "past_due" })
            .eq("stripe_customer_id", customerId)
        }

        // Record a Billing-history "failed" row for this workspace.
        await recordBillingHistory(supabase, invoice, customerId, "failed")

        await recordAudit(supabase, {
          workspaceId: await workspaceIdForCustomer(customerId),
          action: AUDIT_ACTIONS.BILLING_PAYMENT_FAILED,
          resourceType: "invoice",
          resourceId: invoice.id ?? null,
          metadata: {
            amountDue: invoice.amount_due ?? null,
            currency: invoice.currency ?? null,
            eventId: event.id,
          },
        })

        break
      }

      case "checkout.session.completed": {
        // Subscription checkout finished. The customer was already linked to the
        // workspace at checkout-create; mark the plan active promptly (the
        // subscription.created/updated events set the precise tier). We only
        // trust the webhook — never a client success redirect.
        const session = event.data.object as import("stripe").Stripe.Checkout.Session
        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id ?? null
        const wsId = (session.metadata?.workspace_id as string | undefined) ?? null
        if (session.mode === "subscription" && (customerId || wsId)) {
          const q = supabase.from("workspaces").update({ plan_status: "active" })
          await (wsId ? q.eq("id", wsId) : q.eq("stripe_customer_id", customerId!))
        }
        break
      }

      case "payment_intent.succeeded": {
        // Acknowledged. Subscription revenue is reconciled via invoice.paid;
        // this is logged for completeness and future Connect/one-off flows.
        const pi = event.data.object as import("stripe").Stripe.PaymentIntent
        console.log(`[webhooks/stripe] payment_intent.succeeded ${pi.id} (${pi.amount} ${pi.currency})`)
        break
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as import("stripe").Stripe.PaymentIntent
        console.warn(`[webhooks/stripe] payment_intent.payment_failed ${pi.id}: ${pi.last_payment_error?.message ?? "unknown"}`)
        break
      }

      case "account.updated": {
        // Stripe Connect: a connected (owner) account's onboarding/capabilities
        // changed. Sync our stored status. Separate from SaaS billing.
        const acct = event.data.object as import("stripe").Stripe.Account
        const status =
          acct.requirements?.disabled_reason ? "disabled"
            : acct.charges_enabled && acct.payouts_enabled ? "active"
            : acct.details_submitted ? "restricted"
            : "pending"
        await supabase
          .from("stripe_connect_accounts")
          .update({
            status,
            charges_enabled: !!acct.charges_enabled,
            payouts_enabled: !!acct.payouts_enabled,
            details_submitted: !!acct.details_submitted,
            country: acct.country ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_account_id", acct.id)
        break
      }

      case "charge.dispute.created": {
        // A customer disputed a charge (chargeback). Flag the workspace and
        // reverse any pending affiliate commission for this customer.
        const dispute = event.data.object as import("stripe").Stripe.Dispute
        const customerId =
          typeof dispute.charge === "string"
            ? null // charge id only — resolve below if needed
            : (dispute.charge as import("stripe").Stripe.Charge | null)?.customer as string | null ?? null
        console.warn(`[webhooks/stripe] charge.dispute.created ${dispute.id} amount=${dispute.amount} reason=${dispute.reason}`)
        if (customerId) {
          await supabase.from("workspaces").update({ plan_status: "past_due" }).eq("stripe_customer_id", customerId)
          await reverseCommissionForCustomer(supabase, { customerId })
        }

        await recordAudit(supabase, {
          workspaceId: await workspaceIdForCustomer(customerId),
          action: AUDIT_ACTIONS.BILLING_DISPUTE_CREATED,
          resourceType: "dispute",
          resourceId: dispute.id,
          metadata: {
            amount: dispute.amount ?? null,
            reason: dispute.reason ?? null,
            eventId: event.id,
          },
        })
        break
      }

      default:
        // Unhandled event type — log and acknowledge
        console.log(`[webhooks/stripe] Unhandled event type: ${event.type}`)
    }
  } catch (err) {
    // event.id and event.type are non-sensitive correlation metadata.
    captureException(err, {
      source: "api/webhooks/stripe",
      requestId,
      tags: { eventType: event.type, eventId: event.id },
    })
    // Return 500 so Stripe retries — we deliberately do NOT record the event id
    // here, so the retry is reprocessed rather than skipped as a duplicate.
    return NextResponse.json({ error: "Database update failed." }, { status: 500 })
  }

  // Record the processed event id AFTER success. A concurrent re-delivery that
  // raced past the dedupe check above hits the unique index and is ignored.
  try {
    await supabase.from("stripe_webhook_events").insert({
      stripe_event_id: event.id,
      type: event.type,
      payload: event as unknown as Record<string, unknown>,
    })
  } catch {
    /* unique-violation on concurrent delivery, or store unavailable — non-fatal */
  }

  return NextResponse.json({ received: true })
}

/**
 * Map a Stripe subscription to the closest Propvora WorkspacePlan.
 * Reads the first item's price metadata (plan key) or falls back to
 * the price interval to make a best-guess mapping.
 */
type PlanTier = "starter" | "operator" | "scale" | "pro_agency" | "enterprise"

function stripePlanFromSubscription(sub: import("stripe").Stripe.Subscription): PlanTier {
  const valid: PlanTier[] = ["starter", "operator", "scale", "pro_agency", "enterprise"]
  const item = sub.items.data[0]
  if (!item) return "starter"

  // Explicit mapping via Stripe price metadata: { plan: "operator" }
  const metaPlan = (item.price.metadata as Record<string, string>)?.plan
  if (metaPlan && valid.includes(metaPlan as PlanTier)) return metaPlan as PlanTier

  // Fallback: derive from price nickname (matches the plan_tier enum)
  const nick = (item.price.nickname ?? "").toLowerCase()
  if (nick.includes("enterprise")) return "enterprise"
  if (nick.includes("agency") || nick.includes("pro")) return "pro_agency"
  if (nick.includes("scale")) return "scale"
  if (nick.includes("operator")) return "operator"
  return "starter"
}

/**
 * Map a Stripe subscription status to WorkspacePlanStatus.
 */
function stripeStatusToPlanStatus(
  status: import("stripe").Stripe.Subscription.Status
): "active" | "trialing" | "past_due" | "canceled" | "suspended" {
  switch (status) {
    case "active":
      return "active"
    case "trialing":
      return "trialing"
    case "past_due":
      return "past_due"
    case "canceled":
    case "unpaid":
      return "canceled"
    case "paused":
      return "suspended"
    default:
      return "active"
  }
}

// ── Billing-section reconciliation helpers ──────────────────────────────────
//
// These keep the per-workspace Billing control-centre tables in sync with the
// canonical Stripe state. ALL are best-effort and 42P01-tolerant: a missing
// table (before the billing migration is applied) is swallowed so the webhook
// still acknowledges and the affiliate/workspace updates above still take
// effect. They NEVER fabricate data — they only mirror what Stripe sent.

type AdminLike = ReturnType<typeof createAdminClient>

function isoFromUnixSeconds(seconds: number | null | undefined): string | null {
  if (seconds == null) return null
  const ms = seconds * 1000
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null
}

/** Resolve the workspace id for a subscription via metadata, then customer. */
async function resolveWorkspaceId(
  supabase: AdminLike,
  sub: import("stripe").Stripe.Subscription | null,
  customerId: string | null,
): Promise<string | null> {
  const metaWs = (sub?.metadata?.workspace_id as string | undefined) ?? null
  if (metaWs) return metaWs
  if (!customerId) return null
  try {
    const { data } = await supabase
      .from("workspaces")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle()
    return (data?.id as string | null) ?? null
  } catch {
    return null
  }
}

const SECTION_STATUS: Record<string, string> = {
  active: "active",
  trialing: "trialing",
  past_due: "past_due",
  canceled: "cancelled",
  suspended: "paused",
}

/**
 * Upsert the workspace_subscriptions row for a Stripe subscription. Keyed by
 * stripe_subscription_id (then the most recent row for the workspace). Mirrors
 * status, current_period_end, cancel_at_period_end and the base price.
 */
async function syncWorkspaceSubscription(
  supabase: AdminLike,
  sub: import("stripe").Stripe.Subscription,
  customerId: string | null,
  plan: string,
  planStatus: string,
): Promise<void> {
  try {
    const workspaceId = await resolveWorkspaceId(supabase, sub, customerId)
    if (!workspaceId) return

    const item = sub.items?.data?.[0]
    const basePricePence = item?.price?.unit_amount ?? 0
    const billingCycle = item?.price?.recurring?.interval === "year" ? "annual" : "monthly"
    const sectionStatus = SECTION_STATUS[planStatus] ?? "active"
    // The billing period lives on the subscription ITEM in this API version.
    const periodStart = item?.current_period_start ?? null
    const periodEnd = item?.current_period_end ?? null

    const patch = {
      status: sectionStatus,
      plan_code: plan,
      billing_cycle: billingCycle,
      base_price_pence: basePricePence,
      current_period_start: isoFromUnixSeconds(periodStart),
      current_period_end: isoFromUnixSeconds(periodEnd),
      cancel_at_period_end: !!sub.cancel_at_period_end,
      cancelled_at: sub.canceled_at ? isoFromUnixSeconds(sub.canceled_at) : null,
      stripe_subscription_id: sub.id,
      stripe_customer_id: customerId,
      auto_renew: !sub.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    }

    // Prefer an existing row for this stripe subscription id.
    const { data: bySubId } = await supabase
      .from("workspace_subscriptions")
      .select("id")
      .eq("stripe_subscription_id", sub.id)
      .limit(1)
      .maybeSingle()

    if (bySubId) {
      await supabase.from("workspace_subscriptions").update(patch).eq("id", bySubId.id)
      return
    }

    // Else the latest non-archived row for the workspace (e.g. created at
    // checkout before the sub id was known), otherwise insert a fresh row.
    const { data: latest } = await supabase
      .from("workspace_subscriptions")
      .select("id")
      .eq("workspace_id", workspaceId)
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latest) {
      await supabase.from("workspace_subscriptions").update(patch).eq("id", latest.id)
    } else {
      await supabase.from("workspace_subscriptions").insert({ workspace_id: workspaceId, ...patch })
    }
  } catch {
    /* table missing / RLS — non-fatal */
  }
}

/** Mark any open cancellation request completed once the sub is deleted. */
async function completeCancellationRequest(
  supabase: AdminLike,
  subId: string,
  customerId: string | null,
): Promise<void> {
  try {
    const workspaceId = await resolveWorkspaceId(supabase, null, customerId)
    if (!workspaceId) return
    await supabase
      .from("workspace_cancellation_requests")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("workspace_id", workspaceId)
      .in("status", ["scheduled", "paused"])
  } catch {
    /* table missing — non-fatal */
  }
}

/**
 * Insert a workspace_billing_history row for a Stripe invoice. Idempotent on
 * the (workspace_id, reference) pair so a webhook replay does not duplicate.
 * Also records a payment event. Money is integer pence (Stripe minor units).
 */
async function recordBillingHistory(
  supabase: AdminLike,
  invoice: import("stripe").Stripe.Invoice,
  customerId: string | null,
  status: "paid" | "failed",
): Promise<void> {
  try {
    // The subscription link moved under invoice.parent.subscription_details in
    // this API version.
    const subDetails = invoice.parent?.subscription_details?.subscription ?? null
    const subId = typeof subDetails === "string" ? subDetails : subDetails?.id ?? null
    const workspaceId = await resolveWorkspaceId(
      supabase,
      null,
      customerId,
    )
    if (!workspaceId) return

    const reference = invoice.number ?? invoice.id ?? `inv_${Date.now()}`

    // Idempotency: skip if we already logged this invoice reference.
    const { data: seen } = await supabase
      .from("workspace_billing_history")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("reference", reference)
      .limit(1)
      .maybeSingle()
    if (seen) return

    const amountPence = status === "paid" ? invoice.amount_paid ?? 0 : invoice.amount_due ?? 0
    // total_taxes is an array of tax amounts in this API version.
    const taxPence = (invoice.total_taxes ?? []).reduce(
      (sum, t) => sum + (t.amount ?? 0),
      0,
    )
    const issuedAt = isoFromUnixSeconds(invoice.created) ?? new Date().toISOString()

    // Resolve the section subscription row id for the FK, if present.
    let sectionSubId: string | null = null
    if (subId) {
      const { data: row } = await supabase
        .from("workspace_subscriptions")
        .select("id")
        .eq("stripe_subscription_id", subId)
        .limit(1)
        .maybeSingle()
      sectionSubId = (row?.id as string | null) ?? null
    }

    await supabase.from("workspace_billing_history").insert({
      workspace_id: workspaceId,
      subscription_id: sectionSubId,
      doc_type: "invoice",
      reference,
      description: invoice.description ?? (status === "paid" ? "Subscription payment" : "Payment failed"),
      amount_pence: amountPence,
      tax_pence: taxPence,
      currency: (invoice.currency ?? "gbp").toUpperCase(),
      status: status === "paid" ? "paid" : "failed",
      period_label: null,
      issued_at: issuedAt,
    })

    await supabase.from("workspace_subscription_events").insert({
      workspace_id: workspaceId,
      subscription_id: sectionSubId,
      event_type: "payment",
      summary:
        status === "paid"
          ? `Payment received for ${reference}.`
          : `Payment failed for ${reference}.`,
      actor: "System",
      metadata_json: { reference, amountPence },
    })
  } catch {
    /* table missing — non-fatal */
  }
}
