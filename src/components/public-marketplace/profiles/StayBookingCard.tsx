'use client'

import { useState } from 'react'
import { Star, Zap, Lock, CheckCircle } from 'lucide-react'
import type { PublicStay } from '@/lib/public-marketplace/types'

export default function StayBookingCard({ stay }: { stay: PublicStay }) {
  const [nights] = useState(3)
  const price = stay.pricePerNight / 100
  const cleaning = stay.cleaningFee / 100
  const service = stay.serviceFee / 100
  const taxes = stay.taxes / 100
  const total = price * nights + cleaning + service + taxes

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sticky top-20">
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="text-2xl font-bold text-slate-900">£{price.toFixed(0)}</span>
          <span className="text-slate-500 text-sm"> / night</span>
        </div>
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
          <span className="font-semibold text-slate-900">{stay.rating}</span>
          <span className="text-sm text-slate-500">({stay.reviewCount})</span>
        </div>
      </div>

      {/* Date/guest picker */}
      <div className="border border-slate-200 rounded-xl overflow-hidden mb-3">
        <div className="grid grid-cols-2 divide-x divide-slate-200">
          <div className="p-3">
            <div className="text-xs font-semibold text-slate-700">Check in</div>
            <input type="date" className="text-sm text-slate-500 mt-0.5 bg-transparent outline-none w-full" />
          </div>
          <div className="p-3">
            <div className="text-xs font-semibold text-slate-700">Check out</div>
            <input type="date" className="text-sm text-slate-500 mt-0.5 bg-transparent outline-none w-full" />
          </div>
        </div>
        <div className="border-t border-slate-200 p-3">
          <div className="text-xs font-semibold text-slate-700">Guests</div>
          <select className="text-sm text-slate-500 mt-0.5 bg-transparent outline-none w-full">
            {Array.from({ length: stay.guests }, (_, i) => i + 1).map(n => (
              <option key={n}>{n} guest{n > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>
      </div>

      {stay.instantBook && (
        <button className="w-full py-3 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl mb-3 transition-colors text-sm">
          <Zap className="h-4 w-4 text-blue-600" />
          Instant book
        </button>
      )}

      <button className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors mb-2">
        Request to book
      </button>

      <p className="text-center text-xs text-slate-500 mb-4">You won&apos;t be charged yet</p>

      {/* Price breakdown */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-600">£{price.toFixed(0)} × {nights} nights</span>
          <span className="text-slate-900">£{(price * nights).toFixed(0)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Cleaning fee</span>
          <span className="text-slate-900">£{cleaning.toFixed(0)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Service fee</span>
          <span className="text-slate-900">£{service.toFixed(0)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Taxes</span>
          <span className="text-slate-900">£{taxes.toFixed(0)}</span>
        </div>
        <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-2">
          <span>Total</span>
          <span>£{total.toFixed(0)} GBP</span>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-xl">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 mb-2">
          <CheckCircle className="h-4 w-4" />
          Price match guarantee
        </div>
        <div className="space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />Verified stays</div>
          <div className="flex items-center gap-1.5"><Lock className="h-3 w-3 text-emerald-500 shrink-0" />Secure payments</div>
          <div className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />24/7 guest support</div>
        </div>
      </div>
    </div>
  )
}
