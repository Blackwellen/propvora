'use client'

/**
 * DateRangePicker — pure JS date-range calendar (no external lib).
 *
 * Props:
 *   blockedDates  ISO date strings that cannot be selected (booked / unavailable)
 *   checkIn       currently selected check-in (ISO) or null
 *   checkOut      currently selected check-out (ISO) or null
 *   onSelect      called with (checkIn, checkOut) when both dates are chosen
 *   onClose       called when user clicks outside / presses Escape
 *   minNights     minimum required nights gap (default 1)
 *   singleDate    if true: only pick one date (for services), calls onSelect(date, date)
 */

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface DateRangePickerProps {
  blockedDates: string[]
  checkIn: string | null
  checkOut: string | null
  onSelect: (checkIn: string, checkOut: string) => void
  onClose: () => void
  minNights?: number
  singleDate?: boolean
}

// ── helpers ────────────────────────────────────────────────────────────────────

function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function fromISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function firstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay() // 0=Sun
}

function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const d = new Date(year, month + delta, 1)
  return { year: d.getFullYear(), month: d.getMonth() }
}

function isBefore(a: string, b: string): boolean {
  return a < b
}

function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

// ── component ──────────────────────────────────────────────────────────────────

export default function DateRangePicker({
  blockedDates,
  checkIn,
  checkOut,
  onSelect,
  onClose,
  minNights = 1,
  singleDate = false,
}: DateRangePickerProps) {
  const blockedSet = new Set(blockedDates)

  const today = toISO(new Date())
  const todayDate = new Date()

  // which two months are visible
  const [leftYear, setLeftYear] = useState(() => todayDate.getFullYear())
  const [leftMonth, setLeftMonth] = useState(() => todayDate.getMonth())

  // selection state: first click = picking start, second = picking end
  const [picking, setPicking] = useState<'start' | 'end'>('start')
  const [hovered, setHovered] = useState<string | null>(null)
  const [draft, setDraft] = useState<{ start: string | null; end: string | null }>({
    start: checkIn,
    end: checkOut,
  })

  const right = addMonths(leftYear, leftMonth, 1)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  function isBlocked(iso: string): boolean {
    return blockedSet.has(iso) || iso < today
  }

  function isRangeBlocked(start: string, end: string): boolean {
    // check if any blocked date falls in the open range (start, end)
    const s = fromISO(start)
    const e = fromISO(end)
    for (const b of blockedDates) {
      const bd = fromISO(b)
      if (bd > s && bd < e) return true
    }
    return false
  }

  function handleDayClick(iso: string) {
    if (isBlocked(iso)) return

    if (singleDate) {
      setDraft({ start: iso, end: iso })
      onSelect(iso, iso)
      return
    }

    if (picking === 'start') {
      setDraft({ start: iso, end: null })
      setPicking('end')
    } else {
      // end picking
      if (!draft.start) return
      if (iso <= draft.start) {
        // clicked before start → restart
        setDraft({ start: iso, end: null })
        setPicking('end')
        return
      }
      // check minNights
      const diff = (fromISO(iso).getTime() - fromISO(draft.start).getTime()) / 86400000
      if (diff < minNights) {
        // auto-advance end by minNights
        const adjustedDate = new Date(fromISO(draft.start))
        adjustedDate.setDate(adjustedDate.getDate() + minNights)
        const adjusted = toISO(adjustedDate)
        if (isBlocked(adjusted) || isRangeBlocked(draft.start, adjusted)) {
          setDraft({ start: iso, end: null })
          setPicking('end')
          return
        }
        setDraft({ start: draft.start, end: adjusted })
        onSelect(draft.start, adjusted)
        setPicking('start')
        return
      }
      if (isRangeBlocked(draft.start, iso)) {
        // can't select range through blocked dates — restart
        setDraft({ start: iso, end: null })
        setPicking('end')
        return
      }
      setDraft({ start: draft.start, end: iso })
      onSelect(draft.start, iso)
      setPicking('start')
    }
  }

  function isInRange(iso: string): boolean {
    const start = draft.start
    const end = draft.end ?? hovered
    if (!start || !end) return false
    const a = start < end ? start : end
    const b = start < end ? end : start
    return iso > a && iso < b
  }

  function isStart(iso: string): boolean {
    return draft.start === iso
  }

  function isEnd(iso: string): boolean {
    return draft.end === iso || (draft.end == null && hovered === iso && draft.start != null && hovered > draft.start)
  }

  function prevMonth() {
    const prev = addMonths(leftYear, leftMonth, -1)
    if (prev.year < todayDate.getFullYear() || (prev.year === todayDate.getFullYear() && prev.month < todayDate.getMonth())) return
    setLeftYear(prev.year)
    setLeftMonth(prev.month)
  }

  function nextMonth() {
    const next = addMonths(leftYear, leftMonth, 1)
    setLeftYear(next.year)
    setLeftMonth(next.month)
  }

  const canGoPrev =
    leftYear > todayDate.getFullYear() ||
    (leftYear === todayDate.getFullYear() && leftMonth > todayDate.getMonth())

  return (
    <div
      ref={containerRef}
      className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-[16px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.16)] sm:w-auto"
      role="dialog"
      aria-label="Date picker"
    >
      {/* Month navigation header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <button
          onClick={prevMonth}
          disabled={!canGoPrev}
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex gap-8 sm:gap-16">
          <span className="text-[14px] font-[700] text-slate-900">{monthLabel(leftYear, leftMonth)}</span>
          <span className="hidden text-[14px] font-[700] text-slate-900 sm:block">
            {monthLabel(right.year, right.month)}
          </span>
        </div>

        <button
          onClick={nextMonth}
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Calendar grids */}
      <div className="flex flex-col gap-0 p-4 sm:flex-row sm:gap-6">
        <MonthGrid
          year={leftYear}
          month={leftMonth}
          isBlocked={isBlocked}
          isStart={isStart}
          isEnd={isEnd}
          isInRange={isInRange}
          onDayClick={handleDayClick}
          onDayHover={setHovered}
          draft={draft}
        />
        {/* Second month — hidden on mobile */}
        <div className="hidden sm:block">
          <MonthGrid
            year={right.year}
            month={right.month}
            isBlocked={isBlocked}
            isStart={isStart}
            isEnd={isEnd}
            isInRange={isInRange}
            onDayClick={handleDayClick}
            onDayHover={setHovered}
            draft={draft}
          />
        </div>
      </div>

      {/* Footer hint */}
      <div className="border-t border-slate-100 px-5 py-3 text-center text-[12px] text-slate-500">
        {singleDate
          ? 'Select a date'
          : draft.start && !draft.end
          ? 'Now select your check-out date'
          : !draft.start
          ? 'Select check-in date'
          : minNights > 1
          ? `Minimum stay: ${minNights} nights`
          : 'Dates selected'}
      </div>
    </div>
  )
}

// ── MonthGrid ─────────────────────────────────────────────────────────────────

interface MonthGridProps {
  year: number
  month: number
  isBlocked: (iso: string) => boolean
  isStart: (iso: string) => boolean
  isEnd: (iso: string) => boolean
  isInRange: (iso: string) => boolean
  onDayClick: (iso: string) => void
  onDayHover: (iso: string | null) => void
  draft: { start: string | null; end: string | null }
}

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function MonthGrid({
  year, month,
  isBlocked, isStart, isEnd, isInRange,
  onDayClick, onDayHover,
}: MonthGridProps) {
  const totalDays = daysInMonth(year, month)
  const firstDay = firstDayOfMonth(year, month) // 0=Sun

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= totalDays; d++) cells.push(d)

  return (
    <div className="w-[248px]">
      {/* Day-of-week header */}
      <div className="mb-1 grid grid-cols-7">
        {DAY_LABELS.map(l => (
          <div key={l} className="py-1 text-center text-[11px] font-[600] text-slate-400">
            {l}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`e-${idx}`} />
          }
          const iso = toISO(new Date(year, month, day))
          const blocked = isBlocked(iso)
          const start = isStart(iso)
          const end = isEnd(iso)
          const inRange = isInRange(iso)

          let cellClass =
            'relative flex h-9 w-9 mx-auto items-center justify-center text-[13px] rounded-full transition-colors select-none '

          if (blocked) {
            cellClass += 'text-slate-300 cursor-not-allowed line-through'
          } else if (start || end) {
            cellClass += 'bg-blue-600 text-white font-[700] cursor-pointer'
          } else if (inRange) {
            cellClass += 'bg-blue-100 text-blue-900 cursor-pointer rounded-none'
          } else {
            cellClass += 'text-slate-800 hover:bg-slate-100 cursor-pointer font-[500]'
          }

          // Range background spanning (round ends on start/end cells)
          const rangeBar = inRange ? (
            <div className="absolute inset-y-0 inset-x-0 bg-blue-100" aria-hidden="true" />
          ) : null

          return (
            <div
              key={iso}
              className={
                inRange
                  ? 'relative flex items-center justify-center py-0.5 bg-blue-100 first:rounded-l-full last:rounded-r-full'
                  : 'relative flex items-center justify-center py-0.5'
              }
              onMouseEnter={() => !blocked && onDayHover(iso)}
              onMouseLeave={() => onDayHover(null)}
            >
              {rangeBar}
              <button
                type="button"
                onClick={() => onDayClick(iso)}
                disabled={blocked}
                className={cellClass}
                aria-label={`${iso}${blocked ? ' (unavailable)' : ''}`}
                aria-pressed={start || end}
              >
                {day}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
