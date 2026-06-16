"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import {
  ShieldCheck,
  Lock,
  Clock,
  CheckCircle2,
  Info,
  Loader2,
  ArrowLeft,
} from "lucide-react"
import PaymentForm from "@/components/payments/PaymentForm"
import {
  formatPence,
  guestPaymentCopy,
  normalisePaymentPhase,
} from "@/components/payments/status"
import { useIsMobile } from "@/components/mobile/useBreakpoint"

/* Public guest payment surface. Mobile-complete: sticky pay summary bar, ≥44px
   targets. Honest status-driven copy throughout. */

type Stage = "loading" | "not_ready" | "form" | "result"

interface StatusResponse {
  ready: boolean
  paymentStatus: string | null
  bookingStatus: string | null
  amountPence: number | null
  currency: string | null
}

export default function PayClient() {
  const params = useParams()
  const router = useRouter()
  const search = useSearchParams()
  const isMobile = useIsMobile()

  const slug = (Array.isArray(params?.slug) ? params.slug[0] : params?.slug) as
    | string
    | undefined
  const bookingRef = search.get("ref")

  const [stage, setStage] = useState<Stage>("loading")
  const [amountPence, setAmountPence] = useState<number | null>(null)
  const [currency, setCurrency] = useState<string>("GBP")
  const [bookingStatus, setBookingStatus] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)
  const [notReadyMsg, setNotReadyMsg] = useState<string>(
    "We couldn't find this reservation to take payment."
  )
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchStatus = useCallback(async (): Promise<StatusResponse | null> => {
    if (!bookingRef) return null
    try {
      const res = await fetch(
        `/api/payments/status?bookingRef=${encodeURIComponent(bookingRef)}`,
        { cache: "no-store" }
      )
      const data = (await res.json().catch(() => null)) as StatusResponse | null
      if (res.status === 503 || !data?.ready) {
        return data ? { ...data, ready: false } : null
      }
      return data
    } catch {
      return null
    }
  }, [bookingRef])

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    async function init() {
      if (!bookingRef) {
        setNotReadyMsg("This payment link is missing its booking reference.")
        setStage("not_ready")
        return
      }
      const data = await fetchStatus()
      if (cancelled) return
      if (!data || !data.ready) {
        setNotReadyMsg(
          "Online payment isn't available for this booking yet. The property manager will be in touch."
        )
        setStage("not_ready")
        return
      }
      setAmountPence(data.amountPence)
      setCurrency(data.currency ?? "GBP")
      setBookingStatus(data.bookingStatus)
      setPaymentStatus(data.paymentStatus)

      // Already paid / held → jump straight to the honest result view.
      const phase = normalisePaymentPhase(data.paymentStatus)
      if (["held", "succeeded", "processing"].includes(phase)) {
        setStage("result")
      } else {
        setStage("form")
      }
    }
    void init()
    return () => {
      cancelled = true
    }
  }, [bookingRef, fetchStatus])

  // ── Poll once we're showing a result (status drives the copy honestly) ─────
  useEffect(() => {
    if (stage !== "result") return
    pollRef.current = setInterval(async () => {
      const data = await fetchStatus()
      if (!data) return
      setBookingStatus(data.bookingStatus)
      setPaymentStatus(data.paymentStatus)
      const phase = normalisePaymentPhase(data.paymentStatus)
      const confirmed = (data.bookingStatus ?? "").toLowerCase() === "confirmed"
      // Stop polling once terminal-ish.
      if (confirmed || phase === "failed" || phase === "refunded") {
        if (pollRef.current) clearInterval(pollRef.current)
      }
    }, 4000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [stage, fetchStatus])

  function handleResult(r: { intentStatus: string | null }) {
    // Reflect the REAL intent status immediately; polling refines it.
    setPaymentStatus(r.intentStatus)
    setStage("result")
  }

  // ── Not-ready premium state ────────────────────────────────────────────────
  if (stage === "not_ready") {
    return (
      <div className="mx-auto max-w-xl px-4 sm:px-6 py-12 sm:py-16">
        <div className="rounded-2xl border border-[#E2EAF6] bg-white shadow-[0_4px_24px_rgba(15,23,42,0.06)] p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Info className="w-7 h-7 text-slate-400" />
          </div>
          <h1 className="text-[19px] font-bold text-[#0B1B3F]">Payment unavailable</h1>
          <p className="mt-2 text-[13.5px] text-slate-500 leading-relaxed">{notReadyMsg}</p>
          {slug && (
            <Link
              href={`/stay/${encodeURIComponent(slug)}`}
              className="mt-5 inline-flex items-center gap-1.5 h-11 px-5 rounded-xl border border-[#D6E0F0] text-[#1D4ED8] text-[14px] font-semibold hover:bg-blue-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to the listing
            </Link>
          )}
        </div>
      </div>
    )
  }

  if (stage === "loading") {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-[#1D4ED8]" />
        Loading secure payment…
      </div>
    )
  }

  const amt = formatPence(amountPence, currency)

  // ── Result view (honest, status-driven) ────────────────────────────────────
  if (stage === "result") {
    const copy = guestPaymentCopy(normalisePaymentPhase(paymentStatus), bookingStatus)
    const Icon =
      copy.tone === "confirmed"
        ? CheckCircle2
        : copy.tone === "failed"
        ? Info
        : copy.tone === "held"
        ? ShieldCheck
        : Clock
    const tint =
      copy.tone === "confirmed"
        ? "bg-emerald-100 text-emerald-600"
        : copy.tone === "failed"
        ? "bg-red-100 text-red-600"
        : copy.tone === "held"
        ? "bg-indigo-100 text-indigo-600"
        : "bg-blue-100 text-[#1D4ED8]"

    return (
      <div className="mx-auto max-w-xl px-4 sm:px-6 py-10 sm:py-14">
        <div className="rounded-2xl border border-[#E2EAF6] bg-white shadow-[0_4px_24px_rgba(15,23,42,0.06)] overflow-hidden">
          <div className="px-6 sm:px-8 pt-8 pb-6 text-center border-b border-[#EEF3FB]">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${tint}`}>
              <Icon className="w-8 h-8" />
            </div>
            <h1 className="text-[20px] sm:text-[22px] font-bold text-[#0B1B3F]">
              {copy.heading}
            </h1>
            <p className="mt-2 text-[13.5px] leading-relaxed text-slate-500">{copy.body}</p>
          </div>

          {bookingRef && (
            <div className="px-6 sm:px-8 py-4 border-b border-[#EEF3FB] flex items-center justify-between">
              <span className="text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">
                Booking reference
              </span>
              <span className="text-[13.5px] font-bold text-[#0B1B3F] tabular-nums break-all">
                {bookingRef}
              </span>
            </div>
          )}

          {amountPence != null && (
            <div className="px-6 sm:px-8 py-4 border-b border-[#EEF3FB] flex items-center justify-between">
              <span className="text-[13px] text-slate-500">Amount authorised</span>
              <span className="text-[15px] font-bold text-[#0B1B3F]">{amt}</span>
            </div>
          )}

          {copy.tone !== "failed" && (
            <div className="px-6 sm:px-8 py-5 flex items-start gap-2.5 bg-[#F7F9FC]">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-[12px] leading-relaxed text-slate-500">
                Your funds are held securely in escrow and are only released to the
                property manager after your stay is confirmed and completed.
              </p>
            </div>
          )}

          <div className="px-6 sm:px-8 py-6 flex flex-col sm:flex-row gap-3">
            {copy.tone === "failed" ? (
              <button
                type="button"
                onClick={() => setStage("form")}
                className="flex-1 h-11 rounded-xl bg-[#1D4ED8] text-white text-[14px] font-semibold flex items-center justify-center hover:bg-[#1A45BE] transition-colors"
              >
                Try again
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const p = new URLSearchParams()
                  if (bookingRef) p.set("ref", bookingRef)
                  const hrid = search.get("hrid")
                  const token = search.get("token")
                  if (hrid) p.set("hrid", hrid)
                  if (token) p.set("token", token)
                  p.set("status", bookingStatus ?? "pending_payment")
                  router.push(
                    `/stay/${encodeURIComponent(slug ?? "")}/confirmation?${p.toString()}`
                  )
                }}
                className="flex-1 h-11 rounded-xl bg-[#1D4ED8] text-white text-[14px] font-semibold flex items-center justify-center hover:bg-[#1A45BE] transition-colors"
              >
                View booking details
              </button>
            )}
          </div>
        </div>
        <p className="text-center text-[11.5px] text-slate-400 mt-5">
          Powered by <span className="font-semibold text-slate-500">Propvora</span> ·
          Secure direct booking
        </p>
      </div>
    )
  }

  // ── Payment form view ──────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 py-8 sm:py-12 pb-28 lg:pb-12">
      {slug && (
        <Link
          href={`/stay/${encodeURIComponent(slug)}/confirmation?ref=${encodeURIComponent(
            bookingRef ?? ""
          )}`}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-[#1D4ED8] mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      )}

      <div className="rounded-2xl border border-[#E2EAF6] bg-white shadow-[0_4px_24px_rgba(15,23,42,0.06)] overflow-hidden">
        {/* Header / amount */}
        <div className="px-6 sm:px-8 pt-7 pb-5 border-b border-[#EEF3FB]">
          <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wide">
            Secure payment
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[28px] font-bold text-[#0B1B3F]">{amt}</span>
            <span className="text-[13px] text-slate-500">total</span>
          </div>
          {bookingRef && (
            <p className="text-[12px] text-slate-400 mt-1">
              Booking reference{" "}
              <span className="font-semibold text-slate-500 tabular-nums">{bookingRef}</span>
            </p>
          )}
        </div>

        {/* Escrow explanation */}
        <div className="px-6 sm:px-8 py-4 flex items-start gap-2.5 bg-[#F7F9FC] border-b border-[#EEF3FB]">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-[12px] leading-relaxed text-slate-500">
            We&apos;ll authorise your card now, but the funds are{" "}
            <span className="font-semibold text-slate-600">held securely in escrow</span> —
            they&apos;re only released to the property manager once your stay is confirmed and
            completed.
          </p>
        </div>

        {/* Card form */}
        <div className="px-6 sm:px-8 py-6">
          {bookingRef && amountPence != null && (
            <PaymentForm
              bookingRef={bookingRef}
              amountPence={amountPence}
              currency={currency}
              onResult={handleResult}
            />
          )}
        </div>
      </div>

      {/* Trust strip */}
      <div className="mt-3 flex items-center justify-center gap-2 text-[12px] text-slate-500">
        <Lock className="w-4 h-4 text-emerald-500" />
        256-bit encrypted · Processed by Stripe
      </div>

      {/* Mobile sticky amount bar */}
      {isMobile && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 bg-white border-t border-[#E2EAF6] shadow-[0_-8px_28px_rgba(15,23,42,0.10)] px-4 pt-3"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
        >
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold text-[#0B1B3F]">{amt}</span>
              <span className="block text-[12px] text-slate-400">
                Held in escrow until your stay
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-emerald-600">
              <ShieldCheck className="w-4 h-4" /> Secure
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
