'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Search, List, Map, ToggleLeft, Clock, MapPin } from 'lucide-react'
import { useState } from 'react'
import PublicMarketplaceNav from '@/components/public-marketplace/PublicMarketplaceNav'
import { SEED_SERVICE_OFFERS } from '@/lib/public-marketplace/seed-fallback'

const ServicesMap = dynamic(() => import('@/components/public-marketplace/maps/ServicesMap'), { ssr: false })

const FILTER_CHIPS = [
  { label: 'All', value: '' },
  { label: 'Cleaning', value: 'Cleaning' },
  { label: 'Plumbing', value: 'Plumbing' },
  { label: 'Electrical', value: 'Electrical' },
  { label: 'Gardening', value: 'Gardening' },
  { label: 'Emergency', value: 'emergency' },
]

export default function ServicesMapPage() {
  const [activeFilter, setActiveFilter] = useState('')
  const [searchAsMove, setSearchAsMove] = useState(false)
  const [query, setQuery] = useState('')

  const filtered = SEED_SERVICE_OFFERS.filter(o => {
    if (query && !o.title.toLowerCase().includes(query.toLowerCase()) && !o.providerName.toLowerCase().includes(query.toLowerCase())) return false
    if (activeFilter === 'emergency') return o.urgent
    if (activeFilter && activeFilter !== 'emergency') return o.category === activeFilter
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
                placeholder="Search services..."
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
                href="/services"
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
            {filtered.length} services in this area
          </div>

          {/* Compact service cards */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filtered.map(offer => (
              <div key={offer.id} className="bg-white border border-slate-200 rounded-xl p-3 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 line-clamp-1">{offer.title}</p>
                    <p className="text-xs text-slate-500">{offer.providerName}</p>
                  </div>
                  {offer.urgent && (
                    <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-semibold shrink-0">Urgent</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />{offer.responseTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />{offer.city}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">
                    From £{(offer.basePrice / 100).toFixed(0)}
                  </span>
                  <Link
                    href={`/services/${offer.slug}`}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    View details →
                  </Link>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-sm">
                No services match your filters
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
          <ServicesMap offers={filtered} />
        </div>
      </div>
    </div>
  )
}
