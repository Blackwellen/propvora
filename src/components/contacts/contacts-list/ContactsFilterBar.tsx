"use client"

import React from "react"
import { LayoutDashboard, LayoutGrid, List, Table2, Wrench, Search, X, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ViewMode, TypeFilter } from "./types"
import { TYPE_CHIPS } from "./types"

interface Props {
  activeView: ViewMode
  setActiveView: (v: ViewMode) => void
  activeType: TypeFilter
  setActiveType: (t: TypeFilter) => void
  serviceCategory: string
  setServiceCategory: (s: string) => void
  serviceCategoryOptions: string[]
  search: string
  setSearch: (s: string) => void
}

export function ContactsFilterBar({
  activeView, setActiveView, activeType, setActiveType,
  serviceCategory, setServiceCategory, serviceCategoryOptions,
  search, setSearch,
}: Props) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* View switcher */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200">
        {([
          { key: "overview" as ViewMode, label: "Overview", icon: LayoutDashboard },
          { key: "grid"     as ViewMode, label: "Grid",     icon: LayoutGrid },
          { key: "list"     as ViewMode, label: "List",     icon: List },
          { key: "table"    as ViewMode, label: "Table",    icon: Table2 },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveView(key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              activeView === key ? "bg-[var(--brand)] text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="w-px h-6 bg-slate-200 hidden sm:block" />

      {/* Type filter chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {TYPE_CHIPS.map(chip => (
          <button
            key={chip.key}
            onClick={() => setActiveType(chip.key)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              activeType === chip.key ? "bg-[var(--brand)] text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Service category filter */}
      {serviceCategoryOptions.length > 0 && (
        <div className="relative">
          <Wrench className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <select
            aria-label="Filter by service category"
            value={serviceCategory}
            onChange={e => setServiceCategory(e.target.value)}
            className={cn(
              "h-8 pl-8 pr-7 rounded-lg text-xs bg-white border text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] transition-all cursor-pointer appearance-none",
              serviceCategory !== "all" ? "border-[var(--brand)]" : "border-slate-200"
            )}
          >
            <option value="all">All services</option>
            {serviceCategoryOptions.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>
      )}

      {/* Search */}
      <div className="ml-auto relative min-w-[200px] max-w-xs w-full sm:w-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          aria-label="Search contacts"
          placeholder="Search contacts…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-8 pl-8 pr-8 rounded-lg text-xs bg-white border border-slate-200 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
