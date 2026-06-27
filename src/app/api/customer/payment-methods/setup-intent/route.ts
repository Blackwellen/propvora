import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { stripePublishableKey } from "@/lib/payments/stripe-keys"
import { getCustomerStripe, ensureCustomerStripeId } from "@/lib/customer/stripe"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/customer/payment-methods/setup-intent
 *
 * Creates a Stripe SetupIntent for the signed-in customer so they can add a card
 * for future off-session use. Returns the client secret + publishable key for the
 * client to confirm with Stripe.js Elements. No card data ever touches our server.
 */
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const stripe = await getCustomerStripe()
  const publishableKey = stripePublishableKey()
  if (!stripe || !publishableKey) {
    return NextResponse.json({ error: "Card management isn't available right now." }, { status: 503 })
  }

  try {
    const customerId = await ensureCustomerStripeId(stripe, user.id, user.email ?? null)
    const intent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      usage: "off_session",
      metadata: { customer_user_id: user.id },
    })
    return NextResponse.json({ clientSecret: intent.client_secret, publishableKey })
  } catch (e) {
    console.error("[customer/setup-intent]", e)
    return NextResponse.json({ error: "Could not start card setup." }, { status: 502 })
  }
}
