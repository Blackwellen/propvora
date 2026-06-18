'use client'

import { CalendarCheck, BedDouble, CalendarClock, Coins, Home, TrendingUp } from 'lucide-react'

const KPI_CARDS = [
  {
    label: 'Upcoming arrivals',
    value: '18',
    subtitle: 'Next 7 days',
    trend: '+12%',
    icon: CalendarCheck,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    label: 'Active stays',
    value: '46',
    subtitle: 'Currently in house',
    trend: '+8%',
    icon: BedDouble,
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600',
  },
  {
    label: 'Nights booked',
    value: '386',
    subtitle: 'This month',
    trend: '+15%',
    icon: CalendarClock,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
  },
  {
    label: 'Revenue (indic.)',
    value: '£28,430',
    subtitle: 'This month',
    trend: '+11%',
    icon: Coins,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
  {
    label: 'Long-term tenancies',
    value: '22',
    subtitle: 'Active tenancies',
    trend: '+5%',
    icon: Home,
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-600',
  },
]

export default function BookingKpiCards() {
  return (
    <div className="grid grid-cols-5 gap-4 mt-6">
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
              <span className="flex items-center gap-1 text-sm text-emerald-600 font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                {card.trend}
              </span>
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
