"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import {
  Search, SlidersHorizontal, Map as MapIcon, List, X, Loader2, ChevronDown, Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import StayListingCard from "./StayListingCard"
import StayFilterSheet from "./StayFilterSheet"
import {
  EMPTY_FILTERS, SORT_OPTIONS, activeFilterCount, filtersFromParams, filtersToParams,
  filtersToApiParams, refineAndSort, type StayFilters, type SortKey,
} from "./stayFilters"
import type { PublicListingCard } from "@/lib/booking/public"

const StayMap = dynamic(() => import("./StayMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-2xl bg-slate-100" />,
})

function stayHref(l: PublicListingCard): string {
  return `/stay/${encodeURIComponent(l.slug ?? l.id)}`
}

/**
 * The /stay search + map experience over REAL published booking_listings.
 *
 * Filter state is URL-synced (shareable + back-button safe). Server-driven
 * filters re-query /api/booking/public-search (debounced); client refinements
 * (amenities, rating) + sort apply over the returned set. List / split-map /
 * full-map views, "search as I move the map", a desktop filter popover and a
 * mobile/tablet bottom sheet. Mobile-first throughout.
 */
export default function StaySearchExperience({
  listings: initialListings,
  initialView = "list",
}: {
  listings: PublicListingCard[]
  initialView?: "list" | "map"
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [filters, setFilters] = useState<StayFilters>(() =>
    filtersFromParams(new URLSearchParams(searchParams?.toString() ?? ""))
  )
  const [listings, setListings] = useState<PublicListingCard[]>(initialListings)
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<"list" | "map">(initialView)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [searchOnMove, setSearchOnMove] = useState(false)
  const boundsRef = useRef<[number, number, number, number] | null>(null)
  const hydrated = useRef(false)

  const priceCeiling = useMemo(() => {
    const prices = initialListings.map((l) => l.fromNightlyPence ?? 0).filter((p) => p > 0)
    return prices.length ? Math.max(...prices) : 0
  }, [initialListings])

  // Server fetch for the server-driven filters.
  const reqId = useRef(0)
  const fetchListings = useCallback(
    async (f: StayFilters, bounds: [number, number, number, number] | null) => {
      const myReq = ++reqId.current
      setLoading(true)
      try {
        const p = filtersToApiParams(f, bounds)
        const res = await fetch(`/api/booking/public-search?${p.toString()}`, {
          headers: { accept: "application/json" },
        })
        if (myReq !== reqId.current) return
        const json = (await res.json().catch(() => null)) as { listings?: PublicListingCard[] } | null
        setListings(Array.isArray(json?.listings) ? json!.listings! : [])
      } catch {
        if (myReq === reqId.current) setListings([])
      } finally {
        if (myReq === reqId.current) setLoading(false)
      }
    },
    []
  )

  // URL sync + debounced re-query whenever the server-driven filters change.
  useEffect(() => {
    const p = filtersToParams(filters)
    const qs = p.toString()
    router.replace(qs ? `/stay/search?${qs}` : "/stay/search", { scroll: false })

    // Skip the first run when SSR seed already matches the (default) filters.
    if (!hydrated.current) {
      hydrated.current = true
      const seedMatches =
        activeFilterCount(filters) === 0 && !filters.q && !filters.city
      if (seedMatches) return
    }
    const t = setTimeout(() => {
      void fetchListings(filters, searchOnMove ? boundsRef.current : null)
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.q, filters.city, filters.guests, filters.minPence, filters.maxPence, filters.type,
    filters.cancellation, filters.bedrooms, filters.bathrooms, filters.beds, filters.instantOnly,
    filters.verifiedOnly,
  ])

  const patch = (x: Partial<StayFilters>) => setFilters((f) => ({ ...f, ...x }))
  const clear = () => setFilters({ ...EMPTY_FILTERS, sort: filters.sort })
  const count = activeFilterCount(filters)

  const visible = useMemo(() => refineAndSort(listings, filters), [listings, filters])

  const onBoundsChange = useCallback(
    (b: [number, number, number, number]) => {
      boundsRef.current = b
      if (searchOnMove) void fetchListings(filters, b)
    },
    [searchOnMove, filters, fetchListings]
  )

  const sortLabel = SORT_OPTIONS.find((s) => s.key === filters.sort)?.label ?? "Recommended"

  return (
    <div className="mx-auto max-w-[1500px] px-4 sm:px-6 py-5 sm:py-7">
      {/* Search + toolbar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={filters.q}
            onChange={(e) => patch({ q: e.target.value })}
            placeholder="Search by place, city or property name"
            className="h-12 w-full rounded-xl border border-[#D6E0F0] bg-white pl-11 pr-4 text-[14px] text-[#0B1B3F] placeholder:text-slate-400 outline-none focus:border-[var(--brand-strong)] focus:ring-2 focus:ring-[var(--brand)]/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className={cn(
              "inline-flex h-12 items-center gap-2 rounded-xl border px-4 text-[13.5px] font-semibold transition-colors",
              count > 0 ? "border-[var(--brand-strong)] bg-[var(--brand-soft)] text-[var(--brand-strong)]" : "border-[#D6E0F0] bg-white text-slate-600 hover:border-slate-300"
            )}
          >
            <SlidersHorizontal className="h-4 w-4" /> Filters
            {count > 0 && (
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--brand-strong)] text-[11px] text-white">
                {count}
              </span>
            )}
          </button>

          {/* Sort */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setSortOpen((v) => !v)}
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-[#D6E0F0] bg-white px-4 text-[13.5px] font-semibold text-slate-600 hover:border-slate-300"
            >
              <span className="hidden sm:inline">Sort:</span> {sortLabel}
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
            {sortOpen && (
              <>
                <button className="fixed inset-0 z-10 cursor-default" onClick={() => setSortOpen(false)} aria-hidden tabIndex={-1} />
                <div className="absolute right-0 z-20 mt-1 w-52 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                  {SORT_OPTIONS.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => {
                        patch({ sort: s.key as SortKey })
                        setSortOpen(false)
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13px]",
                        filters.sort === s.key ? "bg-[var(--brand-soft)] font-semibold text-[var(--brand-strong)]" : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {s.label}
                      {filters.sort === s.key && <Check className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* View toggle */}
          <div className="flex h-12 rounded-xl border border-[#D6E0F0] bg-white p-1">
            <button
              type="button"
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-colors",
                view === "list" ? "bg-[var(--brand-strong)] text-white" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <List className="h-4 w-4" /> <span className="hidden sm:inline">List</span>
            </button>
            <button
              type="button"
              onClick={() => setView("map")}
              aria-pressed={view === "map"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-colors",
                view === "map" ? "bg-[var(--brand-strong)] text-white" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <MapIcon className="h-4 w-4" /> <span className="hidden sm:inline">Map</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop inline filter panel */}
      {filtersOpen && (
        <div className="mb-5 hidden rounded-2xl border border-[#E2EAF6] bg-white p-5 shadow-sm sm:block">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-[#0B1B3F]">Refine your search</h3>
            <button onClick={() => setFiltersOpen(false)} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          <StayFilterSheet filters={filters} priceCeiling={priceCeiling} onChange={patch} onClear={clear} />
        </div>
      )}

      {/* Result count + search-on-move */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[13px] text-slate-500">
          {loading ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching…
            </span>
          ) : (
            <>
              <span className="font-semibold text-[#0B1B3F]">{visible.length}</span>{" "}
              {visible.length === 1 ? "stay" : "stays"}
            </>
          )}
        </p>
        {view === "map" && (
          <label className="hidden cursor-pointer items-center gap-2 text-[12.5px] font-medium text-slate-600 lg:flex">
            <input type="checkbox" checked={searchOnMove} onChange={(e) => setSearchOnMove(e.target.checked)} className="accent-[var(--brand-strong)]" />
            Search as I move the map
          </label>
        )}
      </div>

      {/* Results */}
      {loading && visible.length === 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-[300px] animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : initialListings.length === 0 ? (
        <EmptyAll />
      ) : visible.length === 0 ? (
        <EmptyFiltered onClear={clear} />
      ) : view === "list" ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((l) => (
            <StayListingCard key={l.id} listing={l} href={stayHref(l)} onHover={setActiveId} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_1.15fr]">
          {/* List rail (hidden on small screens in map view; map is full there) */}
          <div className="hidden space-y-2.5 lg:block lg:max-h-[76vh] lg:overflow-y-auto lg:pr-1">
            {visible.map((l) => (
              <StayListingCard key={l.id} listing={l} href={stayHref(l)} onHover={setActiveId} layout="row" />
            ))}
          </div>
          <div className="h-[68vh] lg:sticky lg:top-20 lg:h-[76vh]">
            <StayMap
              listings={visible}
              activeId={activeId}
              hrefFor={stayHref}
              onHoverId={setActiveId}
              onBoundsChange={onBoundsChange}
              className="h-full w-full"
            />
          </div>
          {/* Mobile/tablet: horizontal card strip under the map */}
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 lg:hidden">
            {visible.map((l) => (
              <div key={l.id} className="w-[260px] shrink-0">
                <StayListingCard listing={l} href={stayHref(l)} onHover={setActiveId} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile/tablet filter bottom sheet */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <button className="absolute inset-0 bg-slate-900/40" onClick={() => setFiltersOpen(false)} aria-label="Close filters" />
          <div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl">
            <div className="sticky -top-5 -mx-5 mb-3 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-3.5">
              <h3 className="text-[16px] font-bold text-[#0B1B3F]">Filters</h3>
              <button onClick={() => setFiltersOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <StayFilterSheet filters={filters} priceCeiling={priceCeiling} onChange={patch} onClear={clear} />
            <button
              onClick={() => setFiltersOpen(false)}
              className="mt-5 h-12 w-full rounded-xl bg-[var(--brand-strong)] text-[14px] font-semibold text-white"
            >
              Show {visible.length} {visible.length === 1 ? "stay" : "stays"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyAll() {
  return (
    <div className="rounded-2xl border border-dashed border-[#D6E0F0] bg-white py-16 text-center">
      <MapIcon className="mx-auto mb-3 h-9 w-9 text-slate-300" />
      <h3 className="text-[15px] font-semibold text-[#0B1B3F]">No stays published yet</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-[13px] text-slate-500">
        Direct-booking stays appear here the moment a property manager publishes one. Check back soon.
      </p>
    </div>
  )
}

function EmptyFiltered({ onClear }: { onClear: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#D6E0F0] bg-white py-14 text-center">
      <h3 className="text-[15px] font-semibold text-[#0B1B3F]">No stays match your filters</h3>
      <button onClick={onClear} className="mt-3 text-[13px] font-semibold text-[var(--brand-strong)] hover:underline">
        Clear filters
      </button>
    </div>
  )
}
