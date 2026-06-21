"use client"

export const dynamic = 'force-dynamic'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { CalendarTabNav } from '@/components/calendar'
import CalendarViewsSwitcher from '@/components/calendar/CalendarViewsSwitcher'
import { MobileTopBar } from '@/components/mobile'
import { Plus, Bell, CalendarRange, AlertTriangle, Clock, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWorkspace } from '@/providers/AuthProvider'
import { useSectionLink } from "@/components/sections/SectionBasePath"
import {
  useCalendarItems,
  bucketItems,
  startOfDay,
  isSameDay,
  fmtTime,
  SOURCE_META,
  type CalendarItem,
} from '../../_lib/useCalendarItems'

const GRID_START = 7
const GRID_END = 20
const TOTAL_HOURS = GRID_END - GRID_START
const PX_PER_HR = 56
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function pad2(n: number) { return String(n).padStart(2, '0') }

/** Monday of the week containing `d`. */
function weekStart(d: Date): Date {
  const x = startOfDay(d)
  const dow = (x.getDay() + 6) % 7
  x.setDate(x.getDate() - dow)
  return x
}

function EventBlock({ item }: { item: CalendarItem }) {
  const meta = SOURCE_META[item.source]
  const d = new Date(item.start)
  const startMins = d.getHours() * 60 + d.getMinutes()
  const endD = item.end ? new Date(item.end) : new Date(d.getTime() + 60 * 60000)
  const endMins = endD.getHours() * 60 + endD.getMinutes()
  const top = ((startMins - GRID_START * 60) / 60) * PX_PER_HR
  const height = Math.max(((endMins - startMins) / 60) * PX_PER_HR, 22)
  return (
    <Link
      href={item.href}
      className={cn("absolute left-1 right-1 rounded-md border-l-[3px] px-1.5 py-1 hover:opacity-90 transition-opacity overflow-hidden", meta.border, meta.chip)}
      style={{ top: `${top}px`, height: `${height}px` }}
      title={`${item.title} · ${item.sourceLabel}`}
    >
      <p className="text-[11px] font-semibold leading-tight truncate">{item.title}</p>
      <p className="text-[10px] opacity-70 mt-0.5">{fmtTime(item.start)}</p>
    </Link>
  )
}

export default function CalendarWeekPage() {
  const sectionLink = useSectionLink()
  const { workspace } = useWorkspace()
  const { items, isLoading } = useCalendarItems(workspace?.id)
  const [cursor, setCursor] = useState(() => weekStart(new Date()))

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => { const d = new Date(cursor); d.setDate(d.getDate() + i); return d }), [cursor])
  const today = new Date()
  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => GRID_START + i)
  const gridH = TOTAL_HOURS * PX_PER_HR

  const weekItems = useMemo(() => {
    const end = new Date(cursor); end.setDate(end.getDate() + 7)
    return items.filter((i) => { const t = new Date(i.start).getTime(); return t >= cursor.getTime() && t < end.getTime() })
  }, [items, cursor])

  const timedByDay = useMemo(() => days.map((day) =>
    weekItems.filter((i) => !i.allDay && isSameDay(new Date(i.start), day))
  ), [days, weekItems])

  const allDayByDay = useMemo(() => days.map((day) =>
    weekItems.filter((i) => i.allDay && isSameDay(new Date(i.start), day))
  ), [days, weekItems])

  const allDayTotal = allDayByDay.reduce((s, a) => s + a.length, 0)
  const overdue = useMemo(() => bucketItems(items).overdue.slice(0, 5), [items])
  const todayItems = weekItems.filter((i) => isSameDay(new Date(i.start), today)).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

  const rangeLabel = `${cursor.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${days[6].toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`

  function prevWeek() { const d = new Date(cursor); d.setDate(d.getDate() - 7); setCursor(d) }
  function nextWeek() { const d = new Date(cursor); d.setDate(d.getDate() + 7); setCursor(d) }
  function thisWeek() { setCursor(weekStart(new Date())) }

  const weekAgenda = useMemo(() =>
    [...weekItems].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  , [weekItems])

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <MobileTopBar
        title="Week"
        subtitle={rangeLabel}
        primaryAction={{ label: "New event", icon: Plus, href: sectionLink("/property-manager/calendar/events/new") }}
        overflowActions={[
          { label: "Previous week", icon: ChevronRight, onClick: prevWeek },
          { label: "This week", icon: CalendarRange, onClick: thisWeek },
          { label: "Next week", icon: ChevronRight, onClick: nextWeek },
        ]}
      />
      <div className="md:hidden">
        <CalendarTabNav />
      </div>
      <div className="md:hidden px-4 py-3 bg-white border-b border-slate-100">
        <CalendarViewsSwitcher />
      </div>

      {/* Mobile agenda list — replaces the time grid below md */}
      <div className="md:hidden p-4 space-y-2.5 bg-slate-50">
        {weekAgenda.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-[13px] text-slate-400">No items this week.</div>
        ) : (
          weekAgenda.map((it) => {
            const d = new Date(it.start)
            return (
              <Link key={it.key} href={it.href} className="flex items-center gap-3 bg-white rounded-2xl border border-[#E8EEF8] shadow-sm p-3.5 active:scale-[0.99] transition-transform">
                <div className="w-12 shrink-0 text-center">
                  <p className="text-[11px] text-slate-400 uppercase">{d.toLocaleDateString("en-GB", { weekday: "short" })}</p>
                  <p className="text-[15px] font-bold text-[#071B4D] leading-none">{d.getDate()}</p>
                </div>
                <span className={cn("w-1.5 h-9 rounded-full shrink-0", SOURCE_META[it.source].dot)} />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#071B4D] truncate">{it.title}</p>
                  <p className="text-[12px] text-slate-500 truncate">{it.allDay ? "All day" : fmtTime(it.start)} · {it.sourceLabel}</p>
                </div>
              </Link>
            )
          })
        )}
      </div>

      <div className="hidden md:block">
        <CalendarTabNav />
      </div>

      <div className="hidden md:flex px-6 py-3 bg-white border-b border-slate-200 items-center gap-3 flex-wrap">
        <span className="text-[13px] font-medium text-slate-500 mr-1">View:</span>
        <CalendarViewsSwitcher />
        <div className="ml-auto flex items-center gap-2">
          <button onClick={prevWeek} className="text-[12px] px-3 py-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors">‹ Prev</button>
          <button onClick={thisWeek} className="text-[12px] px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium">This week</button>
          <button onClick={nextWeek} className="text-[12px] px-3 py-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors">Next ›</button>
          <Link href={sectionLink("/property-manager/calendar/events/new")} className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 font-medium">
            <Plus className="w-3.5 h-3.5" />
            New Event
          </Link>
        </div>
      </div>

      <div className="hidden md:block px-6 py-2.5 bg-white border-b border-slate-100">
        <h2 className="text-[14px] font-semibold text-slate-800">{rangeLabel}</h2>
        <p className="text-[12px] text-slate-400 mt-0.5">{weekItems.length} items this week</p>
      </div>

      <div className="hidden md:flex flex-1 overflow-hidden flex-col lg:flex-row">
        {/* Time grid */}
        <div className="flex-1 overflow-auto bg-white lg:border-r border-slate-200">
          <div className="min-w-[680px]">
            {/* Day header */}
            <div className="flex border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
              <div className="w-14 shrink-0" />
              {days.map((day, i) => {
                const isToday = isSameDay(day, today)
                return (
                  <div key={i} className="flex-1 py-2.5 flex flex-col items-center gap-0.5 border-l border-slate-200">
                    <span className={cn("text-[10px] font-semibold uppercase tracking-widest", isToday ? "text-blue-600" : "text-slate-400")}>{DAY_LABELS[i]}</span>
                    <span className={cn("text-[13px] font-bold w-7 h-7 flex items-center justify-center rounded-full", isToday ? "bg-blue-600 text-white" : "text-slate-700")}>{day.getDate()}</span>
                  </div>
                )
              })}
            </div>

            {/* All-day strip */}
            <div className="flex border-b border-slate-100 bg-blue-50/20 min-h-[40px]">
              <div className="w-14 shrink-0 flex items-center justify-center border-r border-slate-100">
                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider text-center leading-tight">All<br />day</span>
              </div>
              {allDayByDay.map((dayItems, i) => (
                <div key={i} className="flex-1 border-l border-slate-100 p-1 flex flex-col gap-0.5">
                  {dayItems.slice(0, 3).map((it) => (
                    <Link key={it.key} href={it.href} className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium truncate hover:opacity-80", SOURCE_META[it.source].chip)} title={`${it.title} · ${it.sourceLabel}`}>
                      {it.title}
                    </Link>
                  ))}
                  {dayItems.length > 3 && <span className="text-[9px] text-slate-400 px-1">+{dayItems.length - 3}</span>}
                </div>
              ))}
            </div>

            {/* Hour grid */}
            <div className="flex" style={{ height: `${gridH}px` }}>
              <div className="w-14 shrink-0 relative border-r border-slate-100">
                {hours.map((h) => (
                  <div key={h} className="absolute left-0 right-0 flex items-start justify-end pr-2" style={{ top: `${(h - GRID_START) * PX_PER_HR}px`, height: `${PX_PER_HR}px` }}>
                    <span className="text-[10px] text-slate-400 -mt-[7px]">{pad2(h)}:00</span>
                  </div>
                ))}
              </div>
              {days.map((day, dayIdx) => {
                const isToday = isSameDay(day, today)
                return (
                  <div key={dayIdx} className={cn("flex-1 relative border-l border-slate-100", isToday && "bg-blue-50/25")} style={{ height: `${gridH}px` }}>
                    {hours.map((h) => (
                      <div key={h} className="absolute left-0 right-0 border-t border-slate-100" style={{ top: `${(h - GRID_START) * PX_PER_HR}px` }} />
                    ))}
                    {timedByDay[dayIdx].map((it) => <EventBlock key={it.key} item={it} />)}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="w-full lg:w-72 shrink-0 overflow-y-auto bg-slate-50 p-4 flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h3 className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-3">This Week</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Items', value: weekItems.length, cls: 'text-slate-800' },
                { label: 'All-day', value: allDayTotal, cls: 'text-blue-600' },
                { label: 'Overdue', value: overdue.length, cls: 'text-red-600' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className={cn("text-2xl font-bold", s.cls)}>{s.value}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-[12px] font-semibold text-slate-700">Needs Action</h3>
              {overdue.length > 0 && <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-600 text-white">{overdue.length}</span>}
            </div>
            {overdue.length === 0 ? (
              <p className="text-[12px] text-slate-400 text-center py-2">All clear</p>
            ) : (
              <div className="flex flex-col gap-2">
                {overdue.map((item) => (
                  <Link key={item.key} href={item.href} className="rounded-lg bg-amber-50 border border-amber-100 p-3 hover:bg-amber-100/60 transition-colors block">
                    <p className="text-[11px] font-medium text-slate-700 leading-snug truncate">{item.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{item.sourceLabel} · {new Date(item.start).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h3 className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-3">Quick Links</h3>
            <div className="flex flex-col gap-2">
              <Link href={sectionLink("/property-manager/calendar/events/new")} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-blue-600 text-white text-[12px] font-semibold hover:bg-blue-700 transition-colors">
                <Plus className="w-3.5 h-3.5" />New Event
              </Link>
              <Link href={sectionLink("/property-manager/calendar/reminders/new")} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-700 text-[12px] font-medium hover:bg-slate-50 transition-colors">
                <Bell className="w-3.5 h-3.5 text-slate-500" />New Reminder
              </Link>
              <Link href={sectionLink("/property-manager/calendar/views/month")} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-700 text-[12px] font-medium hover:bg-slate-50 transition-colors">
                <CalendarRange className="w-3.5 h-3.5 text-slate-500" />View Month
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-blue-500" />
              <h3 className="text-[12px] font-semibold text-slate-700">Today</h3>
            </div>
            {todayItems.length === 0 ? (
              <p className="text-[12px] text-slate-400">Nothing today</p>
            ) : (
              <div className="flex flex-col gap-2">
                {todayItems.slice(0, 6).map((it) => (
                  <Link key={it.key} href={it.href} className="flex items-start gap-2 group">
                    <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", SOURCE_META[it.source].dot)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-slate-700 leading-tight truncate group-hover:text-blue-700">{it.title}</p>
                      <p className="text-[10px] text-slate-400">{it.allDay ? "All day" : fmtTime(it.start)}</p>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-300 mt-1 shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isLoading && <div className="px-6 py-2 text-center text-[12px] text-slate-400">Loading week…</div>}
    </div>
  )
}
