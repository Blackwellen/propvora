"use client"

import { useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { Search, SlidersHorizontal, Map as MapIcon, List, X, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import StayListingCard, { STAY_TYPE_LABEL, STAY_POLICY_LABEL } from "./StayListingCard"
import { formatMoney } from "./format"
import type { PublicListingCard } from "@/lib/booking/public"

const StayMap = dynamic(() => import("./StayMap"), { ssr: false })

function stayHref(l: PublicListingCard): string {
  return `/stay/${encodeURIComponent(l.slug ?? l.id)}`
}

const TYPE_OPTIONS = Object.keys(STAY_TYPE_LABEL)
const POLICY_OPTIONS = Object.keys(STAY_POLICY_LABEL)

/**
 * The /stay search + map experience over REAL published booking_listings (passed
 * from the server). Filters (text, guests, price, type, cancellation) are applied
 * client-side over the loaded set for instant feedback; the displayed prices are
 * the active pricing profile "from" rates resolved server-side. View toggles
 * between a list and a Leaflet split map. Mobile-first.
 */
export default function StaySearchExperience({
  listings,
  initialView = "list",
}: {
  listings: PublicListingCard[]
  initialView?: "list" | "map"
}) {
  const [q, setQ] = useState("")
  const [guests, setGuests] = useState(0)
  const [maxPrice, setMaxPrice] = useState<number | null>(null)
  const [type, setType] = useState<string | null>(null)
  const [policy, setPolicy] = useState<string | null>(null)
  const [view, setView] = useState<"list" | "map">(initialView)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  const priceCeiling = useMemo(() => {
    const prices = listings.map((l) => l.fromNightlyPence ?? 0).filter((p) => p > 0)
    return prices.length ? Math.max(...prices) : 0
  }, [listings])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return listings.filter((l) => {
      if (needle) {
        const hay = `${l.title} ${l.summary ?? ""} ${l.city ?? ""} ${l.country ?? ""}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      if (guests > 0 && l.maxGuests < guests) return false
      if (maxPrice != null && (l.fromNightlyPence ?? Infinity) > maxPrice) return false
      if (type && l.listingType !== type) return false
      if (policy && l.cancellationPolicy !== policy) return false
      return true
    })
  }, [listings, q, guests, maxPrice, type, policy])

  const activeFilters = (guests > 0 ? 1 : 0) + (maxPrice != null ? 1 : 0) + (type ? 1 : 0) + (policy ? 1 : 0)

  function reset() {
    setGuests(0)
    setMaxPrice(null)
    setType(null)
    setPolicy(null)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-5 sm:py-7">
      {/* Search bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by place, city or property name"
            className="w-full h-12 pl-11 pr-4 rounded-xl border border-[#D6E0F0] bg-white text-[14px] text-[#0B1B3F] placeholder:text-slate-400 focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#2563EB]/20 outline-none"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className={cn(
              "h-12 px-4 rounded-xl border text-[13.5px] font-semibold inline-flex items-center gap-2 transition-colors",
              activeFilters > 0
                ? "border-[#1D4ED8] bg-blue-50 text-[#1D4ED8]"
                : "border-[#D6E0F0] bg-white text-slate-600 hover:border-slate-300"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" /> Filters
            {activeFilters > 0 && (
              <span className="ml-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#1D4ED8] text-white text-[11px]">
                {activeFilters}
              </span>
            )}
          </button>
          <div className="h-12 rounded-xl border border-[#D6E0F0] bg-white p-1 flex">
            <button
              type="button"
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
              className={cn(
                "px-3 rounded-lg text-[13px] font-medium inline-flex items-center gap-1.5 transition-colors",
                view === "list" ? "bg-[#1D4ED8] text-white" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <List className="w-4 h-4" /> List
            </button>
            <button
              type="button"
              onClick={() => setView("map")}
              aria-pressed={view === "map"}
              className={cn(
                "px-3 rounded-lg text-[13px] font-medium inline-flex items-center gap-1.5 transition-colors",
                view === "map" ? "bg-[#1D4ED8] text-white" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <MapIcon className="w-4 h-4" /> Map
            </button>
          </div>
        </div>
      </div>

      {/* Filter panel */}
      {filtersOpen && (
        <div className="mb-5 rounded-2xl border border-[#E2EAF6] bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-semibold text-[#0B1B3F]">Refine results</h3>
            <button onClick={reset} className="text-[12.5px] text-[#1D4ED8] font-medium hover:underline">
              Clear all
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Guests */}
            <div>
              <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">Guests</label>
              <div className="flex items-center gap-2 rounded-xl border border-[#D6E0F0] px-3 h-11">
                <Users className="w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  min={0}
                  value={guests || ""}
                  onChange={(e) => setGuests(Math.max(0, Number(e.target.value) || 0))}
                  placeholder="Any"
                  className="w-full text-[14px] outline-none bg-transparent"
                />
              </div>
            </div>
            {/* Max price */}
            <div>
              <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">
                Max price / night
                {priceCeiling > 0 && maxPrice != null && (
                  <span className="ml-1 text-slate-400">{formatMoney(maxPrice, "GBP")}</span>
                )}
              </label>
              {priceCeiling > 0 ? (
                <input
                  type="range"
                  min={0}
                  max={priceCeiling}
                  step={1000}
                  value={maxPrice ?? priceCeiling}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-[#1D4ED8] mt-3"
                />
              ) : (
                <p className="text-[12px] text-slate-400 mt-2.5">No priced stays yet</p>
              )}
            </div>
            {/* Type */}
            <div>
              <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">Property type</label>
              <select
                value={type ?? ""}
                onChange={(e) => setType(e.target.value || null)}
                className="w-full h-11 rounded-xl border border-[#D6E0F0] px-3 text-[14px] outline-none bg-white"
              >
                <option value="">Any type</option>
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {STAY_TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
            </div>
            {/* Cancellation */}
            <div>
              <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">Cancellation</label>
              <select
                value={policy ?? ""}
                onChange={(e) => setPolicy(e.target.value || null)}
                className="w-full h-11 rounded-xl border border-[#D6E0F0] px-3 text-[14px] outline-none bg-white"
              >
                <option value="">Any policy</option>
                {POLICY_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {STAY_POLICY_LABEL[p]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Result count */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[13px] text-slate-500">
          <span className="font-semibold text-[#0B1B3F]">{filtered.length}</span>{" "}
          {filtered.length === 1 ? "stay" : "stays"} available
        </p>
        {activeFilters > 0 && (
          <button onClick={reset} className="text-[12.5px] text-slate-500 inline-flex items-center gap-1 hover:text-[#1D4ED8]">
            <X className="w-3.5 h-3.5" /> Reset filters
          </button>
        )}
      </div>

      {/* Empty */}
      {listings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D6E0F0] bg-white py-16 text-center">
          <MapIcon className="w-9 h-9 text-slate-300 mx-auto mb-3" />
          <h3 className="text-[15px] font-semibold text-[#0B1B3F]">No stays published yet</h3>
          <p className="mt-1.5 text-[13px] text-slate-500 max-w-sm mx-auto">
            Direct-booking stays appear here the moment a property manager publishes one. Check back soon.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D6E0F0] bg-white py-14 text-center">
          <h3 className="text-[15px] font-semibold text-[#0B1B3F]">No stays match your filters</h3>
          <button onClick={reset} className="mt-3 text-[13px] font-semibold text-[#1D4ED8] hover:underline">
            Clear filters
          </button>
        </div>
      ) : view === "list" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((l) => (
            <StayListingCard key={l.id} listing={l} href={stayHref(l)} onHover={setActiveId} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-4">
          <div className="space-y-3 lg:max-h-[72vh] lg:overflow-y-auto lg:pr-1">
            {filtered.map((l) => (
              <StayListingCard key={l.id} listing={l} href={stayHref(l)} onHover={setActiveId} />
            ))}
          </div>
          <div className="h-[60vh] lg:h-[72vh] lg:sticky lg:top-20">
            <StayMap listings={filtered} activeId={activeId} hrefFor={stayHref} className="w-full h-full" />
          </div>
        </div>
      )}
    </div>
  )
}
