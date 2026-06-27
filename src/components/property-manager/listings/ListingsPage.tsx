'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Filter, Download, ChevronDown, Plus, Search } from 'lucide-react'
import type { Listing } from '@/lib/property-manager/listings/types'
import ListingKpiCards from './ListingKpiCards'
import ListingsTable from './ListingsTable'
import ListingPreviewPanel from './ListingPreviewPanel'
import { cn } from '@/lib/utils'

// Primary tabs filter by STATUS dimension only. Type and channel are secondary
// filter chips below the tab bar — mixing dimensions in the same tab row would
// produce counts that don't add up (e.g. All=130 but Short stays + Long-term
// also = 130, not summing to 130 through a different lens simultaneously).
const STATUS_TABS = [
  { key: 'all', label: 'All listings' },
  { key: 'live', label: 'Live' },
  { key: 'draft', label: 'Draft' },
  { key: 'needs_attention', label: 'Needs attention' },
]

// Secondary type filter chips — independent from status tabs
const TYPE_CHIPS = [
  { key: 'all_types', label: 'All types' },
  { key: 'short_stay', label: 'Short stays' },
  { key: 'long_term', label: 'Long-term rentals' },
]

// Secondary channel filter chips — independent from status tabs
const CHANNEL_CHIPS = [
  { key: 'all_channels', label: 'All channels' },
  { key: 'direct', label: 'Direct booking' },
  { key: 'channel_synced', label: 'Channel synced' },
]

export default function ListingsPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [activeType, setActiveType] = useState('all_types')
  const [activeChannel, setActiveChannel] = useState('all_channels')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // Listings table not yet migrated to live schema. Gated by bookingManagement
  // feature flag. Replace with live Supabase query when migration is applied:
  // supabase.from('listings').select('*').eq('workspace_id', workspaceId)
  const listings: Listing[] = []

  // Derive counts from the SAME dataset so tabs always match table totals.
  // Status counts use only the status dimension; type/channel counts are
  // independent and use the full dataset (not filtered by status tab).
  const statusCounts = useMemo(() => ({
    all: listings.length,
    live: listings.filter((l) => l.status === 'live').length,
    draft: listings.filter((l) => l.status === 'draft').length,
    needs_attention: listings.filter((l) => l.status === 'needs_attention').length,
  }), [listings])

  const typeCounts = useMemo(() => ({
    all_types: listings.length,
    short_stay: listings.filter((l) => l.listing_type === 'short_stay').length,
    long_term: listings.filter((l) => l.listing_type === 'long_term').length,
  }), [listings])

  const channelCounts = useMemo(() => ({
    all_channels: listings.length,
    direct: listings.filter((l) => l.channels.some((c) => c.name === 'direct')).length,
    channel_synced: listings.filter((l) => l.channels.length > 0).length,
  }), [listings])

  const selectedListing = listings.find((l) => l.id === selectedId) ?? null

  const handleSelect = (id: string) => {
    setSelectedId((prev) => (prev === id ? null : id))
  }

  const filteredListings = listings.filter((l) => {
    // Status tab filter
    if (activeTab === 'live' && l.status !== 'live') return false
    if (activeTab === 'draft' && l.status !== 'draft') return false
    if (activeTab === 'needs_attention' && l.status !== 'needs_attention') return false

    // Secondary type filter
    if (activeType === 'short_stay' && l.listing_type !== 'short_stay') return false
    if (activeType === 'long_term' && l.listing_type !== 'long_term') return false

    // Secondary channel filter
    if (activeChannel === 'direct' && !l.channels.some((c) => c.name === 'direct')) return false
    if (activeChannel === 'channel_synced' && l.channels.length === 0) return false

    // Text search
    if (search) {
      const q = search.toLowerCase()
      return (
        l.title.toLowerCase().includes(q) ||
        l.listing_reference.toLowerCase().includes(q) ||
        l.property_location.toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <div className="flex h-full gap-0 overflow-hidden">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto min-w-0 py-6">
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
            <Link href="/property-manager/listings/new" className="flex items-center gap-1.5 bg-[var(--brand)] text-white rounded-xl px-3.5 py-2 text-sm font-medium hover:bg-[var(--brand-strong)] transition-colors">
              <Plus className="w-4 h-4" />
              Create listing
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <ListingKpiCards listings={listings} />

        {/* Status tabs — by status dimension only */}
        <div className="mt-6 border-b border-slate-200">
          <div className="relative">
            <div className="flex gap-0 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] after:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-8 after:bg-gradient-to-l after:from-white after:to-transparent after:pointer-events-none">
              {STATUS_TABS.map((tab) => {
                const isActive = activeTab === tab.key
                const count = statusCounts[tab.key as keyof typeof statusCounts] ?? 0
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                      isActive
                        ? 'border-[var(--brand)] text-[var(--brand)] font-semibold'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    )}
                  >
                    {tab.label}
                    <span
                      className={cn(
                        'text-xs px-1.5 py-0.5 rounded-full',
                        isActive ? 'bg-[var(--brand-soft)] text-[var(--brand)]' : 'bg-slate-100 text-slate-500'
                      )}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Secondary filter chips — type and channel (independent dimensions) */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Type:</span>
          {TYPE_CHIPS.map((chip) => {
            const isActive = activeType === chip.key
            const count = typeCounts[chip.key as keyof typeof typeCounts] ?? 0
            return (
              <button
                key={chip.key}
                onClick={() => setActiveType(chip.key)}
                className={cn(
                  'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                  isActive
                    ? 'bg-[var(--brand-soft)] border-[var(--color-brand-300)] text-[var(--brand)]'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                )}
              >
                {chip.label}
                <span className={cn('text-[10px]', isActive ? 'text-[var(--brand)]' : 'text-slate-400')}>
                  {count}
                </span>
              </button>
            )
          })}
          <span className="text-xs text-slate-300 mx-1">|</span>
          <span className="text-xs text-slate-400 font-medium">Channel:</span>
          {CHANNEL_CHIPS.map((chip) => {
            const isActive = activeChannel === chip.key
            const count = channelCounts[chip.key as keyof typeof channelCounts] ?? 0
            return (
              <button
                key={chip.key}
                onClick={() => setActiveChannel(chip.key)}
                className={cn(
                  'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                  isActive
                    ? 'bg-[var(--brand-soft)] border-[var(--color-brand-300)] text-[var(--brand)]'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                )}
              >
                {chip.label}
                <span className={cn('text-[10px]', isActive ? 'text-[var(--brand)]' : 'text-slate-400')}>
                  {count}
                </span>
              </button>
            )
          })}
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
              className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
            />
          </div>
          <select className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] min-w-[150px]">
            <option>Property type: All</option>
          </select>
          <select className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] min-w-[140px]">
            <option>Listing type: All</option>
            <option>Short stay</option>
            <option>Long-term</option>
          </select>
          <select className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] min-w-[120px]">
            <option>Channel: All</option>
            <option>Airbnb</option>
            <option>Booking.com</option>
            <option>Direct</option>
          </select>
          <select className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] min-w-[160px]">
            <option>Publication status: All</option>
            <option>Published</option>
            <option>Unpublished</option>
          </select>
          <select className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] min-w-[150px]">
            <option>Location: All locations</option>
          </select>
          <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors">
            <span>Date range</span>
          </div>
          <button
            onClick={() => { setSearch(''); setActiveTab('all'); setActiveType('all_types'); setActiveChannel('all_channels') }}
            className="text-sm text-[var(--brand)] hover:text-[var(--brand)] transition-colors whitespace-nowrap"
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
