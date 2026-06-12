"use client"

import React, { useMemo, useState } from "react"
import {
  Download,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  Timer,
  ListChecks,
  BarChart3,
  Inbox,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/layout/PageContainer"
import { WorkTabNav } from "@/components/work/WorkTabNav"
import { WorkKpiStrip, type WorkKpi } from "@/components/work/WorkKpiStrip"
import { useTasks } from "@/hooks/useTasks"
import { useJobs } from "@/hooks/useJobs"
import { useProperties } from "@/hooks/useProperties"
import { useWorkspaceId } from "@/hooks/useWorkspace"
import type { Task, Job } from "@/types/database"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

// ─── Tokens / shared constants ───────────────────────────────────────────────

const BRAND = "#2563EB"
const GREEN = "#10B981"
const AMBER = "#F59E0B"
const RED = "#EF4444"
const SLATE = "#94A3B8"
const VIOLET = "#7C3AED"

const TASK_DONE = new Set(["done"])
const TASK_CLOSED = new Set(["done", "cancelled"])
const JOB_DONE = new Set(["complete", "invoiced", "closed"])
const JOB_CLOSED = new Set(["complete", "invoiced", "closed", "disputed"])

type RangeKey = "30d" | "90d" | "year"
const RANGES: { key: RangeKey; label: string }[] = [
  { key: "30d", label: "Last 30 days" },
  { key: "90d", label: "Last 90 days" },
  { key: "year", label: "This year" },
]

const STATUS_FILTERS = [
  { key: "all", label: "All status" },
  { key: "open", label: "Open" },
  { key: "closed", label: "Closed" },
] as const
type StatusFilterKey = (typeof STATUS_FILTERS)[number]["key"]

const PRIORITY_FILTERS = [
  { key: "all", label: "All priorities" },
  { key: "urgent", label: "Urgent" },
  { key: "high", label: "High" },
  { key: "medium", label: "Medium" },
  { key: "low", label: "Low" },
] as const
type PriorityFilterKey = (typeof PRIORITY_FILTERS)[number]["key"]

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns the inclusive lower bound Date for a given range. */
function rangeStart(range: RangeKey): Date {
  const now = new Date()
  if (range === "30d") return new Date(now.getTime() - 30 * 86_400_000)
  if (range === "90d") return new Date(now.getTime() - 90 * 86_400_000)
  return new Date(now.getFullYear(), 0, 1) // start of this year
}

function isTaskDone(t: Task) {
  return TASK_DONE.has(t.status)
}
function isTaskClosed(t: Task) {
  return TASK_CLOSED.has(t.status)
}
function isJobDone(j: Job) {
  return JOB_DONE.has(j.status)
}
function isJobClosed(j: Job) {
  return JOB_CLOSED.has(j.status)
}

/** Normalised "work item" — flattens Task + Job into one shape for reporting. */
interface WorkItem {
  kind: "task" | "job"
  status: string
  priority: string
  property_id: string | null
  created_at: string
  /** completion timestamp (completed_at / completed_date) or null */
  completed_at: string | null
  /** due / scheduled timestamp or null */
  due_at: string | null
  done: boolean
  closed: boolean
}

function csvEscape(v: string | number) {
  const s = String(v)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function WorkReportsPage() {
  const workspaceId = useWorkspaceId()
  const { data: tasks = [], isLoading: tasksLoading } = useTasks(workspaceId)
  const { data: jobs = [], isLoading: jobsLoading } = useJobs(workspaceId)
  const { data: properties = [] } = useProperties(workspaceId)

  const [range, setRange] = useState<RangeKey>("30d")
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>("all")
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilterKey>("all")

  const isLoading = tasksLoading || jobsLoading

  const propertyNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of properties) map.set(p.id, p.name)
    return map
  }, [properties])

  // ─── Normalise + filter by range / status / priority ──────────────────────
  const items = useMemo<WorkItem[]>(() => {
    const start = rangeStart(range)

    const taskItems: WorkItem[] = tasks.map((t) => ({
      kind: "task",
      status: t.status,
      priority: t.priority,
      property_id: t.property_id,
      created_at: t.created_at,
      completed_at: t.completed_at,
      due_at: t.due_date,
      done: isTaskDone(t),
      closed: isTaskClosed(t),
    }))

    const jobItems: WorkItem[] = jobs.map((j) => ({
      kind: "job",
      status: j.status,
      priority: j.priority,
      property_id: j.property_id,
      created_at: j.created_at,
      completed_at: j.completed_date,
      due_at: j.scheduled_date,
      done: isJobDone(j),
      closed: isJobClosed(j),
    }))

    return [...taskItems, ...jobItems].filter((it) => {
      // Range filter — keep items created within range OR completed within range
      const created = it.created_at ? new Date(it.created_at) : null
      const completed = it.completed_at ? new Date(it.completed_at) : null
      const inRange =
        (created !== null && created >= start) ||
        (completed !== null && completed >= start)
      if (!inRange) return false

      // Status filter
      if (statusFilter === "open" && it.closed) return false
      if (statusFilter === "closed" && !it.closed) return false

      // Priority filter
      if (priorityFilter !== "all" && it.priority !== priorityFilter) return false

      return true
    })
  }, [tasks, jobs, range, statusFilter, priorityFilter])

  const hasData = items.length > 0

  // ─── KPI metrics (all live) ────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const now = new Date()
    const total = items.length
    const doneItems = items.filter((it) => it.done)
    const closed = items.filter((it) => it.closed).length
    const open = total - closed
    const completionRate = total > 0 ? Math.round((doneItems.length / total) * 100) : 0

    const overdue = items.filter(
      (it) => it.due_at && new Date(it.due_at) < now && !it.closed,
    ).length

    // Avg time to completion (created -> completed) in days, over completed items
    const durations: number[] = []
    for (const it of doneItems) {
      if (it.created_at && it.completed_at) {
        const d =
          (new Date(it.completed_at).getTime() - new Date(it.created_at).getTime()) /
          86_400_000
        if (d >= 0) durations.push(d)
      }
    }
    const avgDays =
      durations.length > 0
        ? Math.round((durations.reduce((s, d) => s + d, 0) / durations.length) * 10) / 10
        : 0

    return { total, completionRate, overdue, avgDays, open, closed, completed: doneItems.length }
  }, [items])

  // ─── Chart datasets (all live) ─────────────────────────────────────────────

  // 1. Work volume by status
  const statusData = useMemo(() => {
    const counts = new Map<string, number>()
    for (const it of items) counts.set(it.status, (counts.get(it.status) ?? 0) + 1)
    return Array.from(counts.entries())
      .map(([name, value]) => ({ name: name.replace(/_/g, " "), value }))
      .sort((a, b) => b.value - a.value)
  }, [items])

  // 2. Completion trend by month (created vs completed)
  const trendData = useMemo(() => {
    const start = rangeStart(range)
    // Build month buckets from range start -> now
    const buckets: { key: string; label: string; created: number; completed: number }[] = []
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1)
    const now = new Date()
    const end = new Date(now.getFullYear(), now.getMonth(), 1)
    while (cursor <= end) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`
      buckets.push({
        key,
        label: cursor.toLocaleDateString("en-GB", { month: "short" }),
        created: 0,
        completed: 0,
      })
      cursor.setMonth(cursor.getMonth() + 1)
    }
    const idx = new Map(buckets.map((b, i) => [b.key, i]))
    const keyOf = (iso: string) => {
      const d = new Date(iso)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    }
    for (const it of items) {
      if (it.created_at) {
        const i = idx.get(keyOf(it.created_at))
        if (i !== undefined) buckets[i].created += 1
      }
      if (it.completed_at) {
        const i = idx.get(keyOf(it.completed_at))
        if (i !== undefined) buckets[i].completed += 1
      }
    }
    return buckets
  }, [items, range])

  const trendHasValues = useMemo(
    () => trendData.some((b) => b.created > 0 || b.completed > 0),
    [trendData],
  )

  // 3. Work by priority
  const priorityData = useMemo(() => {
    const order = ["urgent", "high", "medium", "low"]
    const colors: Record<string, string> = {
      urgent: RED,
      high: AMBER,
      medium: BRAND,
      low: SLATE,
    }
    const counts = new Map<string, number>()
    for (const it of items) counts.set(it.priority, (counts.get(it.priority) ?? 0) + 1)
    return order
      .filter((p) => (counts.get(p) ?? 0) > 0)
      .map((p) => ({ name: p.charAt(0).toUpperCase() + p.slice(1), value: counts.get(p)!, color: colors[p] }))
  }, [items])

  // 4. Overdue vs on-time (of items that have a due/scheduled date)
  const overdueData = useMemo(() => {
    const now = new Date()
    let overdue = 0
    let onTime = 0
    for (const it of items) {
      if (!it.due_at) continue
      const due = new Date(it.due_at)
      if (it.closed) {
        // completed before/after due
        if (it.completed_at && new Date(it.completed_at) <= due) onTime += 1
        else if (it.completed_at) overdue += 1
        else onTime += 1
      } else {
        if (due < now) overdue += 1
        else onTime += 1
      }
    }
    const out = [
      { name: "On time", value: onTime, color: GREEN },
      { name: "Overdue", value: overdue, color: RED },
    ]
    return out.filter((d) => d.value > 0)
  }, [items])

  // 5. Jobs by property (top properties by job count)
  const propertyData = useMemo(() => {
    const counts = new Map<string, number>()
    for (const it of items) {
      if (it.kind !== "job") continue
      const pid = it.property_id ?? "__none__"
      counts.set(pid, (counts.get(pid) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .map(([pid, value]) => ({
        name: pid === "__none__" ? "Unassigned" : propertyNameById.get(pid) ?? "Unknown property",
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [items, propertyNameById])

  // ─── CSV export of the current aggregated data ─────────────────────────────
  const handleExport = () => {
    const lines: string[] = []
    const push = (cols: (string | number)[]) => lines.push(cols.map(csvEscape).join(","))

    const rangeLabel = RANGES.find((r) => r.key === range)?.label ?? range
    push(["Propvora Work Report"])
    push(["Range", rangeLabel])
    push(["Status filter", STATUS_FILTERS.find((s) => s.key === statusFilter)?.label ?? statusFilter])
    push(["Priority filter", PRIORITY_FILTERS.find((p) => p.key === priorityFilter)?.label ?? priorityFilter])
    push(["Generated", new Date().toISOString()])
    push([])

    push(["KPIs"])
    push(["Metric", "Value"])
    push(["Total work", metrics.total])
    push(["Completion rate %", metrics.completionRate])
    push(["Overdue", metrics.overdue])
    push(["Avg days to completion", metrics.avgDays])
    push(["Open", metrics.open])
    push(["Closed", metrics.closed])
    push(["Completed", metrics.completed])
    push([])

    push(["Work volume by status"])
    push(["Status", "Count"])
    statusData.forEach((d) => push([d.name, d.value]))
    push([])

    push(["Completion trend by month"])
    push(["Month", "Created", "Completed"])
    trendData.forEach((d) => push([d.key, d.created, d.completed]))
    push([])

    push(["Work by priority"])
    push(["Priority", "Count"])
    priorityData.forEach((d) => push([d.name, d.value]))
    push([])

    push(["Overdue vs on-time"])
    push(["Bucket", "Count"])
    overdueData.forEach((d) => push([d.name, d.value]))
    push([])

    push(["Jobs by property"])
    push(["Property", "Jobs"])
    propertyData.forEach((d) => push([d.name, d.value]))

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `work-report-${range}-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // ─── KPI strip ─────────────────────────────────────────────────────────────
  const KPIS: WorkKpi[] = [
    {
      icon: Briefcase,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      value: metrics.total,
      label: "Total Work",
      sub: hasData ? "In selected range" : "No data",
      subColor: hasData ? "text-emerald-600" : "text-slate-400",
    },
    {
      ring: true,
      ringColor: BRAND,
      value: metrics.completionRate,
      label: "Completion Rate",
      sub: `${metrics.completed} completed`,
      subColor: "text-emerald-600",
    },
    {
      icon: AlertTriangle,
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
      value: metrics.overdue,
      label: "Overdue",
      sub: metrics.overdue > 0 ? "Need attention" : "All on time",
      subColor: metrics.overdue > 0 ? "text-red-500" : "text-emerald-600",
    },
    {
      icon: Timer,
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
      value: metrics.avgDays > 0 ? `${metrics.avgDays}d` : "—",
      label: "Avg Completion",
      sub: "Created → done",
      subColor: "text-slate-500",
    },
    {
      icon: ListChecks,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      value: metrics.open,
      label: "Open",
      sub: "Not yet closed",
      subColor: "text-amber-600",
    },
    {
      icon: CheckCircle2,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      value: metrics.closed,
      label: "Closed",
      sub: "Done / cancelled",
      subColor: "text-slate-500",
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        description="Live operational analytics across tasks and jobs"
        actions={
          <button
            onClick={handleExport}
            disabled={!hasData}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors",
              hasData
                ? "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                : "border border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed",
            )}
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        }
      />

      <WorkTabNav />

      {/* Filter bar */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        {/* Date range */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Range</span>
          <div className="inline-flex rounded-xl border border-slate-200 p-0.5 bg-slate-50">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors",
                  range === r.key
                    ? "bg-white text-[#2563EB] shadow-sm"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilterKey)}
            className="text-xs font-medium text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Priority filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Priority</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as PriorityFilterKey)}
            className="text-xs font-medium text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {PRIORITY_FILTERS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-500">
          <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
          {isLoading ? "Loading…" : `${metrics.total} items in view`}
        </div>
      </div>

      {/* KPI strip */}
      <WorkKpiStrip kpis={KPIS} />

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Work volume by status */}
        <ChartCard title="Work Volume by Status" subtitle="Tasks and jobs grouped by current status">
          {isLoading ? (
            <ChartSkeleton />
          ) : statusData.length === 0 ? (
            <ChartEmpty />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={statusData} margin={{ left: -16, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} interval={0} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#F8FAFC" }} />
                <Bar dataKey="value" fill={BRAND} radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Completion trend by month */}
        <ChartCard title="Completion Trend" subtitle="Created vs completed per month">
          {isLoading ? (
            <ChartSkeleton />
          ) : !trendHasValues ? (
            <ChartEmpty />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trendData} margin={{ left: -16, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
                <Line type="monotone" dataKey="created" name="Created" stroke={BRAND} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="completed" name="Completed" stroke={GREEN} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Work by priority */}
        <ChartCard title="Work by Priority" subtitle="Distribution across priority levels">
          {isLoading ? (
            <ChartSkeleton />
          ) : priorityData.length === 0 ? (
            <ChartEmpty />
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={240}>
                <PieChart>
                  <Pie data={priorityData} cx="50%" cy="50%" innerRadius={50} outerRadius={88} dataKey="value" paddingAngle={2}>
                    {priorityData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                {priorityData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      {d.name}
                    </span>
                    <span className="font-semibold text-slate-800">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>

        {/* Overdue vs on-time */}
        <ChartCard title="Overdue vs On-time" subtitle="Items with a due or scheduled date">
          {isLoading ? (
            <ChartSkeleton />
          ) : overdueData.length === 0 ? (
            <ChartEmpty label="No dated items in range" />
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={240}>
                <PieChart>
                  <Pie
                    data={overdueData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={88}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                    paddingAngle={2}
                  >
                    {overdueData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                {overdueData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      {d.name}
                    </span>
                    <span className="font-semibold text-slate-800">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>

        {/* Jobs by property */}
        <ChartCard
          title="Jobs by Property"
          subtitle="Top properties by job volume"
          className="lg:col-span-2"
        >
          {isLoading ? (
            <ChartSkeleton />
          ) : propertyData.length === 0 ? (
            <ChartEmpty label="No jobs in range" />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(240, propertyData.length * 44)}>
              <BarChart data={propertyData} layout="vertical" margin={{ left: 8, right: 24, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 12, fill: "#64748B" }}
                  axisLine={false}
                  tickLine={false}
                  width={140}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#F8FAFC" }} />
                <Bar dataKey="value" fill={VIOLET} radius={[0, 6, 6, 0]} maxBarSize={26} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  )
}

// ─── Presentational sub-components ───────────────────────────────────────────

const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid #E2E8F0",
  fontSize: 12,
} as const

function ChartCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("bg-white border border-slate-200 rounded-2xl shadow-sm p-5", className)}>
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function ChartSkeleton() {
  return <div className="h-[240px] bg-slate-50 rounded-xl animate-pulse" />
}

function ChartEmpty({ label = "No data yet for this range" }: { label?: string }) {
  return (
    <div className="h-[240px] flex flex-col items-center justify-center gap-2 text-center">
      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
        <Inbox className="w-6 h-6 text-slate-300" />
      </div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="text-xs text-slate-400 max-w-[220px]">
        Create tasks or jobs, or widen the date range to see analytics here.
      </p>
    </div>
  )
}
