'use client'

import { Search } from 'lucide-react'
import { useState } from 'react'

export type SearchBarVariant = 'stays' | 'services' | 'providers'

interface PublicSearchBarProps {
  variant: SearchBarVariant
  onSearch?: (query: Record<string, string>) => void
}

export default function PublicSearchBar({ variant, onSearch }: PublicSearchBarProps) {
  const [where, setWhere] = useState('')
  const [checkin, setCheckin] = useState('')
  const [checkout, setCheckout] = useState('')
  const [guests, setGuests] = useState('')
  const [what, setWhat] = useState('')
  const [when, setWhen] = useState('')
  const [tradeName, setTradeName] = useState('')
  const [radius, setRadius] = useState('25 miles')

  const handleSearch = () => {
    if (variant === 'stays') onSearch?.({ where, checkin, checkout, guests })
    else if (variant === 'services') onSearch?.({ what, where, when })
    else onSearch?.({ tradeName, where, radius })
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-2">
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-0">
        {variant === 'stays' && (
          <>
            <div className="flex-1 px-4 py-3 border-b md:border-b-0 md:border-r border-slate-200">
              <div className="text-xs font-semibold text-slate-900 mb-0.5">Where</div>
              <input
                type="text"
                value={where}
                onChange={e => setWhere(e.target.value)}
                placeholder="City, area or postcode"
                className="w-full text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent"
              />
            </div>
            <div className="flex-1 px-4 py-3 border-b md:border-b-0 md:border-r border-slate-200">
              <div className="text-xs font-semibold text-slate-900 mb-0.5">Check in</div>
              <input
                type="date"
                value={checkin}
                onChange={e => setCheckin(e.target.value)}
                className="w-full text-sm text-slate-500 outline-none bg-transparent"
              />
            </div>
            <div className="flex-1 px-4 py-3 border-b md:border-b-0 md:border-r border-slate-200">
              <div className="text-xs font-semibold text-slate-900 mb-0.5">Check out</div>
              <input
                type="date"
                value={checkout}
                onChange={e => setCheckout(e.target.value)}
                className="w-full text-sm text-slate-500 outline-none bg-transparent"
              />
            </div>
            <div className="flex-1 px-4 py-3 border-b md:border-b-0 md:border-r border-slate-200">
              <div className="text-xs font-semibold text-slate-900 mb-0.5">Guests</div>
              <input
                type="number"
                min="1"
                value={guests}
                onChange={e => setGuests(e.target.value)}
                placeholder="Add guests"
                className="w-full text-sm text-slate-500 placeholder-slate-400 outline-none bg-transparent"
              />
            </div>
          </>
        )}

        {variant === 'services' && (
          <>
            <div className="flex-1 px-4 py-3 border-b md:border-b-0 md:border-r border-slate-200">
              <div className="text-xs font-semibold text-slate-900 mb-0.5">What do you need?</div>
              <input
                type="text"
                value={what}
                onChange={e => setWhat(e.target.value)}
                placeholder="e.g. End of tenancy clean"
                className="w-full text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent"
              />
            </div>
            <div className="flex-1 px-4 py-3 border-b md:border-b-0 md:border-r border-slate-200">
              <div className="text-xs font-semibold text-slate-900 mb-0.5">Location</div>
              <input
                type="text"
                value={where}
                onChange={e => setWhere(e.target.value)}
                placeholder="City or postcode"
                className="w-full text-sm text-slate-500 placeholder-slate-400 outline-none bg-transparent"
              />
            </div>
            <div className="flex-1 px-4 py-3 border-b md:border-b-0 md:border-r border-slate-200">
              <div className="text-xs font-semibold text-slate-900 mb-0.5">When</div>
              <input
                type="date"
                value={when}
                onChange={e => setWhen(e.target.value)}
                className="w-full text-sm text-slate-500 outline-none bg-transparent"
              />
            </div>
          </>
        )}

        {variant === 'providers' && (
          <>
            <div className="flex-1 px-4 py-3 border-b md:border-b-0 md:border-r border-slate-200">
              <div className="text-xs font-semibold text-slate-900 mb-0.5">Trade or business name</div>
              <input
                type="text"
                value={tradeName}
                onChange={e => setTradeName(e.target.value)}
                placeholder="e.g. Plumber, electrician..."
                className="w-full text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent"
              />
            </div>
            <div className="flex-1 px-4 py-3 border-b md:border-b-0 md:border-r border-slate-200">
              <div className="text-xs font-semibold text-slate-900 mb-0.5">Location</div>
              <input
                type="text"
                value={where}
                onChange={e => setWhere(e.target.value)}
                placeholder="City or postcode"
                className="w-full text-sm text-slate-500 placeholder-slate-400 outline-none bg-transparent"
              />
            </div>
            <div className="flex-1 px-4 py-3 border-b md:border-b-0 md:border-r border-slate-200">
              <div className="text-xs font-semibold text-slate-900 mb-0.5">Coverage radius</div>
              <select
                value={radius}
                onChange={e => setRadius(e.target.value)}
                className="w-full text-sm text-slate-500 outline-none bg-transparent"
              >
                <option>5 miles</option>
                <option>10 miles</option>
                <option>15 miles</option>
                <option>25 miles</option>
                <option>50 miles</option>
              </select>
            </div>
          </>
        )}

        <div className="px-2 py-2">
          <button
            onClick={handleSearch}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors whitespace-nowrap"
          >
            <Search className="h-4 w-4" />
            {variant === 'stays' ? 'Search stays' : variant === 'services' ? 'Search services' : 'Search providers'}
          </button>
        </div>
      </div>
    </div>
  )
}
