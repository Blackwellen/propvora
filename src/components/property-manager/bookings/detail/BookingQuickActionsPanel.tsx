'use client'

import {
  Pencil, MessageSquare, DoorOpen, Send, CreditCard, ListChecks,
  Calendar, Heart, Clock, Key, AlignLeft, Edit
} from 'lucide-react'
import type { Booking } from '@/lib/property-manager/bookings/types'
import { formatPence } from '@/lib/marketplace/money'

interface BookingQuickActionsPanelProps {
  booking: Booking
}

export default function BookingQuickActionsPanel({ booking }: BookingQuickActionsPanelProps) {
  return (
    <div className="space-y-4">
      {/* Card 1: Quick actions */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-5 h-5 rounded bg-blue-50 text-blue-700 flex items-center justify-center text-[10px] font-bold">1</span>
          <h3 className="font-semibold text-slate-800 text-sm">Quick actions</h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Pencil, label: 'Edit booking' },
            { icon: MessageSquare, label: 'Message guest' },
            { icon: DoorOpen, label: 'Check in guest' },
            { icon: Send, label: 'Send instructions' },
            { icon: CreditCard, label: 'Take payment' },
            { icon: ListChecks, label: 'Create task' },
          ].map(({ icon: Icon, label }) => (
            <button
              key={label}
              className="flex flex-col items-center gap-1 p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors"
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] font-medium text-center leading-tight">{label}</span>
            </button>
          ))}
        </div>
        <button className="mt-2 w-full border border-red-200 text-red-600 rounded-xl px-3 py-2 text-sm font-medium hover:bg-red-50 transition-colors">
          Cancel booking
        </button>
      </div>

      {/* Card 2: Financial snapshot */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-5 h-5 rounded bg-blue-50 text-blue-700 flex items-center justify-center text-[10px] font-bold">2</span>
          <h3 className="font-semibold text-slate-800 text-sm">Financial snapshot</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Total paid</p>
            <p className="text-lg font-bold text-emerald-600">{formatPence(booking.total_amount)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Outstanding</p>
            <p className="text-lg font-bold text-slate-400">{formatPence(0)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Payout estimate</p>
            <p className="text-lg font-bold text-slate-900">£548.25</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Deposit status</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <p className="text-sm font-semibold text-slate-700">Collected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Important dates */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-5 h-5 rounded bg-blue-50 text-blue-700 flex items-center justify-center text-[10px] font-bold">3</span>
          <h3 className="font-semibold text-slate-800 text-sm">Important dates</h3>
        </div>
        <div className="space-y-2.5">
          {[
            { icon: Calendar, label: 'Booked on', value: '17 Jun 2026, 09:14 AM' },
            { icon: DoorOpen, label: 'Arrival', value: '21 Jun 2026, 03:00 PM' },
            { icon: DoorOpen, label: 'Checkout', value: '24 Jun 2026, 11:00 AM' },
            { icon: Clock, label: 'Reminder schedule', value: '20 Jun, 21 Jun, 23 Jun' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-2">
              <Icon className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-slate-400">{label}</p>
                <p className="text-sm text-slate-700 font-medium">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Card 4: Housekeeping */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-5 h-5 rounded bg-blue-50 text-blue-700 flex items-center justify-center text-[10px] font-bold">4</span>
          <h3 className="font-semibold text-slate-800 text-sm">Housekeeping / maintenance</h3>
        </div>
        <div className="space-y-2">
          {[
            { label: 'Cleaner', value: 'Anna Smith', badge: 'Assigned', badgeColor: 'text-blue-600 bg-blue-50' },
            { label: 'Turnaround', value: '21 Jun, 12:00 PM', badge: 'Scheduled', badgeColor: 'text-blue-600 bg-blue-50' },
            { label: 'Inspection', value: '24 Jun, 11:30 AM', badge: 'Scheduled', badgeColor: 'text-blue-600 bg-blue-50' },
            { label: 'Maintenance', value: 'None reported', badge: null, badgeColor: '' },
          ].map(({ label, value, badge, badgeColor }) => (
            <div key={label} className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-slate-400">{label}</p>
                <p className="text-sm text-slate-700">{value}</p>
              </div>
              {badge && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeColor}`}>
                  {badge}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Card 5: Communication shortcuts */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-5 h-5 rounded bg-blue-50 text-blue-700 flex items-center justify-center text-[10px] font-bold">5</span>
          <h3 className="font-semibold text-slate-800 text-sm">Communication shortcuts</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: Heart, label: 'Welcome message' },
            { icon: Key, label: 'Check-in instructions' },
            { icon: AlignLeft, label: 'House rules reminder' },
            { icon: Clock, label: 'Checkout reminder' },
            { icon: Heart, label: 'Thank you message' },
            { icon: Edit, label: 'Custom message' },
          ].map(({ icon: Icon, label }) => (
            <button
              key={label}
              className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors text-xs font-medium"
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
