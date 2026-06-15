"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { todayIso, addDaysIso } from "./format"

interface DateRangeCalendarProps {
  checkIn: string | null
  checkOut: string | null
  /** Set of yyyy-mm-dd dates that cannot be selected. */
  blockedDates: Set<string>
  /** Earliest selectable date (yyyy-mm-dd). Defaults to today. */
  minDate?: string
  onChange: (range: { checkIn: string | null; checkOut: string | null }) => void
  /** Show two months side by side on wide layouts. */
  months?: 1 | 2
}

function startOfMonth(iso: string): string {
  return iso.slice(0, 7) + "-01"
}
function addMonths(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00.000Z`)
  d.setUTCMonth(d.getUTCMonth() + n)
  return d.toISOString().slice(0, 10)
}
function monthLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00.000Z`)
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d)
}

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]

/** Build the day grid for a given month (yyyy-mm-01). Monday-first. */
function buildGrid(monthStart: string): (string | null)[] {
  const d = new Date(`${monthStart}T00:00:00.000Z`)
  const year = d.getUTCFullYear()
  const month = d.getUTCMonth()
  const firstDow = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7 // Mon=0
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const cells: (string | null)[] = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(
      `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    )
  }
  return cells
}

/**
 * Accessible two-tap date-range picker. First tap sets check-in, second sets
 * check-out (must be after check-in and span no blocked night). Tapping again
 * restarts. Blocked dates and past dates are disabled. Mobile-friendly: every
 * day cell is a ≥40px tap target.
 */
export default function DateRangeCalendar({
  checkIn,
  checkOut,
  blockedDates,
  minDate,
  onChange,
  months = 1,
}: DateRangeCalendarProps) {
  const today = minDate ?? todayIso()
  const [cursor, setCursor] = useState<string>(
    startOfMonth(checkIn ?? today)
  )

  const visibleMonths = useMemo(
    () => Array.from({ length: months }, (_, i) => addMonths(cursor, i)),
    [cursor, months]
  )

  /** Does the half-open range [a, b) contain any blocked night? */
  function rangeHasBlocked(a: string, b: string): boolean {
    let cur = a
    while (cur < b) {
      if (blockedDates.has(cur)) return true
      cur = addDaysIso(cur, 1)
    }
    return false
  }

  function handlePick(iso: string) {
    if (iso < today || blockedDates.has(iso)) return

    // No range yet, or a complete range exists → start fresh with check-in.
    if (!checkIn || (checkIn && checkOut)) {
      onChange({ checkIn: iso, checkOut: null })
      return
    }
    // Have check-in, picking check-out.
    if (iso <= checkIn) {
      onChange({ checkIn: iso, checkOut: null })
      return
    }
    if (rangeHasBlocked(checkIn, iso)) {
      // The span crosses a blocked night — treat as a new check-in.
      onChange({ checkIn: iso, checkOut: null })
      return
    }
    onChange({ checkIn, checkOut: iso })
  }

  function isInRange(iso: string): boolean {
    if (!checkIn || !checkOut) return false
    return iso > checkIn && iso < checkOut
  }

  const canGoPrev = cursor > startOfMonth(today)

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => canGoPrev && setCursor(addMonths(cursor, -1))}
          disabled={!canGoPrev}
          aria-label="Previous month"
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
        >
          <ChevronLeft className="w-4.5 h-4.5" />
        </button>
        <div className="flex-1 flex justify-around">
          {visibleMonths.map((m) => (
            <span key={m} className="text-[14px] font-semibold text-[#0B1B3F]">
              {monthLabel(m)}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setCursor(addMonths(cursor, 1))}
          aria-label="Next month"
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
        >
          <ChevronRight className="w-4.5 h-4.5" />
        </button>
      </div>

      <div className={cn("grid gap-6", months === 2 && "sm:grid-cols-2")}>
        {visibleMonths.map((m) => {
          const cells = buildGrid(m)
          return (
            <div key={m}>
              <div className="grid grid-cols-7 mb-1.5">
                {WEEKDAYS.map((w) => (
                  <div
                    key={w}
                    className="text-center text-[11px] font-medium text-slate-400 py-1"
                  >
                    {w}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-1">
                {cells.map((iso, i) => {
                  if (!iso) return <div key={`e-${i}`} aria-hidden="true" />
                  const past = iso < today
                  const blocked = blockedDates.has(iso)
                  const disabled = past || blocked
                  const isStart = iso === checkIn
                  const isEnd = iso === checkOut
                  const inRange = isInRange(iso)
                  const selected = isStart || isEnd
                  const dayNum = Number(iso.slice(8, 10))
                  return (
                    <div key={iso} className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => handlePick(iso)}
                        disabled={disabled}
                        aria-pressed={selected}
                        aria-label={iso}
                        className={cn(
                          "relative w-10 h-10 sm:w-9 sm:h-9 rounded-full text-[13px] font-medium flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40",
                          disabled &&
                            "text-slate-300 line-through decoration-slate-300 cursor-not-allowed",
                          !disabled &&
                            !selected &&
                            !inRange &&
                            "text-[#0B1B3F] hover:bg-blue-50",
                          inRange && "bg-blue-50 text-[#1D4ED8] rounded-none",
                          selected &&
                            "bg-[#1D4ED8] text-white hover:bg-[#1D4ED8] shadow-sm"
                        )}
                      >
                        {dayNum}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
