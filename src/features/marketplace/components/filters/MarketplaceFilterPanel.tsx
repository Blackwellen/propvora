"use client"

import { Star, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { COUNTRY_OPTIONS } from "@/components/marketplace/taxonomy"
import type { IntentKey } from "@/components/marketplace-public/intent"
import type { MpFilters } from "@/components/marketplace-public/filters"

interface Props {
  intent: IntentKey
  filters: MpFilters
  onChange: (x: Partial<MpFilters>) => void
  onClear: () => void
  activeCount: number
  embedded?: boolean
}

function majorToPence(v: string): number | null {
  const n = Number(v)
  return v.trim() === "" || !Number.isFinite(n) || n < 0 ? null : Math.round(n * 100)
}

/**
 * Intent-aware filter panel used in both the desktop inline variant and the
 * mobile bottom-sheet. Pass `embedded` to suppress the outer card border/bg.
 */
export default function MarketplaceFilterPanel({
  intent,
  filters,
  onChange,
  onClear,
  activeCount,
  embedded = false,
}: Props) {
  const isStay = intent === "stays"
  const isSupplier = intent === "suppliers" || intent === "emergency" || intent === "services"

  return (
    <div className={cn(!embedded && "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm")}>
      <div className="flex flex-wrap items-end gap-3">
        {/* Country filter */}
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

        {/* Location filter */}
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

        {/* Price range */}
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

        {/* Min rating */}
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
                  filters.minRating === r
                    ? "border-[#2563EB] bg-blue-50 text-[#2563EB]"
                    : "border-slate-200 bg-white text-slate-600"
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
