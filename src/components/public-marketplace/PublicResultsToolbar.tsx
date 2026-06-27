'use client'

import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Map, List, ChevronDown, Bookmark } from 'lucide-react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface PublicResultsToolbarProps {
  count: number
  location: string
  sortOptions?: string[]
  defaultSort?: string
  showViewToggle?: boolean
  viewMode?: 'list' | 'grid' | 'map'
  mapHref?: string
  listHref?: string
  showSaveSearch?: boolean
}

const DEFAULT_SORT_OPTIONS = [
  'Recommended',
  'Price: Low to High',
  'Price: High to Low',
  'Rating',
  'Newest',
]

/**
 * Results toolbar — wires sort to URL ?sort= param so the server can apply
 * the selected sort order. Back-button safe and shareable.
 */
export default function PublicResultsToolbar({
  count,
  location,
  sortOptions = DEFAULT_SORT_OPTIONS,
  defaultSort = 'Recommended',
  showViewToggle = true,
  viewMode = 'grid',
  mapHref,
  listHref,
  showSaveSearch = false,
}: PublicResultsToolbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [showSort, setShowSort] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentSort = searchParams?.get('sort') ?? defaultSort

  const applySort = useCallback((opt: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '')
    if (opt === defaultSort) {
      params.delete('sort')
    } else {
      params.set('sort', opt)
    }
    params.delete('page') // reset pagination on sort change
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
    setShowSort(false)
  }, [router, pathname, searchParams, defaultSort])

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{count.toLocaleString()}</span>{' '}
          {count === 1 ? 'result' : 'results'}
          {location ? ` · ${location}` : ''}
        </p>
        {showSaveSearch && (
          <button className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--brand)] hover:text-[var(--brand)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]">
            <Bookmark className="h-4 w-4" />
            Save search
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Map/List toggle */}
        {showViewToggle && (mapHref || listHref) && (
          <div className="flex items-center bg-slate-100 rounded-lg p-1 gap-1">
            {listHref && (
              <Link
                href={listHref}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  viewMode !== 'map' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700',
                )}
              >
                <List className="h-4 w-4" />
                List
              </Link>
            )}
            {mapHref && (
              <Link
                href={mapHref}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  viewMode === 'map' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700',
                )}
              >
                <Map className="h-4 w-4" />
                Map
              </Link>
            )}
          </div>
        )}

        {/* Sort dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowSort(s => !s)}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]"
            aria-expanded={showSort}
            aria-haspopup="listbox"
          >
            Sort: {currentSort}
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showSort && 'rotate-180')} />
          </button>
          {showSort && (
            <div
              role="listbox"
              className="absolute right-0 top-full mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1"
            >
              {sortOptions.map(opt => (
                <button
                  key={opt}
                  role="option"
                  aria-selected={currentSort === opt}
                  onClick={() => applySort(opt)}
                  className={cn(
                    'w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors',
                    currentSort === opt ? 'font-semibold text-[var(--brand)]' : 'text-slate-700',
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
