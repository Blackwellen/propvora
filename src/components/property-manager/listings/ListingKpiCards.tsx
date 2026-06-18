'use client'

import { LayoutList, FileEdit, Globe, Percent, TrendingDown, TrendingUp, Wifi } from 'lucide-react'

const KPI_CARDS = [
  {
    label: 'Live listings',
    value: '112',
    trend: '+12% vs last month',
    trendUp: true,
    icon: LayoutList,
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600',
  },
  {
    label: 'Draft / unpublished',
    value: '18',
    trend: '-5% vs last month',
    trendUp: false,
    icon: FileEdit,
    iconBg: 'bg-slate-50',
    iconColor: 'text-slate-600',
  },
  {
    label: 'Direct-booking enabled',
    value: '78',
    trend: '+16% vs last month',
    trendUp: true,
    icon: Globe,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    label: 'Occupancy (MTD)',
    value: '64%',
    trend: '+6 pp vs last month',
    trendUp: true,
    icon: Percent,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
  },
  {
    label: 'Avg nightly rate (MTD)',
    value: '£182',
    trend: '+8% vs last month',
    trendUp: true,
    icon: TrendingUp,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
  {
    label: 'Channel sync health',
    value: '96%',
    trend: '+3% vs last month',
    trendUp: true,
    icon: Wifi,
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-600',
  },
]

export default function ListingKpiCards() {
  return (
    <div className="grid grid-cols-6 gap-3 mt-6">
      {KPI_CARDS.map((card) => {
        const Icon = card.icon
        const TrendIcon = card.trendUp ? TrendingUp : TrendingDown
        return (
          <div
            key={card.label}
            className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                <Icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>
              <span className={`flex items-center gap-0.5 text-xs font-medium ${card.trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
                <TrendIcon className="w-3 h-3" />
                {card.trend.split(' ')[0]}
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{card.value}</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-snug">{card.label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{card.trend}</p>
          </div>
        )
      })}
    </div>
  )
}
