'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Filter, Map, Star, Zap, Loader2 } from 'lucide-react'
import ServiceOfferCard from '@/components/public-marketplace/cards/ServiceOfferCard'
import type { PublicServiceOffer } from '@/lib/public-marketplace/types'

const PAGE_SIZE = 12

type FilterKey = 'verified' | 'urgent' | 'emergency' | 'toprated' | 'insured'

const CHIPS: { label: string; value: FilterKey; red?: boolean }[] = [
  { label: 'Verified', value: 'verified' },
  { label: 'Urgent', value: 'urgent' },
  { label: 'Emergency', value: 'emergency', red: true },
  { label: 'Top rated', value: 'toprated' },
  { label: 'Insured', value: 'insured' },
]

const SORT_OPTIONS = [
  { label: 'Sort: Recommended ↓', value: '' },
  { label: 'Price: Low to high', value: 'price_asc' },
  { label: 'Rating: Highest first', value: 'rating_desc' },
]

const CATEGORY_TABS = [
  { label: 'All services', value: '' },
  { label: 'Cleaning', value: 'Cleaning' },
  { label: 'Plumbing', value: 'Plumbing' },
  { label: 'Electrical', value: 'Electrical' },
  { label: 'Heating', value: 'Heating' },
  { label: 'Gardening', value: 'Gardening' },
  { label: 'Handyman', value: 'Handyman' },
  { label: 'Waste Removal', value: 'Waste Removal' },
]

interface Props {
  allOffers: PublicServiceOffer[]
  featuredOffers: PublicServiceOffer[]
}

export default function ServicesFilterClient({ allOffers, featuredOffers }: Props) {
  const [active, setActive] = useState<Set<FilterKey>>(new Set())
  const [category, setCategory] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const sentinelRef = useRef<HTMLDivElement>(null)

  function toggle(key: FilterKey) {
    setActive(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

  const filtered = useMemo(() => {
    let result = [...allOffers]
    if (category) result = result.filter(o => o.category === category)
    if (active.has('verified')) result = result.filter(o => o.verified)
    if (active.has('urgent')) result = result.filter(o => o.urgent)
    if (active.has('emergency')) result = result.filter(o => o.urgent)
    if (active.has('toprated')) result = result.filter(o => o.rating >= 4.5)
    if (active.has('insured')) result = result.filter(o => o.insured)
    if (sortBy === 'price_asc') result = [...result].sort((a, b) => a.basePrice - b.basePrice)
    else if (sortBy === 'rating_desc') result = [...result].sort((a, b) => b.rating - a.rating)
    return result
  }, [allOffers, active, category, sortBy])

  const shownFeatured = category === '' ? featuredOffers : featuredOffers.filter(o => o.category === category)
  const activeCount = active.size
  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  useEffect(() => { setVisibleCount(PAGE_SIZE) }, [filtered.length, active, category, sortBy])

  const loadMore = useCallback(() => {
    setVisibleCount(c => Math.min(c + PAGE_SIZE, filtered.length))
  }, [filtered.length])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting && hasMore) loadMore() },
      { rootMargin: '200px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loadMore])

  return (
    <>
      {/* FILTER CHIPS */}
      <div className="border-b border-slate-100 bg-white sticky top-20 z-30 py-3">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            <button className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-full text-sm text-slate-600 hover:bg-slate-50 relative">
              <Filter className="h-3.5 w-3.5" />
              {activeCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{activeCount}</span>
              )}
            </button>
            {CHIPS.map(chip => (
              <button
                key={chip.value}
                onClick={() => toggle(chip.value)}
                className={[
                  'shrink-0 px-4 py-1.5 rounded-full border text-sm font-medium transition-colors whitespace-nowrap',
                  active.has(chip.value)
                    ? 'bg-slate-900 text-white border-slate-900'
                    : chip.red
                    ? 'border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                ].join(' ')}
              >
                {chip.red && <Zap className="h-3.5 w-3.5" />}
                {chip.label}
              </button>
            ))}
            {activeCount > 0 && (
              <button
                onClick={() => setActive(new Set())}
                className="ml-auto shrink-0 text-blue-600 text-sm font-medium hover:text-blue-700 whitespace-nowrap"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8">
        {/* RESULTS TOOLBAR */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-xl font-bold text-slate-900">{filtered.length.toLocaleString()} service offers</span>
            <span className="text-slate-500 text-sm ml-2">
              {activeCount > 0 || category ? '· Filters active' : '· Across the UK'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold">
              Offers
            </button>
            <Link href="/providers" className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50">
              Providers
            </Link>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="text-sm text-slate-600 border border-slate-200 rounded-xl px-3 py-2 bg-white outline-none"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <Link href="/services/map" className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50">
              <Map className="h-4 w-4" />Map
            </Link>
          </div>
        </div>

        {/* FEATURED SERVICE OFFERS — horizontal scroll */}
        {shownFeatured.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                  Featured service offers
                </h2>
                <p className="text-slate-500 text-sm mt-0.5">Hand-picked top performers with proven track records</p>
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-3 -mx-6 px-6 lg:-mx-10 lg:px-10 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
              {shownFeatured.map(offer => (
                <ServiceOfferCard key={offer.id} offer={offer} featured />
              ))}
            </div>
          </div>
        )}

        {/* CATEGORY TABS */}
        <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] mb-6 pb-1">
          {CATEGORY_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setCategory(tab.value)}
              className={[
                'shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap',
                category === tab.value ? 'bg-slate-900 text-white' : 'border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* COMPACT CARD GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 items-stretch">
          {visible.map(offer => (
            <ServiceOfferCard key={offer.id} offer={offer} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-24">
            <p className="text-slate-500 text-lg">No services match your filters.</p>
            <button
              onClick={() => { setActive(new Set()); setCategory('') }}
              className="mt-4 text-blue-600 font-medium hover:text-blue-700 text-sm"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-4" />
        {hasMore && (
          <div className="flex items-center justify-center py-8 gap-2 text-slate-500 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading more services…
          </div>
        )}
        {!hasMore && filtered.length > PAGE_SIZE && (
          <p className="text-center text-xs text-slate-400 py-4">
            All {filtered.length} services shown
          </p>
        )}
      </div>
    </>
  )
}
