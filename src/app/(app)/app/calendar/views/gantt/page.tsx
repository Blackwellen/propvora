"use client"

export const dynamic = 'force-dynamic'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { CalendarTabNav } from '@/components/calendar'
import CalendarViewsSwitcher from '@/components/calendar/CalendarViewsSwitcher'
import { ChevronLeft, ChevronRight, CalendarDays, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWorkspace } from '@/providers/AuthProvider'
import {
  useCalendarItems,
  startOfDay,
  SOURCE_META,
  type CalendarItem,
  type CalendarSource,
} from '../../_lib/useCalendarItems'

const ORDER: CalendarSource[] = ['work', 'compliance', 'portfolio', 'money', 'planning', 'contacts', 'calendar']

const BAR_HEX: Record<CalendarSource, string> = {
  work: '#3B82F6', money: '#22C55E', portfolio: '#A855F7',
  compliance: '#F97316', planning: '#6366F1', contacts: '#EC4899', calendar: '#64748B',
}

export default function CalendarGanttPage() {
  const { workspace } = useWorkspace()
  const { items, isLoading } = useCalendarItems(workspace?.id)
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })

  const year = cursor.getFullYear()
  const month0 = cursor.getMonth()
  const daysInMonth = new Date(year, month0 + 1, 0).getDate()
  const monthLabel = cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" })
  const today = new Date()
  const todayDay = today.getFullYear() === year && today.getMonth() === month0 ? today.getDate() : -1

  // Items in this month, grouped by source.
  const rows = useMemo(() => {
    const monthItems = items.filter((i) => {
      const d = new Date(i.start)
      return d.getFullYear() === year && d.getMonth() === month0
    })
    return ORDER
      .map((source) => ({
        source,
        items: monthItems
          .filter((i) => i.source === source)
          .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
      }))
      .filter((r) => r.items.length > 0)
  }, [items, year, month0])

  const dateTicks = Array.from({ length: daysInMonth }, (_, i) => i + 1).filter((d) => d === 1 || d % 7 === 0 || d === daysInMonth)

  function prevMonth() { setCursor(new Date(year, month0 - 1, 1)) }
  function nextMonth() { setCursor(new Date(year, month0 + 1, 1)) }
  function goToday() { setCursor(new Date(today.getFullYear(), today.getMonth(), 1)) }

  /** percent offset across the month for a 1-based day. */
  function dayPct(day: number) { return ((day - 1) / daysInMonth) * 100 }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <CalendarTabNav />

      <div className="px-6 py-3 bg-white border-b border-slate-200 flex items-center gap-3 flex-wrap">
        <span className="text-[13px] font-medium text-slate-500 mr-1">View:</span>
        <CalendarViewsSwitcher />
        <div className="ml-auto flex items-center gap-2">
          <button onClick={prevMonth} className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-500"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={goToday} className="text-[12px] px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 font-medium">This month</button>
          <button onClick={nextMonth} className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-500"><ChevronRight className="w-4 h-4" /></button>
          <Link href="/app/calendar/events/new" className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 font-semibold">
            <Plus className="w-3.5 h-3.5" />New Event
          </Link>
        </div>
      </div>

      <div className="px-6 py-2.5 bg-white border-b border-slate-100">
        <h2 className="text-[14px] font-semibold text-slate-800">{monthLabel}</h2>
        <p className="text-[12px] text-slate-400 mt-0.5">Items by source across the month</p>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3, 4].map((i) => <div key={i} className="h-10 bg-white border border-slate-200 rounded-lg animate-pulse" />)}</div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-slate-200 rounded-xl text-center">
            <CalendarDays className="w-10 h-10 text-slate-200 mb-3" />
            <p className="text-sm font-medium text-slate-500">Nothing scheduled this month</p>
            <p className="text-xs text-slate-400 mt-1">Dated records appear as markers along the timeline.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {/* Date header */}
            <div className="flex border-b border-slate-200 bg-slate-50">
              <div className="w-32 shrink-0 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Source</div>
              <div className="flex-1 relative h-8">
                {dateTicks.map((d) => (
                  <span key={d} className="absolute top-1/2 -translate-y-1/2 text-[10px] text-slate-400" style={{ left: `${dayPct(d)}%` }}>{d}</span>
                ))}
                {todayDay > 0 && (
                  <span className="absolute top-0 bottom-0 w-px bg-blue-400" style={{ left: `${dayPct(todayDay)}%` }} />
                )}
              </div>
            </div>

            {/* Rows */}
            {rows.map((row) => (
              <div key={row.source} className="flex border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                <div className="w-32 shrink-0 px-3 py-3 flex items-center gap-2">
                  <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", SOURCE_META[row.source].dot)} />
                  <span className="text-[12px] font-medium text-slate-700 truncate">{SOURCE_META[row.source].label}</span>
                </div>
                <div className="flex-1 relative h-12">
                  {/* today line */}
                  {todayDay > 0 && <span className="absolute top-0 bottom-0 w-px bg-blue-200" style={{ left: `${dayPct(todayDay)}%` }} />}
                  {row.items.map((it) => {
                    const d = new Date(it.start)
                    const left = dayPct(d.getDate())
                    return (
                      <Link
                        key={it.key}
                        href={it.href}
                        className="absolute top-1/2 -translate-y-1/2 h-5 rounded px-1.5 flex items-center text-[10px] font-semibold text-white whitespace-nowrap hover:opacity-90 transition-opacity shadow-sm"
                        style={{ left: `calc(${left}% )`, backgroundColor: BAR_HEX[it.source], maxWidth: '160px' }}
                        title={`${it.title} · ${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
                      >
                        <span className="truncate">{it.title}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 flex-wrap mt-4">
          {ORDER.map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: BAR_HEX[s] }} />
              <span className="text-[11px] text-slate-500">{SOURCE_META[s].label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
