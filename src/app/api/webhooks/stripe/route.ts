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

        await recordAudit(supabase, {
          workspaceId: await workspaceIdForCustomer(customerId),
          action: AUDIT_ACTIONS.BILLING_SUBSCRIPTION_UPDATED,
          resourceType: "subscription",
          resourceId: sub.id,
          metadata: { plan, planStatus, eventId: event.id },
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
