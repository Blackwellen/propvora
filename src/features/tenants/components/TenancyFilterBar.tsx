"use client"

import React from "react"
import { Search, SlidersHorizontal, X, AlertTriangle, Calendar, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

export const ALL_PROFILES = [
  { key: "HMO",                    label: "HMO",                    shortLabel: "HMO",        color: "#1d4ed8" },
  { key: "Long-Term Let",          label: "Long-Term Let",          shortLabel: "LTL",        color: "#059669" },
  { key: "Serviced Accommodation", label: "Serviced Accommodation", shortLabel: "SA",         color: "#7C3AED" },
  { key: "Rent-to-Rent",           label: "Rent-to-Rent",           shortLabel: "R2R",        color: "#EA580C" },
  { key: "Student Let",            label: "Student Let",            shortLabel: "Student",    color: "#0891B2" },
  { key: "Co-Living",              label: "Co-Living",              shortLabel: "Co-Living",  color: "#DB2777" },
  { key: "Holiday Let",            label: "Holiday Let",            shortLabel: "Holiday",    color: "#D97706" },
  { key: "Social Housing",         label: "Social Housing",         shortLabel: "Social",     color: "#16A34A" },
  { key: "Supported Living",       label: "Supported Living",       shortLabel: "Supported",  color: "#0369A1" },
  { key: "Commercial",             label: "Commercial",             shortLabel: "Commercial", color: "#374151" },
  { key: "Mixed Use",              label: "Mixed Use",              shortLabel: "Mixed",      color: "#6B21A8" },
  { key: "Development",            label: "Development",            shortLabel: "Dev",        color: "#B45309" },
  { key: "Buy-to-Sell",            label: "Buy-to-Sell",            shortLabel: "BTS",        color: "#BE123C" },
]

interface PropertyOption {
  id: string
  name: string
}

interface TenancyFilterBarProps {
  search: string
  onSearchChange: (v: string) => void
  filterStatus: string
  onFilterStatusChange: (v: string) => void
  filterArrears: boolean
  onFilterArrearsChange: (v: boolean) => void
  filterEndingSoon: boolean
  onFilterEndingSoonChange: (v: boolean) => void
  filterProp: string
  onFilterPropChange: (v: string) => void
  filterProfile: string
  onFilterProfileChange: (v: string) => void
  filterMinRent: string
  onFilterMinRentChange: (v: string) => void
  filterMaxRent: string
  onFilterMaxRentChange: (v: string) => void
  filterCity: string
  onFilterCityChange: (v: string) => void
  showAdv: boolean
  onShowAdvChange: (v: boolean) => void
  arrearsCount: number
  activeFilters: number
  filtered: number
  total: number
  propertyOptions: PropertyOption[]
  onClearAll: () => void
  onPage: (p: number) => void
}

function Chip({ active, onClick, children, color }: { active: boolean; onClick: () => void; children: React.ReactNode; color?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all whitespace-nowrap",
        active ? "text-white border-transparent shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 shadow-sm"
      )}
      style={active ? { background: color ?? "#2563EB", borderColor: color ?? "#2563EB" } : undefined}
    >
      {children}
    </button>
  )
}

function FLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-500 mb-1">{children}</p>
}

export function TenancyFilterBar({
  search, onSearchChange,
  filterStatus, onFilterStatusChange,
  filterArrears, onFilterArrearsChange,
  filterEndingSoon, onFilterEndingSoonChange,
  filterProp, onFilterPropChange,
  filterProfile, onFilterProfileChange,
  filterMinRent, onFilterMinRentChange,
  filterMaxRent, onFilterMaxRentChange,
  filterCity, onFilterCityChange,
  showAdv, onShowAdvChange,
  arrearsCount, activeFilters,
  filtered, total,
  propertyOptions,
  onClearAll, onPage,
}: TenancyFilterBarProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-5">
      {/* Row 1: search + toggle */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search tenant, property, unit..."
            value={search}
            onChange={(e) => { onSearchChange(e.target.value); onPage(1) }}
            className="w-full h-9 pl-9 pr-4 rounded-xl text-[12.5px] bg-slate-50 border border-slate-200 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] transition-all"
          />
        </div>
        <button
          onClick={() => onShowAdvChange(!showAdv)}
          className={cn(
            "flex items-center gap-1.5 h-9 px-3 rounded-xl border text-[12px] font-semibold transition-all shadow-sm whitespace-nowrap",
            showAdv || activeFilters > 0
              ? "bg-[var(--brand-soft)] border-[var(--color-brand-100)] text-[var(--brand)]"
              : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
          )}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />Filters
          {activeFilters > 0 && (
            <span className="ml-0.5 w-4 h-4 rounded-full bg-[var(--brand)] text-white text-[10px] font-bold flex items-center justify-center">{activeFilters}</span>
          )}
        </button>
      </div>

      {/* Status + quick filters */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {["all", "draft", "active", "ended", "terminated", "uncollectable"].map((s) => (
          <Chip key={s} active={filterStatus === s} onClick={() => { onFilterStatusChange(s); onPage(1) }}>
            {s === "all" ? "All statuses" : s.charAt(0).toUpperCase() + s.slice(1)}
          </Chip>
        ))}
        <div className="h-4 w-px bg-slate-200 mx-0.5" />
        <Chip active={filterEndingSoon} onClick={() => { onFilterEndingSoonChange(!filterEndingSoon); onPage(1) }} color="#EA580C">
          <Calendar className="w-3 h-3 inline mr-1" />Ending soon
        </Chip>
        {arrearsCount > 0 && (
          <Chip active={filterArrears} onClick={() => { onFilterArrearsChange(!filterArrears); onPage(1) }} color="#EF4444">
            <AlertTriangle className="w-3 h-3 inline mr-1" />Arrears ({arrearsCount})
          </Chip>
        )}
      </div>

      {/* Advanced filters */}
      {showAdv && (
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
          {/* Operation profile */}
          <div>
            <FLabel>Operation profile</FLabel>
            <div className="flex flex-wrap gap-1.5">
              <Chip active={filterProfile === "all"} onClick={() => onFilterProfileChange("all")}>All profiles</Chip>
              {ALL_PROFILES.map((p) => (
                <Chip key={p.key} active={filterProfile === p.key}
                  onClick={() => onFilterProfileChange(filterProfile === p.key ? "all" : p.key)}
                  color={p.color}>
                  {p.shortLabel}
                </Chip>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <FLabel>Property</FLabel>
              <select
                value={filterProp}
                onChange={(e) => { onFilterPropChange(e.target.value); onPage(1) }}
                className="w-full h-8 rounded-lg border border-slate-200 text-[12px] text-slate-700 bg-white px-2 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] shadow-sm"
              >
                <option value="all">All properties</option>
                {propertyOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <FLabel>Location / city</FLabel>
              <div className="relative">
                <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                <input
                  value={filterCity}
                  onChange={(e) => { onFilterCityChange(e.target.value); onPage(1) }}
                  placeholder="e.g. London"
                  className="w-full h-8 pl-7 pr-2 rounded-lg border border-slate-200 text-[12px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] shadow-sm"
                />
              </div>
            </div>
            <div>
              <FLabel>Min rent / mo</FLabel>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-slate-500 font-medium">£</span>
                <input
                  type="number"
                  value={filterMinRent}
                  onChange={(e) => { onFilterMinRentChange(e.target.value); onPage(1) }}
                  placeholder="0"
                  className="w-full h-8 pl-6 pr-2 rounded-lg border border-slate-200 text-[12px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] shadow-sm"
                />
              </div>
            </div>
            <div>
              <FLabel>Max rent / mo</FLabel>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-slate-500 font-medium">£</span>
                <input
                  type="number"
                  value={filterMaxRent}
                  onChange={(e) => { onFilterMaxRentChange(e.target.value); onPage(1) }}
                  placeholder="Any"
                  className="w-full h-8 pl-6 pr-2 rounded-lg border border-slate-200 text-[12px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] shadow-sm"
                />
              </div>
            </div>
          </div>

          {activeFilters > 0 && (
            <div className="flex items-center justify-between pt-1">
              <p className="text-[12px] text-slate-500">{filtered} of {total} tenancies</p>
              <button
                onClick={onClearAll}
                className="flex items-center gap-1 text-[12px] text-slate-500 hover:text-slate-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
