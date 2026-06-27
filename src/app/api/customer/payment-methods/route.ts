import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCustomerStripe, ensureCustomerStripeId } from "@/lib/customer/stripe"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Customer saved cards — backed by Stripe (source of truth), scoped to the
 * customer's own Stripe Customer.
 *
 *   GET    → { items: [{ id, brand, last4, expMonth, expYear }] }
 *   DELETE ?id=pm_…  → { ok }   (detaches; verifies ownership first)
 */

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const stripe = await getCustomerStripe()
  if (!stripe) return NextResponse.json({ items: [] })

  try {
    const customerId = await ensureCustomerStripeId(stripe, user.id, user.email ?? null)
    const pms = await stripe.paymentMethods.list({ customer: customerId, type: "card" })
    const items = pms.data.map((pm) => ({
      id: pm.id,
      brand: pm.card?.brand ?? "card",
      last4: pm.card?.last4 ?? "••••",
      expMonth: pm.card?.exp_month ?? null,
      expYear: pm.card?.exp_year ?? null,
    }))
    return NextResponse.json({ items })
  } catch (e) {
    console.error("[customer/payment-methods GET]", e)
    return NextResponse.json({ items: [] })
  }
}

export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const id = new URL(req.url).searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

  const stripe = await getCustomerStripe()
  if (!stripe) return NextResponse.json({ error: "Card management isn't available." }, { status: 503 })

  try {
    const customerId = await ensureCustomerStripeId(stripe, user.id, user.email ?? null)
    // Ownership check: the payment method must belong to this customer.
    const pm = await stripe.paymentMethods.retrieve(id)
    if (pm.customer !== customerId) {
      return NextResponse.json({ error: "Not your card." }, { status: 403 })
    }
    await stripe.paymentMethods.detach(id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[customer/payment-methods DELETE]", e)
    return NextResponse.json({ error: "Could not remove the card." }, { status: 502 })
  }
}
