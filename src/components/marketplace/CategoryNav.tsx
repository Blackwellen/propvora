"use client"

import React from "react"
import { LayoutGrid } from "lucide-react"
import { cn } from "@/lib/utils"
import { CATEGORIES } from "./taxonomy"

/* ──────────────────────────────────────────────────────────────────────────
   CategoryNav — horizontal, scrollable category selector.

   "All" + each category as an icon pill. Single-select (empty value = all).
   Horizontal scroll on narrow widths; no arrows needed (native momentum).
─────────────────────────────────────────────────────────────────────────── */

interface CategoryNavProps {
  /** Selected category key, or "" for all. */
  value: string
  onChange: (key: string) => void
  /** Optional per-category counts keyed by category key. */
  counts?: Record<string, number>
  className?: string
}

export function CategoryNav({ value, onChange, counts, className }: CategoryNavProps) {
  const items = [
    { key: "", label: "All", icon: LayoutGrid, color: "text-slate-600", bg: "bg-slate-100" },
    ...CATEGORIES,
  ]

  return (
    <div className={cn("flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 py-0.5", className)}>
      {items.map((item) => {
        const Icon = item.icon
        const active = value === item.key
        const count = item.key ? counts?.[item.key] : undefined
        return (
          <button
            key={item.key || "all"}
            onClick={() => onChange(item.key)}
            aria-pressed={active}
            className={cn(
              "inline-flex items-center gap-1.5 shrink-0 h-9 px-3 rounded-xl text-[12.5px] font-semibold border transition-all whitespace-nowrap",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30",
              active
                ? "bg-[#2563EB] border-[#2563EB] text-white shadow-sm"
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            )}
          >
            <Icon className={cn("w-3.5 h-3.5", active ? "text-white" : item.color)} />
            {item.label}
            {count != null && count > 0 && (
              <span
                className={cn(
                  "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10.5px] font-bold",
                  active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                )}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default CategoryNav
