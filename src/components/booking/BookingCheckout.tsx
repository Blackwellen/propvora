"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CalendarDays,
  Loader2,
  ShieldCheck,
  Lock,
  ChevronRight,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import MobileSheet from "@/components/mobile/MobileSheet"
import { useIsMobile } from "@/components/mobile/useBreakpoint"
import DateRangeCalendar from "./DateRangeCalendar"
import GuestStepper from "./GuestStepper"
import PriceBreakdown from "./PriceBreakdown"
import GuestDetailsForm, { type GuestDetails } from "./GuestDetailsForm"
import { formatMoney, formatDateLabel, nightsBetween, addDaysIso } from "./format"
import type { PublicListingView, QuoteBreakdown, ReserveResult } from "./types"

interface BookingCheckoutProps {
  listing: PublicListingView
  slug: string
}

type Step = "dates" | "details"

/**
 * The public checkout island. Orchestrates:
 *  1. date range + guest selection (calendar inline on desktop, sheet on mobile)
 *  2. a live server-recomputed quote (/api/booking/quote)
 *  3. a guest-details form with legal acceptance
 *  4. reservation via /api/booking/reserve (RPC-backed HOLD — no payment taken)
 *
 * On mobile a sticky bottom price/CTA bar is always visible. The displayed
 * total is always the server's recomputed value.
 */
export default function BookingCheckout({ listing, slug }: BookingCheckoutProps) {
  const router = useRouter()
  const isMobile = useIsMobile()

  const [checkIn, setCheckIn] = useState<string | null>(null)
  const [checkOut, setCheckOut] = useState<string | null>(null)
  const [guests, setGuests] = useState(1)

  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set())
  const [quote, setQuote] = useState<QuoteBreakdown | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteError, setQuoteError] = useState<string | null>(null)

  const [dateSheetOpen, setDateSheetOpen] = useState(false)
  const [step, setStep] = useState<Step>("dates")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0

  // ── Load availability (blocked dates) for a 12-month window ────────────────
  useEffect(() => {
    let cancelled = false
    const from = new Date().toISOString().slice(0, 10)
    const to = addDaysIso(from, 365)
    fetch(
      `/api/booking/availability?listingId=${encodeURIComponent(
        listing.id
      )}&from=${from}&to=${to}`
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.blockedDates) return
        setBlockedDates(new Set<string>(data.blockedDates))
      })
      .catch(() => {
        /* availability is best-effort; reserve RPC is the real guard */
      })
    return () => {
      cancelled = true
    }
  }, [listing.id])

  // ── Live quote whenever dates / guests change ──────────────────────────────
  const quoteSeq = useRef(0)
  const fetchQuote = useCallback(async () => {
    if (!checkIn || !checkOut || nights < 1) {
      setQuote(null)
      setQuoteError(null)
      return
    }
    const seq = ++quoteSeq.current
    setQuoteLoading(true)
    setQuoteError(null)
    try {
      const res = await fetch("/api/booking/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id, checkIn, checkOut, guests }),
      })
      const data = await res.json().catch(() => null)
      if (seq !== quoteSeq.current) return // a newer request superseded this one
      if (!res.ok) {
        setQuote(null)
        setQuoteError(
          (data?.error as string) ?? "We couldn't price these dates. Please try again."
        )
        return
      }
      setQuote(data.quote as QuoteBreakdown)
    } catch {
      if (seq === quoteSeq.current) {
        setQuoteError("We couldn't price these dates. Please try again.")
      }
    } finally {
      if (seq === quoteSeq.current) setQuoteLoading(false)
    }
  }, [checkIn, checkOut, guests, nights, listing.id])

  useEffect(() => {
    void fetchQuote()
  }, [fetchQuote])

  function handleRangeChange(range: { checkIn: string | null; checkOut: string | null }) {
    setCheckIn(range.checkIn)
    setCheckOut(range.checkOut)
    setSubmitError(null)
  }

  async function handleReserve(guest: GuestDetails) {
    if (!checkIn || !checkOut) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch("/api/booking/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          checkIn,
          checkOut,
          guests,
          guest,
        }),
      })
      const data = (await res.json().catch(() => null)) as
        | ReserveResult
        | { error?: string }
        | null
      if (!res.ok || !data || !("ok" in data)) {
        setSubmitError(
          (data as { error?: string } | null)?.error ??
            "We couldn't complete your booking. Please try again."
        )
        return
      }
      // Success — go to the confirmation page with the reference.
      const result = data as ReserveResult
      const params = new URLSearchParams()
      if (result.reference) params.set("ref", result.reference)
      params.set("status", result.status)
      router.push(`/stay/${encodeURIComponent(slug)}/confirmation?${params.toString()}`)
    } catch {
      setSubmitError("We couldn't complete your booking. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const datesChosen = Boolean(checkIn && checkOut && nights >= 1)
  const perNight = listing.basePricePence

  // ── Date summary button (opens sheet on mobile, inline calendar on desktop) ─
  const dateSummary = (
    <button
      type="button"
      onClick={() => isMobile && setDateSheetOpen(true)}
      className={cn(
        "w-full text-left rounded-xl border border-[#D6E0F0] px-3.5 py-3 flex items-center gap-3 transition-colors",
        isMobile && "hover:border-[var(--brand-strong)] active:bg-[var(--brand-soft)]",
        !isMobile && "cursor-default"
      )}
    >
      <CalendarDays className="w-5 h-5 text-[var(--brand-strong)] shrink-0" />
      <span className="flex-1 min-w-0">
        {datesChosen ? (
          <span className="block text-[13.5px] font-semibold text-[#0B1B3F] truncate">
            {formatDateLabel(checkIn!)} → {formatDateLabel(checkOut!)}
          </span>
        ) : (
          <span className="block text-[13.5px] text-slate-500">
            Add your stay dates
          </span>
        )}
        {datesChosen && (
          <span className="block text-[12px] text-slate-400 mt-0.5">
            {nights} night{nights === 1 ? "" : "s"}
          </span>
        )}
      </span>
      {isMobile && <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />}
    </button>
  )

  return (
    <div>
      {/* ── Desktop / tablet booking card ── */}
      <div className="rounded-2xl border border-[#E2EAF6] bg-white shadow-[0_4px_24px_rgba(15,23,42,0.06)] overflow-hidden">
        <div className="px-5 pt-5 pb-4 border-b border-[#EEF3FB]">
          <div className="flex items-baseline gap-1.5">
            {perNight != null ? (
              <>
                <span className="text-[22px] font-bold text-[#0B1B3F]">
                  {formatMoney(perNight, listing.currency)}
                </span>
                <span className="text-[13.5px] text-slate-500">/ night</span>
              </>
            ) : (
              <span className="text-[16px] font-semibold text-[#0B1B3F]">
                Request a price
              </span>
            )}
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {step === "dates" && (
            <>
              {/* Dates */}
              <div>
                <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Dates
                </label>
                {dateSummary}
              </div>

              {/* Inline calendar on desktop only */}
              {!isMobile && (
                <div className="rounded-xl border border-[#EEF3FB] p-3">
                  <DateRangeCalendar
                    checkIn={checkIn}
                    checkOut={checkOut}
                    blockedDates={blockedDates}
                    onChange={handleRangeChange}
                    months={1}
                  />
                </div>
              )}

              {/* Guests */}
              <div>
                <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Guests
                </label>
                <div className="rounded-xl border border-[#D6E0F0] px-3.5 py-2.5">
                  <GuestStepper
                    value={guests}
                    max={listing.maxGuests ?? 16}
                    onChange={(n) => {
                      setGuests(n)
                      setSubmitError(null)
                    }}
                  />
                </div>
                {listing.maxGuests != null && (
                  <p className="text-[11.5px] text-slate-400 mt-1">
                    Sleeps up to {listing.maxGuests}.
                  </p>
                )}
              </div>

              {/* Price */}
              <div className="rounded-xl bg-[#F7F9FC] border border-[#EEF3FB] px-4 py-3.5">
                <PriceBreakdown quote={quote} loading={quoteLoading} />
                {quoteError && (
                  <p className="mt-2 text-[12.5px] text-red-600 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {quoteError}
                  </p>
                )}
              </div>

              <button
                type="button"
                disabled={!datesChosen || quoteLoading || !quote?.ready}
                onClick={() => setStep("details")}
                className="w-full h-12 rounded-xl bg-[var(--brand-strong)] text-white text-[14.5px] font-semibold hover:bg-[#1A45BE] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40"
              >
                Continue to guest details
              </button>

              <p className="text-[11.5px] text-slate-400 text-center flex items-center justify-center gap-1.5">
                <Lock className="w-3 h-3" /> No payment taken yet · you can review
                before confirming
              </p>
            </>
          )}

          {step === "details" && (
            <GuestDetailsForm
              listing={listing}
              quote={quote}
              guests={guests}
              checkIn={checkIn}
              checkOut={checkOut}
              submitting={submitting}
              submitError={submitError}
              onBack={() => setStep("dates")}
              onSubmit={handleReserve}
            />
          )}
        </div>
      </div>

      {/* Trust strip */}
      <div className="mt-3 flex items-center justify-center gap-2 text-[12px] text-slate-500">
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        Booked directly with the property manager
      </div>

      {/* ── Mobile sticky price/CTA bar ── */}
      {isMobile && step === "dates" && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 bg-white border-t border-[#E2EAF6] shadow-[0_-8px_28px_rgba(15,23,42,0.10)] px-4 pt-3"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
        >
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              {datesChosen && quote?.ready ? (
                <>
                  <span className="block text-[15px] font-bold text-[#0B1B3F]">
                    {formatMoney(quote.totalPence, quote.currency)}
                  </span>
                  <span className="block text-[12px] text-slate-400">
                    {nights} night{nights === 1 ? "" : "s"} · total
                  </span>
                </>
              ) : perNight != null ? (
                <>
                  <span className="block text-[15px] font-bold text-[#0B1B3F]">
                    {formatMoney(perNight, listing.currency)}
                  </span>
                  <span className="block text-[12px] text-slate-400">per night</span>
                </>
              ) : (
                <span className="block text-[14px] font-semibold text-[#0B1B3F]">
                  Request a price
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() =>
                datesChosen && quote?.ready ? setStep("details") : setDateSheetOpen(true)
              }
              disabled={quoteLoading}
              className="h-12 px-6 rounded-xl bg-[var(--brand-strong)] text-white text-[14.5px] font-semibold hover:bg-[#1A45BE] disabled:opacity-60 transition-colors flex items-center justify-center gap-2 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40"
            >
              {quoteLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : datesChosen && quote?.ready ? (
                "Continue"
              ) : (
                "Select dates"
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Mobile date picker sheet ── */}
      {isMobile && (
        <MobileSheet
          open={dateSheetOpen}
          onClose={() => setDateSheetOpen(false)}
          title="Choose your dates"
          description={
            datesChosen
              ? `${nights} night${nights === 1 ? "" : "s"} selected`
              : "Tap a start and end date"
          }
          maxHeightVh={0.9}
          footer={
            <button
              type="button"
              onClick={() => setDateSheetOpen(false)}
              disabled={!datesChosen}
              className="w-full h-12 rounded-xl bg-[var(--brand-strong)] text-white text-[14.5px] font-semibold disabled:opacity-50 transition-colors"
            >
              {datesChosen
                ? `Confirm ${nights} night${nights === 1 ? "" : "s"}`
                : "Select your dates"}
            </button>
          }
        >
          <div className="pb-2">
            <DateRangeCalendar
              checkIn={checkIn}
              checkOut={checkOut}
              blockedDates={blockedDates}
              onChange={handleRangeChange}
              months={2}
            />
            <div className="mt-4 pt-4 border-t border-[#EEF3FB]">
              <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Guests
              </label>
              <GuestStepper
                value={guests}
                max={listing.maxGuests ?? 16}
                onChange={setGuests}
              />
            </div>
          </div>
        </MobileSheet>
      )}
    </div>
  )
}
