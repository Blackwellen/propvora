'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { BedDouble, Loader2 } from 'lucide-react'
import LongTermRentalCard from '@/components/marketplace/stays/LongTermRentalCard'
import type { PublicLongTermRental } from '@/lib/public-marketplace/types'

const PAGE_SIZE = 12

type City = '' | 'Manchester' | 'London' | 'Birmingham' | 'Leeds' | 'Bristol' | 'Edinburgh'

const CITY_CHIPS: { id: string; label: string; city: City }[] = [
  { id: 'all', label: 'All cities', city: '' },
  { id: 'manchester', label: 'Manchester', city: 'Manchester' },
  { id: 'london', label: 'London', city: 'London' },
  { id: 'birmingham', label: 'Birmingham', city: 'Birmingham' },
  { id: 'leeds', label: 'Leeds', city: 'Leeds' },
  { id: 'bristol', label: 'Bristol', city: 'Bristol' },
  { id: 'edinburgh', label: 'Edinburgh', city: 'Edinburgh' },
]

type ToggleFilter = 'bills' | 'furnished' | 'available' | 'pets' | 'parking'

const TOGGLE_CHIPS: { id: ToggleFilter; label: string }[] = [
  { id: 'bills', label: 'Bills included' },
  { id: 'furnished', label: 'Furnished' },
  { id: 'available', label: 'Available now' },
  { id: 'pets', label: 'Pets allowed' },
  { id: 'parking', label: 'Parking' },
]

export default function LongTermRentalsFilterClient({ rentals }: { rentals: PublicLongTermRental[] }) {
  const [city, setCity] = useState<City>('')
  const [minBeds, setMinBeds] = useState(0)
  const [toggles, setToggles] = useState<Set<ToggleFilter>>(new Set())
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const sentinelRef = useRef<HTMLDivElement>(null)

  function toggleFilter(key: ToggleFilter) {
    setToggles(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

  const filtered = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return rentals.filter(r => {
      if (city && r.city !== city) return false
      if (minBeds > 0 && r.beds < minBeds) return false
      if (toggles.has('bills') && !r.billsIncluded) return false
      if (toggles.has('furnished') && r.furnishingStatus !== 'Furnished') return false
      if (toggles.has('available') && r.availableFrom > today) return false
      if (toggles.has('pets') && !r.petsAllowed) return false
      if (toggles.has('parking') && !r.parkingAvailable) return false
      return true
    })
  }, [rentals, city, minBeds, toggles])

  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length
  const activeCount = toggles.size + (city ? 1 : 0) + (minBeds > 0 ? 1 : 0)

  useEffect(() => { setVisibleCount(PAGE_SIZE) }, [filtered.length])

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
      {/* Filter chips */}
      <div className="sticky top-20 z-30 bg-white border-b border-slate-100 px-4 py-3">
        <div className="max-w-6xl mx-auto space-y-2">
          {/* City chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            {CITY_CHIPS.map(chip => (
              <button
                key={chip.id}
                onClick={() => setCity(chip.city)}
                className={[
                  'shrink-0 px-3 py-1.5 text-sm font-medium border rounded-full transition-all',
                  city === chip.city
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 text-slate-600',
                ].join(' ')}
              >
                {chip.label}
              </button>
            ))}
            <div className="shrink-0 ml-auto flex items-center gap-2">
              <select
                value={minBeds}
                onChange={e => setMinBeds(Number(e.target.value))}
                className="text-sm border border-slate-200 rounded-full px-3 py-1.5 bg-white outline-none text-slate-600"
              >
                <option value={0}>Any beds</option>
                <option value={1}>1+ bed</option>
                <option value={2}>2+ beds</option>
                <option value={3}>3+ beds</option>
                <option value={4}>4+ beds</option>
              </select>
            </div>
          </div>
          {/* Toggle chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            {TOGGLE_CHIPS.map(chip => (
              <button
                key={chip.id}
                onClick={() => toggleFilter(chip.id)}
                className={[
                  'shrink-0 px-3 py-1.5 text-sm font-medium border rounded-full transition-all flex items-center gap-1',
                  toggles.has(chip.id)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 text-slate-600',
                ].join(' ')}
              >
                <BedDouble className="h-3.5 w-3.5" />
                {chip.label}
              </button>
            ))}
            {activeCount > 0 && (
              <button
                onClick={() => { setCity(''); setMinBeds(0); setToggles(new Set()) }}
                className="ml-auto shrink-0 text-blue-600 text-sm font-medium hover:text-blue-700 whitespace-nowrap"
              >
                Clear all ({activeCount})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm text-slate-500 mb-5">
            <span className="font-semibold text-slate-900">{filtered.length}</span> properties found
            {activeCount > 0 ? ' · Filters active' : ''}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {visible.map(rental => (
              <LongTermRentalCard key={rental.id} rental={rental} basePath="/stays/long-term" />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-24">
              <p className="text-slate-500 text-lg">No properties match your filters.</p>
              <button
                onClick={() => { setCity(''); setMinBeds(0); setToggles(new Set()) }}
                className="mt-4 text-blue-600 font-medium hover:text-blue-700 text-sm"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-4 mt-4" />
          {hasMore && (
            <div className="flex items-center justify-center py-8 gap-2 text-slate-500 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading more properties…
            </div>
          )}
          {!hasMore && filtered.length > PAGE_SIZE && (
            <p className="text-center text-xs text-slate-400 py-4">
              All {filtered.length} properties shown
            </p>
          )}
        </div>
      </section>
    </>
  )
}
