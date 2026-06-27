'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

const TAB_DEFS = [
  { key: 'all', label: 'All bookings' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'arrivals', label: 'Arrivals' },
  { key: 'checked_in', label: 'Checked in' },
  { key: 'checked_out', label: 'Checked out' },
  { key: 'pending', label: 'Pending' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'long_term', label: 'Long-term rentals' },
  // Disputes lives at its own route but appears in the Bookings tab row.
  { key: 'disputes', label: 'Disputes', href: '/property-manager/bookings/disputes' },
]

export interface BookingTabCounts {
  all: number
  confirmed: number
  arrivals: number
  checked_in: number
  checked_out: number
  pending: number
  cancelled: number
  long_term: number
  disputes: number
}

interface BookingStatusTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
  counts: BookingTabCounts
}

export default function BookingStatusTabs({ activeTab, onTabChange, counts }: BookingStatusTabsProps) {
  return (
    <div className="mt-6 border-b border-slate-200">
      <div className="relative">
      <div className="flex gap-0 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] after:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-8 after:bg-gradient-to-l after:from-white after:to-transparent after:pointer-events-none">
        {TAB_DEFS.map((tab) => {
          const isActive = activeTab === tab.key
          const count = counts[tab.key as keyof BookingTabCounts] ?? 0
          const className = cn(
            'flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
            isActive
              ? 'border-[var(--brand)] text-[var(--brand)] font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          )
          const badge = (
            <span
              className={cn(
                'text-xs px-1.5 py-0.5 rounded-full',
                isActive ? 'bg-[var(--brand-soft)] text-[var(--brand)]' : 'bg-slate-100 text-slate-500'
              )}
            >
              {count}
            </span>
          )

          if (tab.href) {
            return (
              <Link key={tab.key} href={tab.href} className={className}>
                {tab.label}
                {badge}
              </Link>
            )
          }
          return (
            <button key={tab.key} onClick={() => onTabChange(tab.key)} className={className}>
              {tab.label}
              {badge}
            </button>
          )
        })}
      </div>
      </div>
    </div>
  )
}
