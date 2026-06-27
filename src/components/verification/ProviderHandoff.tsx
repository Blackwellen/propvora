"use client"

import { useState } from "react"
import { ShieldCheck, Loader2, ArrowRight, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { getStripe, publishableKey } from "@/components/payments/stripeClient"

/* ──────────────────────────────────────────────────────────────────────────
   ProviderHandoff — the "Start / Resume verification" CTA.

   Flow:
     1. POST /api/identity/session → { clientSecret | url, status }.
     2. Prefer the in-browser Stripe Identity modal via Stripe.js
        `stripe.verifyIdentity(clientSecret)` (publishable key only).
     3. Fall back to redirecting to the provider-hosted `url` when Stripe.js
        isn't available or only a URL was returned.
     4. Refresh status so the stepper advances.

   Makes NO charge and no secret-key call — the session is minted server-side.
   503 from the API → a calm "not provisioned yet" message.
─────────────────────────────────────────────────────────────────────────── */

// Stripe Identity adds verifyIdentity to the instance; type it structurally so
// we don't depend on @stripe/stripe-js types.
interface StripeWithIdentity {
  verifyIdentity?: (
    clientSecret: string
  ) => Promise<{ error?: { message?: string } }>
}

export function ProviderHandoff({
  phase,
  onChanged,
  fullWidth,
}: {
  phase: "not_started" | "pending" | "processing" | "requires_input" | "verified" | "canceled"
  onChanged: () => void
  fullWidth?: boolean
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resume = phase === "pending" || phase === "requires_input"
  const ctaLabel = resume ? "Resume verification" : "Start verification"

  async function start() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/identity/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      })
      const json = (await res.json().catch(() => ({}))) as {
        clientSecret?: string | null
        url?: string | null
        error?: string
        notReady?: boolean
      }

      if (!res.ok) {
        setError(
          res.status === 503 || json.notReady
            ? "Identity verification isn't switched on for your workspace yet. Please check back shortly."
            : json.error || "Could not start verification. Please try again."
        )
        return
      }

      // 1. Preferred: in-browser modal via Stripe.js.
      if (json.clientSecret && publishableKey()) {
        const stripe = (await getStripe()) as unknown as StripeWithIdentity | null
        if (stripe?.verifyIdentity) {
          const result = await stripe.verifyIdentity(json.clientSecret)
          if (result?.error?.message) {
            setError(result.error.message)
          }
          // Whether completed or dismissed, re-poll the real status.
          onChanged()
          return
        }
      }

      // 2. Fallback: provider-hosted page.
      if (json.url) {
        window.location.href = json.url
        return
      }

      // 3. Session created but no client handoff available — advance via poll.
      onChanged()
    } catch {
      setError("Network error — please try again.")
    } finally {
      setBusy(false)
    }
  }

  if (phase === "verified") return null

  return (
    <div className={cn(fullWidth && "w-full")}>
      <button
        onClick={start}
        disabled={busy}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors min-h-[48px]",
          "bg-[var(--brand)] hover:bg-[var(--brand-strong)] disabled:opacity-60 disabled:cursor-wait",
          fullWidth && "w-full"
        )}
      >
        {busy ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" />
            Opening secure check…
          </>
        ) : (
          <>
            <ShieldCheck className="w-4 h-4" />
            {ctaLabel}
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {error && (
        <p className="mt-2.5 flex items-start gap-1.5 text-[12.5px] font-medium text-amber-700">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}
