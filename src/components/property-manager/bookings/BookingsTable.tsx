'use client'

import { Eye, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import type { Booking } from '@/lib/property-manager/bookings/types'
import { formatPence } from '@/lib/marketplace/money'
import { cn } from '@/lib/utils'
import BookingStatusBadge from './BookingStatusBadge'

interface BookingsTableProps {
  bookings: Booking[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export default function BookingsTable({ bookings, selectedId, onSelect }: BookingsTableProps) {
  return (
    <div className="mt-4 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="w-10 px-4 py-3">
                <input type="checkbox" className="rounded border-slate-300" />
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider min-w-[260px]">
                Guest / Booking
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider min-w-[200px]">
                Property
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider min-w-[180px]">
                Dates
              </th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold text-slate-500 uppercase tracking-wider w-20">
                Nights
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider w-28">
                Status
              </th>
              <th className="px-4 py-3 text-right text-[10px] font-semibold text-slate-500 uppercase tracking-wider w-28">
                Total
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider w-24">
                Source
              </th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold text-slate-500 uppercase tracking-wider w-20">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bookings.map((booking) => {
              const isSelected = selectedId === booking.id
              return (
                <tr
                  key={booking.id}
                  onClick={() => onSelect(booking.id)}
                  className={cn(
                    'cursor-pointer hover:bg-slate-50 transition-colors',
                    isSelected && 'bg-sky-50 border-l-2 border-l-blue-600'
                  )}
                >
                  <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" className="rounded border-slate-300" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={booking.guest_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(booking.guest_name)}&size=36`}
                        alt={booking.guest_name}
                        className="w-9 h-9 rounded-full object-cover shrink-0"
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{booking.guest_name}</p>
                        <p className="text-xs text-slate-400">{booking.booking_reference}</p>
                        <span className="inline-block mt-0.5 bg-blue-50 text-blue-700 text-[10px] px-1.5 py-0.5 rounded-full">
                          {booking.booking_type === 'long_term' ? 'Long-term' : 'Short stay'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      {booking.property_image && (
                        <img
                          src={booking.property_image}
                          alt={booking.property_name}
                          className="w-10 h-10 rounded-lg object-cover shrink-0"
                        />
                      )}
                      <div>
                        <p className="text-sm font-medium text-slate-800">{booking.property_name}</p>
                        <p className="text-xs text-slate-400">{booking.property_location}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm text-slate-700">
                      {booking.check_in_date} → {booking.check_out_date}
                    </p>
                    {booking.status_note && (
                      <p className={cn(
                        'text-xs mt-0.5',
                        booking.status === 'checked_in' ? 'text-emerald-600' :
                        booking.status === 'pending' ? 'text-amber-600' :
                        'text-blue-600'
                      )}>
                        {booking.status_note}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="text-sm text-slate-700">
                      {booking.nights ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <BookingStatusBadge status={booking.status} />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <p className="text-sm font-semibold text-slate-900">{formatPence(booking.total_amount)}</p>
                    <p className={cn(
                      'text-xs',
                      booking.payment_status === 'paid' ? 'text-emerald-600' :
                      booking.payment_status === 'monthly' ? 'text-blue-600' :
                      'text-slate-400'
                    )}>
                      {booking.payment_status === 'paid' ? 'Paid' :
                       booking.payment_status === 'monthly' ? 'Monthly' :
                       booking.payment_status === 'unpaid' ? 'Unpaid' : 'Partial'}
                    </p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm text-slate-600">{booking.source_channel}</span>
                  </td>
                  <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <Link
                        href={`/property-manager/bookings/${booking.id}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        title="View booking"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        title="More options"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3.5 border-t border-slate-100">
        <p className="text-sm text-slate-500">Showing 1 to 8 of 142 bookings</p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((page) => (
            <button
              key={page}
              className={cn(
                'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                page === 1
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              {page}
            </button>
          ))}
          <span className="text-slate-400 px-1">...</span>
          <button className="w-8 h-8 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            18
          </button>
        </div>
        <select className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option>10 / page</option>
          <option>25 / page</option>
          <option>50 / page</option>
        </select>
      </div>
    </div>
  )
}
