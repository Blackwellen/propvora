// ============================================================================
// Stripe key resolution. Supports both the standard keys and explicit *_TEST
// keys, and PREFERS the test key outside production so local/staging testing
// never accidentally hits a live key. Server secret + client publishable.
// ============================================================================

const isProd = process.env.NODE_ENV === "production"

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
