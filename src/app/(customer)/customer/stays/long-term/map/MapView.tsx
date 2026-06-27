'use client'

import dynamic from 'next/dynamic'
import LongTermRentalCompactCard from '@/components/marketplace/stays/LongTermRentalCompactCard'
import { MapPin } from 'lucide-react'
import type { PublicLongTermRental } from '@/lib/public-marketplace/types'

const LongTermRentalMap = dynamic(
  () => import('@/components/marketplace/maps/LongTermRentalMap'),
  { ssr: false },
)

export default function CustomerLongTermMapView({ rentals }: { rentals: PublicLongTermRental[] }) {
  const [featured, ...rest] = rentals

  return (
    <div className="flex-1 flex flex-col">
      {/* Top bar */}
      <div className="px-4 pt-4 pb-3 bg-white border-b border-slate-100">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-lg font-bold text-slate-900">Long-term rentals · Map</h1>
          <span className="text-sm text-slate-500">
            <span className="font-semibold text-slate-900">{rentals.length}</span> rentals on map
          </span>
        </div>
      </div>

      {/* Split layout */}
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
        {/* Left sidebar */}
        <div className="w-96 shrink-0 overflow-y-auto border-r border-slate-200 p-3 space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-1 mb-2">
            {rentals.length} long-term rentals
          </p>
          {featured && (
            <LongTermRentalCompactCard
              rental={featured}
              featured
              basePath="/customer/stays/long-term"
            />
          )}
          {rest.map((rental) => (
            <LongTermRentalCompactCard
              key={rental.id}
              rental={rental}
              basePath="/customer/stays/long-term"
            />
          ))}
        </div>

        {/* Right map */}
        <div className="flex-1 relative">
          <LongTermRentalMap rentals={rentals} basePath="/customer/stays/long-term" />
          <div className="absolute bottom-4 left-4 bg-white rounded-xl shadow-lg px-4 py-2 text-sm text-slate-700 border border-slate-200 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[var(--brand)] shrink-0" />
            Showing <strong>{rentals.length}</strong> rentals · Click a pin to preview
          </div>
        </div>
      </div>
    </div>
  )
}
