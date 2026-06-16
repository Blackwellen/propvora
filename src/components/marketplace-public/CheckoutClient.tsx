"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ShieldCheck, Lock, Loader2, AlertCircle, CheckCircle2, ChevronLeft, LogIn,
} from "lucide-react"
import { getStripe, type StripeLike, type StripeElementsLike, type StripeElementLike } from "@/components/payments/stripeClient"
import { formatPence } from "@/components/marketplace/PriceTag"

/* ──────────────────────────────────────────────────────────────────────────
   CheckoutClient — the REAL marketplace escrow checkout (Stripe Elements).

   Flow (no stubs):
     1. POST /api/marketplace/checkout { listingId, buyerWorkspaceId } → the
        kernel mints a transaction + order + escrow PaymentIntent and returns
        { orderId, transactionId, clientSecret, amountPence, currency, fee }.
     2. Mount a Stripe Card Element (publishable key only).
     3. stripe.confirmCardPayment(clientSecret, { card }) — authorises + HOLDS
        funds (manual capture). We report the REAL intent status, never assert
        a completed charge.

   Gating: checkout requires a signed-in operator with a buyer workspace. When
   anon, we render a sign-in prompt that returns here after auth. When payments
   aren't provisioned (503 / no clientSecret) we show an honest "order created,
   payment pending" state — the order/transaction still exist.
─────────────────────────────────────────────────────────────────────────── */

interface Props {
  listingId: string
  listingTitle: string
  pricePence: number | null
  currency: string
  /** Resolved server-side. */
  signedIn: boolean
  buyerWorkspaceId: string | null
  /** Path to come back to after sign-in. */
  returnTo: string
}

type Stage = "need_auth" | "starting" | "form" | "result" | "error"

export default function CheckoutClient({
  listingId, listingTitle, pricePence, currency, signedIn, buyerWorkspaceId, returnTo,
}: Props) {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>(signedIn && buyerWorkspaceId ? "starting" : "need_auth")
  const [amountPence, setAmountPence] = useState<number | null>(pricePence)
  const [cur, setCur] = useState(currency)
  const [feePence, setFeePence] = useState<number | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [intentStatus, setIntentStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cardError, setCardError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [notReadyMsg, setNotReadyMsg] = useState<string | null>(null)

  const stripeRef = useRef<StripeLike | null>(null)
  const elementsRef = useRef<StripeElementsLike | null>(null)
  const cardRef = useRef<StripeElementLike | null>(null)
  const secretRef = useRef<string | null>(null)
  const cardMount = useRef<HTMLDivElement | null>(null)

  // ── Start checkout: create the escrow intent + mount the card field ──
  useEffect(() => {
    if (stage !== "starting") return
    let cancelled = false
    async function start() {
      try {
        const res = await fetch("/api/marketplace/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId, buyerWorkspaceId, quantity: 1 }),
        })
        const data = (await res.json().catch(() => null)) as Record<string, unknown> | null
        if (cancelled) return
        if (res.status === 401) {
          setStage("need_auth")
          return
        }
        if (!res.ok) {
          setError((data?.error as string) ?? "We couldn't start checkout. Please try again.")
          setStage("error")
          return
        }
        setOrderId((data?.orderId as string) ?? null)
        if (typeof data?.amountPence === "number") setAmountPence(data.amountPence)
        if (typeof data?.currency === "string") setCur(data.currency)
        const fee = data?.fee as { platformFeePence?: number } | undefined
        if (fee && typeof fee.platformFeePence === "number") setFeePence(fee.platformFeePence)

        const clientSecret = data?.clientSecret as string | null
        if (!clientSecret) {
          // Order/transaction exist but payment isn't provisioned — honest state.
          setNotReadyMsg(
            (data?.message as string) ??
              "Your order has been created. Online payment isn't configured yet — the seller will be in touch to arrange payment."
          )
          setStage("result")
          setIntentStatus("requires_payment")
          return
        }
        secretRef.current = clientSecret

        const stripe = await getStripe()
        if (cancelled) return
        if (!stripe) {
          setNotReadyMsg("Secure card payment isn't available right now. Your order is saved; please try again shortly.")
          setStage("result")
          return
        }
        stripeRef.current = stripe
        const elements = stripe.elements()
        elementsRef.current = elements
        const card = elements.create("card", {
          style: {
            base: { fontSize: "16px", color: "#0B1B3F", fontFamily: "system-ui, -apple-system, sans-serif", "::placeholder": { color: "#94A3B8" } },
            invalid: { color: "#DC2626" },
          },
        })
        cardRef.current = card
        setStage("form")
        requestAnimationFrame(() => {
          if (cancelled || !cardMount.current) return
          card.mount(cardMount.current)
          card.on("change", (e: unknown) => {
            const ev = e as { error?: { message?: string } }
            setCardError(ev?.error?.message ?? null)
          })
        })
      } catch {
        if (!cancelled) {
          setError("We couldn't start checkout. Please try again.")
          setStage("error")
        }
      }
    }
    void start()
    return () => {
      cancelled = true
      try { cardRef.current?.destroy() } catch { /* noop */ }
    }
  }, [stage, listingId, buyerWorkspaceId])

  async function pay() {
    const stripe = stripeRef.current
    const card = cardRef.current
    const secret = secretRef.current
    if (!stripe || !card || !secret) return
    setSubmitting(true)
    setError(null)
    try {
      const result = await stripe.confirmCardPayment(secret, { payment_method: { card } })
      if (result.error) {
        setError(result.error.message ?? "Your payment couldn't be completed. Please try again.")
        setSubmitting(false)
        return
      }
      setIntentStatus(result.paymentIntent?.status ?? null)
      setStage("result")
    } catch {
      setError("Your payment couldn't be completed. Please try again.")
      setSubmitting(false)
    }
  }

  const amt = formatPence(amountPence, cur)

  // ── Auth gate ──
  if (stage === "need_auth") {
    return (
      <Wrap>
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-[#EFF6FF] flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-7 h-7 text-[#2563EB]" />
          </div>
          <h1 className="text-[19px] font-bold text-[#0B1B3F]">Sign in to complete your booking</h1>
          <p className="mt-2 text-[13.5px] text-slate-500 leading-relaxed">
            Booking <span className="font-semibold text-slate-700">{listingTitle}</span> for {amt}. Sign in to your
            Propvora workspace to pay securely with escrow protection.
          </p>
          <Link
            href={`/login?redirectTo=${encodeURIComponent(returnTo)}`}
            className="mt-5 inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-[#2563EB] text-white text-[14px] font-semibold hover:bg-[#1d4ed8] transition-colors"
          >
            <LogIn className="w-4 h-4" /> Sign in to continue
          </Link>
        </div>
      </Wrap>
    )
  }

  if (stage === "starting") {
    return (
      <Wrap>
        <div className="text-center py-6 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-[#2563EB]" />
          Setting up secure checkout…
        </div>
      </Wrap>
    )
  }

  if (stage === "error") {
    return (
      <Wrap>
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h1 className="text-[18px] font-bold text-[#0B1B3F]">We couldn&apos;t start checkout</h1>
          <p className="mt-2 text-[13.5px] text-slate-500">{error}</p>
          <Link href={`/marketplace`} className="mt-5 inline-flex items-center gap-1.5 h-11 px-5 rounded-xl border border-slate-200 text-slate-700 text-[14px] font-semibold hover:bg-slate-50 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to marketplace
          </Link>
        </div>
      </Wrap>
    )
  }

  if (stage === "result") {
    const held = intentStatus === "requires_capture" || intentStatus === "succeeded" || intentStatus === "processing"
    return (
      <Wrap>
        <div className="text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${held ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-[#2563EB]"}`}>
            {held ? <CheckCircle2 className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
          </div>
          <h1 className="text-[20px] font-bold text-[#0B1B3F]">{held ? "Payment authorised" : "Order created"}</h1>
          <p className="mt-2 text-[13.5px] text-slate-500 leading-relaxed">
            {held
              ? "Your funds are held securely in escrow and are only released to the seller once your booking is completed."
              : notReadyMsg ?? "Your order has been created."}
          </p>
          {orderId && (
            <p className="mt-3 text-[12px] text-slate-400">Order reference <span className="font-semibold text-slate-600 tabular-nums break-all">{orderId}</span></p>
          )}
          <Link href="/app/marketplace/orders" className="mt-5 inline-flex items-center gap-1.5 h-11 px-5 rounded-xl bg-[#2563EB] text-white text-[14px] font-semibold hover:bg-[#1d4ed8] transition-colors">
            View my orders
          </Link>
        </div>
      </Wrap>
    )
  }

  // ── Payment form ──
  return (
    <Wrap>
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-700 mb-4 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wide">Secure escrow payment</p>
      <h1 className="text-[17px] font-bold text-[#0B1B3F] mt-0.5">{listingTitle}</h1>

      {/* Amount summary */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-1.5 text-[12.5px]">
        <div className="flex items-center justify-between"><span className="text-slate-500">Amount</span><span className="font-semibold text-slate-800 tabular-nums">{amt}</span></div>
        {feePence != null && (
          <div className="flex items-center justify-between"><span className="text-slate-400">Includes platform fee</span><span className="text-slate-500 tabular-nums">{formatPence(feePence, cur)}</span></div>
        )}
      </div>

      <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-[#F7F9FC] border border-[#EEF3FB] p-3.5">
        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
        <p className="text-[12px] leading-relaxed text-slate-500">
          We&apos;ll authorise your card now, but the funds are <span className="font-semibold text-slate-600">held in escrow</span> and only released once the booking is completed.
        </p>
      </div>

      <div className="mt-4">
        <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Card details</label>
        <div className="rounded-xl border border-[#D6E0F0] bg-white px-3.5 py-3.5 min-h-[48px] focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/20 transition-colors">
          <div ref={cardMount} />
        </div>
        {cardError && <p className="mt-1.5 text-[12px] text-red-600 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> {cardError}</p>}
      </div>

      {error && <p className="mt-3 text-[12.5px] text-red-600 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}</p>}

      <button
        onClick={pay}
        disabled={submitting}
        className="mt-4 w-full h-12 rounded-xl bg-[#2563EB] text-white text-[14.5px] font-semibold hover:bg-[#1d4ed8] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Authorising…</> : <><Lock className="w-4 h-4" /> Pay {amt}</>}
      </button>
      <p className="mt-3 text-[11.5px] text-slate-400 text-center flex items-center justify-center gap-1.5">
        <Lock className="w-3 h-3 shrink-0" /> Secured by Stripe · Funds held in escrow until completion
      </p>
    </Wrap>
  )
}

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 py-8 sm:py-12">
      <div className="rounded-2xl border border-[#E2EAF6] bg-white shadow-[0_4px_24px_rgba(15,23,42,0.06)] p-6 sm:p-8">
        {children}
      </div>
    </div>
  )
}
