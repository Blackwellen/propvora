"use client"

import React, { useState } from "react"
import { Search, SlidersHorizontal, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useIsMobile, useHasMounted } from "@/components/mobile/useBreakpoint"
import MobileFilterSheet, { type FilterGroup } from "@/components/mobile/MobileFilterSheet"
import { TRANSACTION_TYPES, COUNTRY_OPTIONS } from "./taxonomy"

/* ──────────────────────────────────────────────────────────────────────────
   FilterBar — the marketplace search + refinement toolbar.

   Desktop: a search input, inline transaction-type + country selects, a price
   range (min/max in MAJOR units, converted to pence by the caller), and a
   "More filters" disclosure for location.
   Mobile: a compact search field + a "Filters" button that opens the shared
   MobileFilterSheet (pill groups). Price/location stay on the desktop toolbar;
   the sheet carries the categorical filters where pills make sense.

   Money: the bar exposes price as MAJOR-unit strings to the user but reports
   PENCE integers to the caller via `onPriceChange`.
─────────────────────────────────────────────────────────────────────────── */

export interface MarketplaceFilters {
  query: string
  transactionType: string
  countryCode: string
  location: string
  /** Integer pence, or null when unset. */
  minPence: number | null
  maxPence: number | null
}

interface FilterBarProps {
  filters: MarketplaceFilters
  onChange: (patch: Partial<MarketplaceFilters>) => void
  onClear: () => void
  /** Total result count, shown as context. */
  resultCount?: number
  className?: string
}

function majorToPence(v: string): number | null {
  const n = Number(v)
  if (v.trim() === "" || !Number.isFinite(n) || n < 0) return null
  return Math.round(n * 100)
}
function penceToMajor(p: number | null): string {
  return p === null ? "" : String(p / 100)
}

const SELECT_CLS =
  "h-9 rounded-xl border border-slate-200 bg-white px-3 text-[12.5px] font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] transition-all"

export function FilterBar({ filters, onChange, onClear, resultCount, className }: FilterBarProps) {
  const mounted = useHasMounted()
  const mobileMatch = useIsMobile()
  const isMobile = mounted && mobileMatch
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)

  const activeCount =
    (filters.query ? 1 : 0) +
    (filters.transactionType ? 1 : 0) +
    (filters.countryCode ? 1 : 0) +
    (filters.location ? 1 : 0) +
    (filters.minPence !== null ? 1 : 0) +
    (filters.maxPence !== null ? 1 : 0)

  // Local controlled strings for the price inputs (major units).
  const [minMajor, setMinMajor] = useState(penceToMajor(filters.minPence))
  const [maxMajor, setMaxMajor] = useState(penceToMajor(filters.maxPence))

  // Keep local price strings in sync when filters are cleared/reset externally.
  React.useEffect(() => {
    setMinMajor(penceToMajor(filters.minPence))
    setMaxMajor(penceToMajor(filters.maxPence))
  }, [filters.minPence, filters.maxPence])

  const mobileGroups: FilterGroup[] = [
    {
      key: "transactionType",
      label: "Listing type",
      value: filters.transactionType,
      onChange: (v) => onChange({ transactionType: v }),
      options: [{ value: "", label: "Any" }, ...TRANSACTION_TYPES.map((t) => ({ value: t.key, label: t.label }))],
    },
    {
      key: "countryCode",
      label: "Country",
      value: filters.countryCode,
      onChange: (v) => onChange({ countryCode: v }),
      options: [{ value: "", label: "Any" }, ...COUNTRY_OPTIONS.map((c) => ({ value: c.value, label: c.label }))],
    },
  ]

  /* ── Mobile branch ── */
  if (isMobile) {
    return (
      <div className={cn("space-y-2.5", className)}>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={filters.query}
              onChange={(e) => onChange({ query: e.target.value })}
              placeholder="Search the marketplace"
              className="w-full h-11 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-[14px] text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]"
            />
          </div>
          <button
            onClick={() => setSheetOpen(true)}
            className="relative h-11 w-11 shrink-0 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-600 shadow-sm hover:bg-slate-50"
            aria-label="Filters"
          >
            <SlidersHorizontal className="w-4.5 h-4.5" />
            {activeCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--brand)] text-white text-[10px] font-bold flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </button>
        </div>

        {/* Price range — kept on the mobile bar as numeric inputs (pills don't fit ranges). */}
        <div className="flex items-center gap-2">
          <input
            inputMode="numeric"
            value={minMajor}
            onChange={(e) => { setMinMajor(e.target.value); onChange({ minPence: majorToPence(e.target.value) }) }}
            placeholder="Min £"
            className="flex-1 h-10 rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
          />
          <span className="text-slate-400 text-sm">—</span>
          <input
            inputMode="numeric"
            value={maxMajor}
            onChange={(e) => { setMaxMajor(e.target.value); onChange({ maxPence: majorToPence(e.target.value) }) }}
            placeholder="Max £"
            className="flex-1 h-10 rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
          />
        </div>

        <MobileFilterSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          groups={mobileGroups}
          activeCount={activeCount}
          onClear={onClear}
          title="Refine marketplace"
        />
      </div>
    )
  }

  /* ── Desktop / tablet branch ── */
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={filters.query}
            onChange={(e) => onChange({ query: e.target.value })}
            placeholder="Search listings, services and suppliers…"
            className="w-full h-9 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-[13px] text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] transition-all"
          />
        </div>

        {/* Transaction type */}
        <select
          value={filters.transactionType}
          onChange={(e) => onChange({ transactionType: e.target.value })}
          className={SELECT_CLS}
          aria-label="Listing type"
        >
          <option value="">All types</option>
          {TRANSACTION_TYPES.map((t) => (
            <option key={t.key} value={t.key}>{t.label}</option>
          ))}
        </select>

        {/* Country */}
        <select
          value={filters.countryCode}
          onChange={(e) => onChange({ countryCode: e.target.value })}
          className={SELECT_CLS}
          aria-label="Country"
        >
          <option value="">All countries</option>
          {COUNTRY_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>

        {/* Price range */}
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-slate-400">£</span>
            <input
              inputMode="numeric"
              value={minMajor}
              onChange={(e) => { setMinMajor(e.target.value); onChange({ minPence: majorToPence(e.target.value) }) }}
              placeholder="Min"
              className="w-[88px] h-9 rounded-xl border border-slate-200 bg-white pl-6 pr-2 text-[12.5px] text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
            />
          </div>
          <span className="text-slate-300 text-sm">–</span>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-slate-400">£</span>
            <input
              inputMode="numeric"
              value={maxMajor}
              onChange={(e) => { setMaxMajor(e.target.value); onChange({ maxPence: majorToPence(e.target.value) }) }}
              placeholder="Max"
              className="w-[88px] h-9 rounded-xl border border-slate-200 bg-white pl-6 pr-2 text-[12.5px] text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
            />
          </div>
        </div>

        {/* More filters disclosure */}
        <button
          onClick={() => setShowAdvanced((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border text-[12.5px] font-semibold shadow-sm transition-all",
            showAdvanced || filters.location
              ? "bg-[var(--brand-soft)] border-[var(--color-brand-100)] text-[var(--brand)]"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
          )}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          More
        </button>

        {activeCount > 0 && (
          <button
            onClick={onClear}
            className="inline-flex items-center gap-1 h-9 px-2.5 rounded-xl text-[12.5px] font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        )}

        {resultCount != null && (
          <span className="ml-auto text-[12px] font-medium text-slate-500 tabular-nums">
            {resultCount.toLocaleString("en-GB")} {resultCount === 1 ? "listing" : "listings"}
          </span>
        )}
      </div>

      {/* Advanced row */}
      {showAdvanced && (
        <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-500">Location</label>
            <input
              value={filters.location}
              onChange={(e) => onChange({ location: e.target.value })}
              placeholder="City, region or postcode"
              className="w-[260px] h-9 rounded-xl border border-slate-200 bg-white px-3 text-[12.5px] text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default FilterBar
