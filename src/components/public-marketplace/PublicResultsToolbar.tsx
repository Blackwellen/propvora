'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Map, List, LayoutGrid, ChevronDown, Bookmark } from 'lucide-react'
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

export default function PublicResultsToolbar({
  count,
  location,
  sortOptions = ['Recommended', 'Price: Low to High', 'Price: High to Low', 'Rating', 'Newest'],
  defaultSort = 'Recommended',
  showViewToggle = true,
  viewMode = 'grid',
  mapHref,
  listHref,
  showSaveSearch = false,
}: PublicResultsToolbarProps) {
  const [sort, setSort] = useState(defaultSort)
  const [showSort, setShowSort] = useState(false)

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{count.toLocaleString()}</span>{' '}
          {count === 1 ? 'result' : 'results'} · {location}
        </p>
        {showSaveSearch && (
          <button className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700">
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

        {/* Sort */}
        <div className="relative">
          <button
            onClick={() => setShowSort(!showSort)}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 bg-white"
          >
            Sort: {sort}
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          {showSort && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1">
              {sortOptions.map(opt => (
                <button
                  key={opt}
                  onClick={() => { setSort(opt); setShowSort(false) }}
                  className={cn(
                    'w-full text-left px-4 py-2 text-sm hover:bg-slate-50',
                    sort === opt ? 'font-semibold text-blue-600' : 'text-slate-700',
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
