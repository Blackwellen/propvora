'use client'

/* ──────────────────────────────────────────────────────────────────────────
   Customer Stays filtering — the wired equivalent of the public
   /stays StaysFilterClient, scoped to the customer workspace (basePath
   /user/stays). Replaces the previous toggle-only PublicFilterChips that
   wrote ?filters to the URL but never applied them. Real client-side filtering
   over price/type/bedrooms/bathrooms + pets/instant/verified/short/long
   toggles, plus sort and infinite scroll. Reuses the shared FilterBar.
─────────────────────────────────────────────────────────────────────────── */

import { Suspense, useState, useMemo, useEffect, useRef, useCallback, type ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Map, Loader2, X, MapPin, Users } from 'lucide-react'
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

function StaysFilterInner({ stays, saveSearch }: { stays: PublicStay[]; saveSearch?: ReactNode }) {
  const searchParams = useSearchParams()
  const locationParam = searchParams?.get('location') ?? ''
  const guestsParam = Number(searchParams?.get('guests') ?? 0)

  const [filterState, setFilterState] = useState<FilterState>({})
  const [sortBy, setSortBy] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const sentinelRef = useRef<HTMLDivElement>(null)

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
    if (locationParam) {
      const loc = locationParam.toLowerCase()
      result = result.filter(s =>
        (s.location ?? '').toLowerCase().includes(loc) ||
        (s.city ?? '').toLowerCase().includes(loc) ||
        (s.postcode ?? '').toLowerCase().includes(loc)
      )
    }
    if (guestsParam > 0) result = result.filter(s => (s.guests ?? 1) >= guestsParam)

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

    if (sortBy === 'price_asc') result = [...result].sort((a, b) => a.pricePerNight - b.pricePerNight)
    else if (sortBy === 'price_desc') result = [...result].sort((a, b) => b.pricePerNight - a.pricePerNight)
    else if (sortBy === 'rating_desc') result = [...result].sort((a, b) => b.rating - a.rating)
    return result
  }, [stays, filterState, filterDefs, sortBy, locationParam, guestsParam])

  const activeCount = filterDefs.reduce((n, d) => {
    const v = filterState[d.id]
    if (!v) return n
    if (d.kind === 'range') return n + (v.range && (v.range[0] > d.min || v.range[1] < d.max) ? 1 : 0)
    if (d.kind === 'multi') return n + ((v.selected?.length ?? 0) > 0 ? 1 : 0)
    if (d.kind === 'stepper') return n + ((v.count ?? 0) > (d.min ?? 0) ? 1 : 0)
    return n + (v.on ? 1 : 0)
  }, 0) + (locationParam ? 1 : 0) + (guestsParam > 0 ? 1 : 0)

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
    <div className="space-y-5">
      {/* Filter row — sticky */}
      <div className="sticky top-16 z-30 -mx-4 sm:-mx-6 lg:-mx-8 bg-white border-y border-slate-100 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
        <FilterBar filters={filterDefs} value={filterState} onChange={setFilterState} />
        {saveSearch && <div className="shrink-0">{saveSearch}</div>}
      </div>

      {/* Active search context pills */}
      {(locationParam || guestsParam > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          {locationParam && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-soft)] border border-[var(--color-brand-200)] px-3 py-1 text-[12.5px] font-medium text-[var(--brand-strong)]">
              <MapPin className="h-3 w-3" /> {locationParam}
            </span>
          )}
          {guestsParam > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-soft)] border border-[var(--color-brand-200)] px-3 py-1 text-[12.5px] font-medium text-[var(--brand-strong)]">
              <Users className="h-3 w-3" /> {guestsParam} {guestsParam === 1 ? 'guest' : 'guests'}
            </span>
          )}
          <Link href="/customer/stays" className="inline-flex items-center gap-1 text-[12px] text-slate-500 hover:text-slate-700 ml-1">
            <X className="h-3.5 w-3.5" /> Clear search
          </Link>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="text-[15px] font-bold text-slate-900">{filtered.length.toLocaleString()} stays</span>
          <span className="text-slate-500 text-[13px] ml-2">{activeCount > 0 ? 'Matching your search' : 'Across the UK'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/user/stays/map" className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-[12.5px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <Map className="h-4 w-4" /> Map view
          </Link>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="text-[12.5px] text-slate-600 border border-slate-200 rounded-xl px-3 py-2 bg-white outline-none">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 items-stretch">
        {visible.map(stay => <StayCard key={stay.id} stay={stay} basePath="/user/stays" />)}
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <p className="text-slate-500 text-[14px] font-semibold">No stays match your filters.</p>
          <button onClick={() => setFilterState({})} className="mt-3 text-[var(--brand)] font-semibold hover:text-[var(--brand-strong)] text-[12.5px]">Clear all filters</button>
        </div>
      )}
      <div ref={sentinelRef} className="h-4" />
      {hasMore && (
        <div className="flex items-center justify-center py-6 gap-2 text-slate-500 text-[12.5px]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading more stays…
        </div>
      )}
      {!hasMore && filtered.length > PAGE_SIZE && (
        <p className="text-center text-[11px] text-slate-400 py-4">All {filtered.length} stays shown</p>
      )}
    </div>
  )
}

export default function CustomerStaysFilterClient({ stays, saveSearch }: { stays: PublicStay[]; saveSearch?: ReactNode }) {
  return (
    <Suspense fallback={
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-[280px] animate-pulse rounded-2xl bg-slate-100" />)}
      </div>
    }>
      <StaysFilterInner stays={stays} saveSearch={saveSearch} />
    </Suspense>
  )
}
