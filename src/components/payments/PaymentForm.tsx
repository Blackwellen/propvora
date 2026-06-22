"use client"

import { useEffect, useRef, useState } from "react"
import { Lock, Loader2, AlertCircle, ShieldCheck } from "lucide-react"
import { getStripe, type StripeLike, type StripeElementsLike, type StripeElementLike } from "./stripeClient"
import { formatPence } from "./status"

/* ──────────────────────────────────────────────────────────────────────────
   Guest payment form (Stripe PAYMENT ELEMENT, PUBLISHABLE KEY ONLY).

   Flow:
     1. POST /api/payments/intent → { clientSecret, amountPence, currency }
     2. mount a Stripe PAYMENT Element (cards + Google Pay + Apple Pay + any
        saved cards on the intent's customer — Stripe is primary, Google Pay
        appears automatically when supported; no Google dev account needed).
     3. on submit, stripe.confirmPayment({ elements, redirect: "if_required" })
        — authorises + HOLDS funds (manual-capture escrow intent).
     4. report the resulting PaymentIntent status up via onResult — the parent
        polls /api/payments/status and shows HONEST copy (processing / held /
        confirmed). We NEVER assert the booking is confirmed here.

   Renders a premium "not ready" state when Stripe.js is unavailable or the
   intent endpoint returns 503 (payments not provisioned).
─────────────────────────────────────────────────────────────────────────── */

interface PaymentFormProps {
  bookingRef: string
  amountPence: number
  currency: string
  onResult: (result: { intentStatus: string | null; paymentId: string | null }) => void
}

type Phase = "loading" | "ready" | "not_ready" | "submitting" | "done"

export default function PaymentForm({
  bookingRef,
  amountPence,
  currency,
  onResult,
}: PaymentFormProps) {
  const [phase, setPhase] = useState<Phase>("loading")
  const [error, setError] = useState<string | null>(null)
  const [cardError, setCardError] = useState<string | null>(null)
  const [notReadyMsg, setNotReadyMsg] = useState<string>(
    "Online payment isn't available for this booking yet."
  )
  const [serverAmount, setServerAmount] = useState<number>(amountPence)
  const [serverCurrency, setServerCurrency] = useState<string>(currency)

  const stripeRef = useRef<StripeLike | null>(null)
  const elementsRef = useRef<StripeElementsLike | null>(null)
  const cardRef = useRef<StripeElementLike | null>(null)
  const clientSecretRef = useRef<string | null>(null)
  const paymentIdRef = useRef<string | null>(null)
  const cardMountRef = useRef<HTMLDivElement | null>(null)

  // ── Init: create the intent + mount the card element ──────────────────────
  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        const stripe = await getStripe()
        if (cancelled) return
        if (!stripe) {
          setNotReadyMsg(
            "Secure card payment isn't available right now. Please try again later or contact the property manager."
          )
          setPhase("not_ready")
          return
        }
        stripeRef.current = stripe

        const res = await fetch("/api/payments/intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingRef }),
        })
        const data = await res.json().catch(() => null)
        if (cancelled) return

        if (res.status === 503) {
          setNotReadyMsg(
            (data?.error as string) ?? "Online payment isn't available for this booking yet."
          )
          setPhase("not_ready")
          return
        }
        if (!res.ok || !data?.clientSecret) {
          setError(
            (data?.error as string) ?? "We couldn't start the payment. Please try again."
          )
          setPhase("not_ready")
          return
        }

        clientSecretRef.current = data.clientSecret as string
        paymentIdRef.current = (data.paymentId as string | null) ?? null
        if (typeof data.amountPence === "number") setServerAmount(data.amountPence)
        if (typeof data.currency === "string") setServerCurrency(data.currency)

        // Payment Element: created against the intent client_secret so it can
        // render cards + Google Pay/Apple Pay + saved cards in one widget. When
        // the buyer is logged in, the CustomerSession surfaces their saved cards.
        const elements = stripe.elements({
          clientSecret: data.clientSecret,
          ...(data.customerSessionSecret ? { customerSessionClientSecret: data.customerSessionSecret as string } : {}),
          appearance: {
            theme: "stripe",
            variables: {
              colorPrimary: "#2563EB",
              colorText: "#0B1B3F",
              fontFamily: "system-ui, -apple-system, sans-serif",
              borderRadius: "12px",
            },
          },
        })
        elementsRef.current = elements
        const card = elements.create("payment", {
          layout: { type: "tabs", defaultCollapsed: false },
          // Google Pay / Apple Pay surface automatically via the intent's
          // automatic_payment_methods; Stripe stays the primary method.
          wallets: { applePay: "auto", googlePay: "auto" },
        })
        cardRef.current = card
        // Defer mount until the node exists.
        requestAnimationFrame(() => {
          if (cancelled || !cardMountRef.current) return
          card.mount(cardMountRef.current)
          card.on("change", (e: unknown) => {
            const ev = e as { error?: { message?: string } }
            setCardError(ev?.error?.message ?? null)
          })
          setPhase("ready")
        })
      } catch {
        if (!cancelled) {
          setNotReadyMsg(
            "Secure card payment isn't available right now. Please try again later."
          )
          setPhase("not_ready")
        }
      }
    }
    void init()
    return () => {
      cancelled = true
      try {
        cardRef.current?.destroy()
      } catch {
        /* noop */
      }
    }
  }, [bookingRef])

  async function handleSubmit() {
    const stripe = stripeRef.current
    const elements = elementsRef.current
    const clientSecret = clientSecretRef.current
    if (!stripe || !elements || !clientSecret) return
    setPhase("submitting")
    setError(null)
    try {
      // Payment Element confirm — stays on-page unless a method needs a redirect
      // (e.g. 3DS / some wallets), in which case Stripe redirects to return_url.
      const result = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
        confirmParams: {
          return_url: typeof window !== "undefined" ? window.location.href : undefined,
        },
      })
      if (result.error) {
        setError(
          result.error.message ?? "Your payment couldn't be completed. Please try again."
        )
        setPhase("ready")
        return
      }
      // HONEST: report the REAL intent status — the parent polls the status API
      // and shows pending/escrow copy. We do NOT claim confirmation here.
      const intentStatus = result.paymentIntent?.status ?? null
      setPhase("done")
      onResult({ intentStatus, paymentId: paymentIdRef.current })
    } catch {
      setError("Your payment couldn't be completed. Please try again.")
      setPhase("ready")
    }
  }

  if (phase === "not_ready") {
    return (
      <div className="rounded-xl border border-[#EEF3FB] bg-[#F7F9FC] px-4 py-5 text-center">
        <ShieldCheck className="w-7 h-7 text-slate-300 mx-auto mb-2" />
        <p className="text-[13.5px] font-semibold text-[#0B1B3F]">Payment unavailable</p>
        <p className="text-[12.5px] text-slate-500 mt-1 leading-relaxed">{notReadyMsg}</p>
        {error && <p className="text-[12px] text-red-600 mt-2">{error}</p>}
      </div>
    )
  }

  const amt = formatPence(serverAmount, serverCurrency)

  return (
    <div className="space-y-4">
      {/* Card field */}
      <div>
        <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
          Card details
        </label>
        <div className="rounded-xl border border-[#D6E0F0] bg-white px-3.5 py-3.5 min-h-[48px] focus-within:border-[#1D4ED8] focus-within:ring-2 focus-within:ring-[#2563EB]/20 transition-colors">
          {phase === "loading" ? (
            <span className="flex items-center gap-2 text-[13px] text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading secure card field…
            </span>
          ) : (
            <div ref={cardMountRef} />
          )}
        </div>
        {cardError && (
          <p className="mt-1.5 text-[12px] text-red-600 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {cardError}
          </p>
        )}
      </div>

      {error && (
        <p className="text-[12.5px] text-red-600 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={phase !== "ready"}
        className="w-full h-12 rounded-xl bg-[#1D4ED8] text-white text-[14.5px] font-semibold hover:bg-[#1A45BE] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
      >
        {phase === "submitting" ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Authorising…
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" /> Pay {amt}
          </>
        )}
      </button>

      <p className="text-[11.5px] text-slate-400 text-center leading-relaxed flex items-center justify-center gap-1.5">
        <Lock className="w-3 h-3 shrink-0" />
        Secured by Stripe · Your card is authorised now and funds are held until your
        stay is confirmed.
      </p>
    </div>
  )
}
