"use client"
import React from "react"
import { Search, RotateCcw, SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

interface FilterOption {
  label: string
  value: string
}

interface FilterConfig {
  key: string
  placeholder: string
  options: FilterOption[]
  value: string
  onChange: (v: string) => void
}

interface AccountingFilterBarProps {
  searchValue: string
  onSearchChange: (v: string) => void
  searchPlaceholder?: string
  filters?: FilterConfig[]
  onReset?: () => void
  rightActions?: React.ReactNode
  className?: string
}

export function AccountingFilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  onReset,
  rightActions,
  className,
}: AccountingFilterBarProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#E2E8F0] bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
        />
      </div>
      {filters.map((f) => (
        <div key={f.key} className="relative">
          <select
            value={f.value}
            onChange={(e) => f.onChange(e.target.value)}
            className="h-9 pl-3 pr-8 rounded-lg border border-[#E2E8F0] bg-white text-sm text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] cursor-pointer"
          >
            <option value="">{f.placeholder}</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <SlidersHorizontal className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>
      ))}
      {onReset && (
        <button
          onClick={onReset}
          className="h-9 px-3 rounded-lg border border-[#E2E8F0] bg-white text-sm text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      )}
      {rightActions && <div className="ml-auto flex items-center gap-2">{rightActions}</div>}
    </div>
  )
}
