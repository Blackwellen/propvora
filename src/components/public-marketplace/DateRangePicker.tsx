'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'

interface DateRangePickerProps {
  checkIn: string | null
  checkOut: string | null
  onChange: (checkIn: string | null, checkOut: string | null) => void
  blockedDates?: string[]
  minDate?: Date
}

function formatDisplay(iso: string | null): string {
  if (!iso) return 'Add date'
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

export default function DateRangePicker({
  checkIn,
  checkOut,
  onChange,
  blockedDates = [],
  minDate,
}: DateRangePickerProps) {
  const today = minDate ?? new Date()
  today.setHours(0, 0, 0, 0)

  const [open, setOpen] = useState(false)
  const [selecting, setSelecting] = useState<'in' | 'out'>('in')
  const [viewDate, setViewDate] = useState<Date>(
    checkIn ? new Date(checkIn + 'T00:00:00') : new Date(today.getFullYear(), today.getMonth(), 1)
  )
  const [hovered, setHovered] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const blockedSet = new Set(blockedDates)

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1)
  // Monday-based week offset
  const dayOfWeek = (firstDay.getDay() + 6) % 7
  const totalDays = daysInMonth(year, month)

  const cells: (Date | null)[] = []
  for (let i = 0; i < dayOfWeek; i++) cells.push(null)
  for (let d = 1; d <= totalDays; d++) cells.push(new Date(year, month, d))

  function isBlocked(d: Date) {
    return blockedSet.has(toIso(d))
  }

  function isPast(d: Date) {
    return d < today
  }

  function isDisabled(d: Date) {
    if (isPast(d)) return true
    if (isBlocked(d)) return true
    // If selecting checkout: must be after checkin
    if (selecting === 'out' && checkIn) {
      const ci = new Date(checkIn + 'T00:00:00')
      if (d <= ci) return true
    }
    return false
  }

  function isInRange(d: Date) {
    const ci = checkIn ? new Date(checkIn + 'T00:00:00') : null
    const co = checkOut ? new Date(checkOut + 'T00:00:00') : null
    const hov = hovered ? new Date(hovered + 'T00:00:00') : null
    const end = co ?? (selecting === 'out' ? hov : null)
    if (!ci || !end) return false
    return d > ci && d < end
  }

  function isStart(d: Date) {
    return checkIn ? toIso(d) === checkIn : false
  }

  function isEnd(d: Date) {
    return checkOut ? toIso(d) === checkOut : false
  }

  function handleDayClick(d: Date) {
    if (isDisabled(d)) return
    const iso = toIso(d)

    if (selecting === 'in') {
      onChange(iso, null)
      setSelecting('out')
    } else {
      // selecting out
      if (checkIn && iso > checkIn) {
        onChange(checkIn, iso)
        setSelecting('in')
        setOpen(false)
      } else {
        // clicked before or on checkin — restart
        onChange(iso, null)
        setSelecting('out')
      }
    }
  }

  function prevMonth() {
    setViewDate(new Date(year, month - 1, 1))
  }

  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1))
  }

  const monthLabel = viewDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  function clearDates(e: React.MouseEvent) {
    e.stopPropagation()
    onChange(null, null)
    setSelecting('in')
  }

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <div
        className="overflow-hidden rounded-[10px] border border-slate-200 cursor-pointer select-none"
        onClick={() => {
          setOpen(v => !v)
          if (!open) setSelecting(checkIn ? 'out' : 'in')
        }}
      >
        <div className="grid grid-cols-2 divide-x divide-slate-200">
          <div
            className={`flex gap-2.5 p-3.5 transition-colors ${selecting === 'in' && open ? 'bg-blue-50 border-b-2 border-b-blue-500' : 'hover:bg-slate-50'}`}
            onClick={e => {
              e.stopPropagation()
              setSelecting('in')
              setOpen(true)
            }}
          >
            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
            <div>
              <div className="text-[11px] font-[800] uppercase tracking-wide text-slate-600">Check in</div>
              <div className={`mt-0.5 text-[13px] font-[500] ${checkIn ? 'text-slate-900' : 'text-slate-400'}`}>
                {formatDisplay(checkIn)}
              </div>
            </div>
          </div>
          <div
            className={`flex gap-2.5 p-3.5 transition-colors ${selecting === 'out' && open ? 'bg-blue-50 border-b-2 border-b-blue-500' : 'hover:bg-slate-50'}`}
            onClick={e => {
              e.stopPropagation()
              if (checkIn) { setSelecting('out'); setOpen(true) }
            }}
          >
            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-[800] uppercase tracking-wide text-slate-600">Check out</div>
              <div className={`mt-0.5 text-[13px] font-[500] ${checkOut ? 'text-slate-900' : 'text-slate-400'}`}>
                {formatDisplay(checkOut)}
              </div>
            </div>
          </div>
        </div>
        {(checkIn || checkOut) && (
          <div className="flex justify-end border-t border-slate-100 px-3 py-1.5">
            <button
              type="button"
              onClick={clearDates}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-700"
            >
              <X className="h-3 w-3" /> Clear dates
            </button>
          </div>
        )}
      </div>

      {/* Calendar dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-[12px] border border-slate-200 bg-white p-4 shadow-xl">
          <div className="mb-1 text-center text-[11px] font-[600] text-blue-600">
            {selecting === 'in' ? 'Select check-in date' : 'Select check-out date'}
          </div>

          {/* Month nav */}
          <div className="mb-3 flex items-center justify-between">
            <button type="button" onClick={prevMonth} className="rounded-full p-1.5 hover:bg-slate-100">
              <ChevronLeft className="h-4 w-4 text-slate-600" />
            </button>
            <span className="text-[14px] font-[700] text-slate-900">{monthLabel}</span>
            <button type="button" onClick={nextMonth} className="rounded-full p-1.5 hover:bg-slate-100">
              <ChevronRight className="h-4 w-4 text-slate-600" />
            </button>
          </div>

          {/* Day headers */}
          <div className="mb-1 grid grid-cols-7 gap-0">
            {DAYS.map(d => (
              <div key={d} className="py-1 text-center text-[11px] font-[700] text-slate-400">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-0">
            {cells.map((day, idx) => {
              if (!day) return <div key={`blank-${idx}`} />
              const iso = toIso(day)
              const disabled = isDisabled(day)
              const start = isStart(day)
              const end = isEnd(day)
              const inRange = isInRange(day)
              const hovEnd = hovered && selecting === 'out' && checkIn && iso === hovered && iso > checkIn

              return (
                <button
                  key={iso}
                  type="button"
                  disabled={disabled}
                  onMouseEnter={() => !disabled && setHovered(iso)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => handleDayClick(day)}
                  className={[
                    'relative h-9 w-full text-[13px] font-[500] transition-colors focus:outline-none',
                    disabled ? 'cursor-not-allowed text-slate-300' : 'cursor-pointer',
                    (start || end) ? 'rounded-full bg-blue-600 text-white font-[700] z-10' :
                    (inRange || hovEnd) ? 'bg-blue-50 text-blue-700' :
                    (!disabled ? 'hover:rounded-full hover:bg-slate-100 text-slate-800' : ''),
                  ].join(' ')}
                >
                  {day.getDate()}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
