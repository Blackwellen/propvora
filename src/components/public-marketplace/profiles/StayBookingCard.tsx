'use client'

/**
 * StayBookingCard — fully interactive booking sidebar for /stays/[slug].
 *
 * - Fetches blocked dates from /api/stays/[id]/availability on mount
 * - Date-range picker via DateRangePicker component (no external date lib)
 * - Guest count stepper (min 1, max stay.guests)
 * - Dynamic price calculation: nights × pricePerNight + cleaning + service + taxes
 * - Instant book → /marketplace/checkout/[id]?checkIn=…&checkOut=…&guests=…
 * - Request to book → /marketplace/request/[id]?checkIn=…&checkOut=…&guests=…
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Lock,
  Minus,
  Plus,
  Star,
  Users,
  Zap,
} from 'lucide-react'
import type { PublicStay } from '@/lib/public-marketplace/types'
import DateRangePicker from '@/components/public-marketplace/DateRangePicker'

// ── helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function nightsBetween(a: string, b: string): number {
  const msPerDay = 86400000
  const dateA = new Date(a)
  const dateB = new Date(b)
  return Math.max(0, Math.round((dateB.getTime() - dateA.getTime()) / msPerDay))
}

// ── component ──────────────────────────────────────────────────────────────────

interface Props {
  stay: PublicStay
}

export default function StayBookingCard({ stay }: Props) {
  const router = useRouter()

  const pricePerNight = stay.pricePerNight / 100
  const cleaning = stay.cleaningFee / 100
  const service = stay.serviceFee / 100
  const taxes = stay.taxes / 100

  // Availability
  const [blockedDates, setBlockedDates] = useState<string[]>([])
  const [loadingAvail, setLoadingAvail] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/stays/${stay.id}/availability`)
      .then(r => r.json())
      .then((data: { blockedDates?: string[] }) => {
        if (!cancelled) setBlockedDates(data.blockedDates ?? [])
      })
      .catch(() => {
        // silently fail — no blocked dates shown
      })
      .finally(() => {
        if (!cancelled) setLoadingAvail(false)
      })
    return () => { cancelled = true }
  }, [stay.id])

  // Date selection
  const [checkIn, setCheckIn] = useState<string | null>(null)
  const [checkOut, setCheckOut] = useState<string | null>(null)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const calendarRef = useRef<HTMLDivElement>(null)

  // Guest count
  const [guests, setGuests] = useState(1)
  const [guestsOpen, setGuestsOpen] = useState(false)
  const guestsRef = useRef<HTMLDivElement>(null)

  // Close guests dropdown on outside click
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
    setCheckIn(ci)
    setCheckOut(co)
    setCalendarOpen(false)
  }, [])

  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0
  const subtotal = pricePerNight * nights
  const total = subtotal + cleaning + service + taxes
  const hasDates = nights > 0

  function openCalendar() {
    setCalendarOpen(true)
    setGuestsOpen(false)
  }

  function clearDates() {
    setCheckIn(null)
    setCheckOut(null)
    setCalendarOpen(false)
  }

  function handleBook() {
    if (!hasDates) return
    const params = new URLSearchParams({
      checkIn: checkIn!,
      checkOut: checkOut!,
      guests: String(guests),
    })
    const dest = stay.instantBook
      ? `/marketplace/checkout/${stay.id}?${params}`
      : `/marketplace/request/${stay.id}?${params}`
    router.push(dest)
  }

  return (
    <div className="rounded-[14px] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
      {/* Price + rating header */}
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <span className="text-[24px] font-[800] leading-none text-slate-950">
            &pound;{pricePerNight.toFixed(0)}
          </span>
          <span className="text-[14px] font-[500] text-slate-500"> / night</span>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-1">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="text-[14px] font-[800] text-slate-950">{stay.rating}</span>
            <span className="text-[13px] text-slate-500">({stay.reviewCount} reviews)</span>
          </div>
          {hasDates && (
            <button
              onClick={clearDates}
              className="mt-0.5 text-[11px] font-[600] text-blue-600 underline underline-offset-2 hover:text-blue-700"
            >
              Clear dates
            </button>
          )}
        </div>
      </div>

      {/* Date + Guests selector card */}
      <div className="relative mb-4 overflow-hidden rounded-[10px] border border-slate-200">
        {/* Date row */}
        <div className="grid grid-cols-2 divide-x divide-slate-200">
          {/* Check-in */}
          <button
            type="button"
            onClick={openCalendar}
            className="flex gap-3 p-4 text-left transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Select check-in date"
          >
            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
            <div>
              <div className="text-[12px] font-[800] text-slate-800">Check in</div>
              <div
                className={`mt-0.5 text-[13px] font-[500] ${
                  checkIn ? 'text-slate-900' : 'text-slate-500'
                }`}
              >
                {checkIn ? formatDate(checkIn) : 'Add date'}
              </div>
            </div>
          </button>

          {/* Check-out */}
          <button
            type="button"
            onClick={openCalendar}
            className="flex gap-3 p-4 text-left transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Select check-out date"
          >
            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
            <div>
              <div className="text-[12px] font-[800] text-slate-800">Check out</div>
              <div
                className={`mt-0.5 text-[13px] font-[500] ${
                  checkOut ? 'text-slate-900' : 'text-slate-500'
                }`}
              >
                {checkOut ? formatDate(checkOut) : 'Add date'}
              </div>
            </div>
          </button>
        </div>

        {/* Calendar overlay */}
        {calendarOpen && (
          <div ref={calendarRef} className="relative z-50">
            <DateRangePicker
              blockedDates={loadingAvail ? [] : blockedDates}
              checkIn={checkIn}
              checkOut={checkOut}
              onSelect={handleDateSelect}
              onClose={() => setCalendarOpen(false)}
              minNights={stay.shortLets ? 1 : 2}
            />
          </div>
        )}

        {/* Guests selector */}
        <div ref={guestsRef} className="relative border-t border-slate-200">
          <button
            type="button"
            onClick={() => setGuestsOpen(g => !g)}
            className="flex w-full items-center justify-between p-4 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-expanded={guestsOpen}
            aria-label="Select number of guests"
          >
            <div className="flex gap-3">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
              <div>
                <div className="text-[12px] font-[800] text-slate-800">Guests</div>
                <div className="mt-0.5 text-[13px] font-[500] text-slate-900">
                  {guests} guest{guests !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
            {guestsOpen ? (
              <ChevronUp className="h-4 w-4 text-slate-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-500" />
            )}
          </button>

          {/* Guest stepper dropdown */}
          {guestsOpen && (
            <div className="border-t border-slate-100 bg-white px-4 pb-4 pt-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-[700] text-slate-900">Adults</p>
                  <p className="text-[11px] text-slate-500">Max {stay.guests} guests</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setGuests(g => Math.max(1, g - 1))}
                    disabled={guests <= 1}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition-colors hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Decrease guests"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-5 text-center text-[15px] font-[700] text-slate-900">
                    {guests}
                  </span>
                  <button
                    type="button"
                    onClick={() => setGuests(g => Math.min(stay.guests, g + 1))}
                    disabled={guests >= stay.guests}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition-colors hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Increase guests"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGuestsOpen(false)}
                className="mt-3 text-[12px] font-[700] text-slate-900 underline underline-offset-2"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CTA buttons */}
      {!hasDates ? (
        <button
          type="button"
          onClick={openCalendar}
          className="mb-3 w-full rounded-[8px] bg-blue-600 py-3.5 text-[15px] font-[800] text-white transition-colors hover:bg-blue-700"
        >
          Check availability
        </button>
      ) : stay.instantBook ? (
        <button
          type="button"
          onClick={handleBook}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-[8px] bg-blue-600 py-3.5 text-[15px] font-[800] text-white transition-colors hover:bg-blue-700 active:scale-[0.99]"
        >
          <Zap className="h-4 w-4" />
          Reserve now
        </button>
      ) : (
        <button
          type="button"
          onClick={handleBook}
          className="mb-3 w-full rounded-[8px] border border-blue-600 py-3.5 text-[15px] font-[800] text-blue-600 transition-colors hover:bg-blue-50"
        >
          Request to book
        </button>
      )}

      {!hasDates && (
        <p className="mb-4 text-center text-[12px] font-[500] text-slate-500">
          Select your dates first
        </p>
      )}
      {hasDates && (
        <p className="mb-5 text-center text-[12px] font-[500] text-slate-500">
          You won&apos;t be charged yet
        </p>
      )}

      {/* Price breakdown */}
      <div className="space-y-3 text-[13px]">
        {hasDates ? (
          <>
            <div className="flex justify-between">
              <span className="text-slate-600">
                &pound;{pricePerNight.toFixed(0)} &times; {nights} night{nights !== 1 ? 's' : ''}
              </span>
              <span className="font-[600] text-slate-900">&pound;{subtotal.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Cleaning fee</span>
              <span className="font-[600] text-slate-900">&pound;{cleaning.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Service fee</span>
              <span className="font-[600] text-slate-900">&pound;{service.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Taxes</span>
              <span className="font-[600] text-slate-900">&pound;{taxes.toFixed(0)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-3 text-[14px] font-[800] text-slate-950">
              <span>Total</span>
              <span>&pound;{total.toFixed(0)} GBP</span>
            </div>
          </>
        ) : (
          <div className="rounded-[8px] bg-slate-50 px-3 py-3 text-[12px] text-slate-500">
            Add your dates to see the total price including all fees.
          </div>
        )}
      </div>

      {/* Trust panel */}
      <div className="mt-5 rounded-[10px] border border-emerald-100 bg-emerald-50/60 p-3">
        <div className="mb-2 flex items-center gap-2 text-[12px] font-[800] text-emerald-700">
          <CheckCircle className="h-4 w-4" />
          Price match guarantee
        </div>
        <div className="space-y-2 text-[12px] text-slate-600">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-3.5 w-3.5 shrink-0 text-blue-600" /> Verified stays
          </div>
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 shrink-0 text-blue-600" /> Secure payments
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-3.5 w-3.5 shrink-0 text-blue-600" /> 24/7 guest support
          </div>
        </div>
      </div>
    </div>
  )
}
