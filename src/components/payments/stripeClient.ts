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

declare global {
  interface Window {
    Stripe?: (key: string, opts?: Record<string, unknown>) => StripeLike
  }
}

export function publishableKey(): string | null {
  const k = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  return k && k.trim().length > 0 ? k.trim() : null
}

let scriptPromise: Promise<boolean> | null = null

function loadScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false)
  if (window.Stripe) return Promise.resolve(true)
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise<boolean>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://js.stripe.com/v3/"]'
    )
    if (existing) {
      existing.addEventListener("load", () => resolve(!!window.Stripe))
      existing.addEventListener("error", () => resolve(false))
      if (window.Stripe) resolve(true)
      return
    }
    const s = document.createElement("script")
    s.src = "https://js.stripe.com/v3/"
    s.async = true
    s.onload = () => resolve(!!window.Stripe)
    s.onerror = () => resolve(false)
    document.head.appendChild(s)
  })
  return scriptPromise
}

/** Resolve a Stripe.js client, or null when unavailable. Publishable key only. */
export async function getStripe(): Promise<StripeLike | null> {
  const key = publishableKey()
  if (!key) return null

  // 1. Prefer the npm loader if present.
  try {
    // @ts-ignore — optional dependency; may be absent on this branch.
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
  if (!ok || !window.Stripe) return null
  try {
    return window.Stripe(key)
  } catch {
    return null
  }
}
