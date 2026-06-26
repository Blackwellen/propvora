import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getValidatedPortalSession } from "@/lib/portal/session"
import { createAdminClient } from "@/lib/supabase/admin"
import { getTenantTenancies } from "@/lib/portal/data"
import { stripeSecretKey } from "@/lib/payments/stripe-keys"
import { rateLimit, clientKey } from "@/lib/rate-limit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/*
 * POST /api/portal/tenant/payment-intent
 *
 * Creates a Stripe PaymentIntent for the tenant's current rent amount.
 * Auth: portal session cookie (tenant type only).
 * Amount is always server-derived from the tenancy row — client never sends amount.
 */
export async function POST(request: NextRequest) {
  const rl = await rateLimit({ key: clientKey(request, "portal:rent-intent"), limit: 5, windowMs: 15 * 60 * 1000 })
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many payment attempts. Please wait and try again." }, { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } })
  }

  const secretKey = stripeSecretKey()
  if (!secretKey) {
    return NextResponse.json({ error: "Online card payments are not enabled yet. Please use bank transfer.", ready: false }, { status: 503 })
  }

  const session = await getValidatedPortalSession()
  if (!session || session.portalType !== "tenant") {
    return NextResponse.json({ error: "Invalid session." }, { status: 401 })
  }

  // Resolve the tenant's tenancy via the canonical, schema-correct data layer
  // (scopes by primary_contact_id / tenant_contact_id and the session's frozen
  // tenancyIds allow-list). Amount is ALWAYS server-derived from the row.
  const admin = createAdminClient()
  let rentAmountPence: number | null = null
  const currency = "GBP"
  let tenancyId: string | null = null

  try {
    const tenancies = await getTenantTenancies(session)
    // Prefer an active tenancy; otherwise fall back to the most recent one.
    const active = tenancies.find((t) => ["active", "current"].includes((t.status ?? "").toLowerCase()))
    const t = active ?? tenancies[0]
    if (t) {
      rentAmountPence = t.rent_amount != null ? Math.round(t.rent_amount * 100) : null
      tenancyId = t.id
    }
  } catch {
    /* tolerate; fall through to zero-amount guard below */
  }

  if (!rentAmountPence || rentAmountPence <= 0) {
    return NextResponse.json({ error: "We couldn't find your rent amount. Please contact your manager.", ready: false }, { status: 503 })
  }

  try {
    const Stripe = (await import("stripe")).default
    const stripe = new Stripe(secretKey, { apiVersion: "2026-05-27.dahlia" as const })

    // Create a direct-charge PaymentIntent (no escrow; rent is confirmed immediately on capture)
    const intent = await stripe.paymentIntents.create({
      amount: rentAmountPence,
      currency: currency.toLowerCase(),
      capture_method: "automatic",
      description: `Rent payment${tenancyId ? ` · ${tenancyId.slice(0, 8).toUpperCase()}` : ""}`,
      metadata: {
        kind: "tenant_rent",
        workspace_id: session.workspaceId,
        contact_id: session.contactId ?? "",
        tenancy_id: tenancyId ?? "",
      },
      automatic_payment_methods: { enabled: true },
    })

    // Record in payments table for audit trail (tolerant of missing table)
    try {
      await admin.from("payments").insert({
        workspace_id: session.workspaceId,
        payment_type: "income",
        linked_type: "tenancy",
        linked_id: tenancyId,
        amount: rentAmountPence / 100,
        currency,
        payment_method: "card",
        status: "requires_payment",
        stripe_payment_id: intent.id,
        reference: intent.id,
        metadata: { kind: "tenant_rent", contact_id: session.contactId },
      })
    } catch {
      /* non-fatal — webhook reconciles */
    }

    return NextResponse.json({
      clientSecret: intent.client_secret,
      amountPence: rentAmountPence,
      currency,
    })
  } catch (err) {
    console.error("[portal/tenant/payment-intent]", err)
    return NextResponse.json({ error: "We couldn't start the payment. Please try again." }, { status: 500 })
  }
}
