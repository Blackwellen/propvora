import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  accrueCommissionForInvoice,
  reverseCommissionForCustomer,
  stopReferralAccrual,
} from "@/lib/affiliate/commission"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
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
      apiVersion: "2026-05-27.dahlia" as "2026-05-27.dahlia",
    })
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error("[webhooks/stripe] Signature verification failed:", err)
    return NextResponse.json({ error: "Webhook signature verification failed." }, { status: 400 })
  }

  const supabase = createAdminClient()

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

        break
      }

      default:
        // Unhandled event type — log and acknowledge
        console.log(`[webhooks/stripe] Unhandled event type: ${event.type}`)
    }
  } catch (err) {
    console.error("[webhooks/stripe] Database update failed:", err)
    // Return 500 so Stripe retries
    return NextResponse.json({ error: "Database update failed." }, { status: 500 })
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
