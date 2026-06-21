'use client'

/**
 * BookingWidget — interactive date/booking sidebar for marketplace-public listing detail.
 *
 * Used for:
 *  - "stays"    → date-range picker + guests + "Reserve / Request to book" → /marketplace/checkout/[id]
 *  - "services" → single date picker + "Book this service" → /marketplace/checkout/[id]
 *  - "suppliers" / "emergency" → QuoteRequestForm (date hint field only, no calendar)
 *
 * Fetches availability from /api/stays/[id]/availability for stays.
 * Passes checkIn/checkOut/guests/date as search params to checkout.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  CalendarCheck,
  ChevronDown,
  ChevronUp,
  Info,
  Minus,
  Plus,
  Zap,
} from 'lucide-react'
import DateRangePicker from '@/components/public-marketplace/DateRangePicker'
import { formatPence } from '@/components/marketplace/PriceTag'

// ── helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function nightsBetween(a: string, b: string): number {
  return Math.max(
    0,
    Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000),
  )
}

// ── props ──────────────────────────────────────────────────────────────────────

interface BookingWidgetProps {
  listingId: string
  intent: 'stays' | 'services' | 'suppliers' | 'emergency'
  basePricePence: number | null
  currency: string
  instantBook: boolean
  maxGuests?: number
  signedIn: boolean
}

// ── component ──────────────────────────────────────────────────────────────────

export default function BookingWidget({
  listingId,
  intent,
  basePricePence,
  currency,
  instantBook,
  maxGuests = 8,
  signedIn,
}: BookingWidgetProps) {
  const router = useRouter()
  const isStay = intent === 'stays'
  const isService = intent === 'services'

  // ── availability (stays only) ─────────────────────────────────────────────
  const [blockedDates, setBlockedDates] = useState<string[]>([])
  const [loadingAvail, setLoadingAvail] = useState(isStay)

  useEffect(() => {
    if (!isStay) return
    let cancelled = false
    fetch(`/api/stays/${listingId}/availability`)
      .then(r => r.json())
      .then((d: { blockedDates?: string[] }) => {
        if (!cancelled) setBlockedDates(d.blockedDates ?? [])
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingAvail(false) })
    return () => { cancelled = true }
  }, [listingId, isStay])

  // ── date state ────────────────────────────────────────────────────────────
  const [checkIn, setCheckIn] = useState<string | null>(null)
  const [checkOut, setCheckOut] = useState<string | null>(null)
  const [serviceDate, setServiceDate] = useState<string | null>(null)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const calRef = useRef<HTMLDivElement>(null)

  // ── guests (stays only) ───────────────────────────────────────────────────
  const [guests, setGuests] = useState(1)
  const [guestsOpen, setGuestsOpen] = useState(false)
  const guestsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (guestsRef.current && !guestsRef.current.contains(e.target as Node)) {
        setGuestsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleDateSelect = useCallback((ci: string, co: string) => {
    if (isStay) {
      setCheckIn(ci)
      setCheckOut(co)
    } else {
      setServiceDate(ci)
    }
    setCalendarOpen(false)
  }, [isStay])

  const nights = isStay && checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0
  const hasDates = isStay ? nights > 0 : serviceDate != null

  // ── price ─────────────────────────────────────────────────────────────────
  const priceNum = basePricePence ?? 0
  const nightsTotal = isStay ? priceNum * nights : 0
  const platformFee = Math.round(priceNum * 0.025)
  const total = isStay ? nightsTotal + platformFee : priceNum + platformFee

  function clearDates() {
    setCheckIn(null)
    setCheckOut(null)
    setServiceDate(null)
  }

  function handleBook() {
    const params = new URLSearchParams()
    if (isStay && checkIn && checkOut) {
      params.set('checkIn', checkIn)
      params.set('checkOut', checkOut)
      params.set('guests', String(guests))
    } else if (isService && serviceDate) {
      params.set('date', serviceDate)
    }
    router.push(`/marketplace/checkout/${listingId}?${params}`)
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      {/* Date selector */}
      {(isStay || isService) && (
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white">
          {isStay ? (
            // Date range for stays
            <div className="grid grid-cols-2 divide-x divide-slate-200">
              <button
                type="button"
                onClick={() => setCalendarOpen(v => !v)}
                className="flex gap-2.5 p-3.5 text-left transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                <div>
                  <p className="text-[11px] font-[700] uppercase tracking-wide text-slate-500">Check in</p>
                  <p className={`text-[13px] font-[600] ${checkIn ? 'text-slate-900' : 'text-slate-400'}`}>
                    {checkIn ? formatDate(checkIn) : 'Add date'}
                  </p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setCalendarOpen(v => !v)}
                className="flex gap-2.5 p-3.5 text-left transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                <div>
                  <p className="text-[11px] font-[700] uppercase tracking-wide text-slate-500">Check out</p>
                  <p className={`text-[13px] font-[600] ${checkOut ? 'text-slate-900' : 'text-slate-400'}`}>
                    {checkOut ? formatDate(checkOut) : 'Add date'}
                  </p>
                </div>
              </button>
            </div>
          ) : (
            // Single date for services
            <button
              type="button"
              onClick={() => setCalendarOpen(v => !v)}
              className="flex w-full gap-2.5 p-3.5 text-left transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
              <div>
                <p className="text-[11px] font-[700] uppercase tracking-wide text-slate-500">
                  Preferred date
                </p>
                <p className={`text-[13px] font-[600] ${serviceDate ? 'text-slate-900' : 'text-slate-400'}`}>
                  {serviceDate ? formatDate(serviceDate) : 'Select a date'}
                </p>
              </div>
            </button>
          )}

          {/* Calendar */}
          {calendarOpen && (
            <div ref={calRef} className="relative z-50">
              <DateRangePicker
                blockedDates={loadingAvail ? [] : blockedDates}
                checkIn={checkIn}
                checkOut={checkOut}
                onChange={(ci, co) => {
                  handleDateSelect(ci ?? '', co ?? '')
                }}
                minDate={new Date()}
              />
            </div>
          )}

          {/* Guests row (stays only) */}
          {isStay && (
            <div ref={guestsRef} className="relative border-t border-slate-200">
              <button
                type="button"
                onClick={() => setGuestsOpen(v => !v)}
                className="flex w-full items-center justify-between p-3.5 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <div className="flex items-center gap-2">
                  <div className="text-[11px] font-[700] uppercase tracking-wide text-slate-500">Guests</div>
                  <div className="text-[13px] font-[600] text-slate-900">
                    {guests} guest{guests !== 1 ? 's' : ''}
                  </div>
                </div>
                {guestsOpen ? (
                  <ChevronUp className="h-4 w-4 text-slate-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                )}
              </button>
              {guestsOpen && (
                <div className="border-t border-slate-100 bg-white px-4 pb-4 pt-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-[600] text-slate-700">Adults</p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setGuests(g => Math.max(1, g - 1))}
                        disabled={guests <= 1}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition-colors hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-5 text-center text-[15px] font-[700] text-slate-900">{guests}</span>
                      <button
                        type="button"
                        onClick={() => setGuests(g => Math.min(maxGuests, g + 1))}
                        disabled={guests >= maxGuests}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition-colors hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-400">Max {maxGuests} guests</p>
                  <button
                    type="button"
                    onClick={() => setGuestsOpen(false)}
                    className="mt-2 text-[12px] font-[700] text-slate-900 underline underline-offset-2"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Price breakdown (when dates selected) */}
      {hasDates && priceNum > 0 && (
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-[12.5px] space-y-2">
          {isStay ? (
            <>
              <div className="flex justify-between">
                <span className="text-slate-600">
                  {formatPence(priceNum, currency)} × {nights} night{nights !== 1 ? 's' : ''}
                </span>
                <span className="font-[600] text-slate-800">{formatPence(nightsTotal, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Platform fee (2.5%)</span>
                <span className="text-slate-600">{formatPence(platformFee, currency)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-[700] text-slate-900 text-[13px]">
                <span>Estimated total</span>
                <span>{formatPence(total, currency)}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between">
                <span className="text-slate-600">Service price</span>
                <span className="font-[600] text-slate-800">{formatPence(priceNum, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Platform fee (2.5%)</span>
                <span className="text-slate-600">{formatPence(platformFee, currency)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-[700] text-slate-900 text-[13px]">
                <span>Estimated total</span>
                <span>{formatPence(total, currency)}</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* CTA button */}
      {!hasDates ? (
        <button
          type="button"
          onClick={() => setCalendarOpen(true)}
          className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-[#2563EB] text-white text-[14.5px] font-semibold shadow-[0_2px_12px_rgba(37,99,235,0.32)] hover:bg-[#1d4ed8] transition-colors"
        >
          <Calendar className="w-4.5 h-4.5" aria-hidden="true" />
          {isStay ? 'Check availability' : 'Select a date'}
        </button>
      ) : instantBook ? (
        <button
          type="button"
          onClick={handleBook}
          className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-[#2563EB] text-white text-[14.5px] font-semibold shadow-[0_2px_12px_rgba(37,99,235,0.32)] hover:bg-[#1d4ed8] transition-colors"
        >
          <Zap className="w-4.5 h-4.5" aria-hidden="true" />
          {isStay ? 'Reserve now' : 'Book this service'}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleBook}
          className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl border border-[#2563EB] text-[#2563EB] text-[14.5px] font-semibold hover:bg-blue-50 transition-colors"
        >
          <CalendarCheck className="w-4.5 h-4.5" aria-hidden="true" />
          {isStay ? 'Request to book' : 'Request this service'}
        </button>
      )}

      {/* Clear dates / hint */}
      {hasDates && (
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Info className="w-3 h-3 shrink-0" aria-hidden="true" />
            {signedIn ? "Payment confirmed on next step." : "Sign in to confirm payment."}
          </span>
          <button
            type="button"
            onClick={clearDates}
            className="underline underline-offset-2 hover:text-slate-600"
          >
            Clear dates
          </button>
        </div>
      )}
    </div>
  )
}
