import type { Metadata } from 'next'
import PublicSearchBar from '@/components/public-marketplace/PublicSearchBar'
import PublicFilterChips from '@/components/public-marketplace/PublicFilterChips'
import PublicResultsToolbar from '@/components/public-marketplace/PublicResultsToolbar'
import MarketplaceTrustStrip from '@/components/public-marketplace/MarketplaceTrustStrip'
import StayCard from '@/components/public-marketplace/cards/StayCard'
import { getPublicStays } from '@/lib/public-marketplace/queries'

export const metadata: Metadata = {
  title: 'Find a Stay · Propvora',
  description: 'Browse verified short-lets, serviced apartments and holiday lets across the UK.',
}

const FILTER_CHIPS = [
  { id: 'price', label: 'Price', dropdown: true },
  { id: 'type', label: 'Type', dropdown: true },
  { id: 'bedrooms', label: 'Bedrooms', dropdown: true },
  { id: 'pets', label: 'Pets' },
  { id: 'instant', label: 'Instant book' },
  { id: 'verified', label: 'Verified' },
  { id: 'short-lets', label: 'Short lets' },
  { id: 'long-stays', label: 'Long stays' },
]

export default async function CustomerStaysPage() {
  const stays = await getPublicStays()

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-50 to-white pt-12 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-3">Find a Stay</h1>
          <p className="text-lg text-slate-500 mb-8 max-w-2xl">
            Verified short-lets, serviced apartments and long-stay rentals across Greater Manchester and beyond.
          </p>
          <PublicSearchBar variant="stays" />
        </div>
      </section>

      {/* Filter row */}
      <div className="sticky top-16 z-30 bg-white border-b border-slate-100 px-4 py-3">
        <div className="max-w-6xl mx-auto">
          <PublicFilterChips chips={FILTER_CHIPS} />
        </div>
      </div>

      {/* Results */}
      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <PublicResultsToolbar
              count={stays.length}
              location="Across Greater Manchester"
              mapHref="/user/stays/map"
              listHref="/user/stays"
              viewMode="grid"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stays.map(stay => (
              <StayCard key={stay.id} stay={stay} basePath="/user/stays" />
            ))}
          </div>
        </div>
      </section>

      <MarketplaceTrustStrip />
    </div>
  )
}
