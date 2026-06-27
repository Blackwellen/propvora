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
          <div className="w-14 h-14 rounded-full bg-[var(--brand-soft)] flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-7 h-7 text-[var(--brand)]" />
          </div>
          <h1 className="text-[19px] font-bold text-[#0B1B3F]">Sign in to complete your booking</h1>
          <p className="mt-2 text-[13.5px] text-slate-500 leading-relaxed">
            Booking <span className="font-semibold text-slate-700">{listingTitle}</span> for {amt}. Sign in to your
            Propvora workspace to pay securely with escrow protection.
          </p>
          <Link
            href={`/login?redirectTo=${encodeURIComponent(returnTo)}`}
            className="mt-5 inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-[var(--brand)] text-white text-[14px] font-semibold hover:bg-[var(--brand-strong)] transition-colors"
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
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-[var(--brand)]" />
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
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${held ? "bg-emerald-100 text-emerald-600" : "bg-[var(--color-brand-100)] text-[var(--brand)]"}`}>
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
          <Link href="/property-manager/marketplace/orders" className="mt-5 inline-flex items-center gap-1.5 h-11 px-5 rounded-xl bg-[var(--brand)] text-white text-[14px] font-semibold hover:bg-[var(--brand-strong)] transition-colors">
            View my orders
          </Link>
        </div>
      </Wrap>
    )
  }

  // ── Payment form (premium two-column + sticky summary + mobile pay bar) ──
  const summary = (
    <div className="rounded-2xl border border-[#E2EAF6] bg-white p-5 shadow-[0_4px_24px_rgba(15,23,42,0.06)]">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">Order summary</p>
      <h2 className="mt-1 text-[15px] font-bold leading-snug text-[#0B1B3F]">{listingTitle}</h2>
      <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-[13px]">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Subtotal</span>
          <span className="font-semibold tabular-nums text-slate-800">{amt}</span>
        </div>
        {feePence != null && (
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Includes platform fee</span>
            <span className="tabular-nums text-slate-500">{formatPence(feePence, cur)}</span>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
          <span className="text-[14px] font-bold text-[#0B1B3F]">Total due now</span>
          <span className="text-[16px] font-bold tabular-nums text-[#0B1B3F]">{amt}</span>
        </div>
      </div>
      <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-[12px] text-slate-500">
        <li className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" /> Funds held in escrow until the work is completed</li>
        <li className="flex items-start gap-2"><Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" /> Card secured by Stripe — Propvora never stores your card</li>
        <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--brand)]" /> Authorised now, captured only on completion</li>
      </ul>
    </div>
  )

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-10 pb-24 lg:pb-10">
      <button onClick={() => router.back()} className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:text-slate-700">
        <ChevronLeft className="h-4 w-4" /> Back
      </button>

      {/* Stepper */}
      <div className="mb-5 flex items-center gap-2 text-[12px] font-semibold">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-soft)] px-3 py-1 text-[var(--brand)]">1 · Review</span>
        <span className="h-px w-5 bg-slate-200" />
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0B1B3F] px-3 py-1 text-white">2 · Pay</span>
        <span className="h-px w-5 bg-slate-200" />
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-slate-400">3 · Confirmed</span>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
        {/* Payment card */}
        <div className="rounded-2xl border border-[#E2EAF6] bg-white p-6 shadow-[0_4px_24px_rgba(15,23,42,0.06)] sm:p-7">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">Secure escrow payment</p>
          <h1 className="mt-0.5 text-[18px] font-bold text-[#0B1B3F]">Payment details</h1>

          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-[#EEF3FB] bg-[#F7F9FC] p-3.5">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            <p className="text-[12px] leading-relaxed text-slate-500">
              We&apos;ll authorise your card now, but the funds are <span className="font-semibold text-slate-600">held in escrow</span> and only released once the booking is completed.
            </p>
          </div>

          <div className="mt-5">
            <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-slate-500">Card details</label>
            <div className="min-h-[48px] rounded-xl border border-[#D6E0F0] bg-white px-3.5 py-3.5 transition-colors focus-within:border-[var(--brand)] focus-within:ring-2 focus-within:ring-[var(--brand)]/20">
              <div ref={cardMount} />
            </div>
            {cardError && <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-red-600"><AlertCircle className="h-3.5 w-3.5 shrink-0" /> {cardError}</p>}
          </div>

          {error && <p className="mt-3 flex items-center gap-1.5 text-[12.5px] text-red-600"><AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}</p>}

          <button
            onClick={pay}
            disabled={submitting}
            className="mt-5 hidden h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] text-[14.5px] font-semibold text-white transition-colors hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-60 lg:flex"
          >
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Authorising…</> : <><Lock className="h-4 w-4" /> Pay {amt}</>}
          </button>
          <p className="mt-3 hidden items-center justify-center gap-1.5 text-center text-[11.5px] text-slate-400 lg:flex">
            <Lock className="h-3 w-3 shrink-0" /> Secured by Stripe · Funds held in escrow until completion
          </p>
        </div>

        {/* Summary (sticky on desktop) */}
        <aside className="lg:sticky lg:top-[72px] lg:self-start">{summary}</aside>
      </div>

      {/* Mobile sticky pay bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E2EAF6] bg-white/95 p-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-1">
          <div className="min-w-0">
            <p className="text-[11px] text-slate-400">Total due now</p>
            <p className="text-[16px] font-bold tabular-nums text-[#0B1B3F]">{amt}</p>
          </div>
          <button
            onClick={pay}
            disabled={submitting}
            className="ml-auto inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--brand)] text-[14.5px] font-semibold text-white transition-colors hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Authorising…</> : <><Lock className="h-4 w-4" /> Pay securely</>}
          </button>
        </div>
      </div>
    </div>
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
