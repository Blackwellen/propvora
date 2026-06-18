"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Plus,
  AlertTriangle,
} from "lucide-react"
import { DashboardContainer, PageHeader } from "@/components/layout/PageContainer"
import { CalendarTabNav } from "@/components/calendar/CalendarTabNav"
import CalendarViewsSwitcher from "@/components/calendar/CalendarViewsSwitcher"
import { MobileTopBar } from "@/components/mobile"
import { cn } from "@/lib/utils"
import { useWorkspace } from "@/providers/AuthProvider"
import { useSectionLink } from "@/components/sections/SectionBasePath"
import {
  useCalendarItems,
  bucketItems,
  startOfDay,
  isSameDay,
  SOURCE_META,
  type CalendarItem,
  type CalendarSource,
} from "../../_lib/useCalendarItems"

const WEEK_DAYS_HEADER = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]

const ALL_SOURCES: CalendarSource[] = ["work", "compliance", "portfolio", "money", "planning", "contacts", "calendar"]

/** Build a Mon-first 6-week grid for the given month. */
function buildMonthGrid(year: number, month0: number): Array<Date | null> {
  const first = new Date(year, month0, 1)
  // JS: 0=Sun..6=Sat → convert to Mon-first index
  const firstDow = (first.getDay() + 6) % 7
  const daysInMonth = new Date(year, month0 + 1, 0).getDate()
  const cells: Array<Date | null> = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month0, d))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export default function CalendarMonthPage() {
  const sectionLink = useSectionLink()
  const { workspace } = useWorkspace()
  const { items, isLoading } = useCalendarItems(workspace?.id)

  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [visible, setVisible] = useState<Record<CalendarSource, boolean>>(() =>
    ALL_SOURCES.reduce((acc, s) => ({ ...acc, [s]: true }), {} as Record<CalendarSource, boolean>)
  )

  const year = cursor.getFullYear()
  const month0 = cursor.getMonth()
  const monthLabel = cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" })

  const filtered = useMemo(() => items.filter((i) => visible[i.source]), [items, visible])

  const grid = useMemo(() => buildMonthGrid(year, month0), [year, month0])

  const itemsByDay = useMemo(() => {
    const map = new Map<string, CalendarItem[]>()
    for (const it of filtered) {
      const d = startOfDay(new Date(it.start))
      if (d.getFullYear() !== year || d.getMonth() !== month0) continue
      const k = String(d.getDate())
      const arr = map.get(k) ?? []
      arr.push(it)
      map.set(k, arr)
    }
    return map
  }, [filtered, year, month0])

  const monthSummary = useMemo(() =>
    ALL_SOURCES
      .map((s) => ({ source: s, count: items.filter((i) => {
        const d = new Date(i.start)
        return d.getFullYear() === year && d.getMonth() === month0 && i.source === s
      }).length }))
      .filter((r) => r.count > 0)
  , [items, year, month0])

  const overdue = useMemo(() => bucketItems(items).overdue
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 6), [items])

  const today = new Date()

  // Chronological agenda for the mobile list view (this month only).
  const monthAgenda = useMemo(() => {
    return filtered
      .filter((i) => {
        const d = new Date(i.start)
        return d.getFullYear() === year && d.getMonth() === month0
      })
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  }, [filtered, year, month0])

  function toggle(s: CalendarSource) { setVisible((p) => ({ ...p, [s]: !p[s] })) }
  function prevMonth() { setCursor(new Date(year, month0 - 1, 1)) }
  function nextMonth() { setCursor(new Date(year, month0 + 1, 1)) }
  function goToday() { setCursor(new Date(today.getFullYear(), today.getMonth(), 1)) }

  return (
    <DashboardContainer>
      <MobileTopBar
        title="Calendar"
        subtitle={monthLabel}
        primaryAction={{ label: "New event", icon: Plus, href: sectionLink("/app/calendar/events/new") }}
      />
      <div className="md:hidden -mx-4">
        <CalendarTabNav />
      </div>
      <div className="space-y-5 px-4 md:px-6 py-4 md:py-6">
        <div className="hidden md:block">
        <PageHeader
          title="Calendar"
          description="Full month view — events, jobs, tenancies, compliance and planning dates."
          actions={
            <Link
              href={sectionLink("/app/calendar/events/new")}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-[#2563EB] text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Event
            </Link>
          }
        />
        </div>

        {/* Mobile month nav */}
        <div className="md:hidden flex items-center gap-2">
          <button onClick={prevMonth} aria-label="Previous month" className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-[#E2EAF6] text-slate-600">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={goToday} className="flex-1 h-10 rounded-xl bg-white border border-[#E2EAF6] text-slate-700 text-[13px] font-semibold">Today</button>
          <button onClick={nextMonth} aria-label="Next month" className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-[#E2EAF6] text-slate-600">
            <ChevronRight className="w-5 h-5" />
          </button>
          <CalendarViewsSwitcher />
        </div>

        <div className="hidden md:flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            <button onClick={prevMonth} aria-label="Previous month" className="w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={goToday} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[13px] font-semibold hover:bg-slate-50 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40">
              <CalendarDays className="w-3.5 h-3.5" />
              Today
            </button>
            <button onClick={nextMonth} aria-label="Next month" className="w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <h2 className="text-[18px] font-bold text-slate-900 flex-1">{monthLabel}</h2>
          <CalendarViewsSwitcher />
        </div>

        <div className="hidden md:block">
          <CalendarTabNav />
        </div>

        {/* Mobile agenda list — replaces the grid below md */}
        <div className="md:hidden space-y-2.5">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 rounded-2xl bg-slate-100 animate-pulse" />)
          ) : monthAgenda.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-[13px] text-slate-400">
              No items this month.
            </div>
          ) : (
            monthAgenda.map((it) => {
              const d = new Date(it.start)
              return (
                <Link
                  key={it.key}
                  href={it.href}
                  className="flex items-center gap-3 bg-white rounded-2xl border border-[#E8EEF8] shadow-sm p-3.5 active:scale-[0.99] transition-transform"
                >
                  <div className="w-11 shrink-0 text-center">
                    <p className="text-[15px] font-bold text-[#071B4D] leading-none">{d.getDate()}</p>
                    <p className="text-[10px] text-slate-400 uppercase mt-0.5">{d.toLocaleDateString("en-GB", { month: "short" })}</p>
                  </div>
                  <span className={cn("w-1.5 h-9 rounded-full shrink-0", SOURCE_META[it.source].dot)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-[#071B4D] truncate">{it.title}</p>
                    <p className="text-[12px] text-slate-500 truncate">{it.sourceLabel}</p>
                  </div>
                </Link>
              )
            })
          )}
        </div>

        <div className="hidden md:grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-5 items-start">
          {/* Grid — horizontal scroll on small screens so cells keep a usable
              width instead of warping at 375px. */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
           <div className="overflow-x-auto">
            <div className="min-w-[640px]">
            <div className="grid grid-cols-7 border-b border-slate-100">
              {WEEK_DAYS_HEADER.map((day) => (
                <div key={day} className={cn("py-2.5 text-center text-[11px] font-bold uppercase tracking-wide", day === "SAT" || day === "SUN" ? "text-slate-400 bg-slate-50/60" : "text-slate-500")}>
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7" style={{ gridTemplateRows: `repeat(${grid.length / 7}, minmax(116px, 1fr))` }}>
              {grid.map((date, idx) => {
                const isNull = date === null
                const dayItems = !isNull ? (itemsByDay.get(String(date!.getDate())) ?? []) : []
                const isToday = !isNull && isSameDay(date!, today)
                const isWeekend = !isNull && (date!.getDay() === 0 || date!.getDay() === 6)
                return (
                  <div
                    key={idx}
                    className={cn(
                      "border-b border-r border-slate-100 p-1.5 min-h-[116px] relative",
                      isNull && "bg-slate-50/40",
                      isWeekend && !isNull && "bg-slate-50/40",
                      !isNull && !isWeekend && "bg-white hover:bg-blue-50/20 transition-colors duration-100",
                      (idx + 1) % 7 === 0 && "border-r-0"
                    )}
                  >
                    {!isNull && (
                      <>
                        <div className="flex items-center justify-end mb-1">
                          <span className={cn("w-6 h-6 flex items-center justify-center rounded-full text-[12px] font-semibold", isToday ? "bg-blue-600 text-white" : isWeekend ? "text-slate-400" : "text-slate-600")}>
                            {date!.getDate()}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          {dayItems.slice(0, 3).map((it) => (
                            <Link
                              key={it.key}
                              href={it.href}
                              className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium truncate hover:opacity-80 transition-opacity", SOURCE_META[it.source].chip)}
                              title={`${it.title} · ${it.sourceLabel}`}
                            >
                              {it.title}
                            </Link>
                          ))}
                          {dayItems.length > 3 && (
                            <Link href={sectionLink("/app/calendar/views/agenda")} className="text-[10px] text-blue-600 hover:text-blue-800 font-medium text-left px-1 mt-0.5">
                              + {dayItems.length - 3} more
                            </Link>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
            </div>
           </div>

            {isLoading && (
              <div className="px-4 py-2.5 text-center text-[12px] text-slate-400 border-t border-slate-100">Loading calendar…</div>
            )}
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4">
            {/* Layers */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3.5 border-b border-slate-100">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Calendar Layers</p>
              </div>
              <div className="divide-y divide-slate-50">
                {ALL_SOURCES.map((s) => (
                  <label key={s} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50/60 transition-colors">
                    <input type="checkbox" checked={visible[s]} onChange={() => toggle(s)} className="w-3.5 h-3.5 rounded accent-blue-600 cursor-pointer" />
                    <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", SOURCE_META[s].dot)} />
                    <span className="text-[13px] text-slate-700">{SOURCE_META[s].label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Month summary */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3.5 border-b border-slate-100">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{monthLabel} Summary</p>
              </div>
              {monthSummary.length === 0 ? (
                <div className="px-4 py-6 text-center"><p className="text-xs text-slate-400">No items this month</p></div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {monthSummary.map((row) => (
                    <div key={row.source} className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-[13px] text-slate-600">{SOURCE_META[row.source].label}</span>
                      <span className="text-[13px] font-bold text-blue-600">{row.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Attention queue */}
            <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-red-100 bg-red-50/30">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Attention Queue</p>
                <span className="text-[11px] font-semibold text-red-600">{overdue.length} overdue</span>
              </div>
              {overdue.length === 0 ? (
                <div className="px-4 py-6 text-center"><p className="text-xs text-slate-400">All caught up</p></div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {overdue.map((item) => (
                    <Link key={item.key} href={item.href} className="flex items-start gap-3 px-4 py-3 border-l-4 border-red-400 hover:bg-red-50/20 transition-colors">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-[12px] text-slate-700 leading-tight truncate">{item.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{item.sourceLabel} · {new Date(item.start).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardContainer>
  )
}
