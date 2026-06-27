"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CalendarDays,
  Loader2,
  ShieldCheck,
  Lock,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Check,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import MobileSheet from "@/components/mobile/MobileSheet"
import { useIsMobile } from "@/components/mobile/useBreakpoint"
import DateRangeCalendar from "./DateRangeCalendar"
import GuestStepper from "./GuestStepper"
import { formatMoney, formatDateLabel, nightsBetween, addDaysIso, todayIso } from "./format"
import { BOOKING_POLICIES, type BookingPolicyMeta, type LegalBlock } from "@/lib/legal/booking-policies"

/** The deep StayQuote shape returned by /api/booking/listing/quote. */
interface StayQuote {
  ready: boolean
  currency: string
  nights: number
  guests: number
  nightsSubtotalPence: number
  lengthDiscountPence: number
  leadAdjustmentPence: number
  cleaningFeePence: number
  extraGuestFeePence: number
  subtotalPence: number
  securityDepositPence: number
  lines: { label: string; kind: string; pence: number }[]
  notes: string[]
}

const POLICY_TEXT: Record<string, string> = {
  flexible: "Free cancellation up to 24 hours before check-in, then the first night is charged.",
  moderate: "Free cancellation up to 5 days before check-in; 50% refund thereafter.",
  strict: "50% refund up to 7 days before check-in; non-refundable thereafter.",
  non_refundable: "This booking is non-refundable once confirmed.",
  custom: "The host applies a custom cancellation policy — see the listing details.",
}

interface GuestForm {
  fullName: string
  email: string
  phone: string
  arrivalTime: string
  message: string
}

const STEPS = ["dates", "details", "review"] as const
type Step = (typeof STEPS)[number]

/**
 * The deep public booking card + stepper over a published booking_listing. Real
 * server round-trips throughout:
 *   • availability  → /api/booking/listing/availability (deep grid → disabled days)
 *   • live quote    → /api/booking/listing/quote (deep pricing-engine recompute)
 *   • reservation   → /api/booking/listing/reserve (SECURITY DEFINER RPC hold)
 * The displayed total is ALWAYS the server's recomputed value. Legal acceptance
 * (house rules / cancellation / deposit / terms) is collected and re-enforced
 * server-side. On success the guest is sent to /pay to authorise the escrow
 * PaymentIntent. Mobile: sticky price/CTA + date sheet.
 */
export default function StayBookingCard({
  listingId,
  slug,
  title,
  currency,
  maxGuests,
  fromNightlyPence,
  cancellationPolicy,
  securityDepositPence,
  minNights,
}: {
  listingId: string
  slug: string
  title: string
  currency: string
  maxGuests: number
  fromNightlyPence: number | null
  cancellationPolicy: string
  securityDepositPence: number | null
  minNights: number
}) {
  const router = useRouter()
  const isMobile = useIsMobile()

  const [checkIn, setCheckIn] = useState<string | null>(null)
  const [checkOut, setCheckOut] = useState<string | null>(null)
  const [guests, setGuests] = useState(1)
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set())

  const [quote, setQuote] = useState<StayQuote | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteError, setQuoteError] = useState<string | null>(null)

  const [dateSheetOpen, setDateSheetOpen] = useState(false)
  const [step, setStep] = useState<Step>("dates")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [form, setForm] = useState<GuestForm>({ fullName: "", email: "", phone: "", arrivalTime: "", message: "" })
  const [acceptRules, setAcceptRules] = useState(false)
  const [acceptCancel, setAcceptCancel] = useState(false)
  const [acceptDeposit, setAcceptDeposit] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)

  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0
  const hasDeposit = (securityDepositPence ?? 0) > 0

  // ── availability ───────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    const from = todayIso()
    const to = addDaysIso(from, 365)
    fetch(`/api/booking/listing/availability?listingId=${encodeURIComponent(listingId)}&from=${from}&to=${to}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.unavailableDates) return
        setBlockedDates(new Set<string>(data.unavailableDates))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [listingId])

  // ── live quote ──────────────────────────────────────────────────────────────
  const seq = useRef(0)
  const fetchQuote = useCallback(async () => {
    if (!checkIn || !checkOut || nights < 1) {
      setQuote(null)
      setQuoteError(null)
      return
    }
    const s = ++seq.current
    setQuoteLoading(true)
    setQuoteError(null)
    try {
      const res = await fetch("/api/booking/listing/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, checkIn, checkOut, guests }),
      })
      const data = await res.json().catch(() => null)
      if (s !== seq.current) return
      if (!res.ok) {
        setQuote(null)
        setQuoteError((data?.error as string) ?? "We couldn't price these dates.")
        return
      }
      setQuote(data.quote as StayQuote)
    } catch {
      if (s === seq.current) setQuoteError("We couldn't price these dates.")
    } finally {
      if (s === seq.current) setQuoteLoading(false)
    }
  }, [checkIn, checkOut, guests, nights, listingId])

  useEffect(() => {
    void fetchQuote()
  }, [fetchQuote])

  function handleRange(range: { checkIn: string | null; checkOut: string | null }) {
    setCheckIn(range.checkIn)
    setCheckOut(range.checkOut)
    setSubmitError(null)
  }

  const datesChosen = Boolean(checkIn && checkOut && nights >= 1)
  const quoteReady = Boolean(quote?.ready && quote.subtotalPence >= 0 && datesChosen)
  const detailsValid =
    form.fullName.trim().length >= 2 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())
  const allAccepted = acceptRules && acceptCancel && acceptTerms && (!hasDeposit || acceptDeposit)

  async function handleReserve() {
    if (!checkIn || !checkOut || !detailsValid || !allAccepted) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch("/api/booking/listing/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          checkIn,
          checkOut,
          guests,
          guest: {
            fullName: form.fullName.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            arrivalTime: form.arrivalTime.trim(),
            message: form.message.trim(),
            acceptHouseRules: acceptRules,
            acceptCancellation: acceptCancel,
            acceptDeposit: hasDeposit ? acceptDeposit : true,
            acceptTerms,
          },
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        setSubmitError((data?.error as string) ?? "We couldn't complete your booking.")
        return
      }
      // The pay/status/intent routes key on bookings.id, so `ref` MUST be the
      // booking id. The human reference + portal token ride along for the
      // confirmation handoff and the guest's records.
      const params = new URLSearchParams({
        ref: data.bookingId,
        hrid: data.reference,
        token: data.token,
      })
      router.push(`/stay/${encodeURIComponent(slug)}/pay?${params.toString()}`)
    } catch {
      setSubmitError("We couldn't complete your booking. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const perNight = quoteReady ? quote!.nightsSubtotalPence / Math.max(1, nights) : fromNightlyPence

  const breakdown = quote && quoteReady && (
    <div>
      <ul className="space-y-2.5">
        {quote.lines.map((li, i) => (
          <li key={i} className="flex items-center justify-between gap-4 text-[13.5px]">
            <span className={cn("text-slate-600", li.kind === "deposit" && "text-slate-400")}>{li.label}</span>
            <span
              className={cn(
                "font-medium tabular-nums whitespace-nowrap",
                li.pence < 0 ? "text-emerald-600" : "text-[#0B1B3F]",
                li.kind === "deposit" && "text-slate-400"
              )}
            >
              {li.pence < 0 ? "−" : ""}
              {formatMoney(Math.abs(li.pence), quote.currency)}
            </span>
          </li>
        ))}
      </ul>
      <div className="border-t border-[#E2EAF6] mt-3 pt-3 flex items-center justify-between">
        <span className="text-[14px] font-bold text-[#0B1B3F]">Total due now</span>
        <span className="text-[16px] font-bold text-[#0B1B3F] tabular-nums">
          {formatMoney(quote.subtotalPence, quote.currency)}
        </span>
      </div>
      {hasDeposit && (
        <p className="text-[11.5px] text-slate-400 mt-1.5">
          A refundable {formatMoney(quote.securityDepositPence, quote.currency)} security deposit is held
          separately and released after check-out.
        </p>
      )}
      {quote.notes.length > 0 && (
        <ul className="mt-2 space-y-1">
          {quote.notes.map((n, i) => (
            <li key={i} className="text-[11.5px] text-amber-600 flex items-start gap-1.5">
              <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" /> {n}
            </li>
          ))}
        </ul>
      )}
    </div>
  )

  const stepIndex = STEPS.indexOf(step)

  return (
    <div>
      <div className="rounded-2xl border border-[#E2EAF6] bg-white shadow-[0_4px_24px_rgba(15,23,42,0.06)] overflow-hidden">
        {/* Header price */}
        <div className="px-5 pt-5 pb-4 border-b border-[#EEF3FB] flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            {perNight != null ? (
              <>
                <span className="text-[22px] font-bold text-[#0B1B3F]">{formatMoney(perNight, currency)}</span>
                <span className="text-[13.5px] text-slate-500">/ night</span>
              </>
            ) : (
              <span className="text-[16px] font-semibold text-[#0B1B3F]">Request a price</span>
            )}
          </div>
          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((s, i) => (
              <span
                key={s}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === stepIndex ? "w-5 bg-[var(--brand-strong)]" : i < stepIndex ? "w-1.5 bg-[var(--brand-strong)]" : "w-1.5 bg-slate-200"
                )}
              />
            ))}
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {step === "dates" && (
            <>
              <div>
                <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Dates
                </label>
                <button
                  type="button"
                  onClick={() => isMobile && setDateSheetOpen(true)}
                  className={cn(
                    "w-full text-left rounded-xl border border-[#D6E0F0] px-3.5 py-3 flex items-center gap-3 transition-colors",
                    isMobile && "hover:border-[var(--brand-strong)] active:bg-[var(--brand-soft)]"
                  )}
                >
                  <CalendarDays className="w-5 h-5 text-[var(--brand-strong)] shrink-0" />
                  <span className="flex-1 min-w-0">
                    {datesChosen ? (
                      <span className="block text-[13.5px] font-semibold text-[#0B1B3F] truncate">
                        {formatDateLabel(checkIn!)} → {formatDateLabel(checkOut!)}
                      </span>
                    ) : (
                      <span className="block text-[13.5px] text-slate-500">Add your stay dates</span>
                    )}
                    {datesChosen && (
                      <span className="block text-[12px] text-slate-400 mt-0.5">
                        {nights} night{nights === 1 ? "" : "s"}
                        {minNights > 1 ? ` · ${minNights}-night minimum` : ""}
                      </span>
                    )}
                  </span>
                  {isMobile && <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />}
                </button>
              </div>

              {!isMobile && (
                <div className="rounded-xl border border-[#EEF3FB] p-3">
                  <DateRangeCalendar
                    checkIn={checkIn}
                    checkOut={checkOut}
                    blockedDates={blockedDates}
                    onChange={handleRange}
                    months={1}
                  />
                </div>
              )}

              <div>
                <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Guests
                </label>
                <div className="rounded-xl border border-[#D6E0F0] px-3.5 py-2.5">
                  <GuestStepper value={guests} max={maxGuests} onChange={setGuests} />
                </div>
                <p className="text-[11.5px] text-slate-400 mt-1">Sleeps up to {maxGuests}.</p>
              </div>

              <div className="rounded-xl bg-[#F7F9FC] border border-[#EEF3FB] px-4 py-3.5">
                {quoteLoading ? (
                  <div className="flex items-center gap-2 py-1 text-[13px] text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--brand-strong)]" /> Updating price…
                  </div>
                ) : breakdown ? (
                  breakdown
                ) : (
                  <p className="text-[13px] text-slate-500 py-1">Select dates to see the full price.</p>
                )}
                {quoteError && (
                  <p className="mt-2 text-[12.5px] text-red-600 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {quoteError}
                  </p>
                )}
              </div>

              <button
                type="button"
                disabled={!quoteReady || quoteLoading}
                onClick={() => setStep("details")}
                className="w-full h-12 rounded-xl bg-[var(--brand-strong)] text-white text-[14.5px] font-semibold hover:bg-[#1A45BE] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                Continue to guest details
              </button>
              <p className="text-[11.5px] text-slate-400 text-center flex items-center justify-center gap-1.5">
                <Lock className="w-3 h-3" /> No payment taken yet · review before you pay
              </p>
            </>
          )}

          {step === "details" && (
            <div className="space-y-3.5">
              <Field label="Full name" required>
                <input
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="cf-input"
                  placeholder="As on your ID"
                  autoComplete="name"
                />
              </Field>
              <Field label="Email" required>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="cf-input"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Phone">
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="cf-input"
                    placeholder="Optional"
                    autoComplete="tel"
                  />
                </Field>
                <Field label="Arrival time">
                  <input
                    value={form.arrivalTime}
                    onChange={(e) => setForm({ ...form, arrivalTime: e.target.value })}
                    className="cf-input"
                    placeholder="e.g. 4pm"
                  />
                </Field>
              </div>
              <Field label="Message to host">
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="cf-input min-h-[68px] resize-y"
                  placeholder="Anything the host should know (optional)"
                />
              </Field>
              <p className="text-[11.5px] text-slate-400">
                Booking for {guests} guest{guests === 1 ? "" : "s"} ·{" "}
                {checkIn && formatDateLabel(checkIn)} → {checkOut && formatDateLabel(checkOut)}
              </p>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setStep("dates")}
                  className="h-12 px-4 rounded-xl border border-[#D6E0F0] text-slate-600 text-[14px] font-semibold inline-flex items-center gap-1.5 hover:border-slate-300"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  disabled={!detailsValid}
                  onClick={() => setStep("review")}
                  className="flex-1 h-12 rounded-xl bg-[var(--brand-strong)] text-white text-[14.5px] font-semibold hover:bg-[#1A45BE] disabled:opacity-50 transition-colors"
                >
                  Review & confirm
                </button>
              </div>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-4">
              {breakdown && (
                <div className="rounded-xl bg-[#F7F9FC] border border-[#EEF3FB] px-4 py-3.5">{breakdown}</div>
              )}

              {/* Cancellation policy */}
              <div className="rounded-xl border border-[#EEF3FB] px-4 py-3">
                <p className="text-[12.5px] font-semibold text-[#0B1B3F] mb-1">Cancellation policy</p>
                <p className="text-[12px] text-slate-500 leading-relaxed">
                  {POLICY_TEXT[cancellationPolicy] ?? POLICY_TEXT.flexible}
                </p>
              </div>

              {/* Acceptance checkboxes */}
              <div className="space-y-2.5">
                <AcceptBox
                  checked={acceptRules}
                  onChange={setAcceptRules}
                  policySlug="house-rules-policy"
                >
                  I have read and agree to the house rules.
                </AcceptBox>
                <AcceptBox
                  checked={acceptCancel}
                  onChange={setAcceptCancel}
                  policySlug="booking-cancellation-policy"
                >
                  I accept the cancellation policy shown above.
                </AcceptBox>
                {hasDeposit && (
                  <AcceptBox
                    checked={acceptDeposit}
                    onChange={setAcceptDeposit}
                    policySlug="damage-deposit-policy"
                  >
                    I authorise a refundable security deposit of{" "}
                    {formatMoney(securityDepositPence ?? 0, currency)}.
                  </AcceptBox>
                )}
                <AcceptBox
                  checked={acceptTerms}
                  onChange={setAcceptTerms}
                  policySlug="booking-terms"
                >
                  I agree to the booking terms and to my details being shared with the host to manage my stay.
                </AcceptBox>
              </div>

              {submitError && (
                <p className="text-[12.5px] text-red-600 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {submitError}
                </p>
              )}

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setStep("details")}
                  disabled={submitting}
                  className="h-12 px-4 rounded-xl border border-[#D6E0F0] text-slate-600 text-[14px] font-semibold inline-flex items-center gap-1.5 hover:border-slate-300 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  disabled={!allAccepted || submitting || !quoteReady}
                  onClick={handleReserve}
                  className="flex-1 h-12 rounded-xl bg-[var(--brand-strong)] text-white text-[14.5px] font-semibold hover:bg-[#1A45BE] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Holding your dates…
                    </>
                  ) : (
                    <>Reserve & continue to payment</>
                  )}
                </button>
              </div>
              <p className="text-[11.5px] text-slate-400 text-center flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-emerald-500" /> Payment is held securely until check-in
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2 text-[12px] text-slate-500">
        <ShieldCheck className="w-4 h-4 text-emerald-500" /> Booked directly with {title.length > 0 ? "the property manager" : "the host"}
      </div>

      {/* Mobile date sheet */}
      {isMobile && (
        <MobileSheet
          open={dateSheetOpen}
          onClose={() => setDateSheetOpen(false)}
          title="Choose your dates"
          description={datesChosen ? `${nights} night${nights === 1 ? "" : "s"} selected` : "Tap a start and end date"}
          maxHeightVh={0.9}
          footer={
            <button
              type="button"
              onClick={() => setDateSheetOpen(false)}
              disabled={!datesChosen}
              className="w-full h-12 rounded-xl bg-[var(--brand-strong)] text-white text-[14.5px] font-semibold disabled:opacity-50"
            >
              {datesChosen ? `Confirm ${nights} night${nights === 1 ? "" : "s"}` : "Select your dates"}
            </button>
          }
        >
          <div className="pb-2">
            <DateRangeCalendar
              checkIn={checkIn}
              checkOut={checkOut}
              blockedDates={blockedDates}
              onChange={handleRange}
              months={2}
            />
            <div className="mt-4 pt-4 border-t border-[#EEF3FB]">
              <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Guests
              </label>
              <GuestStepper value={guests} max={maxGuests} onChange={setGuests} />
            </div>
          </div>
        </MobileSheet>
      )}

      <style jsx>{`
        :global(.cf-input) {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid #d6e0f0;
          padding: 0.625rem 0.875rem;
          font-size: 14px;
          color: #0b1b3f;
          outline: none;
        }
        :global(.cf-input:focus) {
          border-color: var(--brand-strong);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
        }
      `}</style>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-slate-500 mb-1">
        {label}
        {required && <span className="text-red-400"> *</span>}
      </label>
      {children}
    </div>
  )
}

/** Renders a single LegalBlock from the policy body. */
function PolicyBlockRenderer({ block }: { block: LegalBlock }) {
  if (block.kind === "h2") {
    return <h2 className="text-[14px] font-bold text-[#0B1B3F] mt-5 mb-1.5">{block.text}</h2>
  }
  if (block.kind === "ul") {
    return (
      <ul className="list-disc pl-5 space-y-1 text-[13px] text-slate-600 leading-relaxed">
        {block.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    )
  }
  return <p className="text-[13px] text-slate-600 leading-relaxed">{block.text}</p>
}

/** Inline modal overlay showing a full booking policy document. No external deps. */
function PolicyModal({ policy, onClose }: { policy: BookingPolicyMeta; onClose: () => void }) {
  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="policy-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#EEF3FB] shrink-0">
          <div>
            <p id="policy-modal-title" className="text-[15px] font-bold text-[#0B1B3F]">
              {policy.title}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Version {policy.currentVersion} · Effective {policy.effectiveFrom}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-4 shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close policy"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Body */}
        <div className="overflow-y-auto px-5 py-4 space-y-2 flex-1">
          {policy.body.map((block, i) => (
            <PolicyBlockRenderer key={i} block={block} />
          ))}
        </div>
        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#EEF3FB] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-10 rounded-xl bg-[var(--brand-strong)] text-white text-[13.5px] font-semibold hover:bg-[#1A45BE] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function AcceptBox({
  checked,
  onChange,
  policySlug,
  children,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  policySlug?: string
  children: React.ReactNode
}) {
  const [showPolicy, setShowPolicy] = useState(false)
  const policy = policySlug
    ? (BOOKING_POLICIES as Record<string, BookingPolicyMeta>)[policySlug]
    : undefined

  return (
    <>
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          role="checkbox"
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          className="shrink-0 mt-0.5 group"
        >
          <span
            className={cn(
              "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors",
              checked ? "bg-[var(--brand-strong)] border-[var(--brand-strong)]" : "border-slate-300 group-hover:border-slate-400"
            )}
          >
            {checked && <Check className="w-3.5 h-3.5 text-white" />}
          </span>
        </button>
        <span className="text-[12.5px] leading-relaxed text-slate-600 flex-1">
          {children}
          {policy && (
            <>
              {" "}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowPolicy(true)
                }}
                className="text-[var(--brand-strong)] underline underline-offset-2 hover:text-[#1A45BE] transition-colors font-medium"
              >
                View policy
              </button>
            </>
          )}
        </span>
      </div>
      {showPolicy && policy && (
        <PolicyModal policy={policy} onClose={() => setShowPolicy(false)} />
      )}
    </>
  )
}
