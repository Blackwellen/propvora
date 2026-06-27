"use client"

import React from "react"
import { Search, X, LayoutGrid, List, Table2, ChevronDown, SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

export type ViewMode = "grid" | "list" | "table"
export type ActiveFilter = "all" | "tenants" | "landlords" | "applicants" | "past_tenants" | "other"
export type SortKey = "name" | "recent" | "status"

export const FILTER_TABS: { key: ActiveFilter; label: string }[] = [
  { key: "all",          label: "All People" },
  { key: "tenants",      label: "Tenants" },
  { key: "landlords",    label: "Landlords" },
  { key: "applicants",   label: "Applicants" },
  { key: "past_tenants", label: "Past Tenants" },
  { key: "other",        label: "Other" },
]

interface PeopleFilterBarProps {
  searchQuery: string
  onSearchChange: (v: string) => void
  activeFilter: ActiveFilter
  onFilterChange: (f: ActiveFilter) => void
  sortBy: SortKey
  onSortChange: (s: SortKey) => void
  viewMode: ViewMode
  onViewModeChange: (v: ViewMode) => void
}

export function PeopleFilterBar({
  searchQuery, onSearchChange,
  activeFilter, onFilterChange,
  sortBy, onSortChange,
  viewMode, onViewModeChange,
}: PeopleFilterBarProps) {
  return (
    <div className="hidden md:flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
      {/* Search */}
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          aria-label="Search people"
          placeholder="Search people…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-9 pl-8 pr-8 rounded-lg text-sm bg-white border border-slate-200 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Type filter pills */}
      <div className="flex items-center gap-1.5 flex-wrap flex-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onFilterChange(tab.key)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
              activeFilter === tab.key
                ? "bg-[var(--brand)] text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Sort */}
        <div className="relative">
          <select
            aria-label="Sort people"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortKey)}
            className="h-9 pl-3 pr-7 rounded-lg border border-slate-200 text-xs text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] cursor-pointer appearance-none"
          >
            <option value="name">Sort: Name</option>
            <option value="recent">Sort: Recent</option>
            <option value="status">Sort: Status</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
        </div>

        {/* Filters button */}
        <button className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-600 hover:bg-slate-50 transition-colors">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters
        </button>

        {/* View switcher */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 border border-slate-200">
          {([
            { mode: "grid" as ViewMode,  Icon: LayoutGrid },
            { mode: "list" as ViewMode,  Icon: List },
            { mode: "table" as ViewMode, Icon: Table2 },
          ] as const).map(({ mode, Icon }) => (
            <button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              aria-label={`${mode.charAt(0).toUpperCase() + mode.slice(1)} view`}
              aria-pressed={viewMode === mode}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === mode ? "bg-white text-[var(--brand)] shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
