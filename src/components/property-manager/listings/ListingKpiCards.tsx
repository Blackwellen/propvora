'use client'

import { LayoutList, FileEdit, Globe, Percent, TrendingUp, Wifi } from 'lucide-react'
import type { Listing } from '@/lib/property-manager/listings/types'

// Accepts listings prop so KPIs derive from live data (or empty array when
// listings table migration is not yet applied). No seed data used.
export default function ListingKpiCards({ listings = [] }: { listings?: Listing[] }) {

  const liveCount = listings.filter((l) => l.status === 'live').length
  const draftCount = listings.filter((l) => l.status === 'draft' || !l.published).length
  const directCount = listings.filter((l) => l.channels.some((c) => c.name === 'direct')).length

  // Average occupancy across listings that have it
  const occupancyListings = listings.filter((l) => l.occupancy_mtd != null)
  const avgOccupancy = occupancyListings.length > 0
    ? Math.round(occupancyListings.reduce((sum, l) => sum + (l.occupancy_mtd ?? 0), 0) / occupancyListings.length)
    : 0

  // Average ADR across listings that have it
  const adrListings = listings.filter((l) => l.adr_mtd != null)
  const avgAdr = adrListings.length > 0
    ? Math.round(adrListings.reduce((sum, l) => sum + (l.adr_mtd ?? 0), 0) / adrListings.length / 100)
    : 0

  const KPI_CARDS = [
    {
      label: 'Live listings',
      value: String(liveCount),
      icon: LayoutList,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      label: 'Draft / unpublished',
      value: String(draftCount),
      icon: FileEdit,
      iconBg: 'bg-slate-50',
      iconColor: 'text-slate-600',
    },
    {
      label: 'Direct-booking enabled',
      value: String(directCount),
      icon: Globe,
      iconBg: 'bg-[var(--brand-soft)]',
      iconColor: 'text-[var(--brand)]',
    },
    {
      label: 'Occupancy (MTD avg)',
      value: `${avgOccupancy}%`,
      icon: Percent,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      label: 'Avg nightly rate (MTD)',
      value: `£${avgAdr}`,
      icon: TrendingUp,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      label: 'Channel sync health',
      value: listings.length > 0 ? `${Math.round((listings.filter((l) => l.channels.length > 0).length / listings.length) * 100)}%` : '0%',
      icon: Wifi,
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-600',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 mt-6">
      {KPI_CARDS.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.label}
            className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                <Icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{card.value}</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-snug">{card.label}</p>
          </div>
        )
      })}
    </div>
  )
}
