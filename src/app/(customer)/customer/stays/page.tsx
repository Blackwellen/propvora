import type { Metadata } from 'next'
import PublicSearchBar from '@/components/public-marketplace/PublicSearchBar'
import PublicFilterChips from '@/components/public-marketplace/PublicFilterChips'
import PublicResultsToolbar from '@/components/public-marketplace/PublicResultsToolbar'
import MarketplaceTrustStrip from '@/components/public-marketplace/MarketplaceTrustStrip'
import StayCard from '@/components/public-marketplace/cards/StayCard'
import { getPublicStays } from '@/lib/public-marketplace/queries'
import SaveSearchButton from './SaveSearchButton'

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
    <div className="space-y-5">
      {/* Hero — full shell width, rounded like the dashboard hero */}
      <section className="rounded-3xl bg-gradient-to-b from-[var(--brand-soft)] to-white px-5 py-8 sm:px-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-2">Find a Stay</h1>
        <p className="text-[15px] text-slate-500 mb-6 max-w-2xl">
          Verified short-lets, serviced apartments and long-stay rentals across the UK.
        </p>
        <PublicSearchBar variant="stays" />
      </section>

      {/* Filter row */}
      <div className="sticky top-16 z-30 -mx-4 sm:-mx-6 lg:-mx-8 bg-white border-y border-slate-100 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
        <PublicFilterChips chips={FILTER_CHIPS} />
        <div className="shrink-0"><SaveSearchButton basePath="/user/stays" /></div>
      </div>

      {/* Results */}
      <section>
        <div className="mb-5">
          <PublicResultsToolbar
            count={stays.length}
            location="Across the UK"
            mapHref="/user/stays/map"
            listHref="/user/stays"
            viewMode="grid"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 items-stretch">
          {stays.map(stay => (
            <StayCard key={stay.id} stay={stay} basePath="/user/stays" />
          ))}
        </div>
      </section>

      <MarketplaceTrustStrip />
    </div>
  )
}
