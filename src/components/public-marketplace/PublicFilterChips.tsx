'use client'

import { useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ChevronDown, X, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FilterChip {
  id: string
  label: string
  dropdown?: boolean
  danger?: boolean
  /** @deprecated — active state is now derived from URL, not passed as prop */
  active?: boolean
}

interface PublicFilterChipsProps {
  chips: FilterChip[]
  /** Legacy callback — still called if provided. */
  onChipToggle?: (id: string) => void
  onClear?: () => void
}

/**
 * Premium filter chips — syncs active state to URL ?filters=a,b,c so the
 * server can read and apply them. Back-button safe, shareable, bookmarkable.
 * Active chips are read from the URL on mount so the bar always reflects
 * the current search results.
 */
export default function PublicFilterChips({ chips, onChipToggle, onClear }: PublicFilterChipsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  /* Parse active filters from URL */
  const activeSet = new Set(
    (searchParams?.get('filters') ?? '').split(',').filter(Boolean)
  )

  const pushFilters = useCallback((next: Set<string>) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '')
    params.delete('page') // reset pagination on filter change
    if (next.size > 0) {
      params.set('filters', Array.from(next).join(','))
    } else {
      params.delete('filters')
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }, [router, pathname, searchParams])

  const toggle = useCallback((id: string) => {
    const next = new Set(activeSet)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    pushFilters(next)
    onChipToggle?.(id)
  }, [activeSet, pushFilters, onChipToggle])

  const clear = useCallback(() => {
    pushFilters(new Set())
    onClear?.()
  }, [pushFilters, onClear])

  const hasActive = activeSet.size > 0

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <SlidersHorizontal className="h-4 w-4 text-slate-400 shrink-0" />
      {chips.map(chip => {
        const isActive = activeSet.has(chip.id)
        return (
          <button
            key={chip.id}
            onClick={() => toggle(chip.id)}
            aria-pressed={isActive}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600',
              chip.danger
                ? isActive
                  ? 'bg-red-600 border-red-600 text-white'
                  : 'border-red-200 text-red-600 hover:bg-red-50'
                : isActive
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50',
            )}
          >
            {chip.label}
            {chip.dropdown && <ChevronDown className="h-3 w-3" />}
          </button>
        )
      })}
      {hasActive && (
        <button
          onClick={clear}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Clear all filters"
        >
          <X className="h-3 w-3" />
          Clear all
        </button>
      )}
    </div>
  )
}
