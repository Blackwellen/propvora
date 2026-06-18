'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Building2, Clock, Heart, List, Map, MapPin, Search, Shield, SlidersHorizontal, Star, Users } from 'lucide-react'
import { useState } from 'react'
import PublicMarketplaceNav from '@/components/public-marketplace/PublicMarketplaceNav'
import ProvidersMap from '@/components/public-marketplace/maps/ProvidersMap'
import { SEED_PROVIDERS } from '@/lib/public-marketplace/seed-fallback'
import { formatPence } from '@/lib/marketplace/money'

const AREA_CHIPS = ['All areas', 'City Centre', 'Didsbury', 'Salford Quays', 'Stockport', 'Chorlton', 'Prestwich', 'Altrincham']
const FILTER_CHIPS = [
  { label: 'Vetted', value: 'vetted' },
  { label: 'Gas Safe', value: 'gassafe' },
  { label: 'NICEIC', value: 'niceic' },
  { label: 'Emergency', value: 'emergency' },
]

export default function ProvidersMapPage() {
  const [activeArea, setActiveArea] = useState('All areas')
  const [searchAsMove, setSearchAsMove] = useState(false)
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('')

  const AREA_LOCATION_MAP: Record<string, string[]> = {
    'City Centre': ['city centre', 'central', 'deansgate', 'spinningfields'],
    'Didsbury': ['didsbury'],
    'Salford Quays': ['salford quays', 'salford'],
    'Stockport': ['stockport'],
    'Chorlton': ['chorlton'],
    'Prestwich': ['prestwich'],
    'Altrincham': ['altrincham'],
  }

  const filtered = SEED_PROVIDERS.filter(p => {
    if (query && !p.companyName.toLowerCase().includes(query.toLowerCase()) && !p.trade.toLowerCase().includes(query.toLowerCase())) return false
    if (activeFilter === 'vetted' && !p.vetted) return false
    if (activeFilter === 'gassafe' && !p.gasSafe) return false
    if (activeFilter === 'niceic' && !p.niceic) return false
    if (activeFilter === 'emergency' && !p.emergency24h) return false
    if (activeArea !== 'All areas') {
      const keywords = AREA_LOCATION_MAP[activeArea] ?? [activeArea.toLowerCase()]
      const haystack = (p.location + ' ' + p.city).toLowerCase()
      if (!keywords.some(kw => haystack.includes(kw))) return false
    }
    return true
  })

  return (
    <div className="h-dvh bg-white flex flex-col overflow-hidden">
      <PublicMarketplaceNav />
      <div className="bg-white border-b border-slate-100 px-6 lg:px-10 py-6 shrink-0">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-8 items-center">
          <div>
            <h1 className="text-[26px] font-extrabold leading-tight text-slate-950">Find trusted service providers in your area</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Search vetted businesses by trade, location and coverage. Compare, shortlist and connect with confidence.</p>
          </div>
          <div className="flex items-stretch rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex flex-1 items-center gap-3 border-r border-slate-200 px-5 py-4">
              <Building2 className="h-5 w-5 text-slate-500" />
              <div>
                <p className="text-xs font-bold text-slate-900">Trade</p>
                <p className="text-sm text-slate-500">All trades</p>
              </div>
            </div>
            <div className="flex flex-1 items-center gap-3 border-r border-slate-200 px-5 py-4">
              <Users className="h-5 w-5 text-slate-500" />
              <div>
                <p className="text-xs font-bold text-slate-900">Provider / business</p>
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Company name" className="w-full bg-transparent text-sm text-slate-500 outline-none placeholder-slate-500" />
              </div>
            </div>
            <div className="flex flex-1 items-center gap-3 border-r border-slate-200 px-5 py-4">
              <MapPin className="h-5 w-5 text-slate-500" />
              <div>
                <p className="text-xs font-bold text-slate-900">Location</p>
                <p className="text-sm text-slate-500">Manchester, UK</p>
              </div>
            </div>
            <button className="m-3 inline-flex min-w-[170px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700">
              Search providers
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-slate-100 px-6 lg:px-10 py-4 shrink-0">
        <div className="max-w-[1400px] mx-auto flex items-center gap-4 overflow-x-auto scrollbar-hide">
          <button className="relative shrink-0 rounded-xl border border-slate-200 p-2 text-blue-600">
            <SlidersHorizontal className="h-5 w-5" />
            <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">2</span>
          </button>
          {[
            ['Vetted', Shield],
            ['Fully insured', Shield],
            ['Certified', Shield],
            ['Commercial', Building2],
            ['Residential', Building2],
            ['Fast response', Clock],
            ['24/7 service', Clock],
            ['Top rated', Star],
          ].map(([label, Icon]) => (
            <button key={label as string} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              <Icon className="h-4 w-4" />
              {label as string}
            </button>
          ))}
          <button className="ml-auto shrink-0 text-sm font-semibold text-blue-600">Clear all</button>
        </div>
      </div>

      <div className="bg-white px-6 lg:px-10 py-4 shrink-0">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div>
            <p className="text-lg font-extrabold text-slate-950">{filtered.length} providers match your criteria</p>
            <p className="text-sm text-slate-500">Showing results for Manchester, within 15 miles</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">
              <Heart className="h-4 w-4" />
              Save search
            </button>
            <div className="flex items-center overflow-hidden rounded-xl border border-slate-200">
              <Link href="/providers" className="inline-flex items-center gap-2 px-7 py-2 text-sm font-bold text-slate-600"><List className="h-4 w-4" />List</Link>
              <button className="inline-flex items-center gap-2 bg-blue-600 px-7 py-2 text-sm font-bold text-white"><Map className="h-4 w-4" />Map</button>
            </div>
            <select className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 outline-none">
              <option>Sort: Recommended</option>
            </select>
          </div>
        </div>
      </div>

      {/* SPLIT LAYOUT — full height under nav */}
      <div className="max-w-[1400px] mx-auto w-full flex flex-1 gap-4 overflow-hidden px-6 lg:px-10 pb-8">
        {/* LEFT COLUMN */}
        <aside className="w-[455px] flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden shrink-0 shadow-sm">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 shrink-0">
            <p className="font-bold text-slate-900 text-base">{filtered.length} providers match your criteria</p>
            <p className="text-slate-500 text-xs mt-0.5">Showing results for Manchester, within 15 miles</p>
          </div>

          {/* Search + filters */}
          <div className="px-4 py-3 border-b border-slate-100 shrink-0 space-y-2">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search providers..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="flex-1 text-sm bg-transparent outline-none text-slate-700 placeholder-slate-400"
              />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {FILTER_CHIPS.map(chip => (
                <button
                  key={chip.value}
                  onClick={() => setActiveFilter(chip.value === activeFilter ? '' : chip.value)}
                  className={["px-3 py-1 rounded-full text-xs font-medium border transition-colors", activeFilter === chip.value ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'].join(' ')}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* List/Map toggle + results count */}
          <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between shrink-0">
            <span className="text-xs text-slate-500">{filtered.length} providers in this area</span>
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
              <Link href="/providers" className="flex items-center gap-0.5 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"><List className="h-3 w-3" />List</Link>
              <button className="flex items-center gap-0.5 px-2 py-1 text-xs font-medium bg-slate-900 text-white"><Map className="h-3 w-3" />Map</button>
            </div>
          </div>

          {/* Provider list */}
          <div className="flex-1 overflow-y-auto">
            {filtered.map(provider => (
              <Link key={provider.id} href={"/providers/" + provider.slug} className="block border-b border-slate-100 hover:bg-slate-50 transition-colors">
                {/* Banner image */}
                <div className="relative aspect-[16/8] overflow-hidden">
                  <Image src={provider.heroImage} alt={provider.companyName} fill className="object-cover" sizes="480px" />
                  <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Featured</div>
                  {provider.vetted && (
                    <div className="absolute top-2 right-10 flex items-center gap-0.5 bg-white/90 text-emerald-600 border border-emerald-200 rounded-full px-2 py-0.5 text-[10px] font-medium">
                      <Shield className="w-2.5 h-2.5" />Vetted
                    </div>
                  )}
                  <button className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5" onClick={e => e.preventDefault()}>
                    <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  </button>
                </div>

                {/* Content below banner */}
                <div className="px-4 pb-4 pt-2 relative">
                  {/* Avatar overlapping from banner */}
                  <div className="relative w-12 h-12 rounded-full border-2 border-white shadow overflow-hidden bg-white -mt-6 mb-1">
                    <Image src={provider.logo} alt={provider.companyName} fill className="object-cover" sizes="48px" />
                  </div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-bold text-slate-900 text-sm">{provider.companyName}</h3>
                    {provider.proBadge && <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded">Pro</span>}
                    <div className="flex items-center gap-0.5 ml-auto">
                      <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-semibold text-slate-700">{provider.rating}</span>
                    </div>
                  </div>
                  <p className="text-slate-500 text-xs mb-2">{provider.trade}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                    <span>{provider.jobsDone.toLocaleString()} jobs</span>
                    <span>{provider.responseTime}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{provider.coverageRadius} mi</span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-2">
                    {provider.vetted && <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-0.5"><Shield className="h-2.5 w-2.5" />Fully insured</span>}
                    {provider.gasSafe && <span className="text-[10px] text-blue-700 font-medium">Gas Safe</span>}
                    {provider.emergency24h && <span className="text-[10px] text-slate-500">24/7 service</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">From</p>
                      <span className="text-base font-bold text-slate-900">{formatPence(provider.fromPrice)}</span>
                      <span className="text-xs text-slate-500"> / visit</span>
                    </div>
                    <span className="text-xs font-semibold text-blue-600">View profile</span>
                  </div>
                </div>
              </Link>
            ))}
            <button className="w-full py-4 text-sm font-medium text-blue-600 hover:bg-slate-50 border-t border-slate-100">Load more providers</button>
          </div>
        </aside>

        {/* MAP */}
        <div className="flex-1 relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <ProvidersMap providers={filtered} />

          {/* Area chips overlay */}
          <div className="absolute top-5 left-5 right-5 z-[1000] flex items-center gap-3 overflow-x-auto scrollbar-hide pointer-events-auto">
            {AREA_CHIPS.map(area => (
              <button key={area} onClick={() => setActiveArea(area)} className={["shrink-0 px-4 py-2 rounded-full text-xs font-semibold shadow-md transition-colors whitespace-nowrap", activeArea === area ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'].join(' ')}>
                {area}
              </button>
            ))}
            <button onClick={() => setSearchAsMove(p => !p)} className={["ml-auto shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-md whitespace-nowrap", searchAsMove ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'].join(' ')}>
              <span className={["w-3.5 h-3.5 rounded-full border-2 transition-colors", searchAsMove ? 'bg-white border-white' : 'border-slate-400'].join(' ')} />
              Search as I move the map
            </button>
          </div>

          {/* Coverage key */}
          <div className="absolute bottom-8 right-8 z-[1000] bg-white rounded-xl shadow-md p-4 text-xs space-y-2">
            <p className="font-semibold text-slate-700 mb-2">Coverage key</p>
            <div className="flex items-center gap-2 text-slate-600"><span className="w-3 h-3 rounded-full bg-blue-600 shrink-0" />Exact location</div>
            <div className="flex items-center gap-2 text-slate-600"><span className="w-3 h-3 rounded-full border-2 border-dashed border-blue-500 shrink-0" />Service coverage</div>
            <div className="flex items-center gap-2 text-slate-600"><span className="w-3 h-3 rounded-full border-2 border-slate-400 shrink-0" />Your search area</div>
          </div>

          {/* Search area info */}
          <div className="absolute bottom-8 left-8 z-[1000] bg-white rounded-xl shadow-md p-4 text-xs">
            <p className="font-semibold text-slate-700">Search area: Manchester, 15 miles radius</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-slate-500">Providers in this area:</span>
              <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full font-semibold">{filtered.length}</span>
            </div>
          </div>

          {/* Map / Satellite toggle */}
          <div className="absolute bottom-8 right-[13rem] z-[1000] flex items-center border border-slate-200 rounded-xl overflow-hidden shadow-md">
            <button className="px-3 py-1.5 text-xs font-medium bg-white text-slate-900">Map</button>
            <button className="px-3 py-1.5 text-xs font-medium bg-slate-50 text-slate-500 border-l border-slate-200">Satellite</button>
          </div>
        </div>
      </div>
    </div>
  )
}
