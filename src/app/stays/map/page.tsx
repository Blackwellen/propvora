'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  Search, MapPin, Calendar, Users, ChevronDown,
  List, Map, Star, Zap, Check, Heart, BedDouble, Bath,
} from 'lucide-react'
import { useState } from 'react'
import PublicMarketplaceNav from '@/components/public-marketplace/PublicMarketplaceNav'
import StaysMap from '@/components/public-marketplace/maps/StaysMap'
import { SEED_STAYS } from '@/lib/public-marketplace/seed-fallback'
import { formatPence } from '@/lib/marketplace/money'

const AREA_CHIPS = ['All areas', 'City Centre', 'Spinningfields', 'Northern Quarter', 'Salford Quays', 'Didsbury', 'Chorlton']

const FILTER_CHIPS = [
  { label: 'Price ↓', value: 'price' },
  { label: 'Type ↓', value: 'type' },
  { label: 'Bedrooms ↓', value: 'beds' },
  { label: 'Pets', value: 'pets' },
  { label: 'Instant book', value: 'instant' },
  { label: 'Verified', value: 'verified' },
  { label: 'Short lets', value: 'short' },
  { label: 'Long stays', value: 'long' },
  { label: '••• More filters', value: 'more' },
]

export default function StaysMapPage() {
  const [activeArea, setActiveArea] = useState('All areas')
  const [searchAsMove, setSearchAsMove] = useState(false)
  const [query, setQuery] = useState('')

  const filtered = SEED_STAYS.filter(s => {
    if (query && !s.title.toLowerCase().includes(query.toLowerCase()) && !s.location.toLowerCase().includes(query.toLowerCase())) return false
    return true
  })

  return (
    <div className="h-dvh bg-white flex flex-col overflow-hidden">
      <PublicMarketplaceNav />
      <main id="main-content" className="flex-1 flex flex-col overflow-hidden">
      {/* TOP SEARCH BAR */}
      <div className="bg-white border-b border-slate-100 px-6 lg:px-10 py-6 shrink-0">
        <div className="max-w-[1400px] mx-auto flex items-stretch bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 flex-1 border-r border-slate-200 min-w-0">
            <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Where</div>
              <input
                type="text"
                placeholder="City, area or postcode"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-3 border-r border-slate-200">
            <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
            <div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Check in</div>
              <input type="text" placeholder="Add dates" className="w-24 text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent" />
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-3 border-r border-slate-200">
            <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
            <div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Check out</div>
              <input type="text" placeholder="Add dates" className="w-24 text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent" />
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-3 border-r border-slate-200">
            <Users className="h-4 w-4 text-slate-400 shrink-0" />
            <div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Guests</div>
              <div className="flex items-center gap-1">
                <span className="text-sm text-slate-700">1 guest</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 transition-colors shrink-0 font-semibold text-sm">
            <Search className="h-4 w-4" />
            Search stays
          </button>
        </div>
      </div>

      {/* FILTER CHIPS ROW */}
      <div className="bg-white border-b border-slate-100 px-6 lg:px-10 py-4 shrink-0">
        <div className="max-w-[1400px] mx-auto flex items-center gap-4 overflow-x-auto scrollbar-hide">
          {FILTER_CHIPS.map(chip => (
            <button key={chip.value} className="shrink-0 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap">
              {chip.label}
            </button>
          ))}
          <div className="ml-auto shrink-0">
            <button className="text-blue-600 text-sm font-semibold whitespace-nowrap">Clear all</button>
          </div>
        </div>
      </div>

      {/* RESULTS HEADER */}
      <div className="bg-white px-6 lg:px-10 py-4 shrink-0">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-slate-900">1,248 stays</span>
            <span className="text-slate-500 text-sm ml-2">Across Greater Manchester</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
              <Heart className="h-3.5 w-3.5" />
              Save search
            </button>
            <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
              <Link href="/stays" className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
                <List className="h-3.5 w-3.5" />List
              </Link>
              <button className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-slate-900 text-white">
                <Map className="h-3.5 w-3.5" />Map
              </button>
            </div>
            <select className="text-sm text-slate-600 border border-slate-200 rounded-xl px-3 py-1.5 bg-white outline-none">
              <option>Sort: Recommended ↓</option>
            </select>
          </div>
        </div>
      </div>

      {/* SPLIT LAYOUT */}
      <div className="max-w-[1400px] mx-auto w-full flex flex-1 gap-4 overflow-hidden px-6 lg:px-10 pb-8">
        {/* LEFT COLUMN */}
        <aside className="w-[455px] flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden shrink-0 shadow-sm">
          <div className="flex-1 overflow-y-auto">
            {filtered.map((stay, i) => {
              const price = formatPence(stay.pricePerNight)
              if (i === 0) {
                return (
                  <Link key={stay.id} href={`/stays/${stay.slug}`} className="block border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="relative h-48 overflow-hidden">
                      <Image src={stay.heroImage} alt={stay.title} fill className="object-cover" sizes="420px" />
                      {stay.verified && (
                        <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/90 text-emerald-600 border border-emerald-200 rounded-full px-2 py-0.5 text-xs font-medium">
                          <Check className="w-3 h-3" />Verified stay
                        </div>
                      )}
                      <button className="absolute top-3 right-3 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-sm" onClick={e => e.preventDefault()}>
                        <Heart className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900 text-sm">{stay.title}</h3>
                        <span className="shrink-0 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">{stay.stayType}</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-1.5">{stay.location}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                        <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" />{stay.beds} bed</span>
                        <span className="flex items-center gap-1"><Bath className="w-3 h-3" />{stay.bathrooms} bath</span>
                        <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" />{stay.rating}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{price}</span>
                        <span className="text-xs text-slate-500">/ night</span>
                      </div>
                    </div>
                  </Link>
                )
              }
              return (
                <Link key={stay.id} href={`/stays/${stay.slug}`} className="flex gap-3 p-3 border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0">
                    <Image src={stay.heroImage} alt={stay.title} fill className="object-cover" sizes="80px" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1 mb-0.5">
                      <h3 className="text-xs font-semibold text-slate-900 line-clamp-1">{stay.title}</h3>
                      <span className="shrink-0 bg-blue-50 text-blue-700 text-[10px] px-1.5 py-0.5 rounded-full">{stay.stayType}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-1">{stay.location}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-1">
                      <span>{stay.beds} bed · {stay.bathrooms} bath</span>
                    </div>
                    <div className="flex items-center gap-1.5 mb-1">
                      {stay.instantBook && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] bg-slate-50 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                          <Zap className="w-2.5 h-2.5 text-blue-500" />Instant
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{price}<span className="text-xs font-normal text-slate-500"> /night</span></span>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 self-center -rotate-90" />
                </Link>
              )
            })}
            <button className="w-full py-4 text-sm font-medium text-blue-600 hover:bg-slate-50 transition-colors border-t border-slate-100">
              Load more stays ↓
            </button>
          </div>
        </aside>

        {/* MAP */}
        <div className="flex-1 relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <StaysMap stays={filtered} />

          {/* Area chips overlay — top of map */}
          <div className="absolute top-5 left-5 right-5 z-[1000] flex items-center gap-3 overflow-x-auto scrollbar-hide pointer-events-auto">
            {AREA_CHIPS.map(area => (
              <button
                key={area}
                onClick={() => setActiveArea(area)}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold shadow-md transition-colors whitespace-nowrap ${
                  activeArea === area ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {area}
              </button>
            ))}
            {/* Search as I move toggle */}
            <button
              onClick={() => setSearchAsMove(p => !p)}
              className={`ml-auto shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition-colors whitespace-nowrap ${
                searchAsMove ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'
              }`}
            >
              <span className={`w-3.5 h-3.5 rounded-full border-2 transition-colors ${searchAsMove ? 'bg-white border-white' : 'border-slate-400'}`} />
              Search as I move the map
            </button>
          </div>

          {/* Bottom left card */}
          <div className="absolute bottom-8 left-8 z-[1000] bg-white rounded-xl shadow-md px-5 py-3 text-xs text-slate-600 pointer-events-none">
            Showing 1,248 stays • Tap on a pin to view stay
          </div>

          {/* Map / Satellite toggle */}
          <div className="absolute bottom-8 right-8 z-[1000] flex items-center border border-slate-200 rounded-xl overflow-hidden shadow-md">
            <button className="px-3 py-1.5 text-xs font-medium bg-white text-slate-900">Map</button>
            <button className="px-3 py-1.5 text-xs font-medium bg-slate-50 text-slate-500 border-l border-slate-200">Satellite</button>
          </div>
        </div>
      </div>
      </main>
    </div>
  )
}
