'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Heart, Lock, Minus, Plus, Star, Zap } from 'lucide-react'
import type { PublicStay } from '@/lib/public-marketplace/types'
import { formatPence } from '@/lib/marketplace/money'
import DateRangePicker from '@/components/public-marketplace/DateRangePicker'

const SAVED_KEY = 'propvora_saved_stays'

function getNights(checkIn: string | null, checkOut: string | null): number {
  if (!checkIn || !checkOut) return 0
  const ci = new Date(checkIn + 'T00:00:00')
  const co = new Date(checkOut + 'T00:00:00')
  const diff = Math.round((co.getTime() - ci.getTime()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
}

export default function StayBookingCard({ stay }: { stay: PublicStay }) {
  const router = useRouter()

  const [checkIn, setCheckIn] = useState<string | null>(null)
  const [checkOut, setCheckOut] = useState<string | null>(null)
  const [guests, setGuests] = useState(1)
  const [saved, setSaved] = useState(false)

  // Load saved state from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_KEY)
      if (raw) {
        const arr: string[] = JSON.parse(raw)
        setSaved(arr.includes(stay.slug))
      }
    } catch {
      // ignore
    }
  }, [stay.slug])

  function toggleSaved() {
    try {
      const raw = localStorage.getItem(SAVED_KEY)
      const arr: string[] = raw ? JSON.parse(raw) : []
      const next = saved
        ? arr.filter(s => s !== stay.slug)
        : [...arr, stay.slug]
      localStorage.setItem(SAVED_KEY, JSON.stringify(next))
      setSaved(!saved)
    } catch {
      // ignore
    }
  }

  function handleGuestsChange(delta: number) {
    setGuests(g => Math.min(stay.guests, Math.max(1, g + delta)))
  }

  function handleDateChange(ci: string | null, co: string | null) {
    setCheckIn(ci)
    setCheckOut(co)
  }

  const nights = getNights(checkIn, checkOut)
  const hasDateRange = nights > 0
  const subtotal = stay.pricePerNight * nights // pence

  function handleBook() {
    if (!checkIn || !checkOut) return
    router.push(
      `/stays/${stay.slug}/checkout?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`
    )
  }

  return (
    <div className="rounded-[14px] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
      {/* Price + Rating header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <span className="text-[24px] font-[800] leading-none text-slate-950">
            {formatPence(stay.pricePerNight)}
          </span>
          <span className="text-[14px] font-[500] text-slate-500"> / night</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label={saved ? 'Remove from saved' : 'Save stay'}
            onClick={toggleSaved}
            className={`rounded-full p-2 transition-colors ${saved ? 'text-rose-500 bg-rose-50' : 'text-slate-400 hover:text-rose-400 hover:bg-rose-50'}`}
          >
            <Heart className={`h-4 w-4 ${saved ? 'fill-rose-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Rating row */}
      <div className="mb-4 flex items-center gap-1.5 text-sm">
        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
        <span className="font-[700] text-slate-900">{stay.rating}</span>
        <span className="text-slate-400">({stay.reviewCount} reviews)</span>
        {stay.freeCancellation && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-[700] text-emerald-700 border border-emerald-100">
            <CheckCircle className="h-3 w-3" />Free cancellation
          </span>
        )}
      </div>

      {/* Date range picker */}
      <div className="mb-3">
        <DateRangePicker
          checkIn={checkIn}
          checkOut={checkOut}
          onChange={handleDateChange}
          blockedDates={stay.blockedDates ?? []}
        />
      </div>

      {/* Guests stepper */}
      <div className="mb-4 flex items-center justify-between rounded-[10px] border border-slate-200 px-4 py-3">
        <div>
          <div className="text-[11px] font-[800] uppercase tracking-wide text-slate-600">Guests</div>
          <div className="mt-0.5 text-[13px] font-[500] text-slate-700">
            {guests} {guests === 1 ? 'guest' : 'guests'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleGuestsChange(-1)}
            disabled={guests <= 1}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition-colors hover:border-slate-500 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="w-5 text-center text-[14px] font-[700] text-slate-900">{guests}</span>
          <button
            type="button"
            onClick={() => handleGuestsChange(1)}
            disabled={guests >= stay.guests}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition-colors hover:border-slate-500 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Price breakdown — only when dates selected */}
      {hasDateRange && (
        <div className="mb-4 space-y-2.5 rounded-[10px] bg-slate-50 px-4 py-3 text-[13px]">
          <div className="flex justify-between text-slate-600">
            <span>{formatPence(stay.pricePerNight)} &times; {nights} night{nights !== 1 ? 's' : ''}</span>
            <span className="font-[600] text-slate-900">{formatPence(subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Cleaning fee</span>
            <span className="font-[600] text-slate-900">{formatPence(stay.cleaningFee)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Service fee</span>
            <span className="font-[600] text-slate-900">{formatPence(stay.serviceFee)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2.5 text-[14px] font-[800] text-slate-950">
            <span>Total</span>
            <span>{formatPence(subtotal + stay.cleaningFee + stay.serviceFee)}</span>
          </div>
        </div>
      )}

      {/* CTA button */}
      {stay.instantBook ? (
        <button
          type="button"
          onClick={handleBook}
          disabled={!hasDateRange}
          className="mb-2 flex w-full items-center justify-center gap-2 rounded-[8px] bg-blue-600 py-3.5 text-[15px] font-[800] text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Zap className="h-4 w-4" />
          {hasDateRange ? 'Instant book' : 'Select dates to book'}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleBook}
          disabled={!hasDateRange}
          className="mb-2 flex w-full items-center justify-center gap-2 rounded-[8px] bg-slate-800 py-3.5 text-[15px] font-[800] text-white transition-colors hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {hasDateRange ? 'Request to book' : 'Select dates to book'}
        </button>
      )}

      <p className="mb-4 text-center text-[12px] font-[500] text-slate-500">You won&apos;t be charged yet</p>

      {/* Trust badges */}
      <div className="rounded-[10px] border border-emerald-100 bg-emerald-50/60 p-3">
        <div className="mb-2 flex items-center gap-2 text-[12px] font-[800] text-emerald-700">
          <CheckCircle className="h-4 w-4" />
          Book with confidence
        </div>
        <div className="space-y-1.5 text-[12px] text-slate-600">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-3.5 w-3.5 shrink-0 text-blue-600" />Verified stay
          </div>
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 shrink-0 text-blue-600" />Secure payments
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-3.5 w-3.5 shrink-0 text-blue-600" />24/7 guest support
          </div>
        </div>
      </div>
    </div>
  )
}
