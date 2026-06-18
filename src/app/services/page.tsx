import type { Metadata } from 'next'
import Link from 'next/link'
import { Search, MapPin, Calendar, Filter, ChevronLeft, ChevronRight, Zap, CheckCircle, Lock, HeadphonesIcon, Star } from 'lucide-react'
import PublicPageShell from '@/components/public-marketplace/PublicPageShell'
import ServiceOfferCard from '@/components/public-marketplace/cards/ServiceOfferCard'
import { getPublicServiceOffers, getFeaturedServiceOffers } from '@/lib/public-marketplace/queries'

export const metadata: Metadata = {
  title: 'Services | Propvora — Find trusted property services',
  description: 'Find and book verified property services across 60+ trade categories — plumbers, electricians, gas engineers, cleaners and more.',
  openGraph: {
    title: 'Services | Propvora',
    description: 'Find verified property services across 60+ trade categories.',
    type: 'website',
  },
}

const FILTER_CHIPS = [
  { label: 'Trade ↓', value: 'trade' },
  { label: 'Price ↓', value: 'price' },
  { label: 'Availability ↓', value: 'avail' },
  { label: 'Verified', value: 'verified' },
  { label: 'Urgent', value: 'urgent' },
  { label: 'Residential', value: 'residential' },
  { label: 'Commercial', value: 'commercial' },
  { label: 'HMO', value: 'hmo' },
  { label: 'Emergency', value: 'emergency', red: true },
  { label: 'Top rated', value: 'toprated' },
]

const CATEGORY_TABS = [
  { label: 'All services', count: 1248, value: '' },
  { label: 'Cleaning', count: 186, value: 'Cleaning' },
  { label: 'Plumbing', count: 142, value: 'Plumbing' },
  { label: 'Electrical', count: 128, value: 'Electrical' },
  { label: 'Heating', count: 98, value: 'Heating' },
  { label: 'Gardening', count: 96, value: 'Gardening' },
  { label: 'Handyman', count: 86, value: 'Handyman' },
  { label: 'Waste Removal', count: 64, value: 'Waste Removal' },
  { label: '••• More 10+', count: null, value: 'more' },
]

const TRUST_ITEMS = [
  { icon: CheckCircle, title: 'Vetted & trusted', desc: 'Every service provider is background-checked and vetted.' },
  { icon: Lock, title: 'Secure payments', desc: 'Escrow-protected, with full dispute resolution.' },
  { icon: Star, title: 'Satisfaction guarantee', desc: '100% satisfaction or we make it right.' },
  { icon: HeadphonesIcon, title: 'Managed bookings', desc: 'Our team handles disputes and complaints 24/7.' },
]

import { redirect as _gateRedirect } from "next/navigation"
import { getGlobalFlag as _gateFlag } from "@/lib/flags/public"

export default async function ServicesPage() {
  if (!(await _gateFlag("marketplaceEnabled"))) _gateRedirect("/")
  const [allOffers, featuredOffers] = await Promise.all([
    getPublicServiceOffers(),
    getFeaturedServiceOffers(),
  ])

  return (
    <PublicPageShell hideFooter>
      {/* TOP SECTION — two-column */}
      <section className="bg-white pb-6 pt-6 border-b border-slate-100">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            {/* LEFT */}
            <div className="lg:col-span-1">
              <h1 className="text-3xl font-bold text-slate-900 leading-tight">
                Find trusted services for your home or property
              </h1>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                Vetted professionals. Transparent pricing. Quality work, every time.
              </p>
            </div>

            {/* RIGHT: 3-segment search */}
            <div className="lg:col-span-2">
              <div className="flex items-stretch bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3.5 flex-1 border-r border-slate-200 min-w-0">
                  <Search className="h-4 w-4 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">What do you need?</div>
                    <input
                      type="text"
                      placeholder="e.g. Plumbing, Cleaning, Electrical"
                      className="w-full text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent mt-0.5"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-3.5 border-r border-slate-200 min-w-0">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Location</div>
                    <input
                      type="text"
                      placeholder="City, area or postcode"
                      className="w-32 text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent mt-0.5"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-3.5 border-r border-slate-200 min-w-0">
                  <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">When</div>
                    <input
                      type="text"
                      placeholder="Anytime"
                      className="w-24 text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent mt-0.5"
                    />
                  </div>
                </div>
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 transition-colors shrink-0 font-semibold text-sm">
                  <Search className="h-4 w-4" />
                  Search services
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FILTER CHIPS */}
      <div className="border-b border-slate-100 bg-white sticky top-20 z-30 py-3">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <button className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-full text-sm text-slate-600 hover:bg-slate-50 relative">
              <Filter className="h-3.5 w-3.5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">2</span>
            </button>
            {FILTER_CHIPS.map((chip) => (
              <button
                key={chip.value}
                className={`shrink-0 px-4 py-1.5 rounded-full border text-sm font-medium transition-colors whitespace-nowrap ${
                  chip.red
                    ? 'border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {chip.red && <Zap className="h-3.5 w-3.5" />}
                {chip.label}
              </button>
            ))}
            <div className="ml-auto shrink-0">
              <button className="text-blue-600 text-sm font-medium">Clear all</button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8">
        {/* RESULTS TOOLBAR */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-xl font-bold text-slate-900">1,248 service offers</span>
            <span className="text-slate-500 text-sm ml-2">Across Greater Manchester</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold">
              Offers
            </button>
            <Link href="/providers" className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50">
              Providers
            </Link>
            <select className="text-sm text-slate-600 border border-slate-200 rounded-xl px-3 py-2 bg-white outline-none">
              <option>Sort: Recommended ↓</option>
              <option>Price: Low to high</option>
              <option>Rating: Highest first</option>
            </select>
          </div>
        </div>

        {/* FEATURED SERVICE OFFERS — horizontal scroll */}
        {featuredOffers.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                  Featured service offers
                </h2>
                <p className="text-slate-500 text-sm mt-0.5">Hand-picked top performers with proven track records</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="w-8 h-8 border border-slate-200 rounded-full flex items-center justify-center hover:bg-slate-50 transition-colors">
                  <ChevronLeft className="h-4 w-4 text-slate-600" />
                </button>
                <button className="w-8 h-8 border border-slate-200 rounded-full flex items-center justify-center hover:bg-slate-50 transition-colors">
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                </button>
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-3 -mx-6 px-6 lg:-mx-10 lg:px-10 scrollbar-hide">
              {featuredOffers.map(offer => (
                <ServiceOfferCard key={offer.id} offer={offer} featured />
              ))}
            </div>
          </div>
        )}

        {/* CATEGORY TABS */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-6 pb-1">
          {CATEGORY_TABS.map((tab, i) => (
            <button
              key={tab.value}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap ${
                i === 0 ? 'bg-slate-900 text-white' : 'border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {tab.label}{tab.count !== null ? ` ${tab.count.toLocaleString()}` : ''}
            </button>
          ))}
        </div>

        {/* COMPACT CARD GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 items-stretch">
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

      {/* TRUST STRIP */}
      <section className="bg-slate-50 border-t border-slate-100 py-10">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {TRUST_ITEMS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-start gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Icon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicPageShell>
  )
}
