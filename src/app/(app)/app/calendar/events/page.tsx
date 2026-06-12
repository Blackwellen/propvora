"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, Search, Eye, Copy, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { CalendarTabNav } from "@/components/calendar"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { useWorkspace } from "@/providers/AuthProvider"
import {
  useCalendarItems,
  bucketItems,
  fmtDateTime,
  SOURCE_META,
  type CalendarItem,
  type CalendarSource,
} from "../_lib/useCalendarItems"

export const dynamic = "force-dynamic"

type SourceFilter = "All" | CalendarSource
type StatusFilter = "All" | CalendarItem["status"]

const SOURCE_FILTERS: SourceFilter[] = ["All", "calendar", "work", "money", "portfolio", "compliance", "planning", "contacts"]
const STATUS_FILTERS: StatusFilter[] = ["All", "scheduled", "confirmed", "due_today", "overdue", "completed", "cancelled"]

function statusChip(status: CalendarItem["status"]): string {
  const map: Record<CalendarItem["status"], string> = {
    scheduled: "bg-blue-100 text-blue-700",
    confirmed: "bg-emerald-100 text-emerald-700",
    due_today: "bg-amber-100 text-amber-700",
    overdue: "bg-red-100 text-red-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-slate-100 text-slate-400",
  }
  return map[status]
}

function KpiCard({ label, value, valueClass }: { label: string; value: number | string; valueClass?: string }) {
  return (
    <div className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-white px-5 py-4">
      <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
      <p className={cn("text-2xl font-bold text-slate-900", valueClass)}>{value}</p>
    </div>
  )
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-xs font-medium transition-all border capitalize",
        active ? "bg-[#2563EB] text-white border-[#2563EB]" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
      )}
    >
      {label === "due_today" ? "Due Today" : label}
    </button>
  )
}

export default function EventsPage() {
  const router = useRouter()
  const { workspace } = useWorkspace()
  const { items, isLoading } = useCalendarItems(workspace?.id)
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("All")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All")
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => items.filter((e) => {
    if (sourceFilter !== "All" && e.source !== sourceFilter) return false
    if (statusFilter !== "All" && e.status !== statusFilter) return false
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [items, sourceFilter, statusFilter, search])

  const buckets = useMemo(() => bucketItems(items), [items])
  const completed = items.filter((i) => i.status === "completed").length

  return (
    <DashboardContainer>
      <CalendarTabNav />

      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Events</h1>
            <p className="text-sm text-slate-500 mt-0.5">Every dated record across your portfolio — click any row to open its source</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/app/calendar/events/new" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-[#2563EB] text-white hover:bg-blue-700 transition-colors shadow-sm">
              <Plus className="w-4 h-4" />
              New Event
            </Link>
          </div>
        </div>

        {/* KPI strip */}
        <div className="flex gap-4 flex-wrap">
          <KpiCard label="Total" value={isLoading ? "…" : items.length} />
          <KpiCard label="This Week" value={isLoading ? "…" : buckets.thisWeek.length} valueClass="text-blue-600" />
          <KpiCard label="Overdue" value={isLoading ? "…" : buckets.overdue.length} valueClass="text-red-600" />
          <KpiCard label="Completed" value={isLoading ? "…" : completed} valueClass="text-green-600" />
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-slate-500 mr-1">Source:</span>
            {SOURCE_FILTERS.map((f) => (
              <FilterChip key={f} label={f === "All" ? "All" : SOURCE_META[f as CalendarSource].label} active={sourceFilter === f} onClick={() => setSourceFilter(f)} />
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-slate-500 mr-1">Status:</span>
            {STATUS_FILTERS.map((f) => (
              <FilterChip key={f} label={f} active={statusFilter === f} onClick={() => setStatusFilter(f)} />
            ))}
            <div className="ml-auto relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 w-48"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {["Title", "Source", "Date & Time", "Status", "Type", "Actions"].map((col, i) => (
                    <th key={col} className={cn("px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap", i === 5 ? "text-right" : "text-left")}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">
                    <div className="flex items-center justify-center gap-2"><div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full" />Loading…</div>
                  </td></tr>
                )}
                {!isLoading && filtered.map((ev) => {
                  const meta = SOURCE_META[ev.source]
                  return (
                    <tr key={ev.key} className="hover:bg-slate-50/60 transition-colors cursor-pointer" onClick={() => router.push(ev.href)}>
                      <td className="px-4 py-3"><span className="font-medium text-slate-800 text-sm">{ev.title}</span></td>
                      <td className="px-4 py-3"><span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", meta.chip)}>{ev.sourceLabel}</span></td>
                      <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">
                        {ev.allDay ? new Date(ev.start).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : fmtDateTime(ev.start)}
                      </td>
                      <td className="px-4 py-3"><span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize", statusChip(ev.status))}>{ev.status.replace("_", " ")}</span></td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{ev.isNative ? "Calendar event" : "Linked record"}</td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <ActionMenu
                          items={[
                            { label: "Open Record", icon: Eye, onClick: () => router.push(ev.href) },
                            { label: "Copy Title", icon: Copy, onClick: () => { void navigator.clipboard?.writeText(ev.title) } },
                          ]}
                        />
                      </td>
                    </tr>
                  )
                })}
                {!isLoading && filtered.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-16 text-center">
                    <CalendarDays className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-500">No events match your filters</p>
                    <p className="text-xs text-slate-400 mt-1 mb-4">{items.length === 0 ? "Create an event or add dates to tasks, jobs, tenancies and compliance items." : "Try clearing a filter."}</p>
                    <Link href="/app/calendar/events/new" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-[#2563EB] text-white hover:bg-blue-700 transition-colors">
                      <Plus className="w-4 h-4" />New Event
                    </Link>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
          {!isLoading && filtered.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
              <p className="text-xs text-slate-500">Showing <span className="font-medium text-slate-700">{filtered.length}</span> of <span className="font-medium text-slate-700">{items.length}</span> items</p>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">Live<span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" /></span>
            </div>
          )}
        </div>
      </div>
    </DashboardContainer>
  )
}
