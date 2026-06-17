import type { Metadata } from 'next'
import Link from 'next/link'
import { Search, MapPin, Calendar, Map } from 'lucide-react'
import PublicPageShell from '@/components/public-marketplace/PublicPageShell'
import ServiceOfferCard from '@/components/public-marketplace/cards/ServiceOfferCard'
import MarketplaceTrustStrip from '@/components/public-marketplace/MarketplaceTrustStrip'
import { getPublicServiceOffers, getFeaturedServiceOffers } from '@/lib/public-marketplace/queries'

export const metadata: Metadata = {
  title: 'Services | Propvora — Find trusted property services',
  description:
    'Find and book verified property services across 60+ trade categories — plumbers, electricians, gas engineers, cleaners and more.',
  openGraph: {
    title: 'Services | Propvora',
    description: 'Find verified property services across 60+ trade categories.',
    type: 'website',
  },
}

const FILTER_CHIPS = [
  { label: 'All', value: '' },
  { label: 'Cleaning', value: 'Cleaning' },
  { label: 'Plumbing', value: 'Plumbing' },
  { label: 'Electrical', value: 'Electrical' },
  { label: 'Gardening', value: 'Gardening' },
  { label: 'Handyman', value: 'Handyman' },
  { label: 'Emergency', value: 'emergency' },
  { label: 'Urgent', value: 'urgent' },
  { label: 'Verified', value: 'verified' },
]

export default async function ServicesPage() {
  const [allOffers, featuredOffers] = await Promise.all([
    getPublicServiceOffers(),
    getFeaturedServiceOffers(),
  ])

  return (
    <PublicPageShell>
      {/* Hero */}
      <section className="pt-8 pb-10 px-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight mb-3">
            Find trusted services for your home or property
          </h1>
          <p className="text-lg text-slate-500 mb-8 max-w-xl mx-auto">
            Verified contractors, transparent pricing, and easy online booking — all in one place.
          </p>

          {/* Segmented search bar */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden max-w-3xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
              <div className="flex items-center gap-2 px-4 py-3.5 sm:col-span-2">
                <Search className="h-4 w-4 text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">What do you need?</div>
                  <input
                    type="text"
                    placeholder="Cleaning, plumbing, electrical..."
                    className="w-full text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent mt-0.5"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-3.5">
                <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Location</div>
                  <input
                    type="text"
                    placeholder="City or postcode"
                    className="w-full text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent mt-0.5"
                  />
                </div>
              </div>
              <div className="flex items-center justify-center px-4 py-3.5">
                <button className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-sm">
                  <Search className="h-4 w-4" />
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter chips */}
      <div className="border-b border-slate-100 bg-white sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-hide">
            {FILTER_CHIPS.map((chip) => (
              <button
                key={chip.value}
                className={`shrink-0 px-4 py-1.5 rounded-full border text-sm font-medium transition-colors ${
                  chip.value === ''
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {chip.label}
              </button>
            ))}
            <div className="w-px h-5 bg-slate-200 mx-1 shrink-0" />
            <Link
              href="/services/map"
              className="shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-slate-200 text-sm font-medium text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <Map className="h-3.5 w-3.5" />
              Map view
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Featured services — horizontal scroll */}
        {featuredOffers.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Featured services</h2>
              <span className="text-sm text-blue-600 font-medium">{featuredOffers.length} available</span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide">
              {featuredOffers.map(offer => (
                <ServiceOfferCard key={offer.id} offer={offer} featured />
              ))}
            </div>
          </div>
        )}

        {/* Results toolbar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <p className="text-sm text-slate-600 font-medium">
            <span className="text-slate-900 font-bold">{allOffers.length}</span> offers
          </p>
          <div className="flex items-center gap-3">
            <select className="text-sm text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 bg-white outline-none focus:border-blue-400">
              <option>Sort: Recommended</option>
              <option>Price: Low to high</option>
              <option>Rating: Highest first</option>
              <option>Fastest response</option>
            </select>
            <Link
              href="/services/map"
              className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <Map className="h-4 w-4" />
              View map
            </Link>
          </div>
        </div>

        {/* All offers grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {allOffers.map(offer => (
            <ServiceOfferCard key={offer.id} offer={offer} />
          ))}
        </div>

        {allOffers.length === 0 && (
          <div className="text-center py-24">
            <p className="text-slate-500 text-lg">No services found. Try adjusting your filters.</p>
          </div>
        )}
      </div>

      <MarketplaceTrustStrip />
    </PublicPageShell>
  )
}
