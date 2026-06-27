"use client"

import { useEffect, useRef, useState } from "react"
import { X, CreditCard, Loader2 } from "lucide-react"
import { loadStripe, type Stripe, type StripeElements } from "@stripe/stripe-js"

/**
 * Add a card via a Stripe SetupIntent + the Payment Element. Card data is entered
 * directly into Stripe's iframe and confirmed client-side — it never touches our
 * server. On success the card is attached to the customer's Stripe Customer.
 */
export function AddCardModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const stripeRef = useRef<Stripe | null>(null)
  const elementsRef = useRef<StripeElements | null>(null)
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const res = await fetch("/api/customer/payment-methods/setup-intent", { method: "POST" })
        if (!res.ok) { if (active) { setError("Card setup isn't available right now."); setPhase("error") } return }
        const { clientSecret, publishableKey } = (await res.json()) as { clientSecret: string; publishableKey: string }
        const stripe = await loadStripe(publishableKey)
        if (!stripe || !active) return
        stripeRef.current = stripe
        const elements = stripe.elements({ clientSecret, appearance: { theme: "stripe", variables: { colorPrimary: "#2563EB" } } })
        elementsRef.current = elements
        const paymentEl = elements.create("payment")
        // Mount after the container is in the DOM.
        requestAnimationFrame(() => { if (active && mountRef.current) { paymentEl.mount(mountRef.current); setPhase("ready") } })
      } catch {
        if (active) { setError("Could not start card setup."); setPhase("error") }
      }
    })()
    return () => { active = false }
  }, [])

  async function submit() {
    const stripe = stripeRef.current
    const elements = elementsRef.current
    if (!stripe || !elements) return
    setSubmitting(true); setError(null)
    const { error: err } = await stripe.confirmSetup({ elements, redirect: "if_required" })
    if (err) {
      setError(err.message ?? "Could not save the card.")
      setSubmitting(false)
      return
    }
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/50" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2"><span className="w-8 h-8 rounded-lg bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center"><CreditCard className="w-4 h-4" /></span><h2 className="text-[15px] font-semibold text-slate-900">Add a card</h2></div>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5">
          {phase === "loading" && <div className="py-8 flex items-center justify-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>}
          {phase === "error" && <p className="py-6 text-center text-[13px] text-rose-600">{error}</p>}
          <div ref={mountRef} className={phase === "ready" ? "" : "hidden"} />
          {phase === "ready" && (
            <>
              {error && <p className="mt-3 text-[12.5px] text-rose-600">{error}</p>}
              <p className="mt-3 text-[11px] text-slate-400">Your card is stored securely by Stripe and can be used for future bookings. It is never stored by Propvora.</p>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={onClose} className="border border-slate-200 rounded-xl px-4 py-2 text-[12.5px] font-semibold text-slate-700">Cancel</button>
                <button onClick={submit} disabled={submitting} className="bg-[var(--brand)] text-white rounded-xl px-4 py-2 text-[12.5px] font-semibold inline-flex items-center gap-1.5 disabled:opacity-60">{submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save card</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
