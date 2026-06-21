'use client'

import { CalendarCheck, BedDouble, CalendarClock, Coins, Home } from 'lucide-react'
import type { Booking } from '@/lib/property-manager/bookings/types'

// KPI cards accept bookings prop so values derive from live data (or empty array
// when bookings table migration is not yet applied). No seed data used here.

function isArrivalSoon(checkInDate: string, status: string): boolean {
  if (status !== 'confirmed') return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const checkIn = new Date(checkInDate)
  checkIn.setHours(0, 0, 0, 0)
  const diffDays = (checkIn.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays >= 0 && diffDays <= 7
}

function formatPence(pence: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pence / 100)
}

export default function BookingKpiCards({ bookings = [] }: { bookings?: Booking[] }) {
  const upcomingArrivals = bookings.filter((b) => isArrivalSoon(b.check_in_date, b.status)).length
  const activeStays = bookings.filter((b) => b.status === 'checked_in').length
  const nightsBooked = bookings.reduce((sum, b) => sum + (b.nights ?? 0), 0)
  const revenue = bookings.reduce((sum, b) => sum + b.total_amount, 0)
  const longTermCount = bookings.filter((b) => b.booking_type === 'long_term').length

  const KPI_CARDS = [
    {
      label: 'Upcoming arrivals',
      value: String(upcomingArrivals),
      subtitle: 'Next 7 days',
      trend: null,
      icon: CalendarCheck,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Active stays',
      value: String(activeStays),
      subtitle: 'Currently in house',
      trend: null,
      icon: BedDouble,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      label: 'Nights booked',
      value: String(nightsBooked),
      subtitle: 'Across all bookings',
      trend: null,
      icon: CalendarClock,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      label: 'Revenue (indic.)',
      value: formatPence(revenue),
      subtitle: 'All bookings total',
      trend: null,
      icon: Coins,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      label: 'Long-term tenancies',
      value: String(longTermCount),
      subtitle: 'Long-term bookings',
      trend: null,
      icon: Home,
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-600',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6">
      {KPI_CARDS.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.label}
            className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                <Icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">{card.value}</p>
            <p className="text-sm text-slate-500 mt-0.5">{card.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{card.subtitle}</p>
          </div>
        )
      })}
    </div>
  )
}
