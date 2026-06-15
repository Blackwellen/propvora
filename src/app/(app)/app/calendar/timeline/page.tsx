"use client"

export const dynamic = 'force-dynamic'

import { useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CalendarTabNav } from "@/components/calendar"
import { MobileTopBar } from "@/components/mobile"
import { Eye, Copy, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { useWorkspace } from "@/providers/AuthProvider"
import {
  useCalendarItems,
  bucketItems,
  startOfDay,
  isSameDay,
  SOURCE_META,
  type CalendarItem,
  type CalendarSource,
} from "../_lib/useCalendarItems"

type TimeSection = "past" | "today" | "upcoming"

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

function TimelineDot({ section, source, isOverdue }: { section: TimeSection; source: CalendarSource; isOverdue: boolean }) {
  if (section === "past") return <div className="w-3 h-3 rounded-full bg-slate-300 ring-2 ring-white shrink-0" />
  if (section === "today") return <div className="w-3.5 h-3.5 rounded-full bg-blue-500 ring-2 ring-white shrink-0 shadow-sm" />
  if (isOverdue) return <div className="w-3 h-3 rounded-full bg-red-500 ring-2 ring-white shrink-0" />
  return <div className={cn("w-3 h-3 rounded-full ring-2 ring-white shrink-0", SOURCE_META[source].dot)} />
}

function SectionSeparator({ label, accent, pill }: { label: string; accent: string; pill?: string }) {
  return (
    <div className={cn("flex items-center gap-3 py-3 px-4 rounded-lg mb-2", accent)}>
      <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
      {pill && <span className="text-[11px] font-semibold bg-blue-600 text-white px-2 py-0.5 rounded-full">{pill}</span>}
      <div className="flex-1 h-px bg-current opacity-20" />
    </div>
  )
}

function TimelineEventRow({ item, section }: { item: CalendarItem; section: TimeSection }) {
  const router = useRouter()
  const isPast = section === "past"
  const isToday = section === "today"
  const isOverdue = item.status === "overdue"
  const meta = SOURCE_META[item.source]
  const dateLabel = new Date(item.start).toLocaleDateString("en-GB", { day: "numeric", month: "short", weekday: "short" })
  const timeLabel = item.allDay ? "" : new Date(item.start).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })

  return (
    <div className="flex gap-3 group">
      <div className="flex flex-col items-center shrink-0 pt-1" style={{ width: "20px" }}>
        <TimelineDot section={section} source={item.source} isOverdue={isOverdue} />
        <div className="w-px flex-1 bg-slate-200 mt-1 min-h-[36px]" />
      </div>
      <div className="flex-1 min-w-0 pb-3">
        <Link
          href={item.href}
          className={cn(
            "flex items-start gap-3 p-3 rounded-lg border transition-all hover:shadow-sm",
            isPast && "opacity-70",
            isOverdue ? "border-red-200 bg-red-50/30" : isToday ? "border-blue-100 bg-blue-50/20" : "border-slate-100 bg-white",
            "hover:border-slate-200"
          )}
        >
          <div className="shrink-0 w-24">
            <p className={cn("text-xs font-medium", isPast ? "text-slate-400" : "text-slate-600")}>{dateLabel}</p>
            {timeLabel && <p className="text-xs text-slate-400 mt-0.5 font-mono">{timeLabel}</p>}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn("text-sm font-semibold truncate", isPast ? "text-slate-500" : isOverdue ? "text-red-800" : "text-slate-800")}>
              {item.title}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className={cn("text-[11px] font-medium px-1.5 py-0.5 rounded", meta.chip)}>{item.sourceLabel}</span>
              <span className={cn("text-[11px] font-medium px-1.5 py-0.5 rounded capitalize", statusClasses(item.status))}>
                {item.status.replace("_", " ")}
              </span>
            </div>
          </div>
          <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-all" onClick={(e) => e.preventDefault()}>
            <ActionMenu
              items={[
                { label: "Open Record", icon: Eye, onClick: () => router.push(item.href) },
                { label: "Copy Title", icon: Copy, onClick: () => { void navigator.clipboard?.writeText(item.title) } },
              ]}
            />
          </div>
        </Link>
      </div>
    </div>
  )
}

export default function TimelinePage() {
  const { workspace } = useWorkspace()
  const { items, isLoading } = useCalendarItems(workspace?.id)

  const { past, today, upcoming, sourceBars, attention, milestones } = useMemo(() => {
    const now = new Date()
    const day0 = startOfDay(now)
    // window: last 14 days .. next 30 days to keep timeline readable
    const lower = new Date(day0); lower.setDate(lower.getDate() - 14)
    const upper = new Date(day0); upper.setDate(upper.getDate() + 30)
    const inWindow = items.filter((i) => {
      const t = new Date(i.start).getTime()
      return t >= lower.getTime() && t <= upper.getTime()
    })

    const past = inWindow.filter((i) => startOfDay(new Date(i.start)).getTime() < day0.getTime())
    const today = inWindow.filter((i) => isSameDay(new Date(i.start), now))
    const upcoming = inWindow.filter((i) => startOfDay(new Date(i.start)).getTime() > day0.getTime())

    const sources: CalendarSource[] = ["work", "money", "portfolio", "compliance", "planning", "contacts", "calendar"]
    const sourceBars = sources
      .map((s) => ({ source: s, count: inWindow.filter((i) => i.source === s).length }))
      .filter((b) => b.count > 0)

    const attention = bucketItems(items, now).overdue
      .sort((a, z) => new Date(a.start).getTime() - new Date(z.start).getTime())
      .slice(0, 5)

    const milestones = upcoming
      .filter((i) => {
        const d = startOfDay(new Date(i.start))
        const h = new Date(day0); h.setDate(h.getDate() + 14)
        return d.getTime() <= h.getTime()
      })
      .slice(0, 6)

    return { past, today, upcoming, sourceBars, attention, milestones }
  }, [items])

  const maxSource = Math.max(...sourceBars.map((b) => b.count), 1)
  const todayLabel = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
  const empty = !isLoading && past.length === 0 && today.length === 0 && upcoming.length === 0

  return (
    <div className="min-h-screen bg-slate-50">
      <MobileTopBar title="Timeline" subtitle="Event history & upcoming" />
      <div className="md:hidden">
        <CalendarTabNav />
      </div>
      <div className="hidden md:block">
        <CalendarTabNav />
      </div>

      <div className="hidden md:block bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Timeline</h1>
            <p className="text-sm text-slate-500 mt-0.5">Event history and upcoming schedule across all sections</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-5">
        <div className="flex gap-5 items-start flex-col lg:flex-row">
          {/* Left timeline */}
          <div className="flex-1 min-w-0 w-full">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 bg-slate-50 rounded-lg animate-pulse" />)}
                </div>
              ) : empty ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <CalendarDays className="w-10 h-10 text-slate-200 mb-3" />
                  <p className="text-sm font-medium text-slate-500">No timeline activity</p>
                  <p className="text-xs text-slate-400 mt-1">Dated records from the last 14 and next 30 days will appear here.</p>
                </div>
              ) : (
                <>
                  {past.length > 0 && (
                    <div className="mb-2">
                      <SectionSeparator label="Past" accent="text-slate-400" />
                      {past.map((item) => <TimelineEventRow key={item.key} item={item} section="past" />)}
                    </div>
                  )}
                  {today.length > 0 && (
                    <div className="mb-2">
                      <SectionSeparator label={`Today — ${todayLabel}`} accent="text-blue-600" pill="Today" />
                      <div className="border-l-2 border-blue-500 pl-1 ml-[9px] rounded">
                        {today.map((item) => <TimelineEventRow key={item.key} item={item} section="today" />)}
                      </div>
                    </div>
                  )}
                  {upcoming.length > 0 && (
                    <div>
                      <SectionSeparator label="Upcoming" accent="text-slate-500" />
                      {upcoming.map((item) => <TimelineEventRow key={item.key} item={item} section="upcoming" />)}
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-2 pl-1">
                    <div className="w-4 h-4 rounded-full bg-slate-100 border border-slate-200 shrink-0" />
                    <span className="text-xs text-slate-300">End of visible timeline</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right panel */}
          <div className="w-full lg:w-80 shrink-0 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-800 mb-1">Items by Source</h3>
              <p className="text-xs text-slate-400 mb-3">Last 14 / next 30 days</p>
              {sourceBars.length === 0 ? (
                <p className="text-xs text-slate-400">No items in window.</p>
              ) : (
                <div className="space-y-2.5">
                  {sourceBars.map((bar) => (
                    <div key={bar.source} className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 w-20 shrink-0 font-medium">{SOURCE_META[bar.source].label}</span>
                      <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all", SOURCE_META[bar.source].barBg)} style={{ width: `${Math.round((bar.count / maxSource) * 100)}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-slate-600 w-4 text-right shrink-0">{bar.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-800">Attention Required</h3>
                <span className="text-xs font-medium text-red-700 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">{attention.length} overdue</span>
              </div>
              {attention.length === 0 ? (
                <p className="text-xs text-slate-400">No overdue items.</p>
              ) : (
                <div className="space-y-2">
                  {attention.map((item) => (
                    <Link key={item.key} href={item.href} className="block p-2.5 rounded-lg border border-red-100 bg-red-50/50 hover:bg-red-50 transition-colors">
                      <p className="text-sm font-medium text-red-800 truncate">{item.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{item.sourceLabel}</p>
                      <p className="text-xs mt-1 font-medium text-red-600">
                        Was due {new Date(item.start).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-800">Upcoming Milestones</h3>
                <span className="text-xs text-slate-400">Next 14 days</span>
              </div>
              {milestones.length === 0 ? (
                <p className="text-xs text-slate-400">Nothing upcoming.</p>
              ) : (
                <div className="space-y-2.5">
                  {milestones.map((item) => (
                    <Link key={item.key} href={item.href} className="flex items-center gap-3 group">
                      <div className={cn("w-2 h-2 rounded-full shrink-0", SOURCE_META[item.source].dot)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate group-hover:text-blue-700">{item.title}</p>
                        <p className="text-xs text-slate-400">{item.sourceLabel}</p>
                      </div>
                      <span className="shrink-0 text-xs font-medium text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {new Date(item.start).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
