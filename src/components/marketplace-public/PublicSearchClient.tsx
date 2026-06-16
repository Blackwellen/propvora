"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import {
  Search, SlidersHorizontal, X, Map as MapIcon, LayoutGrid, ChevronLeft, ChevronRight, Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { COUNTRY_OPTIONS } from "@/components/marketplace/taxonomy"
import { MarketplaceEmptyState } from "@/components/marketplace/MarketplaceEmptyState"
import type { PublicListing } from "@/lib/marketplace/search"
import { INTENTS, intentByKey, type IntentKey } from "./intent"
import { StayCard, SupplierCard, EmergencyCard } from "./PublicListingCards"

const MarketplaceMap = dynamic(() => import("./MarketplaceMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center">
      <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
    </div>
  ),
})

/* ──────────────────────────────────────────────────────────────────────────
   PublicSearchClient — the discovery centrepiece for the public marketplace.

   - Segmented intent tabs (All / Stays / Suppliers / Emergency / Services) that
     map to real category + transaction_type filters.
   - Intent-aware FilterPanel: stays surface a price/location refine; suppliers
     surface service-area + verified-only; both share search + country + price.
   - ResultGrid of the right card variant.
   - Map/List split view (Leaflet, client-only) toggled per the user.

   Data: the ANON-safe `/api/marketplace/public-search` (real FTS over published
   listings). Tolerant of a cold API → premium empty state, never a crash.
─────────────────────────────────────────────────────────────────────────── */

const PAGE_SIZE = 24

interface Filters {
  query: string
  countryCode: string
  location: string
  minPence: number | null
  maxPence: number | null
  verifiedOnly: boolean
}

const EMPTY: Filters = {
  query: "",
  countryCode: "",
  location: "",
  minPence: null,
  maxPence: null,
  verifiedOnly: false,
}

interface Props {
  /** Locked intent for a per-door landing page; null/"all" on the discover hub. */
  intent: IntentKey
  /** Whether the segmented tabs navigate (discover hub) or are display-only. */
  lockIntent?: boolean
  /** Seed listings rendered server-side for first paint (SSR/SEO). */
  initialListings?: PublicListing[]
  initialTotal?: number
  heading?: string
  subheading?: string
}

export function PublicSearchClient({
  intent: intentKey,
  lockIntent = false,
  initialListings = [],
  initialTotal = 0,
  heading,
  subheading,
}: Props) {
  const router = useRouter()
  const intent = intentByKey(intentKey)

  const [filters, setFilters] = useState<Filters>(EMPTY)
  const [page, setPage] = useState(1)
  const [view, setView] = useState<"grid" | "split">("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  const [items, setItems] = useState<PublicListing[]>(initialListings)
  const [total, setTotal] = useState(initialTotal)
  const [loading, setLoading] = useState(false)
  const [errored, setErrored] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  const [dq, setDq] = useState("")
  const [dloc, setDloc] = useState("")
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
  }, [dq, dloc, filters.countryCode, filters.minPence, filters.maxPence, filters.verifiedOnly, intentKey])

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
      const json = (await res.json().catch(() => null)) as
        | { items?: PublicListing[]; total?: number }
        | null
      if (!res.ok || !json) {
        setItems([])
        setTotal(0)
        setErrored(res.status >= 500)
        return
      }
      let next = Array.isArray(json.items) ? json.items : []
      if (filters.verifiedOnly) {
        next = next.filter(
          (l) => l.verificationStatus === "verified" || l.verificationStatus === "approved"
        )
      }
      setItems(next)
      setTotal(Number(json.total ?? next.length))
    } catch {
      if (myReq !== reqId.current) return
      setItems([])
      setTotal(0)
      setErrored(true)
    } finally {
      if (myReq === reqId.current) setLoading(false)
    }
  }, [dq, dloc, intent.category, intent.transactionType, filters.countryCode, filters.minPence, filters.maxPence, filters.verifiedOnly, page])

  // Skip the very first fetch when we already have SSR seed data + default filters.
  useEffect(() => {
    if (!hydrated && initialListings.length > 0 && page === 1 && !dq && !dloc && !filters.countryCode && filters.minPence === null && filters.maxPence === null && !filters.verifiedOnly) {
      setHydrated(true)
      return
    }
    setHydrated(true)
    void fetchListings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchListings])

  const patch = (x: Partial<Filters>) => setFilters((f) => ({ ...f, ...x }))
  const clear = () => setFilters({ ...EMPTY })
  const activeCount =
    (filters.query ? 1 : 0) +
    (filters.countryCode ? 1 : 0) +
    (filters.location ? 1 : 0) +
    (filters.minPence !== null ? 1 : 0) +
    (filters.maxPence !== null ? 1 : 0) +
    (filters.verifiedOnly ? 1 : 0)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const onTab = (key: IntentKey) => {
    if (lockIntent) return
    const meta = INTENTS.find((i) => i.key === key)!
    router.push(meta.slug ? `/marketplace/${meta.slug}` : "/marketplace")
  }

  const Card = useMemo(() => {
    if (intent.key === "stays") return StayCard
    if (intent.key === "emergency") return EmergencyCard
    if (intent.key === "suppliers") return SupplierCard
    return undefined // "all"/"services": pick per-listing below
  }, [intent.key])

  const renderCard = (l: PublicListing) => {
    if (Card) return <Card key={l.id} listing={l} />
    // mixed/services: route per-listing intent
    const tt = l.transactionType
    if (tt === "stay_booking") return <StayCard key={l.id} listing={l} />
    if (tt === "emergency_job") return <EmergencyCard key={l.id} listing={l} />
    return <SupplierCard key={l.id} listing={l} />
  }

  const grid = (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map(renderCard)}
    </div>
  )

  const splitGrid = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((l) => (
        <div key={l.id} onMouseEnter={() => setActiveId(l.id)} onMouseLeave={() => setActiveId(null)}>
          {renderCard(l)}
        </div>
      ))}
    </div>
  )

  const empty = errored ? (
    <MarketplaceEmptyState
      variant="no-results"
      title="We couldn't load the marketplace"
      description="There was a problem reaching the marketplace just now. Please try again in a moment."
      action={{ label: "Retry", onClick: () => void fetchListings() }}
    />
  ) : activeCount > 0 ? (
    <MarketplaceEmptyState variant="no-results" action={{ label: "Clear filters", onClick: clear }} />
  ) : (
    <MarketplaceEmptyState variant="browse" />
  )

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6 sm:py-8">
      {/* Heading */}
      {(heading || subheading) && (
        <div className="mb-5">
          {heading && <h1 className="text-[24px] sm:text-[28px] font-bold tracking-tight text-[#0B1B3F]">{heading}</h1>}
          {subheading && <p className="mt-1 text-[14px] text-slate-500">{subheading}</p>}
        </div>
      )}

      {/* Segmented intent tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
        {INTENTS.map((i) => {
          const Icon = i.icon
          const active = i.key === intent.key
          return (
            <button
              key={i.key}
              onClick={() => onTab(i.key)}
              className={cn(
                "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all shrink-0",
                active
                  ? "bg-[#0B1B3F] text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {i.label}
            </button>
          )
        })}
      </div>

      {/* Search + toolbar */}
      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={filters.query}
            onChange={(e) => patch({ query: e.target.value })}
            placeholder={
              intent.key === "stays"
                ? "Search stays by city, area or postcode…"
                : intent.key === "emergency"
                ? "Search emergency call-outs…"
                : "Search the marketplace…"
            }
            className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-[13.5px] text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
          />
        </div>

        <button
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border text-[13px] font-semibold shadow-sm transition-all shrink-0",
            showFilters || activeCount > 0
              ? "bg-[#EFF6FF] border-blue-200 text-[#2563EB]"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters{activeCount > 0 ? ` · ${activeCount}` : ""}
        </button>

        {/* View toggle */}
        <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-sm shrink-0">
          <button
            onClick={() => setView("grid")}
            className={cn("inline-flex items-center gap-1 h-9 px-2.5 rounded-[10px] text-[12.5px] font-semibold transition-colors", view === "grid" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-700")}
            aria-pressed={view === "grid"}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Grid
          </button>
          <button
            onClick={() => setView("split")}
            className={cn("inline-flex items-center gap-1 h-9 px-2.5 rounded-[10px] text-[12.5px] font-semibold transition-colors", view === "split" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-700")}
            aria-pressed={view === "split"}
          >
            <MapIcon className="w-3.5 h-3.5" /> Map
          </button>
        </div>

        <span className="ml-auto text-[12.5px] font-medium text-slate-500 tabular-nums">
          {loading ? "Searching…" : `${total.toLocaleString("en-GB")} ${total === 1 ? "result" : "results"}`}
        </span>
      </div>

      {/* Intent-aware filter panel */}
      {showFilters && (
        <FilterPanel
          intentKey={intent.key}
          filters={filters}
          onChange={patch}
          onClear={clear}
          activeCount={activeCount}
        />
      )}

      {/* Results */}
      <div className="mt-5">
        {loading && items.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[280px] rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          empty
        ) : view === "split" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            <div className="order-2 lg:order-1">{splitGrid}</div>
            <div className="order-1 lg:order-2 lg:sticky lg:top-[72px] h-[60vh] lg:h-[calc(100vh-120px)] relative">
              <MarketplaceMap listings={items} activeId={activeId} className="w-full h-full relative" />
            </div>
          </div>
        ) : (
          grid
        )}
      </div>

      {/* Pagination */}
      {!loading && items.length > 0 && totalPages > 1 && (
        <div className="mt-7 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="inline-flex items-center gap-1 h-9 px-3 rounded-xl border border-slate-200 bg-white text-[13px] font-medium text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <span className="px-3 text-[12.5px] font-medium text-slate-500 tabular-nums">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="inline-flex items-center gap-1 h-9 px-3 rounded-xl border border-slate-200 bg-white text-[13px] font-medium text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Intent-aware filter panel ── */
function FilterPanel({
  intentKey,
  filters,
  onChange,
  onClear,
  activeCount,
}: {
  intentKey: IntentKey
  filters: Filters
  onChange: (x: Partial<Filters>) => void
  onClear: () => void
  activeCount: number
}) {
  const isStay = intentKey === "stays"
  const isSupplier = intentKey === "suppliers" || intentKey === "emergency"
  const majorToPence = (v: string): number | null => {
    const n = Number(v)
    return v.trim() === "" || !Number.isFinite(n) || n < 0 ? null : Math.round(n * 100)
  }
  return (
    <div className="mt-3 rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
      <div className="flex flex-wrap items-end gap-3">
        {/* Country (shared) */}
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

        {/* Location / service-area (label adapts by intent) */}
        <label className="flex flex-col gap-1">
          <span className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-500">
            {isStay ? "Where" : isSupplier ? "Service area" : "Location"}
          </span>
          <input
            value={filters.location}
            onChange={(e) => onChange({ location: e.target.value })}
            placeholder={isStay ? "City or postcode" : "City, region or postcode"}
            className="w-[220px] h-9 rounded-xl border border-slate-200 bg-white px-3 text-[12.5px] text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
          />
        </label>

        {/* Price (shared) */}
        <div className="flex flex-col gap-1">
          <span className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-500">
            {isStay ? "Price / night" : "Price"}
          </span>
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-slate-400">£</span>
              <input
                inputMode="numeric"
                defaultValue={filters.minPence === null ? "" : String(filters.minPence / 100)}
                onChange={(e) => onChange({ minPence: majorToPence(e.target.value) })}
                placeholder="Min"
                className="w-[90px] h-9 rounded-xl border border-slate-200 bg-white pl-6 pr-2 text-[12.5px] text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
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
                className="w-[90px] h-9 rounded-xl border border-slate-200 bg-white pl-6 pr-2 text-[12.5px] text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
              />
            </div>
          </div>
        </div>

        {/* Verified-only (supplier intents) */}
        {isSupplier && (
          <label className="flex items-center gap-2 h-9 px-3 rounded-xl border border-slate-200 bg-white shadow-sm cursor-pointer">
            <input
              type="checkbox"
              checked={filters.verifiedOnly}
              onChange={(e) => onChange({ verifiedOnly: e.target.checked })}
              className="accent-[#2563EB]"
            />
            <span className="text-[12.5px] font-medium text-slate-700">Verified only</span>
          </label>
        )}

        {activeCount > 0 && (
          <button
            onClick={onClear}
            className="inline-flex items-center gap-1 h-9 px-2.5 rounded-xl text-[12.5px] font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors ml-auto"
          >
            <X className="w-3.5 h-3.5" /> Clear all
          </button>
        )}
      </div>
    </div>
  )
}

export default PublicSearchClient
