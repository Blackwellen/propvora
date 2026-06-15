"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, CalendarRange } from "lucide-react"
import { cn } from "@/lib/utils"
import { useIsMobile, useHasMounted } from "@/components/mobile/useBreakpoint"
import { BookingStatusBadge, statusMeta, fmtMoney, fmtDate, BookingEmptyState } from "./primitives"
import type { BookingRow } from "./server"

/* ──────────────────────────────────────────────────────────────────────────
   BookingCalendar — calendar/timeline view of reservations.

   DESKTOP (lg+): a full month GRID. Each day cell shows reservation chips that
   span the stay; clicking a chip opens the reservation. A month grid is the
   right density for a pointer + wide canvas.

   MOBILE (<lg): a month grid does NOT translate to a phone. We render a
   dedicated AGENDA / LIST branch instead — reservations grouped by day for the
   selected month, each a thumb-friendly card. Same month navigation, different
   presentation. This is a purpose-built mobile branch, not a squeezed grid.
─────────────────────────────────────────────────────────────────────────── */

interface Props {
  bookings: BookingRow[]
  onOpen: (id: string) => void
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1)
}
function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}
function parseYmd(s: string | null): Date | null {
  if (!s) return null
  const d = new Date(`${s}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Does the booking's [checkIn, checkOut) interval cover this day? */
function coversDay(b: BookingRow, day: Date): boolean {
  const ci = parseYmd(b.checkIn)
  const co = parseYmd(b.checkOut)
  if (!ci) return false
  const end = co ?? ci
  const t = day.getTime()
  return t >= ci.getTime() && t < end.getTime() + (co ? 0 : 86_400_000)
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export function BookingCalendar({ bookings, onOpen }: Props) {
  const mounted = useHasMounted()
  const isMobile = useIsMobile()
  const [cursor, setCursor] = useState<Date>(() => startOfMonth(new Date()))

  const monthLabel = cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" })

  // Build the 6-week grid (Mon-first) for the cursor month.
  const cells = useMemo(() => {
    const first = startOfMonth(cursor)
    const firstWeekday = (first.getDay() + 6) % 7 // 0 = Monday
    const gridStart = new Date(first)
    gridStart.setDate(first.getDate() - firstWeekday)
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart)
      d.setDate(gridStart.getDate() + i)
      return d
    })
  }, [cursor])

  const monthBookings = useMemo(() => {
    const monthStart = startOfMonth(cursor).getTime()
    const monthEnd = addMonths(cursor, 1).getTime()
    return bookings.filter((b) => {
      const ci = parseYmd(b.checkIn)
      const co = parseYmd(b.checkOut) ?? ci
      if (!ci) return false
      return ci.getTime() < monthEnd && (co ?? ci)!.getTime() >= monthStart
    })
  }, [bookings, cursor])

  const Nav = (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setCursor((c) => addMonths(c, -1))}
        aria-label="Previous month"
        className="h-9 w-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        onClick={() => setCursor(startOfMonth(new Date()))}
        className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
      >
        Today
      </button>
      <button
        onClick={() => setCursor((c) => addMonths(c, 1))}
        aria-label="Next month"
        className="h-9 w-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )

  // ── Mobile agenda branch ──────────────────────────────────────────────────
  if (mounted && isMobile) {
    const byDay = new Map<string, BookingRow[]>()
    for (const b of monthBookings) {
      const ci = parseYmd(b.checkIn)
      if (!ci) continue
      const key = ymd(ci)
      const arr = byDay.get(key) ?? []
      arr.push(b)
      byDay.set(key, arr)
    }
    const days = Array.from(byDay.keys()).sort()

    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-bold text-[#071B4D]">{monthLabel}</h2>
          {Nav}
        </div>
        {days.length === 0 ? (
          <BookingEmptyState
            icon={CalendarRange}
            title="No arrivals this month"
            description="Reservations arriving this month will appear here as an agenda."
          />
        ) : (
          <div className="space-y-4">
            {days.map((day) => {
              const d = parseYmd(day)!
              return (
                <div key={day}>
                  <div className="flex items-center gap-2 mb-1.5 px-0.5">
                    <span className="text-[12px] font-bold text-slate-700">
                      {d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {(byDay.get(day)?.length ?? 0)} arrival{(byDay.get(day)?.length ?? 0) === 1 ? "" : "s"}
                    </span>
                  </div>
                  <ul className="space-y-2" role="list">
                    {(byDay.get(day) ?? []).map((b) => {
                      const c = statusMeta(b.status)
                      return (
                        <li key={b.id}>
                          <button
                            onClick={() => onOpen(b.id)}
                            className={cn(
                              "w-full text-left bg-white rounded-2xl border border-[#E8EEF8] shadow-sm p-3.5 active:scale-[0.99] transition-transform border-l-[3px]",
                              c.text
                            )}
                            style={{ borderLeftColor: "currentColor" }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-[14px] font-bold text-[#071B4D] truncate">{b.guestName}</p>
                                <p className="text-[12px] text-slate-500 truncate">{b.listingTitle}</p>
                              </div>
                              <BookingStatusBadge status={b.status} size="sm" />
                            </div>
                            <div className="mt-2 flex items-center justify-between text-[12px]">
                              <span className="text-slate-500">
                                {fmtDate(b.checkIn)} → {fmtDate(b.checkOut)} · {b.nights}n
                              </span>
                              <span className="font-semibold text-slate-700 tabular-nums">
                                {fmtMoney(b.totalPence, b.currency)}
                              </span>
                            </div>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ── Desktop month grid ─────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h2 className="text-[15px] font-semibold text-slate-900">{monthLabel}</h2>
        {Nav}
      </div>

      <div className="grid grid-cols-7 border-b border-slate-100">
        {WEEKDAYS.map((w) => (
          <div key={w} className="px-2 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wide text-center">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          const inMonth = day.getMonth() === cursor.getMonth()
          const isToday = ymd(day) === ymd(new Date())
          const dayBookings = monthBookings.filter((b) => coversDay(b, day)).slice(0, 3)
          const overflow = monthBookings.filter((b) => coversDay(b, day)).length - dayBookings.length
          return (
            <div
              key={i}
              className={cn(
                "min-h-[104px] border-b border-r border-slate-50 p-1.5 flex flex-col gap-1",
                !inMonth && "bg-slate-50/40",
                i % 7 === 6 && "border-r-0"
              )}
            >
              <div className="flex items-center justify-between px-0.5">
                <span
                  className={cn(
                    "text-[12px] font-semibold tabular-nums",
                    isToday
                      ? "inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#2563EB] text-white"
                      : inMonth
                        ? "text-slate-700"
                        : "text-slate-300"
                  )}
                >
                  {day.getDate()}
                </span>
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                {dayBookings.map((b) => {
                  const c = statusMeta(b.status)
                  const isStart = ymd(day) === b.checkIn
                  return (
                    <button
                      key={b.id}
                      onClick={() => onOpen(b.id)}
                      title={`${b.guestName} · ${b.listingTitle}`}
                      className={cn(
                        "h-[20px] rounded-md px-1.5 text-[10.5px] font-semibold truncate text-left transition-opacity hover:opacity-80",
                        c.bg,
                        c.text,
                        !isStart && "opacity-70"
                      )}
                    >
                      {isStart ? b.guestName : "···"}
                    </button>
                  )
                })}
                {overflow > 0 && (
                  <span className="text-[10px] text-slate-400 px-1">+{overflow} more</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default BookingCalendar
