'use client'

import { X, Mail, Phone, MessageSquare, ExternalLink } from 'lucide-react'
import type { Booking } from '@/lib/property-manager/bookings/types'
import { formatPence } from '@/lib/marketplace/money'
import BookingStatusBadge from './BookingStatusBadge'
import Link from 'next/link'

interface BookingPreviewPanelProps {
  booking: Booking | null
  onClose: () => void
}

const PRICING_BREAKDOWN = [
  { label: 'Accommodation', pence: 51000 },
  { label: 'Cleaning fee', pence: 4500 },
  { label: 'Service fee', pence: 3000 },
  { label: 'VAT (20%)', pence: 12000 },
]

export default function BookingPreviewPanel({ booking, onClose }: BookingPreviewPanelProps) {
  if (!booking) {
    return (
      <div className="w-80 shrink-0 border-l border-slate-200 bg-white overflow-y-auto flex items-center justify-center">
        <p className="text-slate-400 text-sm text-center px-6">
          Select a booking to view guest, stay, payment and operations details.
        </p>
      </div>
    )
  }

  const total = PRICING_BREAKDOWN.reduce((s, i) => s + i.pence, 0)

  return (
    <div className="w-80 shrink-0 border-l border-slate-200 bg-white overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">{booking.booking_reference}</span>
          <BookingStatusBadge status={booking.status} />
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-5 flex-1">
        {/* Guest */}
        <div>
          <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Guest</p>
          <div className="flex items-start gap-3">
            <img
              src={booking.guest_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(booking.guest_name)}&size=40`}
              alt={booking.guest_name}
              className="w-10 h-10 rounded-full object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 text-sm">{booking.guest_name}</p>
              {booking.guest_email && (
                <p className="text-xs text-slate-500 truncate">{booking.guest_email}</p>
              )}
              {booking.guest_phone && (
                <p className="text-xs text-slate-500">{booking.guest_phone}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <button className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors">
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors">
              <Mail className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors">
              <Phone className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Property */}
        <div>
          <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Property</p>
          <div className="flex items-start gap-3">
            {booking.property_image && (
              <img
                src={booking.property_image}
                alt={booking.property_name}
                className="w-12 h-12 rounded-lg object-cover shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900">{booking.property_name}</p>
              <p className="text-xs text-slate-400">{booking.property_location}</p>
              <Link href="/property-manager/portfolio" className="text-xs text-blue-600 hover:underline">
                View property
              </Link>
            </div>
          </div>
        </div>

        {/* Stay details */}
        <div>
          <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Stay</p>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <p className="text-[10px] text-slate-400 font-medium">Check-in</p>
              <p className="text-sm font-semibold text-slate-900">{booking.check_in_date}</p>
              <p className="text-xs text-slate-400">3:00 PM</p>
            </div>
            <span className="text-slate-300 text-lg">→</span>
            <div className="flex-1">
              <p className="text-[10px] text-slate-400 font-medium">Check-out</p>
              <p className="text-sm font-semibold text-slate-900">{booking.check_out_date}</p>
              <p className="text-xs text-slate-400">11:00 AM</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-medium">Nights</p>
              <p className="text-sm font-semibold text-slate-900">{booking.nights ?? '—'}</p>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div>
          <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Pricing</p>
          <div className="space-y-1.5">
            {PRICING_BREAKDOWN.map((item) => (
              <div key={item.label} className="flex justify-between text-sm">
                <span className="text-slate-600">{item.label}</span>
                <span className="text-slate-700">{formatPence(item.pence)}</span>
              </div>
            ))}
            <hr className="my-2 border-slate-100" />
            <div className="flex justify-between text-sm font-bold">
              <span className="text-slate-900">Total</span>
              <span className="text-slate-900">{formatPence(total)}</span>
            </div>
          </div>
        </div>

        {/* Meta */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Payment status</span>
            <span className="text-emerald-600 font-medium capitalize">{booking.payment_status}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Source</span>
            <span className="text-slate-700">{booking.source_channel}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Booked on</span>
            <span className="text-slate-700">17 Jun 2026</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Guests</span>
            <span className="text-slate-700">2 adults</span>
          </div>
          <div className="text-sm">
            <p className="text-slate-400 mb-0.5">Special requests</p>
            <p className="text-slate-700">Late check-in (after 10pm)</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <button className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            View payment
          </button>
          <Link
            href={`/property-manager/bookings/${booking.id}`}
            className="flex-1 bg-blue-600 text-white rounded-xl px-3 py-2 text-sm font-medium text-center hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
          >
            Edit booking
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        <p className="text-xs text-slate-400 text-center">You can cancel or modify this booking.</p>
      </div>
    </div>
  )
}
