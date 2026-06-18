"use client"

export const dynamic = 'force-dynamic'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { CalendarTabNav } from '@/components/calendar'
import CalendarViewsSwitcher from '@/components/calendar/CalendarViewsSwitcher'
import { MobileTopBar } from '@/components/mobile'
import { ChevronLeft, ChevronRight, ExternalLink, Plus, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWorkspace } from '@/providers/AuthProvider'
import { useSectionLink } from "@/components/sections/SectionBasePath"
import {
  useCalendarItems,
  startOfDay,
  isSameDay,
  fmtTime,
  SOURCE_META,
  type CalendarItem,
} from '../../_lib/useCalendarItems'

function statusChip(status: CalendarItem['status']): { label: string; cls: string } {
  const map: Record<CalendarItem['status'], { label: string; cls: string }> = {
    scheduled: { label: 'Scheduled', cls: 'bg-slate-100 text-slate-600' },
    confirmed: { label: 'Confirmed', cls: 'bg-green-100 text-green-700' },
    overdue: { label: 'Overdue', cls: 'bg-red-100 text-red-700' },
    due_today: { label: 'Due Today', cls: 'bg-amber-100 text-amber-700' },
    completed: { label: 'Done', cls: 'bg-green-50 text-green-600' },
    cancelled: { label: 'Cancelled', cls: 'bg-slate-100 text-slate-400' },
  }
  return map[status]
}

function EventCard({ item }: { item: CalendarItem }) {
  const meta = SOURCE_META[item.source]
  const st = statusChip(item.status)
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
      <div className="flex">
        <div className={cn("w-1 shrink-0", meta.dot)} />
        <div className="flex-1 px-4 py-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[12px] font-bold text-slate-500">{item.allDay ? "All day" : fmtTime(item.start)}</span>
                <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", st.cls)}>{st.label}</span>
              </div>
              <p className="text-[14px] font-semibold text-slate-900 leading-tight">{item.title}</p>
              {item.description && <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{item.description}</p>}
            </div>
            <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0", meta.chip)}>{item.sourceLabel}</span>
          </div>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <Link href={item.href} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-blue-600 text-white text-[12px] font-semibold hover:bg-blue-700 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
              {item.isNative ? "Open Event" : `Open in ${item.sourceLabel}`}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function SectionGroup({ title, events }: { title: string; events: CalendarItem[] }) {
  if (events.length === 0) return null
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 px-1">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>
      <div className="flex flex-col gap-2">
        {events.map((ev) => <EventCard key={ev.key} item={ev} />)}
      </div>
    </div>
  )
}

export default function CalendarDayPage() {
  const sectionLink = useSectionLink()
  const { workspace } = useWorkspace()
  const { items, isLoading } = useCalendarItems(workspace?.id)
  const [cursor, setCursor] = useState(() => startOfDay(new Date()))

  const dayItems = useMemo(() =>
    items.filter((i) => isSameDay(new Date(i.start), cursor)).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  , [items, cursor])

  const allDay = dayItems.filter((i) => i.allDay)
  const morning = dayItems.filter((i) => !i.allDay && new Date(i.start).getHours() < 12)
  const afternoon = dayItems.filter((i) => !i.allDay && new Date(i.start).getHours() >= 12)
  const done = dayItems.filter((i) => i.status === 'completed').length
  const overdueToday = dayItems.filter((i) => i.status === 'overdue').length

  const isToday = isSameDay(cursor, new Date())
  const dayLabel = cursor.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })

  // Source breakdown for this day
  const breakdown = useMemo(() => {
    const m = new Map<string, number>()
    for (const it of dayItems) m.set(it.source, (m.get(it.source) ?? 0) + 1)
    return Array.from(m.entries())
  }, [dayItems])

  function prevDay() { const d = new Date(cursor); d.setDate(d.getDate() - 1); setCursor(d) }
  function nextDay() { const d = new Date(cursor); d.setDate(d.getDate() + 1); setCursor(d) }
  function goToday() { setCursor(startOfDay(new Date())) }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <MobileTopBar
        title="Day"
        subtitle={dayLabel}
        primaryAction={{ label: "New event", icon: Plus, href: sectionLink("/app/calendar/events/new") }}
      />
      <div className="md:hidden">
        <CalendarTabNav />
      </div>
      <div className="md:hidden px-4 py-3 bg-white border-b border-slate-100">
        <CalendarViewsSwitcher />
      </div>

      <div className="hidden md:block">
        <CalendarTabNav />
      </div>

      <div className="hidden md:flex px-6 py-3 bg-white border-b border-slate-200 items-center gap-3 flex-wrap">
        <span className="text-[13px] font-medium text-slate-500 mr-1">View:</span>
        <CalendarViewsSwitcher />
        <div className="ml-auto flex items-center gap-2">
          <Link href={sectionLink("/app/calendar/events/new")} className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 font-semibold">
            <Plus className="w-3.5 h-3.5" />New Event
          </Link>
        </div>
      </div>

      <div className="px-6 py-3 bg-white border-b border-slate-100 flex items-center gap-3">
        <button onClick={prevDay} aria-label="Previous day" className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"><ChevronLeft className="w-4 h-4" /></button>
        <div className="flex-1 text-center">
          <h2 className="text-[15px] font-bold text-slate-900">{dayLabel}</h2>
          {isToday && <p className="text-[11px] text-blue-600 font-semibold">Today</p>}
        </div>
        <button onClick={nextDay} aria-label="Next day" className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"><ChevronRight className="w-4 h-4" /></button>
        <button onClick={goToday} className="text-[12px] px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium ml-2">Today</button>
      </div>

      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        {/* Left list */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {isLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-white border border-slate-200 rounded-xl animate-pulse" />)}</div>
          ) : dayItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-slate-200 rounded-xl text-center">
              <CalendarDays className="w-10 h-10 text-slate-200 mb-3" />
              <p className="text-sm font-medium text-slate-500">Nothing on this day</p>
              <p className="text-xs text-slate-400 mt-1">Use the arrows to browse other days.</p>
            </div>
          ) : (
            <>
              {allDay.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">All day</span>
                  <div className="flex flex-wrap gap-2">
                    {allDay.map((it) => (
                      <Link key={it.key} href={it.href} className={cn("text-[12px] px-3 py-1 rounded-full font-semibold hover:opacity-80", SOURCE_META[it.source].chip)}>
                        {it.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              <SectionGroup title="Morning" events={morning} />
              <SectionGroup title="Afternoon & Evening" events={afternoon} />
              <div className="flex items-center justify-between text-[12px] text-slate-400 px-1 mt-1">
                <span>{dayItems.length} item{dayItems.length !== 1 ? "s" : ""}</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />Live</span>
              </div>
            </>
          )}
        </div>

        {/* Right panel */}
        <div className="w-full lg:w-72 shrink-0 overflow-y-auto bg-slate-50 lg:border-l border-slate-200 p-4 flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h3 className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-3">Day Summary</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Items', value: dayItems.length, cls: 'text-slate-800' },
                { label: 'Done', value: done, cls: 'text-green-600' },
                { label: 'Overdue', value: overdueToday, cls: overdueToday > 0 ? 'text-red-600' : 'text-slate-400' },
              ].map((s) => (
                <div key={s.label} className="bg-slate-50 rounded-lg p-2.5 text-center">
                  <p className={cn("text-xl font-bold", s.cls)}>{s.value}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h3 className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-3">By Source</h3>
            {breakdown.length === 0 ? (
              <p className="text-[12px] text-slate-400">No items.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {breakdown.map(([source, count]) => (
                  <div key={source} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full", SOURCE_META[source as CalendarItem['source']].dot)} />
                      <span className="text-[12px] text-slate-600">{SOURCE_META[source as CalendarItem['source']].label}</span>
                    </div>
                    <span className="text-[12px] font-bold text-slate-800">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
