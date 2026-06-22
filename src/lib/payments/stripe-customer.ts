// ============================================================================
// Resolve a Stripe Customer for a logged-in Propvora user WITHOUT a bespoke
// mapping table — Stripe is the source of truth. We tag the customer with
// metadata.propvora_user_id and look it up by that, creating on first use. This
// lets the Payment Element show + save the user's cards across bookings.
// Server-only (uses the secret key). Never throws fatally — returns null so the
// pay flow falls back to a one-off (no-saved-card) PaymentIntent.
// ============================================================================

import type Stripe from "stripe"

export async function resolveStripeCustomer(
  stripe: Stripe,
  user: { id: string; email?: string | null }
): Promise<string | null> {
  try {
    // 1. Look up by our metadata tag (exact, stable).
    const found = await stripe.customers.search({
      query: `metadata['propvora_user_id']:'${user.id}'`,
      limit: 1,
    })
    if (found.data[0]) return found.data[0].id

    // 2. Create one tagged with the user id.
    const created = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { propvora_user_id: user.id },
    })
    return created.id
  } catch {
    return null
  }
}

/**
 * Create a CustomerSession so the Payment Element can show the customer's saved
 * cards and offer to save new ones. Returns the client secret, or null on any
 * failure (the Element then just renders without saved cards).
 */
export async function createCustomerSessionSecret(
  stripe: Stripe,
  customerId: string
): Promise<string | null> {
  try {
    const session = await stripe.customerSessions.create({
      customer: customerId,
      components: {
        payment_element: {
          enabled: true,
          features: {
            payment_method_redisplay: "enabled",
            payment_method_save: "enabled",
            payment_method_save_usage: "off_session",
            payment_method_remove: "enabled",
          },
        },
      },
    })
    return session.client_secret ?? null
  } catch {
    return null
  }
}
