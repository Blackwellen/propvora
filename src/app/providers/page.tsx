import type { Metadata } from 'next'
import Link from 'next/link'
import { Search, MapPin, ChevronDown, Filter, Map, Star, CheckCircle, Shield, Lock, HeadphonesIcon } from 'lucide-react'
import PublicPageShell from '@/components/public-marketplace/PublicPageShell'
import ProviderCard from '@/components/public-marketplace/cards/ProviderCard'
import ProviderFeaturedCard from '@/components/public-marketplace/cards/ProviderFeaturedCard'
import { getPublicProviders, getFeaturedProviders } from '@/lib/public-marketplace/queries'

export const metadata: Metadata = {
  title: 'Providers | Propvora — Find trusted service providers',
  description: 'Find vetted and insured property service providers — plumbers, electricians, gas engineers, cleaners and more across the UK.',
  openGraph: {
    title: 'Providers | Propvora',
    description: 'Find vetted and insured property service providers across the UK.',
    type: 'website',
  },
}

const FILTER_CHIPS = [
  { label: 'All filters 2', value: '', active: true, badge: true },
  { label: 'Vetted', value: 'vetted', active: true },
  { label: 'Emergency cover', value: 'emergency' },
  { label: 'Insurance', value: 'insurance' },
  { label: 'Commercial', value: 'commercial' },
  { label: 'Residential', value: 'residential' },
  { label: 'Gas Safe', value: 'gassafe' },
  { label: 'NICEIC', value: 'niceic', red: true },
  { label: 'Top rated', value: 'toprated' },
  { label: 'Fast response', value: 'fast' },
  { label: '••• More filters', value: 'more' },
]

const TRUST_ITEMS_1 = [
  { icon: CheckCircle, title: 'Vetted backgrounds', desc: 'Every provider is fully background-checked before listing.' },
  { icon: Shield, title: 'Fully insured', desc: 'All providers carry minimum £2M public liability insurance.' },
  { icon: Star, title: 'Genuine reviews', desc: 'Only verified customers can leave reviews on Propvora.' },
  { icon: Lock, title: 'Secure payments', desc: 'Escrow-protected payments with full dispute resolution.' },
]

const TRUST_ITEMS_2 = [
  { icon: HeadphonesIcon, title: 'Managed booking', desc: 'Our ops team oversees every booking end-to-end.' },
  { icon: CheckCircle, title: 'Compliance tracking', desc: 'Certifications and insurance renewals monitored.' },
  { icon: Shield, title: 'Dispute resolution', desc: 'We handle complaints and refunds on your behalf.' },
  { icon: Star, title: 'Quality standards', desc: 'Providers rated below 4.2 are removed from the platform.' },
]

export default async function ProvidersPage() {
  const [allProviders, featuredProviders] = await Promise.all([
    getPublicProviders(),
    getFeaturedProviders(),
  ])

  return (
    <PublicPageShell>
      {/* TOP SECTION — two-column */}
      <section className="bg-white border-b border-slate-100 pb-8 pt-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            {/* LEFT */}
            <div className="lg:col-span-1">
              <h1 className="text-3xl font-bold text-slate-900 leading-tight">
                Find trusted service providers
              </h1>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                Every provider is vetted, insured and reviewed by real property managers.
              </p>
            </div>

            {/* RIGHT: 3-segment search */}
            <div className="lg:col-span-2">
              <div className="flex items-stretch bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3.5 flex-1 border-r border-slate-200 min-w-0">
                  <Search className="h-4 w-4 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Trade or business name</div>
                    <input
                      type="text"
                      placeholder="e.g. Plumbing, Electrical..."
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
                      placeholder="Manchester, UK"
                      className="w-32 text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent mt-0.5"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-3.5 border-r border-slate-200 min-w-0">
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Coverage radius</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-sm text-slate-700">25 miles</span>
                      <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </div>
                </div>
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 transition-colors shrink-0 font-semibold text-sm">
                  <Search className="h-4 w-4" />
                  Search providers
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FILTER CHIPS */}
      <div className="border-b border-slate-100 bg-white sticky top-16 z-30 py-3">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {FILTER_CHIPS.map((chip) => (
              <button
                key={chip.value}
                className={`shrink-0 px-4 py-1.5 rounded-full border text-sm font-medium transition-colors whitespace-nowrap relative ${
                  chip.active
                    ? 'bg-blue-600 text-white border-blue-600'
                    : chip.red
                    ? 'border-red-200 text-red-600 hover:bg-red-50'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {chip.badge && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">2</span>
                )}
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* RESULTS TOOLBAR */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-slate-900">1,248 providers found</span>
            <span className="text-slate-500 text-sm">Serving Manchester, within 25 miles</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/providers/map" className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
              <Map className="h-4 w-4" />Map view
            </Link>
            <select className="text-sm text-slate-600 border border-slate-200 rounded-xl px-3 py-2 bg-white outline-none">
              <option>Sort by: Recommended</option>
              <option>Rating: Highest first</option>
              <option>Most jobs done</option>
            </select>
          </div>
        </div>

        {/* FEATURED PROVIDERS — horizontal scroll */}
        {featuredProviders.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                Featured providers
              </h2>
              <Link href="/providers?filter=featured" className="text-sm text-blue-600 font-medium hover:text-blue-700">
                View all featured →
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide">
              {featuredProviders.map(provider => (
                <ProviderFeaturedCard key={provider.id} provider={provider} />
              ))}
            </div>
          </div>
        )}

        {/* VIEW TOGGLE */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-sm font-medium text-slate-600">View</span>
          <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
            <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-slate-900 text-white">Grid</button>
            <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 border-l border-slate-200">List</button>
          </div>
        </div>

        {/* PROVIDERS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch mb-12">
          {allProviders.map(provider => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
        </div>

        {allProviders.length === 0 && (
          <div className="text-center py-24">
            <p className="text-slate-500 text-lg">No providers found. Try adjusting your filters.</p>
          </div>
        )}

        {/* COMPARE SHORTLISTED */}
        <div className="border border-slate-200 rounded-xl p-4 flex items-center gap-4 mb-12">
          <div className="flex-1">
            <p className="font-semibold text-slate-900 text-sm">Compare shortlisted</p>
            <p className="text-xs text-slate-500">Add up to 4 providers to compare</p>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-10 h-10 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-300 text-xl font-light">+</div>
            ))}
          </div>
          <button disabled className="px-5 py-2.5 bg-slate-200 text-slate-400 rounded-xl text-sm font-semibold cursor-not-allowed">
            Compare
          </button>
        </div>

        {/* WHY CHOOSE VERIFIED */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Why choose verified providers?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TRUST_ITEMS_1.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
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

        {/* WHY WORK WITH PROPVORA */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Why work with Propvora?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TRUST_ITEMS_2.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <Icon className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PublicPageShell>
  )
}
