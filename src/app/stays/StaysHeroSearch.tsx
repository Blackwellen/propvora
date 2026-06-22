"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, Users, ChevronDown, ChevronUp } from "lucide-react"
import { LocationAutocomplete } from "@/components/public-marketplace/LocationAutocomplete"
import { DateInput } from "@/components/public-marketplace/DateInput"

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function StaysHeroSearchInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [location, setLocation] = useState(searchParams?.get("location") ?? "")
  const [checkIn, setCheckIn] = useState(searchParams?.get("checkIn") ?? "")
  const [checkOut, setCheckOut] = useState(searchParams?.get("checkOut") ?? "")
  const [guests, setGuests] = useState(Number(searchParams?.get("guests") ?? 1))
  const [guestsOpen, setGuestsOpen] = useState(false)

  function handleSearch() {
    const p = new URLSearchParams()
    if (location) p.set("location", location)
    if (checkIn) p.set("checkIn", checkIn)
    if (checkOut) p.set("checkOut", checkOut)
    if (guests > 1) p.set("guests", String(guests))
    router.push(`/stays${p.toString() ? `?${p.toString()}` : ""}`, { scroll: false })
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSearch()
  }

  return (
    <div
      className="flex flex-col lg:flex-row items-stretch bg-white border border-slate-200 shadow-sm rounded-2xl overflow-visible"
      role="search"
      aria-label="Search stays"
    >
      {/* Where — location autocomplete */}
      <div className="flex-1 border-b lg:border-b-0 lg:border-r border-slate-200 px-4 py-3.5 min-w-0">
        <LocationAutocomplete
          value={location}
          onChange={(label) => setLocation(label)}
          placeholder="City, area or postcode"
          label="Where"
          bare
        />
      </div>

      {/* Check in */}
      <div className="border-b lg:border-b-0 lg:border-r border-slate-200 px-4 py-3.5 min-w-0">
        <DateInput
          value={checkIn}
          onChange={setCheckIn}
          placeholder="Add dates"
          label="Check in"
          minDate={today()}
          bare
        />
      </div>

      {/* Check out */}
      <div className="border-b lg:border-b-0 lg:border-r border-slate-200 px-4 py-3.5 min-w-0">
        <DateInput
          value={checkOut}
          onChange={setCheckOut}
          placeholder="Add dates"
          label="Check out"
          minDate={checkIn || today()}
          bare
        />
      </div>

      {/* Guests */}
      <div className="relative border-b lg:border-b-0 lg:border-r border-slate-200 px-4 py-3.5 min-w-0">
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Guests</div>
        <button
          type="button"
          onClick={() => setGuestsOpen((v) => !v)}
          onKeyDown={handleKeyDown}
          className="flex items-center gap-1 mt-0.5 text-sm text-slate-700 focus:outline-none"
          aria-haspopup="true"
          aria-expanded={guestsOpen}
        >
          <Users className="h-4 w-4 text-slate-400 shrink-0 mr-1" />
          <span>{guests} {guests === 1 ? "guest" : "guests"}</span>
          {guestsOpen ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
        </button>
        {guestsOpen && (
          <>
            <button
              className="fixed inset-0 z-40 cursor-default"
              onClick={() => setGuestsOpen(false)}
              aria-hidden
              tabIndex={-1}
            />
            <div className="absolute left-0 top-full z-50 mt-1.5 w-48 rounded-2xl border border-slate-200 bg-white shadow-xl p-4">
              <p className="text-[12px] font-semibold text-slate-500 mb-3">Number of guests</p>
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setGuests((g) => Math.max(1, g - 1))}
                  disabled={guests <= 1}
                  className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-lg font-medium"
                  aria-label="Decrease guests"
                >
                  −
                </button>
                <span className="text-[15px] font-semibold text-slate-800 min-w-[2ch] text-center">{guests}</span>
                <button
                  type="button"
                  onClick={() => setGuests((g) => Math.min(20, g + 1))}
                  disabled={guests >= 20}
                  className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-lg font-medium"
                  aria-label="Increase guests"
                >
                  +
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Search button */}
      <button
        type="button"
        onClick={handleSearch}
        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-6 py-4 transition-colors shrink-0 font-semibold text-sm rounded-b-2xl lg:rounded-b-none lg:rounded-r-2xl"
      >
        <Search className="h-4 w-4" />
        Search stays
      </button>
    </div>
  )
}

export default function StaysHeroSearch() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-14 rounded-2xl border border-slate-200 bg-white shadow-sm text-[13px] text-slate-400">
          Loading search…
        </div>
      }
    >
      <StaysHeroSearchInner />
    </Suspense>
  )
}
