"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { LocationAutocomplete } from "@/components/public-marketplace/LocationAutocomplete"
import { DateInput } from "@/components/public-marketplace/DateInput"

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function ServicesHeroSearchInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState(searchParams?.get("q") ?? "")
  const [location, setLocation] = useState(searchParams?.get("where") ?? "")
  const [when, setWhen] = useState(searchParams?.get("when") ?? "")

  function handleSearch() {
    const p = new URLSearchParams()
    if (query) p.set("q", query)
    if (location) p.set("location", location)
    if (when) p.set("when", when)
    // Navigate to unified marketplace with all services + suppliers
    router.push(`/marketplace${p.toString() ? `?${p.toString()}` : ""}`, { scroll: false })
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSearch()
  }

  return (
    <div
      className="flex flex-col lg:flex-row items-stretch bg-white border border-slate-200 shadow-sm rounded-2xl overflow-visible"
      role="search"
      aria-label="Search services"
    >
      {/* What */}
      <div className="flex-1 border-b lg:border-b-0 lg:border-r border-slate-200 px-4 py-3.5 min-w-0">
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">What do you need?</div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. Plumbing, Cleaning, Electrical"
          className="w-full text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent"
          aria-label="Service type"
        />
      </div>

      {/* Location autocomplete */}
      <div className="border-b lg:border-b-0 lg:border-r border-slate-200 px-4 py-3.5 min-w-0 lg:min-w-[220px]">
        <LocationAutocomplete
          value={location}
          onChange={(label) => setLocation(label)}
          placeholder="City, area or postcode"
          label="Location"
          bare
        />
      </div>

      {/* When — date picker */}
      <div className="border-b lg:border-b-0 lg:border-r border-slate-200 px-4 py-3.5 min-w-0">
        <DateInput
          value={when}
          onChange={setWhen}
          placeholder="Anytime"
          label="When"
          minDate={today()}
          bare
        />
      </div>

      {/* Search button */}
      <button
        type="button"
        onClick={handleSearch}
        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-6 py-4 transition-colors shrink-0 font-semibold text-sm rounded-b-2xl lg:rounded-b-none lg:rounded-r-2xl"
      >
        <Search className="h-4 w-4" />
        Search services
      </button>
    </div>
  )
}

export default function ServicesHeroSearch() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-14 rounded-2xl border border-slate-200 bg-white shadow-sm text-[13px] text-slate-400">
          Loading search…
        </div>
      }
    >
      <ServicesHeroSearchInner />
    </Suspense>
  )
}
