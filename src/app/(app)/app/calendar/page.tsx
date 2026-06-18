"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  CalendarDays,
  Plus,
  Bell,
  Download,
  Wrench,
  AlertTriangle,
  FileText,
  Shield,
  BarChart3,
  Users,
  ChevronRight,
  Building2,
} from "lucide-react"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { SectionHeader } from "@/components/layout/SectionHeader"
import { CalendarTabNav } from "@/components/calendar/CalendarTabNav"
import { MobileTopBar } from "@/components/mobile"
import { cn } from "@/lib/utils"
import { useWorkspace } from "@/providers/AuthProvider"
import { useSectionLink } from "@/components/sections/SectionBasePath"
import {
  useCalendarItems,
  bucketItems,
  fmtTime,
  isSameDay,
  startOfDay,
  SOURCE_META,
  type CalendarItem,
  type CalendarSource,
} from "./_lib/useCalendarItems"

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface KpiCardData {
  label: string
  value: number | string
  sub: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
}

const SOURCE_ICON: Record<CalendarSource, React.ElementType> = {
  calendar: CalendarDays,
  work: Wrench,
  money: BarChart3,
  portfolio: Building2,
  compliance: Shield,
  planning: FileText,
  contacts: Users,
}

/* ─────────────────────────────────────────────
   KPI Row — live cross-section aggregation
───────────────────────────────────────────── */
function KpiRow({ items }: { items: CalendarItem[] }) {
  const now = new Date()
  const buckets = bucketItems(items, now)

  const complianceDue = items.filter((i) => {
    if (i.source !== "compliance") return false
    const d = startOfDay(new Date(i.start))
    const horizon = new Date(startOfDay(now)); horizon.setDate(horizon.getDate() + 30)
    return d.getTime() >= startOfDay(now).getTime() && d.getTime() <= horizon.getTime()
  }).length

  const workScheduled = buckets.thisWeek.filter((i) => i.source === "work").length
  const tenanciesEnding = items.filter((i) => {
    if (i.key.startsWith("tenancy-end:") === false) return false
    const d = startOfDay(new Date(i.start))
    const horizon = new Date(startOfDay(now)); horizon.setDate(horizon.getDate() + 30)
    return d.getTime() >= startOfDay(now).getTime() && d.getTime() <= horizon.getTime()
  }).length

  const cards: KpiCardData[] = [
    { label: "Today's Events", value: buckets.today.length, sub: buckets.today.length === 1 ? "1 item today" : `${buckets.today.length} items today`, icon: CalendarDays, iconBg: "bg-blue-50", iconColor: "text-blue-600" },
    { label: "Overdue", value: buckets.overdue.length, sub: "Past due, not done", icon: AlertTriangle, iconBg: "bg-red-50", iconColor: "text-red-600" },
    { label: "Work Scheduled", value: workScheduled, sub: "Tasks & jobs this week", icon: Wrench, iconBg: "bg-amber-50", iconColor: "text-amber-600" },
    { label: "Compliance Due", value: complianceDue, sub: "Next 30 days", icon: Shield, iconBg: "bg-violet-50", iconColor: "text-violet-600" },
    { label: "Tenancies Ending", value: tenanciesEnding, sub: "Next 30 days", icon: Building2, iconBg: "bg-teal-50", iconColor: "text-teal-600" },
    { label: "This Week", value: buckets.thisWeek.length, sub: "All sources", icon: BarChart3, iconBg: "bg-slate-50", iconColor: "text-slate-600" },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.label}
            className="flex flex-col gap-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow duration-200"
          >
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", card.iconBg)}>
              <Icon className={cn("w-4.5 h-4.5", card.iconColor)} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide leading-tight mb-1">
                {card.label}
              </p>
              <p className="text-3xl font-bold text-slate-900 leading-none">{card.value}</p>
              <p className="text-[11px] text-slate-400 mt-1 leading-tight">{card.sub}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Today schedule card
───────────────────────────────────────────── */
function TodayScheduleCard({ items, loading }: { items: CalendarItem[]; loading: boolean }) {
  const sectionLink = useSectionLink()
  const [expanded, setExpanded] = useState(false)
  const now = new Date()
  const todayItems = items
    .filter((i) => isSameDay(new Date(i.start), now))
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  const visible = expanded ? todayItems : todayItems.slice(0, 8)
  const todayLabel = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
            <CalendarDays className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900">Today &mdash; {todayLabel}</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">{todayItems.length} items scheduled</p>
          </div>
        </div>
        <Link
          href={sectionLink("/app/calendar/views/day")}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
        >
          Full day view <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {loading && (
        <div className="divide-y divide-slate-50">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
              <div className="w-14 h-3 bg-slate-100 rounded" />
              <div className="w-8 h-8 bg-slate-100 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <div className="w-40 h-3 bg-slate-100 rounded" />
                <div className="w-24 h-2.5 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && todayItems.length === 0 && (
        <div className="px-5 py-12 text-center">
          <CalendarDays className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">Nothing scheduled today</p>
          <p className="text-xs text-slate-400 mt-1">Tasks, jobs, tenancies and events all show here</p>
        </div>
      )}

      {!loading && visible.length > 0 && (
        <div className="divide-y divide-slate-50">
          {visible.map((it) => {
            const meta = SOURCE_META[it.source]
            const Icon = SOURCE_ICON[it.source] ?? CalendarDays
            const timeStr = it.allDay ? "All day" : fmtTime(it.start)
            return (
              <Link
                key={it.key}
                href={it.href}
                className={cn("flex items-center gap-3 px-4 py-3 hover:bg-slate-50/60 transition-colors duration-100 border-l-[3px]", meta.border)}
              >
                <div className="w-[56px] shrink-0">
                  <span className="text-[12px] font-semibold text-slate-500">{timeStr}</span>
                </div>
                <div className={cn("shrink-0 w-8 h-8 rounded-lg flex items-center justify-center", meta.chip)}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-slate-800 leading-tight truncate">{it.title}</p>
                  {it.description && (
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{it.description}</p>
                  )}
                </div>
                <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0", meta.chip)}>
                  {it.sourceLabel}
                </span>
                <span className={cn(
                  "text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 capitalize",
                  it.status === "overdue" ? "bg-red-100 text-red-700" :
                  it.status === "due_today" ? "bg-amber-100 text-amber-700" :
                  it.status === "confirmed" || it.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                  "bg-slate-100 text-slate-600"
                )}>
                  {it.status.replace("_", " ")}
                </span>
              </Link>
            )
          })}
        </div>
      )}

      {!loading && todayItems.length > 0 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-50 bg-slate-50/40">
          <span className="text-[11px] text-slate-400">
            {todayItems.length} item{todayItems.length !== 1 ? "s" : ""} today
          </span>
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            Live
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </span>
        </div>
      )}

      {todayItems.length > 8 && (
        <div className="px-5 py-2 border-t border-slate-50">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[12px] text-blue-600 hover:text-blue-800 font-medium"
          >
            {expanded ? "Show less" : `${todayItems.length - 8} more items`}
          </button>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Attention queue (overdue across all sources)
───────────────────────────────────────────── */
function AttentionQueueCard({ items }: { items: CalendarItem[] }) {
  const sectionLink = useSectionLink()
  const overdue = bucketItems(items).overdue
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="text-[14px] font-semibold text-slate-900">Attention Queue</span>
        </div>
        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
          {overdue.length} items
        </span>
      </div>
      {overdue.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className="text-xs text-slate-400">No overdue items</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {overdue.slice(0, 5).map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50/60 transition-colors"
            >
              <span className="mt-1.5 w-2 h-2 rounded-full shrink-0 bg-red-500" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{item.sourceLabel}</span>
                </div>
                <p className="text-[12px] font-semibold text-slate-800 leading-tight truncate">{item.title}</p>
              </div>
              <span className="text-[11px] text-red-600 font-medium whitespace-nowrap shrink-0 mt-0.5">
                {new Date(item.start).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </span>
            </Link>
          ))}
        </div>
      )}
      <div className="px-4 py-3 border-t border-slate-50">
        <Link href={sectionLink("/app/calendar/schedule")} className="text-[12px] text-blue-600 hover:text-blue-800 font-medium">
          View full schedule &gt;
        </Link>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Upcoming this week by source
───────────────────────────────────────────── */
function UpcomingWeekCard({ items }: { items: CalendarItem[] }) {
  const sectionLink = useSectionLink()
  const week = bucketItems(items).thisWeek
  const sources: CalendarSource[] = ["work", "compliance", "portfolio", "money", "planning", "contacts", "calendar"]
  const byType = sources
    .map((s) => ({ source: s, count: week.filter((i) => i.source === s).length }))
    .filter((c) => c.count > 0)

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-blue-500" />
          <span className="text-[14px] font-semibold text-slate-900">Upcoming This Week</span>
        </div>
        <Link href={sectionLink("/app/calendar/views/week")} className="text-[11px] text-blue-600 hover:text-blue-800 font-medium">
          View all &rarr;
        </Link>
      </div>
      {byType.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className="text-xs text-slate-400">No items this week</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {byType.map((cat) => (
            <div key={cat.source} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50/60 transition-colors">
              <div className="flex items-center gap-2">
                <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", SOURCE_META[cat.source].dot)} />
                <span className="text-[13px] text-slate-700">{SOURCE_META[cat.source].label}</span>
              </div>
              <span className="text-[13px] font-semibold text-slate-900">{cat.count} item{cat.count !== 1 ? "s" : ""}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Sources panel — what feeds the calendar
───────────────────────────────────────────── */
function SourcesCard({ items }: { items: CalendarItem[] }) {
  const sources: CalendarSource[] = ["calendar", "work", "compliance", "portfolio", "money", "planning", "contacts"]
  const rows = sources
    .map((s) => ({ source: s, count: items.filter((i) => i.source === s).length }))
    .filter((r) => r.count > 0)

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-4 py-3.5 border-b border-slate-100">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Calendar Sources</p>
      </div>
      {rows.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className="text-xs text-slate-400">No dated records yet</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {rows.map((r) => (
            <div key={r.source} className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", SOURCE_META[r.source].dot)} />
                <span className="text-[13px] text-slate-600">{SOURCE_META[r.source].label}</span>
              </div>
              <span className="text-[13px] font-bold text-blue-600">{r.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Page Root
───────────────────────────────────────────── */
export default function CalendarOverviewPage() {
  const sectionLink = useSectionLink()
  const { workspace } = useWorkspace()
  const { items, isLoading } = useCalendarItems(workspace?.id)
  const memoItems = useMemo(() => items, [items])

  return (
    <DashboardContainer>
      <MobileTopBar
        title="Calendar"
        subtitle="Scheduling hub"
        primaryAction={{ label: "New event", icon: Plus, href: sectionLink("/app/calendar/events/new") }}
        overflowActions={[
          { label: "New reminder", icon: Bell, href: sectionLink("/app/calendar/reminders/new") },
          { label: "Export / Settings", icon: Download, href: sectionLink("/app/calendar/settings") },
        ]}
      />
      <div className="md:hidden -mx-4">
        <CalendarTabNav />
      </div>
      <div className="space-y-5 px-4 md:px-6 py-4 md:py-6">
        <div className="hidden md:block">
        <SectionHeader
          title="Calendar"
          subtitle="Operational scheduling command centre — every dated record across your portfolio."
          actions={
            <>
              <Link
                href={sectionLink("/app/calendar/events/new")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-[#2563EB] text-white hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                New Event
              </Link>
              <Link
                href={sectionLink("/app/calendar/reminders/new")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-white text-slate-700 hover:bg-slate-50 transition-colors border border-slate-200 shadow-sm"
              >
                <Bell className="w-4 h-4" />
                New Reminder
              </Link>
              <Link
                href={sectionLink("/app/calendar/settings")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-white text-slate-700 hover:bg-slate-50 transition-colors border border-slate-200 shadow-sm"
              >
                <Download className="w-4 h-4" />
                Export / Settings
              </Link>
            </>
          }
          tabs={<CalendarTabNav />}
        />
        </div>

        <KpiRow items={memoItems} />

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
          <TodayScheduleCard items={memoItems} loading={isLoading} />
          <div className="flex flex-col gap-4">
            <AttentionQueueCard items={memoItems} />
            <UpcomingWeekCard items={memoItems} />
            <SourcesCard items={memoItems} />
          </div>
        </div>
      </div>
    </DashboardContainer>
  )
}
