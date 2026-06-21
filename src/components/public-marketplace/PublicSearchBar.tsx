'use client'

import { Search } from 'lucide-react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useState } from 'react'

export type SearchBarVariant = 'stays' | 'services' | 'providers' | 'emergency'

interface PublicSearchBarProps {
  variant: SearchBarVariant
  /** Legacy callback — still called if provided, but URL params are always pushed. */
  onSearch?: (query: Record<string, string>) => void
}

/**
 * Premium search bar — pushes URL search params on submit so that the page
 * re-renders server-side with the new query applied. State initialises from
 * the current URL so the bar always reflects what is shown in the results.
 * Back-button safe, shareable, bookmarkable.
 */
export default function PublicSearchBar({ variant, onSearch }: PublicSearchBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  /* Initialise state from URL params so the bar reflects current filters */
  const [where, setWhere]       = useState(searchParams?.get('where') ?? '')
  const [checkin, setCheckin]   = useState(searchParams?.get('checkin') ?? '')
  const [checkout, setCheckout] = useState(searchParams?.get('checkout') ?? '')
  const [guests, setGuests]     = useState(searchParams?.get('guests') ?? '')
  const [what, setWhat]         = useState(searchParams?.get('q') ?? '')
  const [when, setWhen]         = useState(searchParams?.get('when') ?? '')
  const [tradeName, setTrade]   = useState(searchParams?.get('trade') ?? '')
  const [radius, setRadius]     = useState(searchParams?.get('radius') ?? '25')

  /** Build new URLSearchParams, preserving unrelated params (e.g. ?tab=) */
  const buildParams = useCallback((extra: Record<string, string>) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '')
    // Always reset pagination on a new search
    params.delete('page')
    Object.entries(extra).forEach(([k, v]) => {
      if (v) params.set(k, v)
      else params.delete(k)
    })
    return params.toString()
  }, [searchParams])

  const handleSearch = useCallback(() => {
    let qs = ''
    if (variant === 'stays') {
      qs = buildParams({ where, checkin, checkout, guests })
      onSearch?.({ where, checkin, checkout, guests })
    } else if (variant === 'services') {
      qs = buildParams({ q: what, where, when })
      onSearch?.({ q: what, where, when })
    } else if (variant === 'emergency') {
      qs = buildParams({ q: what, where })
      onSearch?.({ q: what, where })
    } else {
      qs = buildParams({ trade: tradeName, where, radius })
      onSearch?.({ trade: tradeName, where, radius })
    }
    router.push(`${pathname}?${qs}`, { scroll: false })
  }, [variant, where, checkin, checkout, guests, what, when, tradeName, radius, buildParams, onSearch, router, pathname])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const labelClass = 'text-xs font-semibold text-slate-900 mb-0.5'
  const inputClass = 'w-full text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent'
  const dividerClass = 'flex-1 px-4 py-3 border-b md:border-b-0 md:border-r border-slate-200'

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-2">
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-0">

        {variant === 'stays' && (
          <>
            <div className={dividerClass}>
              <div className={labelClass}>Where</div>
              <input type="text" value={where} onChange={e => setWhere(e.target.value)} onKeyDown={handleKeyDown} placeholder="City, area or postcode" className={inputClass} />
            </div>
            <div className={dividerClass}>
              <div className={labelClass}>Check in</div>
              <input type="date" value={checkin} onChange={e => setCheckin(e.target.value)} className={inputClass} />
            </div>
            <div className={dividerClass}>
              <div className={labelClass}>Check out</div>
              <input type="date" value={checkout} onChange={e => setCheckout(e.target.value)} className={inputClass} />
            </div>
            <div className={dividerClass}>
              <div className={labelClass}>Guests</div>
              <input type="number" min="1" value={guests} onChange={e => setGuests(e.target.value)} onKeyDown={handleKeyDown} placeholder="Add guests" className={inputClass} />
            </div>
          </>
        )}

        {variant === 'services' && (
          <>
            <div className={dividerClass}>
              <div className={labelClass}>What do you need?</div>
              <input type="text" value={what} onChange={e => setWhat(e.target.value)} onKeyDown={handleKeyDown} placeholder="e.g. End of tenancy clean" className={inputClass} />
            </div>
            <div className={dividerClass}>
              <div className={labelClass}>Location</div>
              <input type="text" value={where} onChange={e => setWhere(e.target.value)} onKeyDown={handleKeyDown} placeholder="City or postcode" className={inputClass} />
            </div>
            <div className={dividerClass}>
              <div className={labelClass}>When</div>
              <input type="date" value={when} onChange={e => setWhen(e.target.value)} className={inputClass} />
            </div>
          </>
        )}

        {variant === 'emergency' && (
          <>
            <div className={dividerClass}>
              <div className={labelClass}>What emergency?</div>
              <input type="text" value={what} onChange={e => setWhat(e.target.value)} onKeyDown={handleKeyDown} placeholder="e.g. Gas leak, burst pipe, lockout…" className={inputClass} />
            </div>
            <div className={dividerClass}>
              <div className={labelClass}>Your location</div>
              <input type="text" value={where} onChange={e => setWhere(e.target.value)} onKeyDown={handleKeyDown} placeholder="Postcode or address" className={inputClass} />
            </div>
          </>
        )}

        {variant === 'providers' && (
          <>
            <div className={dividerClass}>
              <div className={labelClass}>Trade or business name</div>
              <input type="text" value={tradeName} onChange={e => setTrade(e.target.value)} onKeyDown={handleKeyDown} placeholder="e.g. Plumber, electrician..." className={inputClass} />
            </div>
            <div className={dividerClass}>
              <div className={labelClass}>Location</div>
              <input type="text" value={where} onChange={e => setWhere(e.target.value)} onKeyDown={handleKeyDown} placeholder="City or postcode" className={inputClass} />
            </div>
            <div className={dividerClass}>
              <div className={labelClass}>Coverage radius</div>
              <select value={radius} onChange={e => setRadius(e.target.value)} className={`${inputClass} cursor-pointer`}>
                <option value="5">5 miles</option>
                <option value="10">10 miles</option>
                <option value="15">15 miles</option>
                <option value="25">25 miles</option>
                <option value="50">50 miles</option>
              </select>
            </div>
          </>
        )}

        <div className="px-2 py-2">
          <button
            onClick={handleSearch}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl transition-colors whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <Search className="h-4 w-4" />
            {variant === 'stays'
              ? 'Search stays'
              : variant === 'services'
              ? 'Search services'
              : variant === 'emergency'
              ? 'Find help now'
              : 'Search providers'}
          </button>
        </div>
      </div>
    </div>
  )
}
