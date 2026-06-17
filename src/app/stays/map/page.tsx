'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Search, List, Map, ToggleLeft } from 'lucide-react'
import { useState } from 'react'
import PublicMarketplaceNav from '@/components/public-marketplace/PublicMarketplaceNav'
import StayCompactCard from '@/components/public-marketplace/cards/StayCompactCard'
import { SEED_STAYS } from '@/lib/public-marketplace/seed-fallback'

const StaysMap = dynamic(() => import('@/components/public-marketplace/maps/StaysMap'), { ssr: false })

const FILTER_CHIPS = [
  { label: 'All', value: '' },
  { label: 'Entire home', value: 'Entire home' },
  { label: 'Studio', value: 'Studio' },
  { label: 'Pets', value: 'pets' },
  { label: 'Instant book', value: 'instant' },
]

export default function StaysMapPage() {
  const [activeFilter, setActiveFilter] = useState('')
  const [searchAsMove, setSearchAsMove] = useState(false)
  const [query, setQuery] = useState('')

  const filtered = SEED_STAYS.filter(s => {
    if (query && !s.title.toLowerCase().includes(query.toLowerCase()) && !s.location.toLowerCase().includes(query.toLowerCase())) return false
    if (activeFilter === 'Entire home') return s.stayType === 'Entire home'
    if (activeFilter === 'Studio') return s.stayType === 'Studio'
    if (activeFilter === 'pets') return s.petsAllowed
    if (activeFilter === 'instant') return s.instantBook
    return true
  })

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <PublicMarketplaceNav />
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-80 flex flex-col border-r border-slate-200 bg-white overflow-hidden shrink-0">
          {/* Search */}
          <div className="p-3 border-b border-slate-100">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search stays..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="flex-1 text-sm bg-transparent outline-none text-slate-700 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Filter chips */}
          <div className="p-3 border-b border-slate-100">
            <div className="flex flex-wrap gap-1.5">
              {FILTER_CHIPS.map(chip => (
                <button
                  key={chip.value}
                  onClick={() => setActiveFilter(chip.value === activeFilter ? '' : chip.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    activeFilter === chip.value
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* List/Map toggle */}
          <div className="p-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Link
                href="/stays"
                className="flex items-center gap-1.5 flex-1 justify-center py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <List className="h-3.5 w-3.5" />
                List view
              </Link>
              <button className="flex items-center gap-1.5 flex-1 justify-center py-2 bg-slate-900 text-white rounded-lg text-xs font-medium">
                <Map className="h-3.5 w-3.5" />
                Map view
              </button>
            </div>
          </div>

          {/* Results count */}
          <div className="px-3 py-2 text-xs text-slate-500">
            {filtered.length} stays in this area
          </div>

          {/* Compact stay cards */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filtered.map((stay, i) => (
              <StayCompactCard key={stay.id} stay={stay} featured={i === 0} />
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-sm">
                No stays match your filters
              </div>
            )}
          </div>

          {/* Search as I move toggle */}
          <div className="p-3 border-t border-slate-100">
            <button
              onClick={() => setSearchAsMove(prev => !prev)}
              className="flex items-center gap-2 text-sm text-slate-600 w-full"
            >
              <ToggleLeft className={`h-5 w-5 ${searchAsMove ? 'text-blue-600' : 'text-slate-400'}`} />
              Search as I move the map
            </button>
          </div>
        </aside>

        {/* Map */}
        <div className="flex-1 relative">
          <StaysMap stays={filtered} />
        </div>
      </div>
    </div>
  )
}
