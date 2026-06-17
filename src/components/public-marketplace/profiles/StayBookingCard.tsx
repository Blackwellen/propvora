'use client'

import { useState } from 'react'
import { Calendar, CheckCircle, ChevronDown, Lock, Star, Users, Zap } from 'lucide-react'
import type { PublicStay } from '@/lib/public-marketplace/types'

export default function StayBookingCard({ stay }: { stay: PublicStay }) {
  const [nights] = useState(3)
  const price = stay.pricePerNight / 100
  const cleaning = stay.cleaningFee / 100
  const service = stay.serviceFee / 100
  const taxes = stay.taxes / 100
  const total = price * nights + cleaning + service + taxes

  return (
    <div className="rounded-[14px] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <span className="text-[24px] font-[800] leading-none text-slate-950">&pound;{price.toFixed(0)}</span>
          <span className="text-[14px] font-[500] text-slate-500"> / night</span>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-1">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="text-[14px] font-[800] text-slate-950">{stay.rating}</span>
            <span className="text-[13px] text-slate-500">({stay.reviewCount} reviews)</span>
          </div>
          <p className="mt-0.5 text-[12px] font-[600] text-slate-500">Excellent location</p>
        </div>
      </div>

      <div className="mb-4 overflow-hidden rounded-[10px] border border-slate-200">
        <div className="grid grid-cols-2 divide-x divide-slate-200">
          <div className="flex gap-3 p-4">
            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
            <div>
              <div className="text-[12px] font-[800] text-slate-800">Check in</div>
              <div className="mt-0.5 text-[13px] font-[500] text-slate-500">Add dates</div>
            </div>
          </div>
          <div className="flex gap-3 p-4">
            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
            <div>
              <div className="text-[12px] font-[800] text-slate-800">Check out</div>
              <div className="mt-0.5 text-[13px] font-[500] text-slate-500">Add dates</div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 p-4">
          <div className="flex gap-3">
            <Users className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
            <div>
              <div className="text-[12px] font-[800] text-slate-800">Guests</div>
              <div className="mt-0.5 text-[13px] font-[500] text-slate-500">{Math.min(2, stay.guests)} guests</div>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-500" />
        </div>
      </div>

      {stay.instantBook && (
        <button className="mb-3 flex w-full items-center justify-center gap-2 rounded-[8px] bg-blue-600 py-3.5 text-[15px] font-[800] text-white transition-colors hover:bg-blue-700">
          <Zap className="h-4 w-4" />
          Instant book
        </button>
      )}

      <button className="mb-3 w-full rounded-[8px] border border-blue-600 py-3.5 text-[15px] font-[800] text-blue-600 transition-colors hover:bg-blue-50">
        Request to book
      </button>

      <p className="mb-5 text-center text-[12px] font-[500] text-slate-500">You won&apos;t be charged yet</p>

      <div className="space-y-3 text-[13px]">
        <div className="flex justify-between">
          <span className="text-slate-600">&pound;{price.toFixed(0)} x {nights} nights</span>
          <span className="font-[600] text-slate-900">&pound;{(price * nights).toFixed(0)}</span>
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
      </div>

      <div className="mt-5 rounded-[10px] border border-emerald-100 bg-emerald-50/60 p-3">
        <div className="mb-2 flex items-center gap-2 text-[12px] font-[800] text-emerald-700">
          <CheckCircle className="h-4 w-4" />
          Price match guarantee
        </div>
        <div className="space-y-2 text-[12px] text-slate-600">
          <div className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 shrink-0 text-blue-600" />Verified stays</div>
          <div className="flex items-center gap-2"><Lock className="h-3.5 w-3.5 shrink-0 text-blue-600" />Secure payments</div>
          <div className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 shrink-0 text-blue-600" />24/7 guest support</div>
        </div>
      </div>
    </div>
  )
}
