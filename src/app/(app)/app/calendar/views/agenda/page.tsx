"use client"

export const dynamic = 'force-dynamic'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CalendarTabNav } from '@/components/calendar'
import CalendarViewsSwitcher from '@/components/calendar/CalendarViewsSwitcher'
import { ActionMenu } from '@/components/portfolio/ActionMenu'
import { Plus, Calendar, Eye, Copy, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWorkspace } from '@/providers/AuthProvider'
import {
  useCalendarItems,
  startOfDay,
  isSameDay,
  fmtTime,
  SOURCE_META,
  type CalendarItem,
  type CalendarSource,
} from '../../_lib/useCalendarItems'

const FILTER_SOURCES: CalendarSource[] = ['work', 'money', 'portfolio', 'compliance', 'planning', 'contacts', 'calendar']

function statusChip(status: CalendarItem['status']): { label: string; cls: string } {
  const map: Record<CalendarItem['status'], { label: string; cls: string }> = {
    scheduled: { label: 'Scheduled', cls: 'bg-slate-100 text-slate-600' },
    confirmed: { label: 'Confirmed', cls: 'bg-green-100 text-green-700' },
    overdue: { label: 'Overdue', cls: 'bg-red-100 text-red-700 font-bold' },
    due_today: { label: 'Due Today', cls: 'bg-amber-100 text-amber-700' },
    completed: { label: 'Done', cls: 'bg-green-50 text-green-600' },
    cancelled: { label: 'Cancelled', cls: 'bg-slate-100 text-slate-400' },
  }
  return map[status]
}

function EventRow({ item }: { item: CalendarItem }) {
  const router = useRouter()
  const meta = SOURCE_META[item.source]
  const st = statusChip(item.status)
  return (
    <Link
      href={item.href}
      className={cn("flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors group border-l-[3px]", meta.border)}
    >
      <div className={cn("w-2 h-2 rounded-full shrink-0", meta.dot)} />
      <span className="text-[12px] font-semibold text-slate-500 w-12 shrink-0">{item.allDay ? "All day" : fmtTime(item.start)}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-slate-900 leading-tight truncate">{item.title}</p>
      </div>
      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 hidden sm:inline", meta.chip)}>{item.sourceLabel}</span>
      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0", st.cls)}>{st.label}</span>
      <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.preventDefault()}>
        <ActionMenu
          items={[
            { label: 'Open Record', icon: Eye, onClick: () => router.push(item.href) },
            { label: 'Copy Title', icon: Copy, onClick: () => { void navigator.clipboard?.writeText(item.title) } },
          ]}
        />
      </div>
    </Link>
  )
}

export default function CalendarAgendaPage() {
  const { workspace } = useWorkspace()
  const { items, isLoading } = useCalendarItems(workspace?.id)
  const [active, setActive] = useState<Set<CalendarSource>>(new Set(FILTER_SOURCES))

  function toggle(key: CalendarSource) {
    setActive((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

  const now = new Date()

  // Group future-and-today items by day (agenda looks forward).
  const groups = useMemo(() => {
    const day0 = startOfDay(now)
    const visible = items.filter((i) => active.has(i.source) && startOfDay(new Date(i.start)).getTime() >= day0.getTime())
    const byDay = new Map<string, CalendarItem[]>()
    for (const it of visible) {
      const k = startOfDay(new Date(it.start)).toISOString()
      const arr = byDay.get(k) ?? []; arr.push(it); byDay.set(k, arr)
    }
    return Array.from(byDay.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([iso, evs]) => ({
        iso,
        date: new Date(iso),
        events: evs.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
      }))
  }, [items, active, now])

  const totalVisible = groups.reduce((sum, g) => sum + g.events.length, 0)
  const overdueCount = items.filter((i) => active.has(i.source) && i.status === 'overdue').length
  const thisWeekCount = useMemo(() => {
    const day0 = startOfDay(now); const weekEnd = new Date(day0); weekEnd.setDate(weekEnd.getDate() + 7)
    return items.filter((i) => active.has(i.source) && startOfDay(new Date(i.start)).getTime() >= day0.getTime() && startOfDay(new Date(i.start)).getTime() < weekEnd.getTime()).length
  }, [items, active, now])

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <CalendarTabNav />

      <div className="px-6 py-3 bg-white border-b border-slate-200 flex items-center gap-3 flex-wrap">
        <span className="text-[13px] font-medium text-slate-500 mr-1">View:</span>
        <CalendarViewsSwitcher />
        <div className="ml-auto flex items-center gap-2">
          <Link href="/app/calendar/events/new" className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 font-semibold">
            <Plus className="w-3.5 h-3.5" />
            New Event
          </Link>
        </div>
      </div>

      <div className="px-6 py-3 bg-white border-b border-slate-100 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-bold text-slate-900">Agenda</h2>
          <p className="text-[12px] text-slate-400 mt-0.5">Chronological list of upcoming dated records</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[13px] font-medium text-slate-700">
          <Calendar className="w-4 h-4 text-slate-400" />
          From today
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        {/* Left list */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {isLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 bg-white border border-slate-200 rounded-xl animate-pulse" />)}</div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-slate-200 rounded-xl text-center">
              <CalendarDays className="w-10 h-10 text-slate-200 mb-3" />
              <p className="text-sm font-medium text-slate-500">Nothing upcoming</p>
              <p className="text-xs text-slate-400 mt-1">{active.size === 0 ? "Select a source to show items." : "No dated records from today onward."}</p>
            </div>
          ) : (
            groups.map((group) => {
              const isToday = isSameDay(group.date, now)
              return (
                <div key={group.iso} className={cn("bg-white rounded-xl border overflow-hidden shadow-sm", isToday ? 'border-blue-300' : 'border-slate-200')}>
                  <div className={cn("flex items-center justify-between px-4 py-2.5 border-b", isToday ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100')}>
                    <div className="flex items-center gap-2">
                      {isToday && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                      <span className={cn("text-[13px] font-bold", isToday ? 'text-blue-800' : 'text-slate-800')}>
                        {group.date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
                      </span>
                      {isToday && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-600 text-white">TODAY</span>}
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                      {group.events.length} {group.events.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                  {group.events.map((ev) => <EventRow key={ev.key} item={ev} />)}
                </div>
              )
            })
          )}
          <div className="flex items-center px-1 text-[12px] text-slate-400 mt-1 pb-4">
            <span>Showing <strong className="text-slate-600">{totalVisible}</strong> items</span>
          </div>
        </div>

        {/* Right filters */}
        <div className="w-full lg:w-72 shrink-0 overflow-y-auto bg-slate-50 lg:border-l border-slate-200 p-4 flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h3 className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-3">Filter by Source</h3>
            <div className="flex flex-col gap-2">
              {FILTER_SOURCES.map((key) => {
                const meta = SOURCE_META[key]
                const count = items.filter((e) => e.source === key).length
                return (
                  <label key={key} className="flex items-center gap-2.5 cursor-pointer group">
                    <input type="checkbox" checked={active.has(key)} onChange={() => toggle(key)} className="rounded border-slate-300 accent-blue-600 w-3.5 h-3.5" />
                    <div className={cn("w-2 h-2 rounded-full shrink-0", meta.dot)} />
                    <span className="text-[12px] text-slate-700 group-hover:text-slate-900 flex-1">{meta.label}</span>
                    <span className="text-[10px] text-slate-400">{count}</span>
                  </label>
                )
              })}
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
              <button onClick={() => setActive(new Set(FILTER_SOURCES))} className="flex-1 text-[11px] py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">Select all</button>
              <button onClick={() => setActive(new Set())} className="flex-1 text-[11px] py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">Clear</button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h3 className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-3">Agenda Summary</h3>
            <div className="flex flex-col gap-2.5">
              {[
                { label: 'Items shown', value: totalVisible, cls: 'text-slate-800' },
                { label: 'Overdue', value: overdueCount, cls: 'text-red-600' },
                { label: 'This week', value: thisWeekCount, cls: 'text-blue-600' },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-[12px] text-slate-600">{s.label}</span>
                  <span className={cn("text-[14px] font-bold", s.cls)}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
