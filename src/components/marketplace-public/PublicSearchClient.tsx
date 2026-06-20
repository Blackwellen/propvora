"use client"

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import {
  Search, SlidersHorizontal, X, Map as MapIcon, LayoutGrid, ChevronLeft, ChevronRight, Loader2,
  ChevronDown, Check, Zap, ShieldCheck, Clock, Star,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { COUNTRY_OPTIONS } from "@/components/marketplace/taxonomy"
import { MarketplaceEmptyState } from "@/components/marketplace/MarketplaceEmptyState"
import type { PublicListing } from "@/lib/marketplace/search"
import { INTENTS, intentByKey, type IntentKey } from "./intent"
import { StayCard, SupplierCard, EmergencyCard } from "./PublicListingCards"
import {
  MP_EMPTY, MP_SORT_OPTIONS, mpActiveCount, mpFromParams, mpToParams, mpRefineAndSort,
  togglesForIntent, type MpFilters, type MpSortKey,
} from "./filters"

const MarketplaceMap = dynamic(() => import("./MarketplaceMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
      <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
    </div>
  ),
})

/* ──────────────────────────────────────────────────────────────────────────
   PublicSearchClient — discovery centrepiece for the public marketplace.

   Intent tabs → real category/transaction_type filters. URL-synced filter state
   (filters.ts) drives the real `/api/marketplace/public-search` FTS, plus
   client-side discovery toggles (instant-book / verified / available-now /
   rating) and sort. Grid + split-map views (Leaflet) with hover-sync and
   "search as I move the map". Mobile/tablet filter bottom sheet.
─────────────────────────────────────────────────────────────────────────── */

const PAGE_SIZE = 24

interface Props {
  intent: IntentKey
  lockIntent?: boolean
  initialListings?: PublicListing[]
  initialTotal?: number
  heading?: string
  subheading?: string
}

function PublicSearchInner({
  intent: intentKey,
  lockIntent = false,
  initialListings = [],
  initialTotal = 0,
  heading,
  subheading,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const intent = intentByKey(intentKey)
  const toggles = togglesForIntent(intent.key)

  const [filters, setFilters] = useState<MpFilters>(() =>
    mpFromParams(new URLSearchParams(searchParams?.toString() ?? ""))
  )
  const [page, setPage] = useState(1)
  const [view, setView] = useState<"grid" | "split">("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [searchOnMove, setSearchOnMove] = useState(false)

  const [items, setItems] = useState<PublicListing[]>(initialListings)
  const [total, setTotal] = useState(initialTotal)
  const [loading, setLoading] = useState(false)
  const [errored, setErrored] = useState(false)
  const hydrated = useRef(false)
  const boundsRef = useRef<[number, number, number, number] | null>(null)

  // Debounce the free-text inputs.
  const [dq, setDq] = useState(filters.query)
  const [dloc, setDloc] = useState(filters.location)
  useEffect(() => {
    const t = setTimeout(() => setDq(filters.query), 300)
    return () => clearTimeout(t)
  }, [filters.query])
  useEffect(() => {
    const t = setTimeout(() => setDloc(filters.location), 300)
    return () => clearTimeout(t)
  }, [filters.location])

  useEffect(() => {
    setPage(1)
  }, [dq, dloc, filters.countryCode, filters.minPence, filters.maxPence, intentKey])

  // URL sync.
  useEffect(() => {
    const qs = mpToParams(filters).toString()
    const base = intent.slug ? `/marketplace/${intent.slug}` : "/marketplace"
    router.replace(qs ? `${base}?${qs}` : base, { scroll: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const reqId = useRef(0)
  const fetchListings = useCallback(async () => {
    const myReq = ++reqId.current
    setLoading(true)
    setErrored(false)
    const p = new URLSearchParams()
    if (dq) p.set("q", dq)
    if (intent.category) p.set("category", intent.category)
    if (intent.transactionType) p.set("transactionType", intent.transactionType)
    if (filters.countryCode) p.set("countryCode", filters.countryCode)
    if (dloc) p.set("location", dloc)
    if (filters.minPence !== null) p.set("minPence", String(filters.minPence))
    if (filters.maxPence !== null) p.set("maxPence", String(filters.maxPence))
    p.set("page", String(page))
    p.set("pageSize", String(PAGE_SIZE))
    try {
      const res = await fetch(`/api/marketplace/public-search?${p.toString()}`, {
        headers: { accept: "application/json" },
      })
      if (myReq !== reqId.current) return
      const json = (await res.json().catch(() => null)) as { items?: PublicListing[]; total?: number } | null
      if (!res.ok || !json) {
        setItems([])
        setTotal(0)
        setErrored(res.status >= 500)
        return
      }
      setItems(Array.isArray(json.items) ? json.items : [])
      setTotal(Number(json.total ?? 0))
    } catch {
      if (myReq !== reqId.current) return
      setItems([])
      setTotal(0)
      setErrored(true)
    } finally {
      if (myReq === reqId.current) setLoading(false)
    }
  }, [dq, dloc, intent.category, intent.transactionType, filters.countryCode, filters.minPence, filters.maxPence, page])

  useEffect(() => {
    if (!hydrated.current && initialListings.length > 0 && page === 1 && !dq && !dloc && !filters.countryCode && filters.minPence === null && filters.maxPence === null) {
      hydrated.current = true
      return
    }
    hydrated.current = true
    void fetchListings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchListings])

  const patch = (x: Partial<MpFilters>) => setFilters((f) => ({ ...f, ...x }))
  const clear = () => setFilters({ ...MP_EMPTY, sort: filters.sort })
  const activeCount = mpActiveCount(filters)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  // Client refinements + sort over the page items.
  const visible = useMemo(() => mpRefineAndSort(items, filters), [items, filters])

  const onBoundsChange = useCallback(
    (b: [number, number, number, number]) => {
      boundsRef.current = b
      // Marketplace FTS RPC has no bounds param; filter the loaded set locally.
      if (searchOnMove) {
        setItems((prev) =>
          prev.filter(
            (l) =>
              l.latitude == null ||
              l.longitude == null ||
              (l.latitude >= b[0] && l.latitude <= b[2] && l.longitude >= b[1] && l.longitude <= b[3])
          )
        )
      }
    },
    [searchOnMove]
  )

  const onTab = (key: IntentKey) => {
    if (lockIntent) return
    const meta = INTENTS.find((i) => i.key === key)!
    router.push(meta.slug ? `/marketplace/${meta.slug}` : "/marketplace")
  }

  const Card = useMemo(() => {
    if (intent.key === "stays") return StayCard
    if (intent.key === "emergency") return EmergencyCard
    if (intent.key === "suppliers") return SupplierCard
    return undefined
  }, [intent.key])

  const renderCard = (l: PublicListing) => {
    if (Card) return <Card key={l.id} listing={l} />
    const tt = l.transactionType
    if (tt === "stay_booking") return <StayCard key={l.id} listing={l} />
    if (tt === "emergency_job") return <EmergencyCard key={l.id} listing={l} />
    return <SupplierCard key={l.id} listing={l} />
  }

  const sortLabel = MP_SORT_OPTIONS.find((s) => s.key === filters.sort)?.label ?? "Recommended"

  const empty = errored ? (
    <MarketplaceEmptyState
      variant="no-results"
      title="We couldn't load the marketplace"
      description="There was a problem reaching the marketplace just now. Please try again in a moment."
      action={{ label: "Retry", onClick: () => void fetchListings() }}
    />
  ) : activeCount > 0 || filters.query ? (
    <MarketplaceEmptyState variant="no-results" action={{ label: "Clear filters", onClick: clear }} />
  ) : (
    <MarketplaceEmptyState variant="browse" />
  )

  return (
    <div className="mx-auto max-w-[1500px] px-4 sm:px-6 py-6 sm:py-8">
      {(heading || subheading) && (
        <div className="mb-5">
          {heading && <h1 className="text-[24px] sm:text-[28px] font-bold tracking-tight text-[#0B1B3F]">{heading}</h1>}
          {subheading && <p className="mt-1 text-[14px] text-slate-500">{subheading}</p>}
        </div>
      )}

      {/* Intent tabs */}
      <div className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        {INTENTS.map((i) => {
          const Icon = i.icon
          const active = i.key === intent.key
          return (
            <button
              key={i.key}
              onClick={() => onTab(i.key)}
              className={cn(
                "inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[13px] font-semibold transition-all",
                active ? "bg-[#0B1B3F] text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {i.label}
            </button>
          )
        })}
      </div>

      {/* Search + toolbar */}
      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={filters.query}
            onChange={(e) => patch({ query: e.target.value })}
            placeholder={
              intent.key === "stays" ? "Search stays by city, area or postcode…" : intent.key === "emergency" ? "Search emergency call-outs…" : "Search the marketplace…"
            }
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-[13.5px] text-slate-700 shadow-sm transition-all focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
          />
        </div>

        <button
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border px-3.5 text-[13px] font-semibold shadow-sm transition-all",
            showFilters || activeCount > 0 ? "border-blue-200 bg-[#EFF6FF] text-[#2563EB]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters{activeCount > 0 ? ` · ${activeCount}` : ""}
        </button>

        {/* Sort */}
        <div className="relative shrink-0">
          <button
            onClick={() => setSortOpen((v) => !v)}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
          >
            <span className="hidden sm:inline">Sort:</span> {sortLabel}
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
          {sortOpen && (
            <>
              <button className="fixed inset-0 z-10 cursor-default" onClick={() => setSortOpen(false)} aria-hidden tabIndex={-1} />
              <div className="absolute right-0 z-20 mt-1 w-52 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                {MP_SORT_OPTIONS.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => {
                      patch({ sort: s.key as MpSortKey })
                      setSortOpen(false)
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13px]",
                      filters.sort === s.key ? "bg-blue-50 font-semibold text-[#2563EB]" : "text-slate-600 hover:bg-slate-50"
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
        <div className="inline-flex shrink-0 items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-sm">
          <button
            onClick={() => setView("grid")}
            className={cn("inline-flex h-9 items-center gap-1 rounded-[10px] px-2.5 text-[12.5px] font-semibold transition-colors", view === "grid" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-700")}
            aria-pressed={view === "grid"}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Grid
          </button>
          <button
            onClick={() => setView("split")}
            className={cn("inline-flex h-9 items-center gap-1 rounded-[10px] px-2.5 text-[12.5px] font-semibold transition-colors", view === "split" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-700")}
            aria-pressed={view === "split"}
          >
            <MapIcon className="h-3.5 w-3.5" /> Map
          </button>
        </div>

        <span className="ml-auto text-[12.5px] font-medium tabular-nums text-slate-500">
          {loading ? "Searching…" : `${visible.length.toLocaleString("en-GB")} ${visible.length === 1 ? "result" : "results"}`}
        </span>
      </div>

      {/* Quick toggle chips (always visible) */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {toggles.instantBook && (
          <QuickChip active={filters.instantBook} onClick={() => patch({ instantBook: !filters.instantBook })} icon={<Zap className="h-3.5 w-3.5" />}>
            Instant book
          </QuickChip>
        )}
        {toggles.verified && (
          <QuickChip active={filters.verifiedOnly} onClick={() => patch({ verifiedOnly: !filters.verifiedOnly })} icon={<ShieldCheck className="h-3.5 w-3.5" />}>
            Verified
          </QuickChip>
        )}
        {toggles.availableNow && (
          <QuickChip active={filters.availableNow} onClick={() => patch({ availableNow: !filters.availableNow })} icon={<Clock className="h-3.5 w-3.5" />}>
            Available now
          </QuickChip>
        )}
        {toggles.rating && (
          <QuickChip active={filters.minRating >= 4.5} onClick={() => patch({ minRating: filters.minRating >= 4.5 ? 0 : 4.5 })} icon={<Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}>
            Top rated
          </QuickChip>
        )}
      </div>

      {/* Filter panel (desktop inline) */}
      {showFilters && (
        <div className="mt-3 hidden sm:block">
          <FilterPanel intent={intent.key} filters={filters} onChange={patch} onClear={clear} activeCount={activeCount} />
        </div>
      )}

      {/* Results */}
      <div className="mt-5">
        {view === "split" && (
          <label className="mb-3 hidden cursor-pointer items-center gap-2 text-[12.5px] font-medium text-slate-600 lg:flex">
            <input type="checkbox" checked={searchOnMove} onChange={(e) => setSearchOnMove(e.target.checked)} className="accent-[#2563EB]" />
            Search as I move the map
          </label>
        )}
        {loading && visible.length === 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[280px] animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          empty
        ) : view === "split" ? (
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {visible.map((l) => (
                  <div key={l.id} onMouseEnter={() => setActiveId(l.id)} onMouseLeave={() => setActiveId(null)}>
                    {renderCard(l)}
                  </div>
                ))}
              </div>
            </div>
            <div className="relative order-1 h-[60vh] lg:order-2 lg:sticky lg:top-[72px] lg:h-[calc(100vh-120px)]">
              <MarketplaceMap
                listings={visible}
                activeId={activeId}
                onHoverId={setActiveId}
                onBoundsChange={onBoundsChange}
                className="relative h-full w-full"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{visible.map(renderCard)}</div>
        )}
      </div>

      {/* Pagination */}
      {!loading && visible.length > 0 && totalPages > 1 && (
        <div className="mt-7 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <span className="px-3 text-[12.5px] font-medium tabular-nums text-slate-500">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Mobile/tablet filter bottom sheet */}
      {showFilters && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <button className="absolute inset-0 bg-slate-900/40" onClick={() => setShowFilters(false)} aria-label="Close filters" />
          <div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl">
            <div className="sticky -top-5 -mx-5 mb-3 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-3.5">
              <h3 className="text-[16px] font-bold text-[#0B1B3F]">Filters</h3>
              <button onClick={() => setShowFilters(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <FilterPanel intent={intent.key} filters={filters} onChange={patch} onClear={clear} activeCount={activeCount} embedded />
            <button onClick={() => setShowFilters(false)} className="mt-5 h-12 w-full rounded-xl bg-[#2563EB] text-[14px] font-semibold text-white">
              Show {visible.length} {visible.length === 1 ? "result" : "results"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function QuickChip({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
        active ? "border-[#2563EB] bg-blue-50 text-[#2563EB]" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
      )}
    >
      {icon}
      {children}
    </button>
  )
}

/* ── Intent-aware filter panel ── */
function FilterPanel({
  intent,
  filters,
  onChange,
  onClear,
  activeCount,
  embedded = false,
}: {
  intent: IntentKey
  filters: MpFilters
  onChange: (x: Partial<MpFilters>) => void
  onClear: () => void
  activeCount: number
  embedded?: boolean
}) {
  const isStay = intent === "stays"
  const isSupplier = intent === "suppliers" || intent === "emergency" || intent === "services"
  const majorToPence = (v: string): number | null => {
    const n = Number(v)
    return v.trim() === "" || !Number.isFinite(n) || n < 0 ? null : Math.round(n * 100)
  }
  return (
    <div className={cn(!embedded && "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm")}>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-500">Country</span>
          <select
            value={filters.countryCode}
            onChange={(e) => onChange({ countryCode: e.target.value })}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-[12.5px] font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
          >
            <option value="">All countries</option>
            {COUNTRY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-500">
            {isStay ? "Where" : isSupplier ? "Service area" : "Location"}
          </span>
          <input
            value={filters.location}
            onChange={(e) => onChange({ location: e.target.value })}
            placeholder={isStay ? "City or postcode" : "City, region or postcode"}
            className="h-9 w-[220px] rounded-xl border border-slate-200 bg-white px-3 text-[12.5px] text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
          />
        </label>

        <div className="flex flex-col gap-1">
          <span className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-500">{isStay ? "Price / night" : "Price"}</span>
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-slate-400">£</span>
              <input
                inputMode="numeric"
                defaultValue={filters.minPence === null ? "" : String(filters.minPence / 100)}
                onChange={(e) => onChange({ minPence: majorToPence(e.target.value) })}
                placeholder="Min"
                className="h-9 w-[90px] rounded-xl border border-slate-200 bg-white pl-6 pr-2 text-[12.5px] text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
              />
            </div>
            <span className="text-slate-300">–</span>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-slate-400">£</span>
              <input
                inputMode="numeric"
                defaultValue={filters.maxPence === null ? "" : String(filters.maxPence / 100)}
                onChange={(e) => onChange({ maxPence: majorToPence(e.target.value) })}
                placeholder="Max"
                className="h-9 w-[90px] rounded-xl border border-slate-200 bg-white pl-6 pr-2 text-[12.5px] text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
              />
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className="flex flex-col gap-1">
          <span className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-500">Min rating</span>
          <div className="flex items-center gap-1">
            {[0, 4, 4.5].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onChange({ minRating: r })}
                className={cn(
                  "inline-flex h-9 items-center gap-1 rounded-xl border px-2.5 text-[12.5px] font-medium",
                  filters.minRating === r ? "border-[#2563EB] bg-blue-50 text-[#2563EB]" : "border-slate-200 bg-white text-slate-600"
                )}
              >
                {r > 0 && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                {r === 0 ? "Any" : `${r}+`}
              </button>
            ))}
          </div>
        </div>

        {activeCount > 0 && (
          <button
            onClick={onClear}
            className="ml-auto inline-flex h-9 items-center gap-1 rounded-xl px-2.5 text-[12.5px] font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
          >
            <X className="h-3.5 w-3.5" /> Clear all
          </button>
        )}
      </div>
    </div>
  )
}

/** Public export — wraps the inner client in a Suspense boundary because it
 *  reads `useSearchParams` (required by Next.js for client search-param reads). */
export function PublicSearchClient(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1500px] px-4 sm:px-6 py-8 text-[13px] text-slate-400">Loading marketplace…</div>
      }
    >
      <PublicSearchInner {...props} />
    </Suspense>
  )
}

export default PublicSearchClient
