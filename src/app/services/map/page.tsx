'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Search, MapPin, List, Map, Star, Check, Clock, Shield } from 'lucide-react'
import { useMemo, useState } from 'react'
import PublicMarketplaceNav from '@/components/public-marketplace/PublicMarketplaceNav'
import ServicesMap from '@/components/public-marketplace/maps/ServicesMap'
import FilterBar, { type FilterDef, type FilterState, rangeOf, selectedOf, countOf, toggleOf } from '@/components/public-marketplace/FilterBar'
import { SEED_SERVICE_OFFERS } from '@/lib/public-marketplace/seed-fallback'
import { formatPence } from '@/lib/marketplace/money'

function deriveAreas(): string[] {
  const counts: Record<string, number> = {}
  for (const o of SEED_SERVICE_OFFERS) {
    const area = (o.location ?? '').split(',')[0].trim() || o.city
    if (area) counts[area] = (counts[area] ?? 0) + 1
  }
  return ['All areas', ...Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([a]) => a)]
}

export default function ServicesMapPage() {
  const AREA_CHIPS = useMemo(deriveAreas, [])
  const [activeArea, setActiveArea] = useState('All areas')
  const [searchAsMove, setSearchAsMove] = useState(false)
  const [query, setQuery] = useState('')
  const [filterState, setFilterState] = useState<FilterState>({})
  const [sortBy, setSortBy] = useState('')

  const filterDefs = useMemo<FilterDef[]>(() => {
    const pounds = SEED_SERVICE_OFFERS.map(o => Math.round(o.basePrice / 100)).filter(n => n > 0)
    const minP = pounds.length ? Math.max(0, Math.floor(Math.min(...pounds) / 10) * 10) : 0
    const maxP = pounds.length ? Math.ceil(Math.max(...pounds) / 50) * 50 : 1000
    const cats = [...new Set(SEED_SERVICE_OFFERS.map(o => o.category).filter(Boolean))].sort()
    return [
      { id: 'price', label: 'Price', kind: 'range', min: minP, max: Math.max(maxP, minP + 50), step: 10, prefix: '£' },
      { id: 'category', label: 'Category', kind: 'multi', options: cats.map(c => ({ value: c, label: c })) },
      { id: 'rating', label: 'Rating', kind: 'stepper', min: 0, max: 5, suffix: '★' },
      { id: 'verified', label: 'Verified', kind: 'toggle' },
      { id: 'insured', label: 'Insured', kind: 'toggle' },
      { id: 'urgent', label: 'Urgent', kind: 'toggle' },
    ]
  }, [])

  const filtered = useMemo(() => {
    let result = SEED_SERVICE_OFFERS.filter(o => {
      if (query && !o.title.toLowerCase().includes(query.toLowerCase()) && !o.providerName.toLowerCase().includes(query.toLowerCase())) return false
      if (activeArea !== 'All areas') {
        const haystack = (o.location + ' ' + o.city).toLowerCase()
        if (!haystack.includes(activeArea.toLowerCase())) return false
      }
      return true
    })
    const pr = rangeOf(filterState, 'price')
    if (pr) { const def = filterDefs.find(d => d.id === 'price'); const hb = def && def.kind === 'range' ? def.max : pr[1]; result = result.filter(o => { const v = o.basePrice / 100; return v >= pr[0] && (pr[1] >= hb ? true : v <= pr[1]) }) }
    const cats = selectedOf(filterState, 'category')
    if (cats.length) result = result.filter(o => cats.includes(o.category))
    const minR = countOf(filterState, 'rating')
    if (minR > 0) result = result.filter(o => o.rating >= minR)
    if (toggleOf(filterState, 'verified')) result = result.filter(o => o.verified)
    if (toggleOf(filterState, 'insured')) result = result.filter(o => o.insured)
    if (toggleOf(filterState, 'urgent')) result = result.filter(o => o.urgent)
    if (sortBy === 'price_asc') result = [...result].sort((a, b) => a.basePrice - b.basePrice)
    else if (sortBy === 'price_desc') result = [...result].sort((a, b) => b.basePrice - a.basePrice)
    else if (sortBy === 'rating_desc') result = [...result].sort((a, b) => b.rating - a.rating)
    return result
  }, [query, activeArea, filterState, filterDefs, sortBy])

  return (
    <div className="h-dvh bg-white flex flex-col overflow-hidden">
      <PublicMarketplaceNav />
      {/* TOP SEARCH BAR */}
      <div className="bg-white border-b border-slate-100 px-6 lg:px-10 py-6 shrink-0">
        <div className="max-w-[1400px] mx-auto flex items-stretch bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 flex-1 border-r border-slate-200">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input type="text" aria-label="Service type or keyword" placeholder="Plumbing and Heating" value={query} onChange={e => setQuery(e.target.value)} className="w-full text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent" />
          </div>
          <Link
            href={`/services${query ? `?q=${encodeURIComponent(query)}` : ''}`}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 transition-colors shrink-0 font-semibold text-sm"
          >
            <Search className="h-4 w-4" />Search services
          </Link>
        </div>
      </div>

      {/* FILTER CHIPS */}
      <div className="bg-white border-b border-slate-100 px-6 lg:px-10 py-4 shrink-0">
        <div className="max-w-[1400px] mx-auto">
          <FilterBar filters={filterDefs} value={filterState} onChange={setFilterState} />
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
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} aria-label="Sort services" className="text-xs text-slate-600 border border-slate-200 rounded-lg px-2 py-1 bg-white outline-none">
                <option value="">Sort: Recommended</option>
                <option value="price_asc">Price: Low to high</option>
                <option value="price_desc">Price: High to low</option>
                <option value="rating_desc">Rating: Highest first</option>
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
            {filtered.length === 0 && (
              <div className="px-4 py-16 text-center">
                <p className="text-sm font-medium text-slate-600">No services match your filters</p>
                <p className="text-xs text-slate-400 mt-1">Try widening your price range or clearing a filter.</p>
              </div>
            )}
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
