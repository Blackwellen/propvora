'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Map, Star, Loader2 } from 'lucide-react'
import ProviderCard from '@/components/public-marketplace/cards/ProviderCard'
import ProviderFeaturedCard from '@/components/public-marketplace/cards/ProviderFeaturedCard'
import type { PublicProvider } from '@/lib/public-marketplace/types'

const PAGE_SIZE = 12

type FilterKey = 'vetted' | 'emergency' | 'insurance' | 'gassafe' | 'niceic' | 'toprated' | 'fast'

const CHIPS: { label: string; value: FilterKey; red?: boolean }[] = [
  { label: 'Vetted', value: 'vetted' },
  { label: 'Emergency cover', value: 'emergency' },
  { label: 'Insurance', value: 'insurance' },
  { label: 'Gas Safe', value: 'gassafe' },
  { label: 'NICEIC', value: 'niceic', red: true },
  { label: 'Top rated', value: 'toprated' },
  { label: 'Fast response', value: 'fast' },
]

const SORT_OPTIONS = [
  { label: 'Sort by: Recommended', value: '' },
  { label: 'Rating: Highest first', value: 'rating_desc' },
  { label: 'Most jobs done', value: 'jobs_desc' },
  { label: 'Price: Low to high', value: 'price_asc' },
]

interface Props {
  allProviders: PublicProvider[]
  featuredProviders: PublicProvider[]
}

export default function ProvidersFilterClient({ allProviders, featuredProviders }: Props) {
  const [active, setActive] = useState<Set<FilterKey>>(new Set())
  const [sortBy, setSortBy] = useState('')
  const [viewGrid, setViewGrid] = useState(true)
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
    let result = [...allProviders]
    if (active.has('vetted')) result = result.filter(p => p.vetted)
    if (active.has('emergency')) result = result.filter(p => p.emergency24h)
    if (active.has('insurance')) result = result.filter(p => p.insured)
    if (active.has('gassafe')) result = result.filter(p => !!p.gasSafe)
    if (active.has('niceic')) result = result.filter(p => !!p.niceic)
    if (active.has('toprated')) result = result.filter(p => p.rating >= 4.5)
    if (active.has('fast')) result = result.filter(p => p.responseTime.includes('hour') || p.responseTime.includes('min'))
    if (sortBy === 'rating_desc') result = [...result].sort((a, b) => b.rating - a.rating)
    else if (sortBy === 'jobs_desc') result = [...result].sort((a, b) => b.jobsDone - a.jobsDone)
    else if (sortBy === 'price_asc') result = [...result].sort((a, b) => a.fromPrice - b.fromPrice)
    return result
  }, [allProviders, active, sortBy])

  const activeCount = active.size
  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  useEffect(() => { setVisibleCount(PAGE_SIZE) }, [filtered.length, active, sortBy])

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
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {CHIPS.map(chip => (
              <button
                key={chip.value}
                onClick={() => toggle(chip.value)}
                className={[
                  'shrink-0 px-4 py-1.5 rounded-full border text-sm font-medium transition-colors whitespace-nowrap relative',
                  active.has(chip.value)
                    ? 'bg-slate-900 text-white border-slate-900'
                    : chip.red
                    ? 'border-red-200 text-red-600 hover:bg-red-50'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                ].join(' ')}
              >
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
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-slate-900">{filtered.length.toLocaleString()} providers found</span>
            <span className="text-slate-500 text-sm">
              {activeCount > 0 ? '· Filters active' : '· Across the UK'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/providers/map" className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
              <Map className="h-4 w-4" />Map view
            </Link>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="text-sm text-slate-600 border border-slate-200 rounded-xl px-3 py-2 bg-white outline-none"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* FEATURED PROVIDERS — horizontal scroll */}
        {featuredProviders.length > 0 && activeCount === 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                Featured providers
              </h2>
              <Link href="/providers?filter=featured" className="text-sm text-blue-600 font-medium hover:text-blue-700">
                View all featured →
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-3 -mx-6 px-6 lg:-mx-10 lg:px-10 scrollbar-hide">
              {featuredProviders.map(provider => (
                <ProviderFeaturedCard key={provider.id} provider={provider} />
              ))}
            </div>
          </div>
        )}

        {/* VIEW TOGGLE */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-sm font-medium text-slate-600">View</span>
          <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewGrid(true)}
              className={['flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors', viewGrid ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'].join(' ')}
            >
              Grid
            </button>
            <button
              onClick={() => setViewGrid(false)}
              className={['flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-l border-slate-200 transition-colors', !viewGrid ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'].join(' ')}
            >
              List
            </button>
          </div>
        </div>

        {/* PROVIDERS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 items-stretch mb-6">
          {visible.map(provider => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-24">
            <p className="text-slate-500 text-lg">No providers match your filters.</p>
            <button
              onClick={() => setActive(new Set())}
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
            Loading more providers…
          </div>
        )}
        {!hasMore && filtered.length > PAGE_SIZE && (
          <p className="text-center text-xs text-slate-400 py-4">
            All {filtered.length} providers shown
          </p>
        )}
      </div>
    </>
  )
}
