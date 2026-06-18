'use client'

import { useState } from 'react'
import { Filter, Download, ChevronDown, Plus, Search } from 'lucide-react'
import { SEED_LISTINGS } from '@/lib/property-manager/listings/seed'
import type { Listing } from '@/lib/property-manager/listings/types'
import ListingKpiCards from './ListingKpiCards'
import ListingsTable from './ListingsTable'
import ListingPreviewPanel from './ListingPreviewPanel'
import { cn } from '@/lib/utils'

const TABS = [
  { key: 'all', label: 'All listings', count: 130 },
  { key: 'live', label: 'Live', count: 112 },
  { key: 'draft', label: 'Draft', count: 18 },
  { key: 'needs_attention', label: 'Needs attention', count: 15 },
  { key: 'short_stay', label: 'Short stays', count: 94 },
  { key: 'long_term', label: 'Long-term rentals', count: 36 },
  { key: 'direct', label: 'Direct booking enabled', count: 78 },
  { key: 'channel_synced', label: 'Channel synced', count: 102 },
]

export default function ListingsPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>('1')
  const [search, setSearch] = useState('')

  const listings: Listing[] = SEED_LISTINGS

  const selectedListing = listings.find((l) => l.id === selectedId) ?? null

  const handleSelect = (id: string) => {
    setSelectedId((prev) => (prev === id ? null : id))
  }

  const filteredListings = listings.filter((l) => {
    if (search) {
      const q = search.toLowerCase()
      return (
        l.title.toLowerCase().includes(q) ||
        l.listing_reference.toLowerCase().includes(q) ||
        l.property_location.toLowerCase().includes(q)
      )
    }
    if (activeTab === 'live') return l.status === 'live'
    if (activeTab === 'draft') return l.status === 'draft'
    if (activeTab === 'needs_attention') return l.status === 'needs_attention'
    if (activeTab === 'short_stay') return l.listing_type === 'short_stay'
    if (activeTab === 'long_term') return l.listing_type === 'long_term'
    if (activeTab === 'direct') return l.channels.some((c) => c.name === 'direct')
    if (activeTab === 'channel_synced') return l.channels.length > 0
    return true
  })

  return (
    <div className="flex h-full gap-0 overflow-hidden">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto min-w-0 px-6 py-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Listings</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage bookable listings, availability, pricing, channels and direct-booking performance.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button className="flex items-center gap-1.5 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              <Filter className="w-4 h-4" />
              Filters
            </button>
            <button className="flex items-center gap-1.5 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button className="flex items-center gap-1.5 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              Bulk actions
              <ChevronDown className="w-4 h-4" />
            </button>
            <button className="flex items-center gap-1.5 bg-blue-600 text-white rounded-xl px-3.5 py-2 text-sm font-medium hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4" />
              Create listing
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <ListingKpiCards />

        {/* Status tabs */}
        <div className="mt-6 border-b border-slate-200">
          <div className="flex gap-0 overflow-x-auto [&::-webkit-scrollbar]:hidden">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                    isActive
                      ? 'border-blue-600 text-blue-600 font-semibold'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      'text-xs px-1.5 py-0.5 rounded-full',
                      isActive ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Filter row */}
        <div className="mt-4 flex gap-2 items-center flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search listings..."
              className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]">
            <option>Property type: All</option>
          </select>
          <select className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px]">
            <option>Listing type: All</option>
            <option>Short stay</option>
            <option>Long-term</option>
          </select>
          <select className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px]">
            <option>Channel: All</option>
            <option>Airbnb</option>
            <option>Booking.com</option>
            <option>Direct</option>
          </select>
          <select className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[160px]">
            <option>Publication status: All</option>
            <option>Published</option>
            <option>Unpublished</option>
          </select>
          <select className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]">
            <option>Location: All locations</option>
          </select>
          <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors">
            <span>17 Jun 2026 – 17 Jul 2026</span>
          </div>
          <button
            onClick={() => { setSearch(''); setActiveTab('all') }}
            className="text-sm text-blue-600 hover:text-blue-700 transition-colors whitespace-nowrap"
          >
            Clear all
          </button>
        </div>

        {/* Table */}
        <ListingsTable
          listings={filteredListings}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
      </div>

      {/* Preview panel */}
      <ListingPreviewPanel
        listing={selectedListing}
        onClose={() => setSelectedId(null)}
      />
    </div>
  )
}
