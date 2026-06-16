"use client"

import React from "react"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

/* ──────────────────────────────────────────────────────────────────────────
   Multi-view primitives shared by the supplier list pages (jobs / leads /
   invoices): a segmented ViewSwitcher and a generic, dependency-free Kanban
   board. Light tokens only; no drag library (status changes happen on the
   detail page / via row actions, matching the operator pattern).
─────────────────────────────────────────────────────────────────────────── */

export interface ViewOption<T extends string> {
  key: T
  label: string
  icon: LucideIcon
}

export function SupplierViewSwitcher<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: ViewOption<T>[]
  value: T
  onChange: (v: T) => void
  className?: string
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 p-1 rounded-xl bg-slate-100 border border-slate-200",
        className
      )}
      role="tablist"
      aria-label="View"
    >
      {options.map(({ key, label, icon: Icon }) => {
        const active = key === value
        return (
          <button
            key={key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(key)}
            title={label}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40",
              active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        )
      })}
    </div>
  )
}

/* ── Generic Kanban board ──────────────────────────────────────────────────── */

export interface KanbanColumn {
  key: string
  label: string
  accent: string // tailwind text/bg accent token, e.g. "text-emerald-600"
  dot: string // tailwind bg dot, e.g. "bg-emerald-500"
}

export function SupplierKanban<T>({
  columns,
  items,
  getColumn,
  renderCard,
  getKey,
}: {
  columns: KanbanColumn[]
  items: T[]
  getColumn: (item: T) => string
  renderCard: (item: T) => React.ReactNode
  getKey: (item: T) => string
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
      {columns.map((col) => {
        const colItems = items.filter((i) => getColumn(i) === col.key)
        return (
          <div key={col.key} className="w-[280px] shrink-0">
            <div className="flex items-center gap-2 px-1 mb-2.5">
              <span className={cn("w-2 h-2 rounded-full", col.dot)} />
              <h3 className="text-[13px] font-semibold text-slate-700">{col.label}</h3>
              <span className="ml-auto text-[11px] font-bold text-slate-400">{colItems.length}</span>
            </div>
            <div className="space-y-2.5 rounded-xl bg-slate-50/70 border border-slate-100 p-2 min-h-[120px]">
              {colItems.length === 0 ? (
                <p className="text-[12px] text-slate-400 text-center py-6">Nothing here</p>
              ) : (
                colItems.map((item) => (
                  <div key={getKey(item)} className="bg-white border border-slate-200 rounded-xl shadow-sm p-3">
                    {renderCard(item)}
                  </div>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Lightweight month calendar (job locations / scheduled dates) ───────────── */

export interface CalendarEntry {
  /** ISO date (YYYY-MM-DD) the entry falls on. */
  date: string
  label: string
  tone?: string // tailwind bg token for the dot
  href?: string
}

export function SupplierMiniCalendar({
  entries,
  month,
  onMonthChange,
  onEntryClick,
}: {
  entries: CalendarEntry[]
  month: Date
  onMonthChange: (d: Date) => void
  onEntryClick?: (e: CalendarEntry) => void
}) {
  const year = month.getFullYear()
  const m = month.getMonth()
  const first = new Date(year, m, 1)
  const startDay = (first.getDay() + 6) % 7 // Monday=0
  const daysInMonth = new Date(year, m + 1, 0).getDate()
  const byDate = new Map<string, CalendarEntry[]>()
  for (const e of entries) {
    const arr = byDate.get(e.date) ?? []
    arr.push(e)
    byDate.set(e.date, arr)
  }
  const todayIso = new Date().toISOString().slice(0, 10)

  const cells: (number | null)[] = []
  for (let i = 0; i < startDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => onMonthChange(new Date(year, m - 1, 1))}
          className="h-8 px-2.5 rounded-lg text-sm font-semibold text-slate-500 hover:bg-slate-100"
        >
          ←
        </button>
        <p className="text-sm font-semibold text-slate-800">
          {first.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
        </p>
        <button
          onClick={() => onMonthChange(new Date(year, m + 1, 1))}
          className="h-8 px-2.5 rounded-lg text-sm font-semibold text-slate-500 hover:bg-slate-100"
        >
          →
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d == null) return <div key={i} />
          const iso = `${year}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
          const dayEntries = byDate.get(iso) ?? []
          const isToday = iso === todayIso
          return (
            <div
              key={i}
              className={cn(
                "min-h-[64px] rounded-lg border p-1.5 text-left",
                isToday ? "border-[#2563EB] bg-blue-50/40" : "border-slate-100 bg-white"
              )}
            >
              <span className={cn("text-[11px] font-semibold", isToday ? "text-[#2563EB]" : "text-slate-500")}>{d}</span>
              <div className="mt-1 space-y-1">
                {dayEntries.slice(0, 2).map((e, j) => (
                  <button
                    key={j}
                    onClick={() => onEntryClick?.(e)}
                    className="block w-full truncate text-left text-[10px] font-medium text-slate-700 rounded px-1 py-0.5 bg-slate-50 hover:bg-slate-100"
                  >
                    <span className={cn("inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle", e.tone ?? "bg-[#2563EB]")} />
                    {e.label}
                  </button>
                ))}
                {dayEntries.length > 2 && (
                  <span className="text-[10px] text-slate-400 px-1">+{dayEntries.length - 2} more</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
