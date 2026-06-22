'use client'

import { Suspense, useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Map, Loader2, X, MapPin, Calendar, Users } from 'lucide-react'
import StayCard from '@/components/public-marketplace/cards/StayCard'
import FilterBar, { type FilterDef, type FilterState, rangeOf, selectedOf, countOf, toggleOf } from '@/components/public-marketplace/FilterBar'
import type { PublicStay } from '@/lib/public-marketplace/types'

const PAGE_SIZE = 12

const STAY_TYPES = ['Entire home', 'Private room', 'Shared room', 'Studio', 'Penthouse']

const SORT_OPTIONS = [
  { label: 'Sort: Recommended', value: '' },
  { label: 'Price: Low to high', value: 'price_asc' },
  { label: 'Price: High to low', value: 'price_desc' },
  { label: 'Rating: Highest first', value: 'rating_desc' },
]

function formatDateDisplay(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function StaysFilterInner({ stays }: { stays: PublicStay[] }) {
  const searchParams = useSearchParams()
  const locationParam = searchParams?.get('location') ?? ''
  const checkInParam = searchParams?.get('checkIn') ?? ''
  const checkOutParam = searchParams?.get('checkOut') ?? ''
  const guestsParam = Number(searchParams?.get('guests') ?? 0)

  const [filterState, setFilterState] = useState<FilterState>({})
  const [sortBy, setSortBy] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Build filter schema from the actual data (price bounds + present types).
  const filterDefs = useMemo<FilterDef[]>(() => {
    const prices = stays.map(s => Math.round(s.pricePerNight / 100)).filter(n => n > 0)
    const minP = prices.length ? Math.max(0, Math.floor(Math.min(...prices) / 10) * 10) : 0
    const maxP = prices.length ? Math.ceil(Math.max(...prices) / 50) * 50 : 1000
    const presentTypes = STAY_TYPES.filter(t => stays.some(s => s.stayType === t))
    return [
      { id: 'price', label: 'Price', kind: 'range', min: minP, max: maxP, step: 10, prefix: '£' },
      { id: 'type', label: 'Type', kind: 'multi', options: presentTypes.map(t => ({ value: t, label: t })) },
      { id: 'beds', label: 'Bedrooms', kind: 'stepper', min: 0, max: 8, suffix: 'beds' },
      { id: 'baths', label: 'Bathrooms', kind: 'stepper', min: 0, max: 6, suffix: 'baths' },
      { id: 'pets', label: 'Pets', kind: 'toggle' },
      { id: 'instant', label: 'Instant book', kind: 'toggle' },
      { id: 'verified', label: 'Verified', kind: 'toggle' },
      { id: 'short', label: 'Short lets', kind: 'toggle' },
      { id: 'long', label: 'Long stays', kind: 'toggle' },
    ]
  }, [stays])

  const filtered = useMemo(() => {
    let result = [...stays]
    // URL param filters from hero search bar
    if (locationParam) {
      const loc = locationParam.toLowerCase()
      result = result.filter(s =>
        (s.location ?? '').toLowerCase().includes(loc) ||
        (s.city ?? '').toLowerCase().includes(loc) ||
        (s.postcode ?? '').toLowerCase().includes(loc)
      )
    }
    if (guestsParam > 0) {
      result = result.filter(s => (s.guests ?? 1) >= guestsParam)
    }
    // Filter-bar values
    const priceRange = rangeOf(filterState, 'price')
    if (priceRange) {
      const [lo, hi] = priceRange
      const max = filterDefs.find(d => d.id === 'price')
      const hiBound = max && max.kind === 'range' ? max.max : hi
      result = result.filter(s => {
        const p = s.pricePerNight / 100
        return p >= lo && (hi >= hiBound ? true : p <= hi)
      })
    }
    const types = selectedOf(filterState, 'type')
    if (types.length) result = result.filter(s => types.includes(s.stayType))
    const beds = countOf(filterState, 'beds')
    if (beds > 0) result = result.filter(s => (s.bedrooms ?? s.beds) >= beds)
    const baths = countOf(filterState, 'baths')
    if (baths > 0) result = result.filter(s => s.bathrooms >= baths)
    if (toggleOf(filterState, 'pets')) result = result.filter(s => s.petsAllowed)
    if (toggleOf(filterState, 'instant')) result = result.filter(s => s.instantBook)
    if (toggleOf(filterState, 'verified')) result = result.filter(s => s.verified)
    if (toggleOf(filterState, 'short')) result = result.filter(s => s.shortLets)
    if (toggleOf(filterState, 'long')) result = result.filter(s => s.longStays)
    // Sort
    if (sortBy === 'price_asc') result = [...result].sort((a, b) => a.pricePerNight - b.pricePerNight)
    else if (sortBy === 'price_desc') result = [...result].sort((a, b) => b.pricePerNight - a.pricePerNight)
    else if (sortBy === 'rating_desc') result = [...result].sort((a, b) => b.rating - a.rating)
    return result
  }, [stays, filterState, filterDefs, sortBy, locationParam, guestsParam])

  const chipActiveCount = filterDefs.reduce((n, d) => {
    const v = filterState[d.id]
    if (!v) return n
    if (d.kind === 'range') return n + (v.range && (v.range[0] > d.min || v.range[1] < d.max) ? 1 : 0)
    if (d.kind === 'multi') return n + ((v.selected?.length ?? 0) > 0 ? 1 : 0)
    if (d.kind === 'stepper') return n + ((v.count ?? 0) > (d.min ?? 0) ? 1 : 0)
    return n + (v.on ? 1 : 0)
  }, 0)
  const activeCount = chipActiveCount + (locationParam ? 1 : 0) + (checkInParam ? 1 : 0) + (guestsParam > 0 ? 1 : 0)
  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  useEffect(() => { setVisibleCount(PAGE_SIZE) }, [filtered.length, filterState, sortBy, locationParam, guestsParam])

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
      {/* FILTER CHIPS ROW — sticky */}
      <div className="border-b border-slate-100 bg-white sticky top-20 z-30 py-3">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <FilterBar filters={filterDefs} value={filterState} onChange={setFilterState} />
        </div>
      </div>

      {/* RESULTS TOOLBAR */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-5">
        {/* Active search context pills */}
        {(locationParam || checkInParam || checkOutParam || guestsParam > 0) && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {locationParam && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-[12.5px] font-medium text-blue-700">
                <MapPin className="h-3 w-3" /> {locationParam}
              </span>
            )}
            {(checkInParam || checkOutParam) && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-[12.5px] font-medium text-blue-700">
                <Calendar className="h-3 w-3" />
                {checkInParam ? formatDateDisplay(checkInParam) : '–'} → {checkOutParam ? formatDateDisplay(checkOutParam) : '–'}
              </span>
            )}
            {guestsParam > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-[12.5px] font-medium text-blue-700">
                <Users className="h-3 w-3" /> {guestsParam} {guestsParam === 1 ? 'guest' : 'guests'}
              </span>
            )}
            <a href="/stays" className="inline-flex items-center gap-1 text-[12px] text-slate-500 hover:text-slate-700 ml-1">
              <X className="h-3.5 w-3.5" /> Clear search
            </a>
          </div>
        )}
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="text-xl font-bold text-slate-900">{filtered.length.toLocaleString()} stays</span>
            <span className="text-slate-500 text-sm ml-2">
              {activeCount > 0 ? 'Matching your search' : 'Across the UK'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/stays/map"
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Map className="h-4 w-4" />
              Map view
            </Link>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="text-sm text-slate-600 border border-slate-200 rounded-xl px-3 py-2 bg-white outline-none"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* CARD GRID */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 items-stretch">
          {visible.map(stay => (
            <StayCard key={stay.id} stay={stay} />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-24">
            <p className="text-slate-500 text-lg">No stays match your filters.</p>
            <button
              onClick={() => setFilterState({})}
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
            Loading more stays…
          </div>
        )}
        {!hasMore && filtered.length > PAGE_SIZE && (
          <p className="text-center text-xs text-slate-400 py-6">
            All {filtered.length} stays shown
          </p>
        )}
      </div>
    </>
  )
}

/** Wrap with Suspense — required because StaysFilterInner reads useSearchParams */
export default function StaysFilterClient({ stays }: { stays: PublicStay[] }) {
  return (
    <Suspense fallback={
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-[280px] animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      </div>
    }>
      <StaysFilterInner stays={stays} />
    </Suspense>
  )
}
