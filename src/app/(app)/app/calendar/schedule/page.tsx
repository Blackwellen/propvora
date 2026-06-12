"use client"

export const dynamic = 'force-dynamic'

import { useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CalendarTabNav } from "@/components/calendar"
import { Plus, Eye, Copy, AlertTriangle, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { useWorkspace } from "@/providers/AuthProvider"
import {
  useCalendarItems,
  bucketItems,
  fmtDateTime,
  startOfDay,
  SOURCE_META,
  type CalendarItem,
} from "../_lib/useCalendarItems"

/* ─── Status chip ─────────────────────────────────────────────────────── */
function statusClasses(status: CalendarItem["status"]): string {
  const map: Record<CalendarItem["status"], string> = {
    scheduled: "text-slate-600 bg-slate-100",
    confirmed: "text-emerald-700 bg-emerald-50",
    due_today: "text-amber-700 bg-amber-50",
    overdue: "text-red-700 bg-red-50",
    completed: "text-green-700 bg-green-50",
    cancelled: "text-slate-400 bg-slate-100",
  }
  return map[status]
}

/* ─── Single row ──────────────────────────────────────────────────────── */
function ScheduleRow({ item }: { item: CalendarItem }) {
  const router = useRouter()
  const meta = SOURCE_META[item.source]
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 bg-white border border-slate-100 border-l-4 rounded-lg hover:border-slate-200 hover:shadow-sm transition-all",
        meta.border
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 whitespace-nowrap font-mono">
            {item.allDay ? new Date(item.start).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) : fmtDateTime(item.start)}
          </span>
          <span className="text-sm font-medium text-slate-800 truncate">{item.title}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <span className={cn("text-[11px] font-medium px-1.5 py-0.5 rounded", meta.chip)}>{item.sourceLabel}</span>
          <span className={cn("text-[11px] font-medium px-1.5 py-0.5 rounded capitalize", statusClasses(item.status))}>
            {item.status.replace("_", " ")}
          </span>
        </div>
      </div>
      <div className="shrink-0" onClick={(e) => e.preventDefault()}>
        <ActionMenu
          items={[
            { label: "Open Record", icon: Eye, onClick: () => router.push(item.href) },
            { label: "Copy Title", icon: Copy, onClick: () => { void navigator.clipboard?.writeText(item.title) } },
          ]}
        />
      </div>
    </Link>
  )
}

/* ─── Group accordion-less section ───────────────────────────────────── */
function ScheduleSection({
  title,
  items,
  accent,
  emptyHint,
}: {
  title: string
  items: CalendarItem[]
  accent: string
  emptyHint?: string
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className={cn("text-[11px] font-bold uppercase tracking-widest", accent)}>{title}</span>
        <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200 rounded-full px-2 py-0.5">
          {items.length}
        </span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-slate-400 px-1 py-2">{emptyHint ?? "Nothing here."}</p>
      ) : (
        <div className="space-y-1">
          {items.map((item) => (
            <ScheduleRow key={item.key} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Page ────────────────────────────────────────────────────────────── */
export default function SchedulePage() {
  const { workspace } = useWorkspace()
  const { items, isLoading } = useCalendarItems(workspace?.id)

  const { overdue, today, week, weekBars, stats } = useMemo(() => {
    const now = new Date()
    const b = bucketItems(items, now)
    const overdue = b.overdue.slice().sort((a, z) => new Date(a.start).getTime() - new Date(z.start).getTime())
    const today = b.today.slice().sort((a, z) => new Date(a.start).getTime() - new Date(z.start).getTime())
    // "this week" excluding today, next 7 days
    const week = b.thisWeek
      .filter((i) => startOfDay(new Date(i.start)).getTime() > startOfDay(now).getTime())
      .sort((a, z) => new Date(a.start).getTime() - new Date(z.start).getTime())

    // Events-by-day bar chart for the next 7 days
    const day0 = startOfDay(now)
    const bars = Array.from({ length: 7 }, (_, idx) => {
      const d = new Date(day0); d.setDate(d.getDate() + idx)
      const count = b.thisWeek.filter((i) => startOfDay(new Date(i.start)).getTime() === d.getTime()).length
      return { day: d.toLocaleDateString("en-GB", { weekday: "short" }), count }
    })

    return {
      overdue,
      today,
      week,
      weekBars: bars,
      stats: {
        total: b.thisWeek.length + overdue.length,
        overdue: overdue.length,
        today: today.length,
        upcoming: week.length,
      },
    }
  }, [items])

  const maxBar = Math.max(...weekBars.map((b) => b.count), 1)

  return (
    <div className="min-h-screen bg-slate-50">
      <CalendarTabNav />

      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Schedule</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Chronological view — overdue, today and the week ahead across every section
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/app/calendar/events/new"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Event
            </Link>
          </div>
        </div>
      </div>

      <div className="px-6 py-5">
        <div className="flex gap-5 items-start flex-col lg:flex-row">
          {/* Left — chronological list */}
          <div className="flex-1 min-w-0 w-full">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-14 bg-white border border-slate-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : stats.total === 0 && today.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-slate-200 rounded-xl text-center">
                <CalendarDays className="w-10 h-10 text-slate-200 mb-3" />
                <p className="text-sm font-medium text-slate-500">Nothing scheduled</p>
                <p className="text-xs text-slate-400 mt-1">Add a task due date, schedule a job, or create an event to populate the schedule.</p>
              </div>
            ) : (
              <>
                {overdue.length > 0 && (
                  <ScheduleSection title="Overdue" items={overdue} accent="text-red-600" />
                )}
                <ScheduleSection title="Today" items={today} accent="text-blue-600" emptyHint="Nothing due today." />
                <ScheduleSection title="This Week" items={week} accent="text-slate-500" emptyHint="Nothing else this week." />
              </>
            )}
          </div>

          {/* Right panel */}
          <div className="w-full lg:w-80 shrink-0 space-y-4">
            {/* Bar chart */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-800 mb-1">Schedule Overview</h3>
              <p className="text-xs text-slate-400 mb-3">Items by day, next 7 days</p>
              <div className="space-y-2">
                {weekBars.map((bar, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-7 shrink-0 font-medium">{bar.day}</span>
                    <div className="flex-1 h-4 bg-slate-100 rounded overflow-hidden">
                      {bar.count > 0 && (
                        <div
                          className="h-full bg-slate-500 rounded transition-all"
                          style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }}
                        />
                      )}
                    </div>
                    <span className="text-xs font-semibold text-slate-600 w-4 text-right shrink-0">{bar.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Overdue spotlight */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <h3 className="text-sm font-semibold text-slate-800">Overdue</h3>
                </div>
                <span className="text-xs font-medium text-red-700 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                  {overdue.length}
                </span>
              </div>
              {overdue.length === 0 ? (
                <p className="text-xs text-slate-400">All caught up.</p>
              ) : (
                <div className="space-y-2">
                  {overdue.slice(0, 5).map((item) => (
                    <Link key={item.key} href={item.href} className="flex items-center justify-between gap-2 p-2.5 bg-red-50/60 rounded-lg hover:bg-red-50 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{item.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{item.sourceLabel}</p>
                      </div>
                      <span className="shrink-0 text-xs font-medium text-red-600">
                        {new Date(item.start).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* This week summary */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Summary</h3>
              <div className="space-y-2.5">
                {[
                  { label: "Total (week + overdue)", value: stats.total, color: "text-slate-800" },
                  { label: "Today", value: stats.today, color: "text-blue-600" },
                  { label: "Overdue", value: stats.overdue, color: "text-red-600" },
                  { label: "Upcoming this week", value: stats.upcoming, color: "text-slate-600" },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">{stat.label}</span>
                    <span className={cn("text-sm font-bold", stat.color)}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
