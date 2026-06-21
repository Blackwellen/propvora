"use client"

import React from "react"
import { Search, ChevronDown, Star } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SupplierFilterPanelProps {
  search: string
  onSearchChange: (v: string) => void
  searchPlaceholder?: string

  trades: string[]
  tradeFilter: string
  onTradeChange: (v: string) => void

  sortBy: "name" | "rating" | "trade"
  onSortChange: (v: "name" | "rating" | "trade") => void

  /** When provided, renders a "Preferred only" toggle */
  preferredOnly?: boolean
  onPreferredOnlyChange?: (v: boolean) => void

  onClearFilters?: () => void

  /** Count display text shown after the count result (e.g. "12 of 55") */
  resultCount?: number
  totalCount?: number
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SupplierFilterPanel({
  search,
  onSearchChange,
  searchPlaceholder = "Search suppliers…",
  trades,
  tradeFilter,
  onTradeChange,
  sortBy,
  onSortChange,
  preferredOnly,
  onPreferredOnlyChange,
  onClearFilters,
  resultCount,
  totalCount,
}: SupplierFilterPanelProps) {
  return (
    <div className="hidden md:flex items-center gap-2 flex-wrap bg-white border border-slate-200 rounded-2xl px-4 py-2.5">
      {/* Search */}
      <div className="relative flex-1 min-w-[220px]">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-[13px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 bg-white"
        />
      </div>

      {/* Trade filter */}
      <div className="relative">
        <select
          value={tradeFilter}
          onChange={(e) => onTradeChange(e.target.value)}
          className="appearance-none border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-[12px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 cursor-pointer"
        >
          {trades.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
      </div>

      {/* Sort */}
      <div className="relative">
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as "name" | "rating" | "trade")}
          className="appearance-none border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-[12px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 cursor-pointer"
        >
          <option value="name">Sort: Name</option>
          <option value="rating">Sort: Rating</option>
          <option value="trade">Sort: Trade</option>
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
      </div>

      {/* Preferred only toggle */}
      {onPreferredOnlyChange !== undefined && (
        <button
          onClick={() => onPreferredOnlyChange(!preferredOnly)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-semibold transition-colors",
            preferredOnly
              ? "border-[#2563EB] bg-blue-50 text-[#2563EB]"
              : "border-slate-200 text-slate-600 hover:bg-slate-50"
          )}
        >
          <Star className={cn("w-3.5 h-3.5", preferredOnly && "fill-[#2563EB]")} />
          Preferred only
        </button>
      )}

      {/* Clear */}
      {onClearFilters && (
        <button
          onClick={onClearFilters}
          className="text-[12px] font-medium text-[#2563EB] hover:underline px-2"
        >
          Clear Filters
        </button>
      )}

      {/* Count */}
      {resultCount !== undefined && totalCount !== undefined && (
        <span className="text-[12.5px] text-slate-500 ml-auto">
          {resultCount} of {totalCount}
        </span>
      )}
    </div>
  )
}
