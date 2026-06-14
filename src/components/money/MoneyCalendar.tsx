"use client"

import React, { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================================
// Reusable month-grid calendar for money records (income, expenses,
// bills…). Buckets entries by ISO date and shows a per-day count +
// total, with month navigation. Tone drives the accent colour so the
// same grid works for income (emerald) and expenses (rose).
// ============================================================

export interface MoneyCalendarEntry {
  id: string
  /** ISO date (YYYY-MM-DD or full ISO). */
  dateISO: string
  /** Numeric amount in major units (£). */
  amount: number
  label: string
}

const GBP = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 })
const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function MoneyCalendar({
  entries,
  tone = "emerald",
}: {
  entries: MoneyCalendarEntry[]
  tone?: "emerald" | "rose" | "blue"
}) {
  // Default the visible month to the most recent entry, else today.
  const initial = useMemo(() => {
    const dates = entries
      .map((e) => new Date(e.dateISO))
      .filter((d) => !Number.isNaN(d.getTime()))
      .sort((a, b) => b.getTime() - a.getTime())
    const seed = dates[0] ?? new Date()
    return new Date(seed.getFullYear(), seed.getMonth(), 1)
  }, [entries])

  const [month, setMonth] = useState(initial)

  // Bucket entries by ISO day.
  const byDay = useMemo(() => {
    const map = new Map<string, { count: number; total: number; items: MoneyCalendarEntry[] }>()
    for (const e of entries) {
      const d = new Date(e.dateISO)
      if (Number.isNaN(d.getTime())) continue
      const key = ymd(d)
      const cur = map.get(key) ?? { count: 0, total: 0, items: [] }
      cur.count++
      cur.total += e.amount
      cur.items.push(e)
      map.set(key, cur)
    }
    return map
  }, [entries])

  // Build the 6-week grid (Mon-first).
  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1)
    const startOffset = (first.getDay() + 6) % 7 // 0=Mon
    const start = new Date(first)
    start.setDate(first.getDate() - startOffset)
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }, [month])

  const toneAccent = {
    emerald: "text-emerald-700 bg-emerald-50 border-emerald-100",
    rose: "text-rose-700 bg-rose-50 border-rose-100",
    blue: "text-blue-700 bg-blue-50 border-blue-100",
  }[tone]

  const monthTotal = useMemo(() => {
    let t = 0
    for (const [key, v] of byDay) {
      const d = new Date(key)
      if (d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear()) t += v.total
    }
    return t
  }, [byDay, month])

  const todayKey = ymd(new Date())

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-900">
            {month.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
          </h3>
          <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full border", toneAccent)}>
            {GBP.format(monthTotal)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMonth(new Date())}
            className="h-7 px-2.5 rounded-lg border border-slate-200 text-[11.5px] font-medium text-slate-600 hover:bg-slate-50"
          >
            Today
          </button>
          <button
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Day-of-week header */}
      <div className="grid grid-cols-7 mb-1">
        {DOW.map((d) => (
          <div key={d} className="text-[10.5px] font-semibold text-slate-400 text-center py-1">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          const inMonth = d.getMonth() === month.getMonth()
          const key = ymd(d)
          const day = byDay.get(key)
          const isToday = key === todayKey
          return (
            <div
              key={i}
              className={cn(
                "min-h-[64px] rounded-lg border p-1.5 flex flex-col",
                inMonth ? "border-slate-100 bg-white" : "border-transparent bg-slate-50/50",
                isToday && "ring-1 ring-[#2563EB]/40"
              )}
            >
              <span className={cn("text-[11px] font-medium", inMonth ? "text-slate-500" : "text-slate-300")}>
                {d.getDate()}
              </span>
              {day && inMonth && (
                <div className={cn("mt-auto rounded-md border px-1.5 py-1", toneAccent)}>
                  <p className="text-[11px] font-bold leading-tight">{GBP.format(day.total)}</p>
                  <p className="text-[9.5px] opacity-80 leading-tight">
                    {day.count} record{day.count > 1 ? "s" : ""}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
