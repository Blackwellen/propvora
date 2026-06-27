"use client"

import { useEffect, useRef, useState } from "react"
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  value: string          // ISO date string YYYY-MM-DD or ""
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  minDate?: string       // ISO date string, defaults to today
  /** If true, input is borderless/transparent (for embedding in a segmented bar) */
  bare?: boolean
  className?: string
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatDisplay(iso: string): string {
  if (!iso) return ""
  const [y, m, d] = iso.split("-").map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function firstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

export function DateInput({
  value,
  onChange,
  placeholder = "Add dates",
  label,
  minDate,
  bare = false,
  className,
}: Props) {
  const min = minDate ?? today()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Calendar view state
  const initDate = value ? new Date(value + "T00:00:00") : new Date()
  const [viewYear, setViewYear] = useState(initDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(initDate.getMonth())

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1) }
    else setViewMonth((m) => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1) }
    else setViewMonth((m) => m + 1)
  }

  function selectDay(day: number) {
    const iso = isoDate(viewYear, viewMonth, day)
    onChange(iso)
    setOpen(false)
  }

  function clearValue(e: React.MouseEvent) {
    e.stopPropagation()
    onChange("")
  }

  const totalDays = daysInMonth(viewYear, viewMonth)
  const firstDay = firstDayOfMonth(viewYear, viewMonth)
  // Cells: empty cells for offset + numbered cells
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ]
  // Pad to full rows of 7
  while (cells.length % 7 !== 0) cells.push(null)

  const displayText = value ? formatDisplay(value) : ""

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 w-full text-left",
          !bare && "h-10 rounded-xl border border-slate-200 bg-white px-3 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
        )}
        aria-label={label ?? placeholder}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
        <div className="min-w-0 flex-1">
          {label && (
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</div>
          )}
          <span className={cn(
            "block text-sm mt-0.5",
            displayText ? "text-slate-700" : "text-slate-400"
          )}>
            {displayText || placeholder}
          </span>
        </div>
        {value && (
          <button
            type="button"
            onClick={clearValue}
            className="shrink-0 text-slate-400 hover:text-slate-600"
            aria-label="Clear date"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </button>

      {/* Calendar popup */}
      {open && (
        <div
          role="dialog"
          aria-label="Date picker"
          className="absolute left-0 top-full z-50 mt-1.5 w-72 rounded-2xl border border-slate-200 bg-white shadow-xl p-4"
        >
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-[13.5px] font-semibold text-slate-800">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-[11px] font-semibold text-slate-400 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, i) => {
              if (day === null) {
                return <div key={`empty-${i}`} />
              }
              const iso = isoDate(viewYear, viewMonth, day)
              const isSelected = iso === value
              const isPast = iso < min
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => !isPast && selectDay(day)}
                  disabled={isPast}
                  aria-label={`${day} ${MONTHS[viewMonth]} ${viewYear}`}
                  aria-pressed={isSelected}
                  className={cn(
                    "flex h-8 w-full items-center justify-center rounded-lg text-[12.5px] font-medium transition-colors",
                    isSelected
                      ? "bg-[var(--brand)] text-white"
                      : isPast
                      ? "text-slate-300 cursor-not-allowed"
                      : "text-slate-700 hover:bg-slate-100 cursor-pointer"
                  )}
                >
                  {day}
                </button>
              )
            })}
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[12px] font-medium text-slate-500 hover:text-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
