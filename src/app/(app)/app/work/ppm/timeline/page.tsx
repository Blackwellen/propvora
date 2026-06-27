"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Plus,
} from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { cn } from "@/lib/utils"
import { WorkTabNav } from "@/components/work/WorkTabNav"
import { PpmTabNav } from "@/components/work/PpmTabNav"
import { MobileTopBar } from "@/components/mobile"
import { useWorkspaceId } from "@/hooks/useWorkspace"
import { useProperties } from "@/hooks/useProperties"
import { usePpmPlans, type PpmPlan } from "@/hooks/usePpm"

// ─── Constants ──────────────────────────────────────────────────────────────────

const MONTH_COUNT = 6

// Status → colours (single source for spans, dots and legend)
const STATUS_META: Record<string, { bar: string; dot: string; label: string }> = {
  scheduled: { bar: "bg-[var(--brand)]", dot: "bg-[var(--brand)]", label: "Scheduled" },
  "due-soon": { bar: "bg-amber-400", dot: "bg-amber-400", label: "Due Soon" },
  overdue: { bar: "bg-red-500", dot: "bg-red-500", label: "Overdue" },
  completed: { bar: "bg-emerald-500", dot: "bg-emerald-500", label: "Completed" },
  paused: { bar: "bg-slate-400", dot: "bg-slate-400", label: "Paused" },
}

const CATEGORY_PALETTE = ["#3B82F6", "#F97316", "#EAB308", "#EF4444", "#14B8A6", "#8B5CF6"]

// ─── Date helpers ────────────────────────────────────────────────────────────────

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1)
}
function sameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}
function normaliseStatus(s: string): keyof typeof STATUS_META {
  if (s === "due_soon" || s === "due-soon") return "due-soon"
  if (s === "overdue") return "overdue"
  if (s === "completed") return "completed"
  if (s === "paused") return "paused"
  return "scheduled"
}

// ─── View models ─────────────────────────────────────────────────────────────────

interface TimelineSpan {
  col: number
  label: string
  status: keyof typeof STATUS_META
}
interface TimelineTask {
  id: string
  name: string
  status: keyof typeof STATUS_META
  span: TimelineSpan | null
}
interface TimelineProperty {
  key: string
  name: string
  tasks: TimelineTask[]
}

// ─── Page ─────────────────────────────────────────────────────────────────────────

export default function PpmTimelinePage() {
  const router = useRouter()
  const workspaceId = useWorkspaceId()
  const { data: livePlans = [], isLoading } = usePpmPlans(workspaceId)
  const { data: properties = [] } = useProperties(workspaceId)

  const [search, setSearch] = useState("")
  const [offset, setOffset] = useState(0) // months from current month
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const propertyNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of properties) map.set(p.id, p.name || "Unnamed property")
    return map
  }, [properties])

  // Month window derived from today + offset
  const months = useMemo(() => {
    const base = startOfMonth(addMonths(new Date(), offset))
    return Array.from({ length: MONTH_COUNT }, (_, i) => addMonths(base, i))
  }, [offset])
  const monthLabels = useMemo(
    () => months.map((m) => m.toLocaleDateString("en-GB", { month: "short", year: "numeric" })),
    [months]
  )
  const windowStart = months[0]
  const windowEnd = addMonths(months[MONTH_COUNT - 1], 1) // exclusive

  // Plans whose next_due_date falls inside the visible window
  const inWindowPlans = useMemo(() => {
    return livePlans.filter((p) => {
      if (!p.next_due_date) return false
      const due = new Date(p.next_due_date)
      return due >= windowStart && due < windowEnd
    })
  }, [livePlans, windowStart, windowEnd])

  // Group in-window plans by property → timeline rows
  const timelineProperties = useMemo<TimelineProperty[]>(() => {
    const q = search.trim().toLowerCase()
    const byProperty = new Map<string, TimelineProperty>()

    for (const p of inWindowPlans) {
      const key = p.property_id ?? "__unassigned__"
      const name = p.property_id ? propertyNameById.get(p.property_id) ?? "Linked property" : "Unassigned"
      if (q && !(`${name} ${p.name}`.toLowerCase().includes(q))) continue

      const due = new Date(p.next_due_date!)
      const col = months.findIndex((m) => sameMonth(m, due))
      const status = normaliseStatus(p.status)
      const task: TimelineTask = {
        id: p.id,
        name: p.name,
        status,
        span:
          col >= 0
            ? {
                col,
                label: due.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
                status,
              }
            : null,
      }

      const group = byProperty.get(key) ?? { key, name, tasks: [] }
      group.tasks.push(task)
      byProperty.set(key, group)
    }

    return Array.from(byProperty.values()).sort((a, b) => {
      if (a.key === "__unassigned__") return 1
      if (b.key === "__unassigned__") return -1
      return a.name.localeCompare(b.name)
    })
  }, [inWindowPlans, search, propertyNameById, months])

  function isExpanded(key: string) {
    return expanded[key] ?? true
  }
  function toggleProperty(key: string) {
    setExpanded((prev) => ({ ...prev, [key]: !(prev[key] ?? true) }))
  }

  // KPIs — derived from live data
  const kpis = useMemo(() => {
    const dueSoon = livePlans.filter((p) => normaliseStatus(p.status) === "due-soon").length
    const overdue = livePlans.filter((p) => normaliseStatus(p.status) === "overdue").length
    return [
      { label: "In This Window", value: String(inWindowPlans.length), sub: `Next ${MONTH_COUNT} months`, tone: "text-slate-900" },
      { label: "Due Soon", value: String(dueSoon), sub: "Within 30 days", tone: "text-amber-700" },
      { label: "Overdue", value: String(overdue), sub: "Require attention", tone: "text-red-700" },
      { label: "Total Schedules", value: String(livePlans.length), sub: "All PPM plans", tone: "text-slate-900" },
    ]
  }, [livePlans, inWindowPlans])

  // Upcoming load donut — live category breakdown of in-window plans
  const loadData = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of inWindowPlans) {
      const key = p.category?.trim() || "Other"
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value], i) => ({ name, value, fill: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length] }))
  }, [inWindowPlans])
  const loadTotal = useMemo(() => loadData.reduce((s, d) => s + d.value, 0), [loadData])

  // Busiest months — live count of in-window plans per month column
  const busiestMonths = useMemo(() => {
    const counts = months.map((m) => inWindowPlans.filter((p) => sameMonth(new Date(p.next_due_date!), m)).length)
    const max = Math.max(1, ...counts)
    return months.map((m, i) => ({ label: monthLabels[i], count: counts[i], pct: Math.round((counts[i] / max) * 100) }))
  }, [months, monthLabels, inWindowPlans])

  function exportCsv() {
    const headers = ["Property", "Task", "Status", "Due Date"]
    const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`
    const lines = [headers.join(",")]
    for (const prop of timelineProperties) {
      for (const t of prop.tasks) {
        const plan = inWindowPlans.find((p) => p.id === t.id)
        lines.push(
          [prop.name, t.name, STATUS_META[t.status].label, plan?.next_due_date ?? ""].map(escape).join(",")
        )
      }
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `ppm-timeline-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function goToPlan(id: string) {
    router.push(`/property-manager/work/ppm/${id}`)
  }

  const windowRangeLabel = `${monthLabels[0]} – ${monthLabels[MONTH_COUNT - 1]}`
  const hasRows = timelineProperties.length > 0

  return (
    <div className="space-y-5">
      <MobileTopBar
        title="PPM Timeline"
        subtitle="Maintenance schedule"
        primaryAction={{ label: "New PPM schedule", icon: Plus, href: "/property-manager/work/ppm/schedules/new" }}
      />

      {/* Header */}
      <div className="hidden md:block">
        <h1 className="text-xl font-bold text-slate-900">PPM Timeline</h1>
        <p className="text-sm text-slate-500">Visualise recurring maintenance across upcoming months</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{k.label}</span>
            </div>
            <p className={cn("text-3xl font-bold", k.tone)}>{k.value}</p>
            <p className="text-[11px] text-slate-500 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Tab navs */}
      <WorkTabNav />
      <PpmTabNav />

      {/* Timeline controls — all wired */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-[12.5px] font-semibold text-slate-700">
          <CalendarDays className="w-3.5 h-3.5 text-slate-400" /> {windowRangeLabel}
        </span>
        <button
          onClick={exportCsv}
          disabled={!hasRows}
          className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Export timeline CSV"
          title="Export CSV"
        >
          <Download className="w-4 h-4" />
        </button>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search properties or tasks..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/50 bg-white"
          />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setOffset((o) => o - 1)}
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setOffset((o) => o + 1)}
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setOffset(0)}
            disabled={offset === 0}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Today
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        {/* Timeline grid */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
          {/* Grid header */}
          <div className="grid border-b border-slate-100 min-w-[640px]" style={{ gridTemplateColumns: "200px repeat(6, 1fr)" }}>
            <div className="px-4 py-3 border-r border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Property / Task</span>
            </div>
            {monthLabels.map((m, i) => (
              <div key={m} className="px-2 py-3 border-r border-slate-100 last:border-r-0 text-center">
                <span className={cn("text-[11px] font-semibold", i === 0 && offset === 0 ? "text-[var(--brand)]" : "text-slate-500")}>
                  {m}
                </span>
              </div>
            ))}
          </div>

          {isLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-9 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : !hasRows ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <CalendarDays className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">
                {livePlans.length === 0 ? "No PPM schedules yet" : "Nothing scheduled in this window"}
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                {livePlans.length === 0
                  ? "Create a recurring maintenance schedule to populate the timeline."
                  : "Adjust the month range or search to see scheduled maintenance."}
              </p>
              {livePlans.length === 0 && (
                <Link
                  href="/property-manager/work/ppm/schedules/new"
                  className="inline-flex items-center gap-1.5 mt-4 bg-[var(--brand)] hover:bg-[var(--brand-strong)] text-white rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add PPM Schedule
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[640px]">
                {timelineProperties.map((prop) => (
                  <React.Fragment key={prop.key}>
                    {/* Property header row */}
                    <div
                      className="grid border-b border-slate-100 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                      style={{ gridTemplateColumns: "200px repeat(6, 1fr)" }}
                      onClick={() => toggleProperty(prop.key)}
                    >
                      <div className="px-4 py-2.5 flex items-center gap-2 border-r border-slate-100">
                        <span className="text-[12px] text-slate-500">{isExpanded(prop.key) ? "▾" : "▸"}</span>
                        <span className="text-sm">🏢</span>
                        <span className="text-[12.5px] font-semibold text-slate-800 truncate">{prop.name}</span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--brand-soft)] text-[var(--brand)] border border-[var(--color-brand-100)]">
                          {prop.tasks.length}
                        </span>
                      </div>
                      {monthLabels.map((m) => (
                        <div key={m} className="border-r border-slate-100 last:border-r-0" />
                      ))}
                    </div>

                    {/* Task rows */}
                    {isExpanded(prop.key) &&
                      prop.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="grid border-b border-slate-50 hover:bg-slate-50 transition-colors"
                          style={{ gridTemplateColumns: "200px repeat(6, 1fr)" }}
                        >
                          <div className="px-4 py-2 flex items-center gap-2 border-r border-slate-100 pl-8">
                            <span className={cn("w-2 h-2 rounded-full shrink-0", STATUS_META[task.status].dot)} />
                            <span className="text-[11.5px] text-slate-700 truncate">{task.name}</span>
                          </div>
                          {monthLabels.map((m, colIdx) => (
                            <div
                              key={m}
                              className="relative border-r border-slate-50 last:border-r-0 px-1 py-1.5 flex items-center"
                            >
                              {task.span && task.span.col === colIdx && (
                                <button
                                  onClick={() => goToPlan(task.id)}
                                  className={cn(
                                    "flex items-center px-2 py-0.5 rounded text-[10px] font-semibold text-white whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity",
                                    STATUS_META[task.span.status].bar
                                  )}
                                  title={`${task.name}: ${task.span.label}`}
                                >
                                  {task.span.label}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Legend */}
          {hasRows && (
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
              <div className="flex flex-wrap items-center gap-4">
                {Object.values(STATUS_META).map((l) => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <span className={cn("w-2.5 h-2.5 rounded-sm shrink-0", l.bar)} />
                    <span className="text-[11px] text-slate-600">{l.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Each marker shows a plan&apos;s next due date. Click a marker to open the schedule.
              </p>
            </div>
          )}
        </div>

        {/* Right rail */}
        <div className="space-y-4">
          {/* Upcoming Load (live category breakdown) */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Upcoming Load</h3>
            {loadTotal === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CalendarDays className="w-7 h-7 text-slate-200 mb-2" />
                <p className="text-[12px] font-semibold text-slate-600">No scheduled load</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Nothing due in the selected window.</p>
              </div>
            ) : (
              <>
                <div className="relative h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={loadData} cx="50%" cy="50%" innerRadius={44} outerRadius={64} paddingAngle={2} dataKey="value">
                        {loadData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val) => [`${val} schedule${val === 1 ? "" : "s"}`]}
                        contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-xl font-bold text-slate-900">{loadTotal}</p>
                    <p className="text-[10px] text-slate-500">In window</p>
                  </div>
                </div>
                <div className="space-y-1.5 mt-2">
                  {loadData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                        <span className="text-slate-600 truncate">{d.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-semibold text-slate-800">{d.value}</span>
                        <span className="text-slate-400">({Math.round((d.value / loadTotal) * 100)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Busiest Months (live) */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Busiest Months</h3>
            <div className="space-y-3">
              {busiestMonths.map((b) => (
                <div key={b.label} className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-600 w-20 shrink-0 truncate">{b.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-2 rounded-full bg-[var(--brand)] transition-all" style={{ width: `${b.pct}%` }} />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 w-5 text-right shrink-0">{b.count}</span>
                </div>
              ))}
            </div>
            <Link
              href="/property-manager/work/ppm/schedules"
              className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[var(--brand)] hover:text-[var(--brand-strong)] transition-colors"
            >
              View all schedules →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
