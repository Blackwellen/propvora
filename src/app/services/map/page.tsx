'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Search, MapPin, Calendar, List, Map, Star, Check, Heart, Clock, Shield } from 'lucide-react'
import { useState } from 'react'
import PublicMarketplaceNav from '@/components/public-marketplace/PublicMarketplaceNav'
import ServicesMap from '@/components/public-marketplace/maps/ServicesMap'
import { SEED_SERVICE_OFFERS } from '@/lib/public-marketplace/seed-fallback'
import { formatPence } from '@/lib/marketplace/money'

const AREA_CHIPS = ['All areas', 'City Centre', 'Salford', 'Northern Quarter', 'Didsbury', 'Chorlton', 'Stockport']
const FILTER_CHIPS = [
  { label: 'Response time', value: 'response' },
  { label: 'Price range', value: 'price' },
  { label: 'Verified only', value: 'verified' },
  { label: 'Property type', value: 'proptype' },
  { label: 'Emergency', value: 'emergency' },
  { label: 'More filters', value: 'more' },
]

export default function ServicesMapPage() {
  const [activeArea, setActiveArea] = useState('All areas')
  const [searchAsMove, setSearchAsMove] = useState(false)
  const [query, setQuery] = useState('')

  const [activeFilter, setActiveFilter] = useState('')

  const AREA_LOCATION_MAP: Record<string, string[]> = {
    'City Centre': ['city centre', 'central', 'deansgate'],
    'Salford': ['salford'],
    'Northern Quarter': ['northern quarter', 'nq'],
    'Didsbury': ['didsbury'],
    'Chorlton': ['chorlton'],
    'Stockport': ['stockport'],
  }

  const filtered = SEED_SERVICE_OFFERS.filter(o => {
    if (query && !o.title.toLowerCase().includes(query.toLowerCase()) && !o.providerName.toLowerCase().includes(query.toLowerCase())) return false
    if (activeFilter === 'verified' && !o.verified) return false
    if (activeFilter === 'emergency' && !o.urgent) return false
    if (activeArea !== 'All areas') {
      const keywords = AREA_LOCATION_MAP[activeArea] ?? [activeArea.toLowerCase()]
      const haystack = (o.location + ' ' + o.city).toLowerCase()
      if (!keywords.some(kw => haystack.includes(kw))) return false
    }
    return true
  })

  return (
    <div className="h-dvh bg-white flex flex-col overflow-hidden">
      <PublicMarketplaceNav />
      {/* TOP SEARCH BAR */}
      <div className="bg-white border-b border-slate-100 px-6 lg:px-10 py-6 shrink-0">
        <div className="max-w-[1400px] mx-auto flex items-stretch bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 flex-1 border-r border-slate-200">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input type="text" placeholder="Plumbing and Heating" value={query} onChange={e => setQuery(e.target.value)} className="w-full text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent" />
          </div>
          <div className="flex items-center gap-2 px-4 py-3 border-r border-slate-200">
            <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
            <input type="text" placeholder="Manchester, M15 4GB" className="w-36 text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent" />
          </div>
          <div className="flex items-center gap-2 px-4 py-3 border-r border-slate-200">
            <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
            <input type="text" placeholder="Fri, 23 May" className="w-28 text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent" />
          </div>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 transition-colors shrink-0 font-semibold text-sm">
            <Search className="h-4 w-4" />Search services
          </button>
          <button className="flex items-center gap-2 px-4 py-3 border-l border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors shrink-0">
            <Heart className="h-4 w-4" />Save search
          </button>
        </div>
      </div>

      {/* FILTER CHIPS */}
      <div className="bg-white border-b border-slate-100 px-6 lg:px-10 py-4 shrink-0">
        <div className="max-w-[1400px] mx-auto flex items-center gap-4 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {FILTER_CHIPS.map(chip => (
            <button
              key={chip.value}
              onClick={() => setActiveFilter(chip.value === activeFilter ? '' : chip.value)}
              className={["shrink-0 px-4 py-2 rounded-xl border text-sm font-medium whitespace-nowrap transition-colors", activeFilter === chip.value ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50'].join(' ')}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* SPLIT LAYOUT */}
      <div className="max-w-[1400px] mx-auto w-full flex flex-1 gap-4 overflow-hidden px-6 lg:px-10 pb-8">
        {/* LEFT */}
        <aside className="w-[455px] flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden shrink-0 shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div>
              <span className="font-bold text-slate-900">{filtered.length} services found</span>
              <span className="text-slate-500 text-sm ml-2">Across Greater Manchester</span>
            </div>
            <div className="flex items-center gap-2">
              <select className="text-xs text-slate-600 border border-slate-200 rounded-lg px-2 py-1 bg-white outline-none">
                <option>Sort: Recommended</option>
              </select>
              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                <Link href="/services" className="flex items-center gap-0.5 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"><List className="h-3 w-3" />List</Link>
                <button className="flex items-center gap-0.5 px-2 py-1 text-xs font-medium bg-slate-900 text-white"><Map className="h-3 w-3" />Map</button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.map((offer, i) => (
              <Link key={offer.id} href={"/services/" + offer.slug} className="flex gap-3 p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors relative">
                {i === 0 && <span className="absolute top-3 left-3 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">Top match</span>}
                <div className="relative w-28 h-24 rounded-xl overflow-hidden shrink-0">
                  <Image src={offer.heroImage} alt={offer.title} fill className="object-cover" sizes="112px" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-0.5">
                    <h3 className="font-bold text-slate-900 text-sm line-clamp-1 flex-1">{offer.providerName}</h3>
                    {offer.providerPro && <span className="shrink-0 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded">Pro</span>}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-semibold text-slate-700">{offer.rating}</span>
                    </div>
                  </div>
                  <p className="text-slate-500 text-xs mb-1">{offer.category}</p>
                  <p className="flex items-center gap-1 text-slate-500 text-xs mb-1.5"><MapPin className="h-3 w-3 shrink-0" />{offer.city}</p>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="bg-slate-50 border border-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{offer.responseTime}</span>
                    <span className="bg-slate-50 border border-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full">{formatPence(offer.basePrice)} from</span>
                    <span className="bg-slate-50 border border-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full">24/7</span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-1">
                    {offer.verified && <span className="flex items-center gap-0.5 text-[10px] text-emerald-700 font-medium"><Check className="h-2.5 w-2.5" />Verified</span>}
                    {offer.insured && <span className="flex items-center gap-0.5 text-[10px] text-blue-700 font-medium"><Shield className="h-2.5 w-2.5" />Fully insured</span>}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-lg font-bold text-slate-900">{formatPence(offer.basePrice)}<span className="text-xs font-normal text-slate-500"> / visit</span></span>
                    <span className="text-xs font-semibold text-blue-600">View profile</span>
                  </div>
                </div>
              </Link>
            ))}
            <button className="w-full py-4 text-sm font-medium text-blue-600 hover:bg-slate-50 border-t border-slate-100">Load more services</button>
          </div>
        </aside>

        {/* MAP */}
        <div className="flex-1 relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <ServicesMap offers={filtered} />

          {/* Area chips overlay */}
          <div className="absolute top-5 left-5 right-5 z-[1000] flex items-center gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] pointer-events-auto">
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

          <div className="absolute bottom-8 left-8 z-[1000] bg-white rounded-xl shadow-md px-5 py-3 text-xs text-slate-600 pointer-events-none max-w-xs">
            Showing {filtered.length} services in this area
          </div>
          <div className="absolute bottom-8 right-8 z-[1000] flex items-center border border-slate-200 rounded-xl overflow-hidden shadow-md">
            <button className="px-3 py-1.5 text-xs font-medium bg-white text-slate-900">Map</button>
            <button className="px-3 py-1.5 text-xs font-medium bg-slate-50 text-slate-500 border-l border-slate-200">Satellite</button>
          </div>
        </div>
      </div>
    </div>
  )
}
