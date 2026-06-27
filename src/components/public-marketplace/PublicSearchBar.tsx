'use client'

import { CalendarDays, Search } from 'lucide-react'
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

  /** Premium date input with calendar icon */
  function DateInput({
    label,
    value,
    onChange,
  }: {
    label: string
    value: string
    onChange: (v: string) => void
  }) {
    return (
      <div className={dividerClass}>
        <div className={labelClass}>{label}</div>
        <div className="relative flex items-center">
          <CalendarDays
            className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="date"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="pl-6 w-full text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent cursor-pointer focus:text-[var(--brand)]"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-2">
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-0">

        {variant === 'stays' && (
          <>
            <div className={dividerClass}>
              <div className={labelClass}>Where</div>
              <input type="text" value={where} onChange={e => setWhere(e.target.value)} onKeyDown={handleKeyDown} placeholder="City, area or postcode" className={inputClass} />
            </div>
            <DateInput label="Check in" value={checkin} onChange={setCheckin} />
            <DateInput label="Check out" value={checkout} onChange={setCheckout} />
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
            <DateInput label="When" value={when} onChange={setWhen} />
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
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[var(--brand)] hover:bg-[var(--brand-strong)] active:bg-[var(--brand-strong)] text-white font-semibold text-sm rounded-xl transition-colors whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]"
          >
            <Search className="h-4 w-4" />
            Search
          </button>
        </div>
      </div>
    </div>
  )
}
