'use client'

import { CalendarCheck, Moon, Users, CreditCard, DollarSign } from 'lucide-react'
import type { Booking } from '@/lib/property-manager/bookings/types'
import { formatPence } from '@/lib/marketplace/money'

interface BookingSummaryStripProps {
  booking: Booking
}

export default function BookingSummaryStrip({ booking }: BookingSummaryStripProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm mt-6 p-0 overflow-hidden">
      <div className="grid grid-cols-7 divide-x divide-slate-100">
        {/* 1. Guest */}
        <div className="px-4 py-4">
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-2">Guest</p>
          <div className="flex items-center gap-2">
            <img
              src={booking.guest_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(booking.guest_name)}&size=32`}
              alt={booking.guest_name}
              className="w-8 h-8 rounded-full object-cover shrink-0"
            />
            <div>
              <p className="text-sm font-semibold text-slate-900">{booking.guest_name}</p>
              <p className="text-xs text-emerald-600">Repeat guest</p>
            </div>
          </div>
        </div>

        {/* 2. Property */}
        <div className="px-4 py-4">
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-2">Property</p>
          <div className="flex items-center gap-2">
            {booking.property_image && (
              <img
                src={booking.property_image}
                alt={booking.property_name}
                className="w-8 h-8 rounded-lg object-cover shrink-0"
              />
            )}
            <div>
              <p className="text-sm font-medium text-slate-900 leading-tight">{booking.property_name}</p>
              <p className="text-xs text-slate-400">{booking.property_location.split(',')[0]}</p>
            </div>
          </div>
        </div>

        {/* 3. Dates */}
        <div className="px-4 py-4">
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-2">Dates</p>
          <div className="flex items-center gap-1">
            <CalendarCheck className="w-4 h-4 text-[var(--brand)] shrink-0" />
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {booking.check_in_date} → {booking.check_out_date}
              </p>
              <p className="text-xs text-slate-400">Check-in 3:00 PM / Check-out 11:00 AM</p>
            </div>
          </div>
        </div>

        {/* 4. Nights */}
        <div className="px-4 py-4">
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-2">Nights</p>
          <div className="flex items-center gap-1.5">
            <Moon className="w-4 h-4 text-indigo-500 shrink-0" />
            <div>
              <p className="text-2xl font-bold text-slate-900">{booking.nights ?? '—'}</p>
              <p className="text-xs text-slate-400">
                {booking.booking_type === 'long_term' ? 'Long-term' : 'Short stay'}
              </p>
            </div>
          </div>
        </div>

        {/* 5. Guests */}
        <div className="px-4 py-4">
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-2">Guests</p>
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-purple-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-slate-900">2 adults</p>
              <p className="text-xs text-slate-400">No children</p>
            </div>
          </div>
        </div>

        {/* 6. Payment */}
        <div className="px-4 py-4">
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-2">Payment</p>
          <div className="flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-green-500 shrink-0" />
            <div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <p className="text-sm font-semibold text-emerald-600">Paid</p>
              </div>
              <p className="text-xs text-slate-400">Paid on 17 Jun 2026</p>
            </div>
          </div>
        </div>

        {/* 7. Total */}
        <div className="px-4 py-4">
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-2">Total</p>
          <div className="flex items-start gap-1">
            <DollarSign className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
            <div>
              <p className="text-2xl font-bold text-slate-900">{formatPence(booking.total_amount)}</p>
              <p className="text-xs text-emerald-600">Paid in full</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
