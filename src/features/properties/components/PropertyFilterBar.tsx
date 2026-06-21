"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Search, SlidersHorizontal, LayoutGrid, List } from "lucide-react"

export interface PropertyFilters {
  search: string
  filterStatus: string
  filterProfile: string
  filterType: string
  filterHealth: string
  sortBy: string
  view: "cards" | "table"
}

export interface PropertyFilterBarProps {
  filters: PropertyFilters
  showFilters: boolean
  onFilterChange: (key: keyof PropertyFilters, value: string) => void
  onViewChange: (view: "cards" | "table") => void
  onToggleFilters: () => void
  onMobileFilters?: () => void
}

const STATUS_OPTIONS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "vacant", label: "Vacant" },
  { key: "maintenance", label: "Maintenance" },
  { key: "archived", label: "Archived" },
]

export function PropertyFilterBar({
  filters, showFilters, onFilterChange, onViewChange, onToggleFilters, onMobileFilters,
}: PropertyFilterBarProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Status tabs */}
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => onFilterChange("filterStatus", opt.key)}
            className={cn(
              "px-3 py-1.5 rounded-full text-[13px] font-medium border transition-all",
              filters.filterStatus === opt.key
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            )}
          >
            {opt.label}
          </button>
        ))}

        {/* Desktop: filter toggle + view toggle */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onToggleFilters}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium text-slate-600 bg-white border border-slate-200 hover:border-slate-300 transition-all"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
          </button>
          <button
            onClick={onMobileFilters}
            className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium text-slate-600 bg-white border border-slate-200 hover:border-slate-300 transition-all"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
          </button>
          <div className="hidden md:flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
            <button
              onClick={() => onViewChange("cards")}
              className={cn("p-1.5 rounded-lg transition-all", filters.view === "cards" ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-600")}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewChange("table")}
              className={cn("p-1.5 rounded-lg transition-all", filters.view === "table" ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-600")}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop search */}
      <div className="relative hidden md:block">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search properties..."
          value={filters.search}
          onChange={(e) => onFilterChange("search", e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
        />
      </div>
    </div>
  )
}

export default PropertyFilterBar
