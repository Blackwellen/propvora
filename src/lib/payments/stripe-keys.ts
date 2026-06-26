// ============================================================================
// Stripe key resolution. Supports both the standard keys and explicit *_TEST
// keys, and PREFERS the test key outside production so local/staging testing
// never accidentally hits a live key. Server secret + client publishable.
// ============================================================================

const isProd = process.env.NODE_ENV === "production"

/**
 * Resolve a payment method configuration ID for the current environment.
 * Non-production uses the _TEST variant so local dev never mixes live/test accounts.
 */
export function stripePmcId(
  key: "SUBSCRIPTIONS" | "STAY_BOOKINGS" | "INVOICE_PAYMENTS" | "MARKETPLACE"
): string | undefined {
  const test = process.env[`STRIPE_PMC_${key}_TEST`]
  const live = process.env[`STRIPE_PMC_${key}`]
  return isProd ? live : (test || live)
}

type PlanTier = "starter" | "operator" | "scale" | "pro_agency"
type BillingInterval = "monthly" | "annual"

/**
 * Resolve a plan price ID for the current environment.
 * In non-production, returns the matching _TEST price so the test Stripe account
 * is used instead of accidentally sending a live priceId to the test key.
 */
export function stripePriceId(
  tier: PlanTier,
  interval: BillingInterval,
  livePriceId: string
): string {
  if (isProd) return livePriceId
  const envKey = `STRIPE_PRICE_${tier.toUpperCase()}_${interval.toUpperCase()}_TEST`
  return process.env[envKey] ?? livePriceId
}

/** Server secret key. Non-production prefers STRIPE_SECRET_KEY_TEST. */
export function stripeSecretKey(): string | undefined {
  const test = process.env.STRIPE_SECRET_KEY_TEST
  const std = process.env.STRIPE_SECRET_KEY
  if (!isProd && test) return test
  return std || test
}

/** True when a usable secret key is configured. */
export function hasStripeSecret(): boolean {
  return !!stripeSecretKey()
}

/**
 * Client publishable key. Both vars are referenced literally so Next inlines
 * them; non-production prefers the _TEST publishable key.
 */
export function stripePublishableKey(): string | null {
  const test = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST
  const std = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  const k = !isProd && test ? test : std || test
  return k && k.trim().length > 0 ? k.trim() : null
}
