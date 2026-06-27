import type Stripe from "stripe"
import { stripeSecretKey } from "@/lib/payments/stripe-keys"
import { createAdminClient } from "@/lib/supabase/admin"

export const CUSTOMER_STRIPE_API_VERSION = "2026-05-27.dahlia" as const

/** A Stripe client for customer-facing flows, or null if not configured. */
export async function getCustomerStripe(): Promise<Stripe | null> {
  const secret = stripeSecretKey()
  if (!secret) return null
  const StripeCtor = (await import("stripe")).default
  return new StripeCtor(secret, { apiVersion: CUSTOMER_STRIPE_API_VERSION })
}

/**
 * Resolve (or lazily create) the Stripe Customer for a signed-in customer. The id
 * is cached on `customer_account_settings.metadata_json.stripe_customer_id` so the
 * same Stripe customer is reused across sessions. Uses the service-role client.
 */
export async function ensureCustomerStripeId(
  stripe: Stripe,
  userId: string,
  email: string | null
): Promise<string> {
  const admin = createAdminClient()

  const { data: row } = await admin
    .from("customer_account_settings")
    .select("id, metadata_json")
    .eq("customer_id", userId)
    .maybeSingle()

  const meta = ((row as { metadata_json?: Record<string, unknown> } | null)?.metadata_json ?? {}) as Record<string, unknown>
  const existing = typeof meta.stripe_customer_id === "string" ? meta.stripe_customer_id : null
  if (existing) return existing

  const customer = await stripe.customers.create({
    email: email ?? undefined,
    metadata: { customer_user_id: userId },
  })

  const nextMeta = { ...meta, stripe_customer_id: customer.id }
  if ((row as { id?: string } | null)?.id) {
    await admin.from("customer_account_settings").update({ metadata_json: nextMeta }).eq("customer_id", userId)
  } else {
    await admin.from("customer_account_settings").insert({ customer_id: userId, status: "active", metadata_json: nextMeta, created_by: userId })
  }
  return customer.id
}
