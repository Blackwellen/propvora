"use client"

/* ──────────────────────────────────────────────────────────────────────────
   Browser Stripe.js loader — PUBLISHABLE KEY ONLY.

   `@stripe/stripe-js` is not a guaranteed dependency on this branch, so we load
   Stripe.js DYNAMICALLY and tolerate its absence:
     1. try the npm `@stripe/stripe-js` loader (if installed),
     2. else inject the official https://js.stripe.com/v3 script and use the
        global `window.Stripe`.
   Either way we only ever use the publishable key (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY).
   A null return means "Stripe.js unavailable" → the pay form renders a premium
   not-ready state instead of crashing.

   This file makes NO charge — it constructs the client SDK. The actual
   confirmation happens via stripe.confirmCardPayment with the client_secret
   minted server-side; nothing here is invoked during type-checking.
─────────────────────────────────────────────────────────────────────────── */

// Minimal structural types so we don't depend on @stripe/stripe-js types.
export interface StripeLike {
  elements: (opts?: Record<string, unknown>) => StripeElementsLike
  confirmCardPayment: (
    clientSecret: string,
    data?: Record<string, unknown>
  ) => Promise<{ error?: { message?: string }; paymentIntent?: { status?: string } }>
  /**
   * Payment Element confirmation — supports cards, Google Pay, Apple Pay and
   * saved cards in one widget. Pass the Elements instance (created with the
   * intent client_secret) + `redirect: "if_required"` to stay on-page.
   */
  confirmPayment: (
    opts: Record<string, unknown>
  ) => Promise<{ error?: { message?: string }; paymentIntent?: { status?: string } }>
}
export interface StripeElementsLike {
  create: (type: string, opts?: Record<string, unknown>) => StripeElementLike
  getElement: (type: string) => StripeElementLike | null
}
export interface StripeElementLike {
  mount: (selector: string | HTMLElement) => void
  unmount: () => void
  on: (event: string, handler: (e: unknown) => void) => void
  destroy: () => void
}

// Access window.Stripe (injected by the CDN script) without augmenting the
// global Window type — `@stripe/stripe-js`, when installed, already declares
// `window.Stripe`, and a second conflicting declaration would error.
type StripeGlobal = (key: string, opts?: Record<string, unknown>) => StripeLike
function windowStripe(): StripeGlobal | undefined {
  if (typeof window === "undefined") return undefined
  return (window as unknown as { Stripe?: StripeGlobal }).Stripe
}

export function publishableKey(): string | null {
  const k = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  return k && k.trim().length > 0 ? k.trim() : null
}

let scriptPromise: Promise<boolean> | null = null

function loadScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false)
  if (windowStripe()) return Promise.resolve(true)
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise<boolean>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://js.stripe.com/v3/"]'
    )
    if (existing) {
      existing.addEventListener("load", () => resolve(!!windowStripe()))
      existing.addEventListener("error", () => resolve(false))
      if (windowStripe()) resolve(true)
      return
    }
    const s = document.createElement("script")
    s.src = "https://js.stripe.com/v3/"
    s.async = true
    s.onload = () => resolve(!!windowStripe())
    s.onerror = () => resolve(false)
    document.head.appendChild(s)
  })
  return scriptPromise
}

/** Resolve a Stripe.js client, or null when unavailable. Publishable key only. */
export async function getStripe(): Promise<StripeLike | null> {
  const key = publishableKey()
  if (!key) return null

  // 1. Prefer the npm loader (@stripe/stripe-js is a declared dependency). The
  // dynamic import + try/catch keeps the CDN fallback path working even if the
  // module ever fails to load at runtime.
  try {
    const mod = await import("@stripe/stripe-js")
    if (mod?.loadStripe) {
      const s = await mod.loadStripe(key)
      if (s) return s as unknown as StripeLike
    }
  } catch {
    /* not installed — fall back to the CDN script */
  }

  // 2. CDN fallback.
  const ok = await loadScript()
  const ctor = windowStripe()
  if (!ok || !ctor) return null
  try {
    return ctor(key)
  } catch {
    return null
  }
}
