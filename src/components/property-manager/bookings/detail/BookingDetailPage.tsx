'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronRight, Pencil, MessageSquare, DoorOpen, ChevronDown,
  MapPin, CheckCircle2, Clock, AlertCircle, Download, X,
  ChevronLeft, CreditCard
} from 'lucide-react'
import type { Booking } from '@/lib/property-manager/bookings/types'
import { formatPence } from '@/lib/marketplace/money'
import BookingStatusBadge from '../BookingStatusBadge'
import BookingSummaryStrip from './BookingSummaryStrip'
import ReservationJourneyCard from './ReservationJourneyCard'
import BookingQuickActionsPanel from './BookingQuickActionsPanel'

interface BookingDetailPageProps {
  bookingId: string
}

const OPERATIONS_CHECKLIST = [
  { label: 'ID verified', status: 'completed', note: '' },
  { label: 'House rules accepted', status: 'completed', note: '' },
  { label: 'Access code scheduled', status: 'scheduled', note: '20 Jun, 03:00 PM' },
  { label: 'Cleaner assigned', status: 'scheduled', note: '21 Jun, 12:00 PM' },
  { label: 'Welcome message sent', status: 'completed', note: '17 Jun, 10:15 AM' },
  { label: 'Deposit collected', status: 'completed', note: '£200.00' },
  { label: 'Issue flag', status: 'none', note: 'None' },
]

const ACTIVITY_LOG = [
  { time: 'Today, 10:24 AM', desc: 'You updated check-in instructions schedule' },
  { time: '17 Jun, 09:20 AM', desc: 'Payment captured — £645.00 captured via Visa **** 4242' },
  { time: '17 Jun, 09:14 AM', desc: 'Booking created — Manual booking via Direct channel' },
]

function SimpleModal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children?: React.ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children ?? (
          <p className="text-sm text-slate-500">This feature is coming soon.</p>
        )}
        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-[var(--brand)] text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-[var(--brand-strong)] transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BookingDetailPage({ bookingId }: BookingDetailPageProps) {
  const [imageIndex] = useState(0)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [showCheckinModal, setShowCheckinModal] = useState(false)

  // Bookings table not yet migrated — no live data available yet.
  // When the bookingManagement flag is enabled and migration applied, replace
  // this placeholder with a live Supabase query scoped to workspaceId.
  // The booking object below is cast to avoid TS errors on the existing JSX;
  // the null check above ensures this component is never actually rendered.
  const _bookingMaybe: Booking | null = null

  if (!_bookingMaybe) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-[15px] font-semibold text-slate-700 mb-1">Booking not found</p>
        <p className="text-[13px] text-slate-400 mb-6">
          This booking may not exist yet or the bookings table has not been migrated.
        </p>
        <Link
          href="/property-manager/bookings"
          className="text-sm text-[var(--brand)] hover:text-[var(--brand)] font-medium"
        >
          ← Back to Bookings
        </Link>
      </div>
    )
  }

  // Dead code path — only reached when a live booking is passed in future.
  const booking = _bookingMaybe as Booking

  const PROPERTY_IMAGES = [
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
  ]

  return (
    <div className="py-6 max-w-full">
      {/* Modals */}
      <SimpleModal open={showEditModal} title="Edit booking" onClose={() => setShowEditModal(false)} />
      <SimpleModal open={showMessageModal} title="Message guest" onClose={() => setShowMessageModal(false)} />
      <SimpleModal open={showCheckinModal} title="Check in guest" onClose={() => setShowCheckinModal(false)} />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500 mb-4">
        <Link href="/property-manager/bookings" className="hover:text-slate-700 transition-colors">
          Bookings
        </Link>
        <ChevronRight className="w-4 h-4 text-slate-300" />
        <span className="text-slate-400">{booking.booking_reference}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Booking details</h1>
            <BookingStatusBadge status={booking.status} />
            <span className="inline-flex items-center rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600">
              {booking.source_channel}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Created on 17 Jun 2026 • Last updated today at 10:24 AM by you
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-1.5 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Edit booking
          </button>
          <button
            onClick={() => setShowMessageModal(true)}
            className="flex items-center gap-1.5 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Send message
          </button>
          <button
            onClick={() => setShowCheckinModal(true)}
            className="flex items-center gap-1.5 bg-[var(--brand)] text-white rounded-xl px-3.5 py-2 text-sm font-medium hover:bg-[var(--brand-strong)] transition-colors"
          >
            <DoorOpen className="w-4 h-4" />
            Check in
          </button>
          <button className="flex items-center gap-1.5 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            More
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary strip */}
      <BookingSummaryStrip booking={booking} />

      {/* Two-column layout */}
      <div className="mt-6 flex gap-5">
        {/* LEFT 70% */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* A. Stay overview */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center text-xs font-bold">A</div>
              <h3 className="font-semibold text-slate-800">Stay overview</h3>
            </div>
            <div className="grid grid-cols-2 gap-5">
              {/* Property image */}
              <div className="relative">
                <div className="aspect-video w-full relative rounded-xl overflow-hidden">
                  <img
                    src={PROPERTY_IMAGES[imageIndex]}
                    alt={booking.property_name}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-2 left-2 bg-slate-900/70 text-white text-xs px-2 py-0.5 rounded-full">
                    1 / 24
                  </span>
                  <button className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-slate-700 flex items-center justify-center hover:bg-white transition-colors shadow-sm">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-slate-700 flex items-center justify-center hover:bg-white transition-colors shadow-sm">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Property info */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-xl font-bold text-slate-900">{booking.property_name}</h4>
                  <span className="inline-flex items-center bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2.5 py-0.5 text-xs font-medium">
                    Verified
                  </span>
                </div>
                <div className="flex items-start gap-1 text-sm text-slate-500 mt-1">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
                  65 Redchurch Street, {booking.property_location}, UK
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  {[
                    ['Booking ID', booking.booking_reference],
                    ['Source', booking.source_channel],
                    ['Listing type', 'Entire home/apt'],
                    ['Guests', '2 adults'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs text-slate-400">{label}</p>
                      <p className="text-sm font-medium text-slate-700">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  {['Entire home', '2 beds', '2 baths', 'Fast Wi-Fi', 'Kitchen', 'Washer'].map((feat) => (
                    <span
                      key={feat}
                      className="bg-slate-50 border border-slate-200 text-slate-600 text-xs px-2.5 py-1 rounded-full"
                    >
                      {feat}
                    </span>
                  ))}
                </div>

                <div className="mt-4">
                  <p className="text-xs text-slate-400 font-medium mb-1">Booking notes</p>
                  <p className="text-sm text-slate-600 italic">
                    "Arriving late evening. Looking forward to the stay for a weekend getaway."
                  </p>
                  <button className="text-xs text-[var(--brand)] hover:text-[var(--brand)] mt-1">Edit</button>
                </div>
              </div>
            </div>
          </div>

          {/* B. Guest profile */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center text-xs font-bold">B</div>
              <h3 className="font-semibold text-slate-800">Guest profile</h3>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {/* Left */}
              <div>
                <div className="flex items-start gap-3 mb-4">
                  <img
                    src={booking.guest_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(booking.guest_name)}&size=80`}
                    alt={booking.guest_name}
                    className="w-20 h-20 rounded-2xl object-cover shrink-0"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900">{booking.guest_name}</h4>
                    <span className="inline-flex items-center bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5 text-xs font-medium mt-1">
                      Repeat guest
                    </span>
                    {booking.guest_email && (
                      <p className="text-sm text-slate-500 mt-2 flex items-center gap-1.5">
                        <span className="text-slate-400">✉</span>
                        {booking.guest_email}
                      </p>
                    )}
                    {booking.guest_phone && (
                      <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <span className="text-slate-400">📞</span>
                        {booking.guest_phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['ID verified', '✅ Verified'],
                    ['Review score', '★ 4.9'],
                    ['Communication', 'Email preferred'],
                    ['Emergency contact', 'Mark Johnson'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs text-slate-400">{label}</p>
                      <p className="text-sm text-slate-700 font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right (empty column for layout) */}
              <div className="flex flex-col justify-end">
                <div className="flex flex-wrap gap-2 mt-auto">
                  {['Open guest profile', 'Message', 'Call', 'View stay history'].map((action) => (
                    <button
                      key={action}
                      className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* C. Reservation journey */}
          <ReservationJourneyCard />

          {/* D. Payment & charges */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center text-xs font-bold">D</div>
              <h3 className="font-semibold text-slate-800">Payment & charges</h3>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {/* Fee breakdown */}
              <div>
                <div className="space-y-2">
                  {[
                    ['Nightly total (3 nights)', 51000],
                    ['Cleaning fee', 4500],
                    ['Service fee', 3000],
                    ['VAT (20%)', 6000],
                  ].map(([label, pence]) => (
                    <div key={label as string} className="flex justify-between text-sm">
                      <span className="text-slate-600">{label}</span>
                      <span className="text-slate-700">{formatPence(pence as number)}</span>
                    </div>
                  ))}
                  <hr className="my-2 border-slate-100" />
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Payout to owner (after fees)</span>
                    <span className="text-slate-500 font-medium">£548.25</span>
                  </div>
                  <p className="text-xs text-slate-400">Scheduled on 26 Jun 2026</p>
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-slate-500">Total</span>
                  <span className="text-2xl font-bold text-slate-900">{formatPence(booking.total_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Paid</span>
                  <span className="text-sm font-semibold text-emerald-600">{formatPence(booking.total_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Outstanding</span>
                  <span className="text-sm font-semibold text-slate-400">{formatPence(0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Payment method</span>
                  <div className="flex items-center gap-1.5">
                    <span className="bg-[var(--brand)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">VISA</span>
                    <span className="text-sm text-slate-700">**** 4242</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Paid on</span>
                  <span className="text-sm text-slate-700">17 Jun 2026, 09:20 AM</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Invoice / receipt</span>
                  <button className="flex items-center gap-1 text-sm text-[var(--brand)] hover:text-[var(--brand)] transition-colors">
                    <Download className="w-3.5 h-3.5" />
                    View receipt
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              {['View receipt', 'Take payment', 'Issue refund', 'Open ledger'].map((action) => (
                <button
                  key={action}
                  className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>

          {/* E. Operations & readiness */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center text-xs font-bold">E</div>
              <h3 className="font-semibold text-slate-800">Operations & readiness</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {OPERATIONS_CHECKLIST.map((item) => (
                <div key={item.label} className="flex items-start gap-2.5">
                  {item.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  ) : item.status === 'scheduled' ? (
                    <Clock className="w-5 h-5 text-[var(--brand)] shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-sm text-slate-700">{item.label}</p>
                    {item.note && (
                      <p className={`text-xs ${
                        item.status === 'completed' ? 'text-emerald-600' :
                        item.status === 'scheduled' ? 'text-[var(--brand)]' :
                        'text-slate-400'
                      }`}>{item.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* F. Stay rules, access & logistics */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center text-xs font-bold">F</div>
              <h3 className="font-semibold text-slate-800">Stay rules, access & logistics</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                ['Check-in method', 'Self check-in'],
                ['Access code', 'Sent 24h before arrival'],
                ['Parking', 'Street parking'],
                ['Wi-Fi', 'Property Wi-Fi (fiber)'],
                ['House manual', 'View guide →'],
                ['Pets', 'No pets allowed'],
                ['Quiet hours', '10:00 PM – 8:00 AM'],
                ['Special requests', 'Late check-in'],
                ['Accessibility', 'Lift access available'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className="text-sm text-slate-700 font-medium">
                    {value === 'View guide →' ? (
                      <button className="text-[var(--brand)] hover:text-[var(--brand)] transition-colors">{value}</button>
                    ) : value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* G. Notes & activity */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center text-xs font-bold">G</div>
                <h3 className="font-semibold text-slate-800">Notes & activity</h3>
              </div>
              <select className="border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]">
                <option>All activity</option>
                <option>Payments</option>
                <option>Messages</option>
                <option>System</option>
              </select>
            </div>
            <div className="space-y-4">
              {ACTIVITY_LOG.map((item) => (
                <div key={item.time} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--brand-soft)] flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4 text-[var(--brand)]" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">{item.time}</p>
                    <p className="text-sm text-slate-700">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="text-sm text-[var(--brand)] hover:text-[var(--brand)] transition-colors mt-4">
              View all activity →
            </button>
          </div>
        </div>

        {/* RIGHT 30% sticky */}
        <div className="w-72 shrink-0">
          <div className="sticky top-6">
            <BookingQuickActionsPanel booking={booking} />
          </div>
        </div>
      </div>
    </div>
  )
}
