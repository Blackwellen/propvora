import type { Metadata } from 'next'
import PublicSearchBar from '@/components/public-marketplace/PublicSearchBar'
import PublicFilterChips from '@/components/public-marketplace/PublicFilterChips'
import PublicResultsToolbar from '@/components/public-marketplace/PublicResultsToolbar'
import StayCompactCard from '@/components/public-marketplace/cards/StayCompactCard'
import MapAreaChips from '@/components/public-marketplace/maps/MapAreaChips'
import MapSearchToggle from '@/components/public-marketplace/maps/MapSearchToggle'
import StaysMap from '@/components/public-marketplace/maps/StaysMap'
import { getPublicStays } from '@/lib/public-marketplace/queries'

export const metadata: Metadata = {
  title: 'Map view · Stays · Propvora',
  description: 'Browse stays on a map across Greater Manchester.',
}

const FILTER_CHIPS = [
  { id: 'price', label: 'Price', dropdown: true },
  { id: 'type', label: 'Type', dropdown: true },
  { id: 'bedrooms', label: 'Bedrooms', dropdown: true },
  { id: 'pets', label: 'Pets' },
  { id: 'instant', label: 'Instant book' },
  { id: 'verified', label: 'Verified' },
]

export default async function CustomerStaysMapPage() {
  const stays = await getPublicStays()
  const [featured, ...rest] = stays

  return (
    <div className="flex-1 flex flex-col">
      {/* Search bar */}
      <div className="px-4 pt-4 pb-3 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto">
          <PublicSearchBar variant="stays" />
          <div className="mt-3">
            <PublicFilterChips chips={FILTER_CHIPS} />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-4 py-3 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto">
          <PublicResultsToolbar
            count={stays.length}
            location="Greater Manchester"
            mapHref="/user/stays/map"
            listHref="/user/stays"
            viewMode="map"
            showSaveSearch
          />
        </div>
      </div>

      {/* Area chips + map toggle row */}
      <div className="px-4 py-2 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <MapAreaChips variant="stays" />
          <MapSearchToggle />
        </div>
      </div>

      {/* Split layout */}
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 280px)' }}>
        {/* Left list */}
        <div className="w-96 shrink-0 overflow-y-auto border-r border-slate-200 p-3 space-y-3">
          {featured && <StayCompactCard stay={featured} featured basePath="/user/stays" />}
          {rest.map(stay => (
            <StayCompactCard key={stay.id} stay={stay} basePath="/user/stays" />
          ))}
        </div>

        {/* Right map */}
        <div className="flex-1 relative">
          <StaysMap stays={stays} />
          {/* Bottom info bubble */}
          <div className="absolute bottom-4 left-4 bg-white rounded-xl shadow-lg px-4 py-2 text-sm text-slate-700 border border-slate-200">
            Showing <strong>{stays.length}</strong> stays · Tap a pin to view stay
          </div>
        </div>
      </div>
    </div>
  )
}
