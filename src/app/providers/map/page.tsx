'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import Image from 'next/image'
import { Search, List, Map, ToggleLeft, Star, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import PublicMarketplaceNav from '@/components/public-marketplace/PublicMarketplaceNav'
import { SEED_PROVIDERS } from '@/lib/public-marketplace/seed-fallback'

const ProvidersMap = dynamic(() => import('@/components/public-marketplace/maps/ProvidersMap'), { ssr: false })

const FILTER_CHIPS = [
  { label: 'All', value: '' },
  { label: 'Vetted', value: 'vetted' },
  { label: 'Gas Safe', value: 'gassafe' },
  { label: 'NICEIC', value: 'niceic' },
  { label: 'Emergency', value: 'emergency' },
]

export default function ProvidersMapPage() {
  const [activeFilter, setActiveFilter] = useState('')
  const [searchAsMove, setSearchAsMove] = useState(false)
  const [query, setQuery] = useState('')

  const filtered = SEED_PROVIDERS.filter(p => {
    if (query && !p.companyName.toLowerCase().includes(query.toLowerCase()) && !p.trade.toLowerCase().includes(query.toLowerCase())) return false
    if (activeFilter === 'vetted') return p.vetted
    if (activeFilter === 'gassafe') return !!p.gasSafe
    if (activeFilter === 'niceic') return !!p.niceic
    if (activeFilter === 'emergency') return p.emergency24h
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
                placeholder="Search providers..."
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
                href="/providers"
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
            {filtered.length} providers in this area
          </div>

          {/* Compact provider cards */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filtered.map(provider => (
              <div key={provider.id} className="bg-white border border-slate-200 rounded-xl p-3 hover:shadow-sm transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0">
                    <Image src={provider.logo} alt={provider.companyName} fill className="object-cover" sizes="40px" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-slate-900 truncate">{provider.companyName}</p>
                      {provider.proBadge && (
                        <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded font-semibold shrink-0">Pro</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{provider.trade}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-semibold text-slate-700">{provider.rating}</span>
                    {provider.vetted && (
                      <span className="ml-1 flex items-center gap-0.5 text-xs text-emerald-600">
                        <CheckCircle className="h-3 w-3" />Vetted
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/providers/${provider.slug}`}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    View profile →
                  </Link>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-sm">
                No providers match your filters
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
          <ProvidersMap providers={filtered} />
        </div>
      </div>
    </div>
  )
}
