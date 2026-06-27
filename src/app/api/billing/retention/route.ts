import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import type Stripe from "stripe"
import { getPriceId } from "@/lib/billing/plans"
import { recordAudit, AUDIT_ACTIONS } from "@/lib/audit/log"
import {
  resolveBillingContext,
  getActiveSubscription,
  resolveStripeSubscriptionId,
  getStripe,
  recordSubscriptionEvent,
  checkBillingCsrf,
  type AdminClient,
} from "../_shared"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const TENURE_MIN_DAYS = 90 // "subscribed for 3 months or longer"

type IneligibleReason =
  | "already_claimed"
  | "no_subscription"
  | "not_active"
  | "plan_not_basic"
  | "tenure"
  | "unknown"

interface Eligibility {
  eligible: boolean
  reason?: IneligibleReason
  creditMinor?: number
  currency?: string
}

/** Has this workspace ever claimed the retention offer? (one-shot guard) */
async function alreadyClaimed(admin: AdminClient, workspaceId: string): Promise<boolean> {
  try {
    const { data } = await admin
      .from("workspace_cancellation_requests")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("retention_offer_claimed", true)
      .limit(1)
      .maybeSingle()
    return !!data
  } catch {
    return false
  }
}

/** Is the subscription's price the Starter (basic) tier? Free credit is basic-only. */
function isBasicPlan(sub: Stripe.Subscription): boolean {
  const priceId = sub.items?.data?.[0]?.price?.id ?? null
  if (!priceId) return false
  const starterMonthly = getPriceId("starter", "monthly")
  const starterAnnual = getPriceId("starter", "annual")
  return priceId === starterMonthly || priceId === starterAnnual
}

/** 2 months of value from the live price (annual → 2/12 of annual; monthly → 2×). */
function retentionCreditMinor(sub: Stripe.Subscription): { creditMinor: number; currency: string } {
  const item = sub.items?.data?.[0]
  const unit = item?.price?.unit_amount ?? 0
  const currency = item?.price?.currency ?? "gbp"
  const interval = item?.price?.recurring?.interval
  const creditMinor = interval === "year" ? Math.round((unit * 2) / 12) : unit * 2
  return { creditMinor, currency }
}

/**
 * Authoritative eligibility — ALL conditions enforced server-side:
 *   one-time · basic/Starter only · paid & active · subscribed ≥ 3 months.
 */
async function evaluate(
  admin: AdminClient,
  workspaceId: string,
  secretKey: string,
  stripeSubscriptionId: string,
): Promise<Eligibility> {
  if (await alreadyClaimed(admin, workspaceId)) return { eligible: false, reason: "already_claimed" }
  try {
    const stripe = await getStripe(secretKey)
    const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId)

    // Paid + active only (excludes trialing, past_due, canceled, paused).
    if (sub.status !== "active") return { eligible: false, reason: "not_active" }

    // Basic/Starter only — never give away AI tiers.
    if (!isBasicPlan(sub)) return { eligible: false, reason: "plan_not_basic" }

    // Tenure ≥ 3 months from the subscription start.
    const ageDays = (Date.now() / 1000 - (sub.created ?? Date.now() / 1000)) / 86400
    if (ageDays < TENURE_MIN_DAYS) return { eligible: false, reason: "tenure" }

    const { creditMinor, currency } = retentionCreditMinor(sub)
    if (creditMinor <= 0) return { eligible: false, reason: "unknown" }
    return { eligible: true, creditMinor, currency }
  } catch {
    return { eligible: false, reason: "unknown" }
  }
}

/** GET — drives conditional UI visibility. Returns eligibility only. */
export async function GET() {
  const resolved = await resolveBillingContext()
  if (resolved.response) return resolved.response
  const { workspaceId, admin, secretKey } = resolved.ctx

  const sub = await getActiveSubscription(admin, workspaceId)
  const stripeRef = await resolveStripeSubscriptionId(admin, workspaceId, sub)
  if (!stripeRef) return NextResponse.json({ eligible: false, reason: "no_subscription" })

  const elig = await evaluate(admin, workspaceId, secretKey, stripeRef.stripeSubscriptionId)
  return NextResponse.json(elig)
}

/**
 * POST — claim the "2 months free" retention credit. Re-checks EVERY condition
 * server-side (never trusts the client), applies a real negative Stripe customer
 * balance transaction, persists the one-shot marker, and audits.
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
      { error: "An active subscription is required to claim the retention offer." },
      { status: 404 },
    )
  }

  const elig = await evaluate(admin, workspaceId, secretKey, stripeRef.stripeSubscriptionId)
  if (!elig.eligible) {
    const status = elig.reason === "already_claimed" ? 409 : 403
    const message: Record<IneligibleReason, string> = {
      already_claimed: "The retention offer has already been claimed for this workspace.",
      no_subscription: "An active subscription is required to claim the retention offer.",
      not_active: "The retention offer is only available on a paid, active subscription.",
      plan_not_basic: "The retention offer is only available on the Starter plan.",
      tenure: "The retention offer is available after three months of paid subscription.",
      unknown: "The retention offer is not available for this subscription.",
    }
    return NextResponse.json(
      { error: message[elig.reason ?? "unknown"], reason: elig.reason, alreadyClaimed: elig.reason === "already_claimed" },
      { status },
    )
  }

  const creditMinor = elig.creditMinor ?? 0
  const currency = elig.currency ?? "gbp"

  // ── Apply the real Stripe credit ──────────────────────────────────────────
  try {
    const stripe = await getStripe(secretKey)
    let customerId = stripeRef.stripeCustomerId
    if (!customerId) {
      const s = await stripe.subscriptions.retrieve(stripeRef.stripeSubscriptionId)
      customerId = typeof s.customer === "string" ? s.customer : s.customer.id
    }
    await stripe.customers.createBalanceTransaction(customerId, {
      amount: -creditMinor,
      currency,
      description: "Retention offer — 2 months free",
      metadata: { workspace_id: workspaceId, kind: "retention_offer", actor: actorEmail ?? userId },
    })
  } catch (err) {
    console.error("[billing/retention] stripe credit failed", err)
    return NextResponse.json(
      { error: "Could not apply the retention credit with Stripe. Please try again." },
      { status: 502 },
    )
  }

  // ── Persist the one-shot marker on workspace_cancellation_requests ─────────
  try {
    const { data: existing } = await admin
      .from("workspace_cancellation_requests")
      .select("id")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (existing) {
      await admin
        .from("workspace_cancellation_requests")
        .update({ retention_offer_claimed: true, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
    } else {
      await admin.from("workspace_cancellation_requests").insert({
        workspace_id: workspaceId,
        subscription_id: sub?.id ?? null,
        reason: "retention_offer",
        data_retention_days: 90,
        retention_offer_claimed: true,
        status: "withdrawn", // not a cancellation — just carries the one-shot marker
        created_by: userId,
        updated_at: new Date().toISOString(),
      })
    }
  } catch {
    /* table missing — non-fatal; Stripe credit already applied + audited */
  }

  await recordSubscriptionEvent(admin, {
    workspaceId,
    subscriptionId: sub?.id ?? null,
    eventType: "plan_change",
    summary: `Retention offer claimed — ${(creditMinor / 100).toFixed(2)} ${currency.toUpperCase()} credit applied.`,
    actor: actorEmail ?? "Owner",
    metadata: { kind: "retention_offer", creditMinor, currency },
  })

  await recordAudit(admin, {
    workspaceId,
    userId,
    action: AUDIT_ACTIONS.BILLING_SUBSCRIPTION_UPDATED,
    resourceType: "subscription",
    resourceId: stripeRef.stripeSubscriptionId,
    metadata: { event: "retention_offer_claimed", creditMinor, currency },
  })

  return NextResponse.json({ ok: true, claimed: true, creditMinor, currency })
}
