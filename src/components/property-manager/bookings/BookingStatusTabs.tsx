'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

const TABS = [
  { key: 'all', label: 'All bookings', count: 142 },
  { key: 'confirmed', label: 'Confirmed', count: 96 },
  { key: 'arrivals', label: 'Arrivals', count: 18 },
  { key: 'checked_in', label: 'Checked in', count: 46 },
  { key: 'checked_out', label: 'Checked out', count: 32 },
  { key: 'pending', label: 'Pending', count: 14 },
  { key: 'cancelled', label: 'Cancelled', count: 10 },
  { key: 'long_term', label: 'Long-term rentals', count: 22 },
  // Disputes lives at its own route but appears in the Bookings tab row.
  { key: 'disputes', label: 'Disputes', count: 5, href: '/property-manager/bookings/disputes' },
]

interface BookingStatusTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export default function BookingStatusTabs({ activeTab, onTabChange }: BookingStatusTabsProps) {
  return (
    <div className="mt-6 border-b border-slate-200">
      <div className="flex gap-0 overflow-x-auto [&::-webkit-scrollbar]:hidden">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key
          const className = cn(
            'flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
            isActive
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          )
          const badge = (
            <span
              className={cn(
                'text-xs px-1.5 py-0.5 rounded-full',
                isActive ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
              )}
            >
              {tab.count}
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
  )
}
