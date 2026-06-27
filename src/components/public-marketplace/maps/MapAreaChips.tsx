'use client'

import { useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Area chips for the map view. Areas are DATA-DRIVEN — the page derives them
 * from the locations actually present in the result set (most-common first) and
 * passes them in via `areas`. Clicking an area writes `?where=` to the URL so
 * the server re-filters the list + map. "All areas" clears the filter.
 *
 * Falls back to a small fixed set only if no areas are supplied (empty data).
 */
const FALLBACK = ['City Centre', 'Salford', 'Trafford', 'Stockport']

export default function MapAreaChips({
  areas,
  // legacy prop kept so existing call sites don't break
  variant: _variant,
}: {
  areas?: string[]
  variant?: 'stays' | 'services' | 'providers'
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const list = (areas && areas.length > 0 ? areas : FALLBACK).slice(0, 7)
  const active = (searchParams?.get('where') ?? '').trim()

  const select = useCallback((area: string | null) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '')
    params.delete('page')
    if (area) params.set('where', area)
    else params.delete('where')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }, [router, pathname, searchParams])

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
      <button
        onClick={() => select(null)}
        className={cn(
          'flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap',
          !active
            ? 'bg-[var(--brand)] text-white border-[var(--brand)]'
            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300',
        )}
      >
        <MapPin className="h-3.5 w-3.5" />
        All areas
      </button>
      {list.map(area => {
        const isActive = active.toLowerCase() === area.toLowerCase()
        return (
          <button
            key={area}
            onClick={() => select(isActive ? null : area)}
            aria-pressed={isActive}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap',
              isActive
                ? 'bg-[var(--brand)] text-white border-[var(--brand)]'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300',
            )}
          >
            {area}
          </button>
        )
      })}
    </div>
  )
}
