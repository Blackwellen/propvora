"use client"

import React from "react"
import {
  Search,
  ChevronDown,
  Table2,
  LayoutGrid,
  CalendarDays,
  Filter,
} from "lucide-react"
import { cn } from "@/lib/utils"

type ViewMode = "table" | "cards" | "calendar"

interface IncomeFilterBarProps {
  searchQuery: string
  onSearchChange: (v: string) => void
  viewMode: ViewMode
  onViewModeChange: (v: ViewMode) => void
}

export function IncomeFilterBar({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
}: IncomeFilterBarProps) {
  return (
    <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            aria-label="Search income"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search income..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
          />
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
          <button
            onClick={() => onViewModeChange("table")}
            aria-label="Table view"
            aria-pressed={viewMode === "table"}
            className={cn(
              "w-8 h-8 rounded-md flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]",
              viewMode === "table" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Table2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange("cards")}
            aria-label="Card view"
            aria-pressed={viewMode === "cards"}
            className={cn(
              "w-8 h-8 rounded-md flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]",
              viewMode === "cards" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange("calendar")}
            aria-label="Calendar view"
            aria-pressed={viewMode === "calendar"}
            className={cn(
              "w-8 h-8 rounded-md flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]",
              viewMode === "calendar" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <CalendarDays className="w-4 h-4" />
          </button>
        </div>

        {/* Filters */}
        <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          Type: All <ChevronDown className="w-3 h-3" />
        </button>
        <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          Status: All <ChevronDown className="w-3 h-3" />
        </button>
        <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          Property: All <ChevronDown className="w-3 h-3" />
        </button>
        <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <CalendarDays className="w-3.5 h-3.5" />
          Jun 1 – Jun 30, 2026
        </button>
        <button
          aria-label="More filters"
          className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
        >
          <Filter className="w-4 h-4 text-slate-400" />
        </button>
      </div>
    </div>
  )
}
