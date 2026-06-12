"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Briefcase,
  AlertTriangle,
  Clock,
  TrendingDown,
  Receipt,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckSquare,
  Plus,
  Download,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/layout/PageContainer"
import { WorkTabNav } from "@/components/work/WorkTabNav"
import { useTasks } from "@/hooks/useTasks"
import { useJobs } from "@/hooks/useJobs"
import { useWorkspaceId } from "@/hooks/useWorkspace"
import type { Task, Job } from "@/types/database"

// ─── Types ─────────────────────────────────────────────────────────────────

interface GanttRow {
  id: string
  num: number
  type: "job" | "task"
  title: string
  ref: string
  property: string
  assigneeInitials: string
  supplierInitials?: string
  startDate: string
  dueDate: string
  progress: number
  status: "complete" | "in_progress" | "at_risk" | "not_started"
  deps: string
  barColor: string
  barWidth: number
  barLeft: number
  milestone?: string
  milestoneDate?: string
  href: string
  startMs?: number
  dueMs?: number
}

type KpiItem =
  | {
      label: string
      value: number
      sub: string
      icon: React.ComponentType<{ className?: string }>
      bg: string
      color: string
      isRing?: false
    }
  | {
      label: string
      value: number
      sub: string
      isRing: true
      ringColor: string
    }

// ─── Seed (fallback) KPI data ────────────────────────────────────────────────

const SEED_KPIS: KpiItem[] = [
  { label: "Open Work", value: 18, sub: "Sample data", icon: Briefcase, bg: "bg-blue-50", color: "text-blue-600" },
  { label: "Overdue", value: 4, sub: "Sample data", icon: AlertTriangle, bg: "bg-red-50", color: "text-red-600" },
  { label: "Waiting Supplier", value: 3, sub: "Sample data", icon: Clock, bg: "bg-amber-50", color: "text-amber-600" },
  { label: "Revenue Blocking", value: 2, sub: "Sample data", icon: TrendingDown, bg: "bg-red-50", color: "text-red-600" },
  { label: "Invoice Pending", value: 5, sub: "£2,450 total", icon: Receipt, bg: "bg-violet-50", color: "text-violet-600" },
  { label: "Due This Week", value: 12, sub: "Sample data", icon: CalendarIcon, bg: "bg-blue-50", color: "text-blue-600" },
  { label: "Scheduled Jobs", value: 7, sub: "This week", icon: Briefcase, bg: "bg-emerald-50", color: "text-emerald-600" },
  { label: "Completion Rate", value: 72, sub: "Sample data", isRing: true, ringColor: "#2563EB" },
]

// ─── Seed (fallback) Gantt data ──────────────────────────────────────────────

const GANTT_ROWS: GanttRow[] = [
  { id: "j1001", num: 1, type: "job", title: "Boiler Annual Service", ref: "Job · J-1001", property: "16 Grove St", assigneeInitials: "HV", supplierInitials: "HV", startDate: "12 May", dueDate: "16 May", progress: 100, status: "complete", deps: "—", barColor: "bg-emerald-500", barWidth: 8, barLeft: 0, milestone: "Electrical Certification", milestoneDate: "28 May", href: "/app/work/jobs" },
  { id: "j1002", num: 2, type: "job", title: "Fire Risk Assessment", ref: "Job · J-1002", property: "17 Brunswick Rd", assigneeInitials: "SG", startDate: "14 May", dueDate: "22 May", progress: 100, status: "complete", deps: "—", barColor: "bg-emerald-500", barWidth: 14, barLeft: 4, href: "/app/work/jobs" },
  { id: "t2001", num: 3, type: "task", title: "Electrical EICR", ref: "Task · T-2001", property: "21 Manor Flat 3B", assigneeInitials: "VC", supplierInitials: "VC", startDate: "15 May", dueDate: "28 May", progress: 75, status: "in_progress", deps: "1FS", barColor: "bg-blue-500", barWidth: 22, barLeft: 5, href: "/app/work/tasks" },
  { id: "t2002", num: 4, type: "task", title: "Fire Door Inspections", ref: "Task · T-2002", property: "16 Grove St", assigneeInitials: "SG", startDate: "19 May", dueDate: "30 May", progress: 60, status: "in_progress", deps: "2FS", barColor: "bg-blue-500", barWidth: 18, barLeft: 12, milestone: "Fire Risk Sign-off", milestoneDate: "30 May", href: "/app/work/tasks" },
  { id: "j1003", num: 5, type: "job", title: "Plumbing Repairs", ref: "Job · J-1003", property: "22 Oak Ave", assigneeInitials: "SP", startDate: "20 May", dueDate: "5 Jun", progress: 35, status: "in_progress", deps: "1SS", barColor: "bg-blue-400", barWidth: 26, barLeft: 14, href: "/app/work/jobs" },
  { id: "j1004", num: 6, type: "job", title: "Roof Leak Investigation", ref: "Job · J-1004", property: "18 Maple Rd", assigneeInitials: "PR", startDate: "25 May", dueDate: "5 Jun", progress: 0, status: "not_started", deps: "3FS", barColor: "bg-slate-300", barWidth: 16, barLeft: 22, href: "/app/work/jobs" },
  { id: "j1005", num: 7, type: "job", title: "Lift Maintenance", ref: "Job · J-1005", property: "19 Park Lane", assigneeInitials: "LT", startDate: "26 May", dueDate: "10 Jun", progress: 40, status: "in_progress", deps: "2SS", barColor: "bg-blue-400", barWidth: 24, barLeft: 23, href: "/app/work/jobs" },
  { id: "t2004", num: 8, type: "task", title: "Asbestos Survey", ref: "Task · T-2004", property: "17 Brunswick Rd", assigneeInitials: "ES", startDate: "30 May", dueDate: "12 Jun", progress: 0, status: "not_started", deps: "4FS", barColor: "bg-slate-300", barWidth: 20, barLeft: 28, href: "/app/work/tasks" },
  { id: "j1006", num: 9, type: "job", title: "Facade Repairs", ref: "Job · J-1006", property: "20 Queen St", assigneeInitials: "BR", startDate: "8 Jun", dueDate: "20 Jun", progress: 15, status: "at_risk", deps: "6FS", barColor: "bg-red-400", barWidth: 18, barLeft: 38, milestone: "Facade Works Start", milestoneDate: "8 Jun", href: "/app/work/jobs" },
  { id: "t2006", num: 10, type: "task", title: "Window Replacement", ref: "Task · T-2004", property: "20 Queen St", assigneeInitials: "GW", startDate: "10 Jun", dueDate: "25 Jun", progress: 0, status: "not_started", deps: "9FS", barColor: "bg-slate-300", barWidth: 20, barLeft: 40, href: "/app/work/tasks" },
  { id: "j1007", num: 11, type: "job", title: "Fire Alarm Upgrade", ref: "Job · J-1006", property: "21 Manor Flat 3B", assigneeInitials: "SG", startDate: "15 Jun", dueDate: "30 Jun", progress: 0, status: "not_started", deps: "3FS", barColor: "bg-slate-300", barWidth: 22, barLeft: 44, href: "/app/work/jobs" },
  { id: "j1008", num: 12, type: "job", title: "Boiler Replacement", ref: "Job · J-1007", property: "16 Grove St", assigneeInitials: "HV", startDate: "1 Jul", dueDate: "15 Jul", progress: 0, status: "not_started", deps: "5FS", barColor: "bg-slate-300", barWidth: 18, barLeft: 54, milestone: "Project Completion", milestoneDate: "15 Jul", href: "/app/work/jobs" },
]

// ─── Seed (fallback) bottom panel data ───────────────────────────────────────

const SEED_MILESTONES = [
  { name: "Electrical Certification", date: "28 May 2025", status: "Completed", color: "text-emerald-600" },
  { name: "Fire Risk Sign-off", date: "30 May 2025", status: "Completed", color: "text-emerald-600" },
  { name: "Facade Works Start", date: "08 Jun 2025", status: "At Risk", color: "text-amber-600" },
  { name: "Project Completion", date: "15 Jul 2025", status: "Planned", color: "text-slate-500" },
]

const SEED_BOTTLENECKS = [
  { title: "Facade Repairs", desc: "Delayed by 3 days — Waiting for Roof Leak Investigation", priority: "High", icon: AlertTriangle, color: "text-red-500" },
  { title: "Boiler Replacement", desc: "Supplier availability impacting start date", priority: "Medium", icon: Clock, color: "text-amber-500" },
]

const SEED_AI_RECS = [
  { text: "Bring forward Lift Maintenance by 2 days to reduce idle time", sub: "Impact: Saves 1 day" },
  { text: "Consider parallel execution of Window Replacement with Facade Repairs", sub: "Impact: Saves 2 days" },
  { text: "Reassign Plumbing Repairs to reduce critical path delay", sub: "Impact: Saves 1 day" },
]

const LEGEND = [
  { color: "bg-blue-500", label: "Task" },
  { color: "bg-blue-400", label: "Job" },
  { color: "bg-red-400", label: "At Risk" },
  { color: "bg-emerald-500", label: "Complete" },
  { color: "bg-slate-300", label: "Not Started" },
  { color: "bg-red-400", label: "Overdue" },
]

type Zoom = "Week" | "Month" | "Quarter"
type GroupBy = "Property" | "Assignee" | "Status"

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DAY = 86_400_000

function fmtShort(ms: number) {
  return new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

function fmtLong(ms: number) {
  return new Date(ms).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

function initialsFromTitle(title: string) {
  const words = title.trim().split(/\s+/)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return title.slice(0, 2).toUpperCase()
}

// Status mapping → 4 gantt statuses + progress
function taskGantt(t: Task, now: number): { status: GanttRow["status"]; progress: number } {
  if (t.status === "done") return { status: "complete", progress: 100 }
  if (t.status === "blocked") return { status: "at_risk", progress: 20 }
  if (t.due_date && new Date(t.due_date).getTime() < now && t.status !== "cancelled")
    return { status: "at_risk", progress: t.status === "in_progress" ? 50 : 10 }
  if (t.status === "in_progress") return { status: "in_progress", progress: 50 }
  if (t.status === "waiting") return { status: "in_progress", progress: 35 }
  return { status: "not_started", progress: 0 }
}

function jobGantt(j: Job, now: number): { status: GanttRow["status"]; progress: number } {
  if (["complete", "invoiced", "closed"].includes(j.status)) return { status: "complete", progress: 100 }
  if (j.status === "disputed") return { status: "at_risk", progress: 25 }
  const due = j.scheduled_date ? new Date(j.scheduled_date).getTime() : null
  if (due && due < now && !["complete", "invoiced", "closed"].includes(j.status))
    return { status: "at_risk", progress: 40 }
  if (j.status === "in_progress") return { status: "in_progress", progress: 55 }
  if (["scheduled", "approved", "quote_received"].includes(j.status))
    return { status: "in_progress", progress: 30 }
  return { status: "not_started", progress: 0 }
}

function barColorClass(status: GanttRow["status"], type: "job" | "task") {
  if (status === "complete") return "bg-emerald-500"
  if (status === "at_risk") return "bg-red-400"
  if (status === "not_started") return "bg-slate-300"
  return type === "task" ? "bg-blue-500" : "bg-blue-400"
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function KpiCard(props: KpiItem) {
  if (props.isRing) {
    const pct = props.value
    const r = 15.9155
    const circ = 2 * Math.PI * r
    const dash = (pct / 100) * circ

    return (
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-3 flex items-center gap-3">
        <svg className="w-10 h-10 -rotate-90 shrink-0" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r={r} fill="none" stroke="#E2E8F0" strokeWidth="3" />
          <circle
            cx="18"
            cy="18"
            r={r}
            fill="none"
            stroke={props.ringColor}
            strokeWidth="3"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="min-w-0">
          <p className="text-[18px] font-bold text-slate-800">{pct}%</p>
          <p className="text-[11px] font-medium text-slate-500 leading-tight">{props.label}</p>
          <p className="text-[10px] text-emerald-600 mt-0.5">{props.sub}</p>
        </div>
      </div>
    )
  }

  const Icon = props.icon
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-3 flex items-center gap-3">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", props.bg)}>
        <Icon className={cn("w-4.5 h-4.5", props.color)} />
      </div>
      <div className="min-w-0">
        <p className="text-[18px] font-bold text-slate-800">{props.value}</p>
        <p className="text-[11px] font-medium text-slate-500 leading-tight">{props.label}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">{props.sub}</p>
      </div>
    </div>
  )
}

function GanttHeader({ columns }: { columns: { month: string; weeks: string[] }[] }) {
  return (
    <div className="flex border-b border-slate-200 bg-slate-50">
      {/* Fixed left columns */}
      <div className="flex shrink-0 border-r border-slate-200">
        <div className="w-8 px-2 py-2" />
        <div className="w-6 flex items-center justify-center py-2 text-[10px] font-bold text-slate-500">#</div>
        <div className="w-52 px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Task / Job</div>
        <div className="w-32 px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Property</div>
        <div className="w-28 px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Assignee</div>
        <div className="w-20 px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Start</div>
        <div className="w-20 px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Due</div>
        <div className="w-24 px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Progress</div>
        <div className="w-24 px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Status</div>
        <div className="w-12 px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Deps</div>
      </div>

      {/* Timeline header */}
      <div className="flex-1 overflow-hidden">
        <div className="flex">
          {columns.map((m) => (
            <div key={m.month} className="flex-1 border-r border-slate-200 last:border-r-0">
              <div className="px-2 py-1 text-[11px] font-semibold text-slate-600 border-b border-slate-200 bg-slate-50">
                {m.month}
              </div>
              <div className="flex">
                {m.weeks.map((w, wi) => (
                  <div key={`${w}-${wi}`} className="flex-1 px-1 py-1 text-[10px] text-slate-400 border-r border-slate-100 last:border-r-0">
                    {w}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {/* Today marker label */}
        <div className="relative h-0">
          <div
            className="absolute top-[-30px] text-[10px] font-bold bg-[#2563EB] text-white px-1.5 py-0.5 rounded-sm"
            style={{ left: "8%" }}
          >
            Today
          </div>
        </div>
      </div>
    </div>
  )
}

function GanttRowItem({ row, index, onOpen }: { row: GanttRow; index: number; onOpen: (href: string) => void }) {
  const statusColors: Record<GanttRow["status"], string> = {
    complete: "bg-emerald-100 text-emerald-700",
    in_progress: "bg-blue-100 text-blue-700",
    at_risk: "bg-red-100 text-red-700",
    not_started: "bg-slate-100 text-slate-600",
  }
  const statusLabels: Record<GanttRow["status"], string> = {
    complete: "Complete",
    in_progress: "In Progress",
    at_risk: "At Risk",
    not_started: "Not Started",
  }

  const barBg =
    row.status === "complete"
      ? "#10B981"
      : row.status === "at_risk"
      ? "#EF4444"
      : row.status === "in_progress"
      ? "#2563EB"
      : "#94A3B8"

  return (
    <div
      className={cn(
        "flex border-b border-slate-100 hover:bg-slate-50 transition-colors",
        index % 2 !== 0 ? "bg-slate-50/30" : ""
      )}
    >
      {/* Fixed columns */}
      <div className="flex shrink-0 border-r border-slate-200">
        <div className="w-8 px-2 flex items-center">
          <input type="checkbox" className="rounded w-3.5 h-3.5" onClick={(e) => e.stopPropagation()} />
        </div>
        <div className="w-6 flex items-center justify-center text-[12px] text-slate-400">{row.num}</div>
        <button
          type="button"
          onClick={() => onOpen(row.href)}
          className="w-52 px-3 py-2.5 flex items-center gap-1.5 min-w-0 text-left hover:bg-slate-100 transition-colors"
        >
          {row.type === "job" ? (
            <Briefcase className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          ) : (
            <CheckSquare className="w-3.5 h-3.5 text-violet-500 shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-[12.5px] font-semibold text-slate-800 truncate">{row.title}</p>
            <p className="text-[10px] text-slate-400">{row.ref}</p>
          </div>
        </button>
        <div className="w-32 px-3 py-2.5 flex items-center">
          <span className="text-[12px] text-slate-600 truncate">{row.property}</span>
        </div>
        <div className="w-28 px-3 py-2.5 flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-[9px] text-white font-bold shrink-0">
            {row.assigneeInitials}
          </div>
          {row.supplierInitials && (
            <div className="w-5 h-5 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center text-[8px] font-bold shrink-0">
              {row.supplierInitials}
            </div>
          )}
        </div>
        <div className="w-20 px-3 py-2.5 flex items-center text-[12px] text-slate-600">{row.startDate}</div>
        <div className="w-20 px-3 py-2.5 flex items-center text-[12px] text-slate-600">{row.dueDate}</div>
        <div className="w-24 px-3 py-2.5 flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-slate-200">
            <div
              className={cn("h-1.5 rounded-full", row.barColor)}
              style={{ width: `${row.progress}%` }}
            />
          </div>
          <span className="text-[11px] font-medium text-slate-600 w-7 text-right">{row.progress}%</span>
        </div>
        <div className="w-24 px-3 py-2.5 flex items-center">
          <span className={cn("text-[10.5px] font-semibold px-2 py-0.5 rounded-full", statusColors[row.status])}>
            {statusLabels[row.status]}
          </span>
        </div>
        <div className="w-12 px-3 py-2.5 flex items-center text-[11px] text-slate-400">{row.deps}</div>
      </div>

      {/* Timeline bar */}
      <button
        type="button"
        onClick={() => onOpen(row.href)}
        className="flex-1 relative py-2.5 flex items-center overflow-hidden text-left cursor-pointer"
      >
        {/* Today vertical line */}
        <div className="absolute top-0 bottom-0 w-px bg-[#2563EB] z-10" style={{ left: "8%" }} />

        {/* Gantt bar */}
        <div
          className="absolute h-6 rounded-md flex items-center px-2"
          style={{
            left: `${row.barLeft}%`,
            width: `${Math.max(row.barWidth, 8)}%`,
            backgroundColor: barBg,
            opacity: row.status === "not_started" ? 0.5 : 1,
          }}
        >
          {row.progress > 0 && (
            <span className="text-[9px] font-bold text-white whitespace-nowrap">{row.progress}%</span>
          )}
          {row.status === "at_risk" && (
            <AlertTriangle className="w-3 h-3 text-white ml-auto" />
          )}
        </div>

        {/* Milestone diamond */}
        {row.milestone && (
          <div
            className="absolute z-20 flex flex-col items-center"
            style={{ left: `${Math.min(row.barLeft + row.barWidth, 96)}%` }}
          >
            <div className="w-3 h-3 bg-violet-600 rotate-45 border border-violet-700" />
            <div className="text-[9px] text-slate-600 font-medium whitespace-nowrap mt-1 bg-white px-1 border border-slate-200 rounded">
              {row.milestone}
            </div>
          </div>
        )}
      </button>
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function GanttPage() {
  const router = useRouter()
  const workspaceId = useWorkspaceId()
  const { data: tasks = [], isLoading: tasksLoading } = useTasks(workspaceId)
  const { data: jobs = [], isLoading: jobsLoading } = useJobs(workspaceId)

  const [zoom, setZoom] = useState<Zoom>("Month")
  const [groupBy, setGroupBy] = useState<GroupBy>("Property")
  const [offsetUnits, setOffsetUnits] = useState(0)

  const isLoading = tasksLoading || jobsLoading
  const hasLiveData = tasks.length > 0 || jobs.length > 0

  // ─── Build live rows (or seed fallback) ──────────────────────────────────
  const { rows, columns, dateLabel } = useMemo(() => {
    const now = Date.now()

    if (!hasLiveData) {
      // Seeded window matches the original static header
      const start = new Date("2025-05-12").getTime()
      const end = new Date("2025-08-30").getTime()
      return {
        rows: GANTT_ROWS,
        windowStart: start,
        windowEnd: end,
        columns: [
          { month: "May 2025", weeks: ["12", "19", "26"] },
          { month: "Jun 2025", weeks: ["02", "09", "16", "23"] },
          { month: "Jul 2025", weeks: ["07", "14", "21", "28"] },
          { month: "Aug 2025", weeks: ["04", "11", "18", "25"] },
        ],
        dateLabel: "12 May 2025 – 30 Aug 2025",
      }
    }

    // Collect raw items with start/due in ms
    type Raw = {
      id: string
      type: "job" | "task"
      title: string
      ref: string
      property: string
      assignee: string
      assigneeInitials: string
      supplierInitials?: string
      startMs: number
      dueMs: number
      status: GanttRow["status"]
      progress: number
      href: string
    }

    const raw: Raw[] = []

    tasks.forEach((t) => {
      const createdMs = new Date(t.created_at).getTime()
      const dueMs = t.due_date ? new Date(t.due_date).getTime() : createdMs + 5 * DAY
      const startMs = Math.min(createdMs, dueMs)
      const g = taskGantt(t, now)
      raw.push({
        id: t.id,
        type: "task",
        title: t.title,
        ref: `Task · ${t.id.slice(0, 8)}`,
        property: t.property_id ?? "Unassigned",
        assignee: t.assigned_to ?? "Unassigned",
        assigneeInitials: t.assigned_to ? t.assigned_to.slice(0, 2).toUpperCase() : initialsFromTitle(t.title),
        startMs,
        dueMs,
        status: g.status,
        progress: g.progress,
        href: `/app/work/tasks/${t.id}`,
      })
    })

    jobs.forEach((j) => {
      const createdMs = new Date(j.created_at).getTime()
      const dueMs = j.scheduled_date
        ? new Date(j.scheduled_date).getTime()
        : j.completed_date
        ? new Date(j.completed_date).getTime()
        : createdMs + 7 * DAY
      const startMs = Math.min(createdMs, dueMs)
      const g = jobGantt(j, now)
      raw.push({
        id: j.id,
        type: "job",
        title: j.title,
        ref: `Job · ${j.reference ?? j.id.slice(0, 8)}`,
        property: j.property_id ?? "Unassigned",
        assignee: j.assigned_to ?? "Unassigned",
        assigneeInitials: j.assigned_to ? j.assigned_to.slice(0, 2).toUpperCase() : initialsFromTitle(j.title),
        supplierInitials: j.supplier_contact_id ? j.supplier_contact_id.slice(0, 2).toUpperCase() : undefined,
        startMs,
        dueMs,
        status: g.status,
        progress: g.progress,
        href: `/app/work/jobs/${j.id}`,
      })
    })

    // Visible window from data min/max, padded; shifted by zoom-aware offset
    const minStart = Math.min(...raw.map((r) => r.startMs))
    const maxDue = Math.max(...raw.map((r) => r.dueMs))
    const pad = 3 * DAY
    const unitMs = zoom === "Week" ? 7 * DAY : zoom === "Quarter" ? 90 * DAY : 30 * DAY
    const baseStart = minStart - pad + offsetUnits * unitMs
    const baseEnd = Math.max(maxDue + pad, baseStart + unitMs) + offsetUnits * unitMs
    const span = Math.max(baseEnd - baseStart, DAY)

    // Sort by start, then group
    raw.sort((a, b) => a.startMs - b.startMs)
    const grouped = [...raw].sort((a, b) => {
      const key = (r: Raw) =>
        groupBy === "Property" ? r.property : groupBy === "Assignee" ? r.assignee : r.status
      return key(a).localeCompare(key(b)) || a.startMs - b.startMs
    })

    const builtRows: GanttRow[] = grouped.map((r, i) => {
      const left = ((r.startMs - baseStart) / span) * 100
      const width = ((r.dueMs - r.startMs) / span) * 100
      const isMilestone = r.type === "job" && r.dueMs >= now && r.dueMs <= now + 14 * DAY
      return {
        id: r.id,
        num: i + 1,
        type: r.type,
        title: r.title,
        ref: r.ref,
        property: r.property,
        assigneeInitials: r.assigneeInitials,
        supplierInitials: r.supplierInitials,
        startDate: fmtShort(r.startMs),
        dueDate: fmtShort(r.dueMs),
        progress: r.progress,
        status: r.status,
        deps: "—",
        barColor: barColorClass(r.status, r.type),
        barWidth: Math.max(Math.min(width, 100 - Math.max(left, 0)), 4),
        barLeft: Math.max(Math.min(left, 96), 0),
        milestone: isMilestone ? r.title : undefined,
        milestoneDate: isMilestone ? fmtShort(r.dueMs) : undefined,
        href: r.href,
        startMs: r.startMs,
        dueMs: r.dueMs,
      }
    })

    // Build month/week column headers across the window
    const cols: { month: string; weeks: string[] }[] = []
    const cursor = new Date(baseStart)
    cursor.setDate(1)
    const endDate = new Date(baseEnd)
    while (cursor <= endDate) {
      const monthLabel = cursor.toLocaleDateString("en-GB", { month: "short", year: "numeric" })
      const year = cursor.getFullYear()
      const month = cursor.getMonth()
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      const weeks: string[] = []
      for (let d = 1; d <= daysInMonth; d += 7) {
        weeks.push(String(d).padStart(2, "0"))
      }
      cols.push({ month: monthLabel, weeks })
      cursor.setMonth(cursor.getMonth() + 1)
    }

    return {
      rows: builtRows,
      windowStart: baseStart,
      windowEnd: baseEnd,
      columns: cols,
      dateLabel: `${fmtLong(baseStart)} – ${fmtLong(baseEnd)}`,
    }
  }, [tasks, jobs, hasLiveData, zoom, groupBy, offsetUnits])

  // ─── Live KPI strip (mirrors Overview page approach) ─────────────────────
  const kpis: KpiItem[] = useMemo(() => {
    if (!hasLiveData) return SEED_KPIS
    const now = new Date()
    const weekAhead = new Date(now.getTime() + 7 * DAY)

    const openWork =
      tasks.filter((t) => !["done", "cancelled"].includes(t.status)).length +
      jobs.filter((j) => !["complete", "invoiced", "closed", "disputed"].includes(j.status)).length

    const overdue =
      tasks.filter((t) => t.due_date && new Date(t.due_date) < now && !["done", "cancelled"].includes(t.status)).length +
      jobs.filter(
        (j) =>
          j.scheduled_date &&
          new Date(j.scheduled_date) < now &&
          !["complete", "invoiced", "closed"].includes(j.status)
      ).length

    const waiting =
      tasks.filter((t) => t.status === "waiting").length +
      jobs.filter((j) => j.status === "supplier_requested" || j.status === "quote_received").length

    const revenueBlocking = jobs.filter((j) => j.status === "disputed").length

    const invoicePending = jobs.filter((j) => j.status === "invoiced").length

    const dueThisWeek =
      tasks.filter(
        (t) => t.due_date && new Date(t.due_date) >= now && new Date(t.due_date) <= weekAhead && !["done", "cancelled"].includes(t.status)
      ).length +
      jobs.filter(
        (j) =>
          j.scheduled_date &&
          new Date(j.scheduled_date) >= now &&
          new Date(j.scheduled_date) <= weekAhead &&
          !["complete", "invoiced", "closed"].includes(j.status)
      ).length

    const scheduledJobs = jobs.filter((j) => j.status === "scheduled").length

    const doneTasks = tasks.filter((t) => t.status === "done").length
    const completionRate = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0

    return [
      { label: "Open Work", value: openWork, sub: "Live count", icon: Briefcase, bg: "bg-blue-50", color: "text-blue-600" },
      { label: "Overdue", value: overdue, sub: overdue > 0 ? "Action needed" : "All on time", icon: AlertTriangle, bg: "bg-red-50", color: "text-red-600" },
      { label: "Waiting Supplier", value: waiting, sub: "Chase required", icon: Clock, bg: "bg-amber-50", color: "text-amber-600" },
      { label: "Revenue Blocking", value: revenueBlocking, sub: "Disputed jobs", icon: TrendingDown, bg: "bg-red-50", color: "text-red-600" },
      { label: "Invoice Pending", value: invoicePending, sub: "Awaiting payment", icon: Receipt, bg: "bg-violet-50", color: "text-violet-600" },
      { label: "Due This Week", value: dueThisWeek, sub: "Next 7 days", icon: CalendarIcon, bg: "bg-blue-50", color: "text-blue-600" },
      { label: "Scheduled Jobs", value: scheduledJobs, sub: "Upcoming", icon: Briefcase, bg: "bg-emerald-50", color: "text-emerald-600" },
      { label: "Completion Rate", value: completionRate, sub: "Tasks completed", isRing: true, ringColor: "#2563EB" },
    ]
  }, [tasks, jobs, hasLiveData])

  // ─── Milestones / Bottlenecks / AI recs (live or seed) ───────────────────
  const milestones = useMemo(() => {
    if (!hasLiveData) return SEED_MILESTONES
    const now = Date.now()
    const items = rows
      .filter((r) => r.dueMs && r.dueMs >= now - 7 * DAY)
      .sort((a, b) => (a.dueMs ?? 0) - (b.dueMs ?? 0))
      .slice(0, 5)
      .map((r) => {
        const status =
          r.status === "complete"
            ? { status: "Completed", color: "text-emerald-600" }
            : r.status === "at_risk"
            ? { status: "At Risk", color: "text-amber-600" }
            : { status: "Planned", color: "text-slate-500" }
        return { name: r.title, date: r.dueMs ? fmtLong(r.dueMs) : "—", ...status }
      })
    return items
  }, [rows, hasLiveData])

  const bottlenecks = useMemo(() => {
    if (!hasLiveData) return SEED_BOTTLENECKS
    return rows
      .filter((r) => r.status === "at_risk")
      .slice(0, 4)
      .map((r) => ({
        title: r.title,
        desc: `${r.property} — overdue or blocked, due ${r.dueDate}`,
        priority: "High" as const,
        icon: AlertTriangle,
        color: "text-red-500",
      }))
  }, [rows, hasLiveData])

  const aiRecs = useMemo(() => {
    if (!hasLiveData) return SEED_AI_RECS
    const atRisk = rows.filter((r) => r.status === "at_risk")
    const notStarted = rows.filter((r) => r.status === "not_started")
    const recs: { text: string; sub: string }[] = []
    atRisk.slice(0, 2).forEach((r) =>
      recs.push({ text: `${r.title} is overdue — reassign or escalate`, sub: "Heuristic suggestion" })
    )
    if (notStarted.length > 0)
      recs.push({
        text: `${notStarted.length} item${notStarted.length === 1 ? "" : "s"} not started — schedule to avoid delays`,
        sub: "Heuristic suggestion",
      })
    if (recs.length === 0)
      recs.push({ text: "Pipeline is on track — no bottlenecks detected", sub: "Heuristic suggestion" })
    return recs
  }, [rows, hasLiveData])

  // ─── Export current rows to CSV ──────────────────────────────────────────
  const handleExport = () => {
    const headers = ["#", "Type", "Title", "Reference", "Property", "Start", "Due", "Progress", "Status"]
    const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`
    const lines = [headers.join(",")]
    rows.forEach((r) => {
      lines.push(
        [r.num, r.type, r.title, r.ref, r.property, r.startDate, r.dueDate, `${r.progress}%`, r.status]
          .map((v) => escape(String(v)))
          .join(",")
      )
    })
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `gantt-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <PageHeader
        title="Gantt"
        description="Timeline planning and dependencies"
        actions={
          <>
            <Link
              href="/app/work/tasks/new"
              className="flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] text-white rounded-lg text-[13px] font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Create Task
            </Link>
            <Link
              href="/app/work/jobs/new"
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-[13px] font-medium hover:bg-slate-50 transition-colors"
            >
              <Plus className="w-4 h-4" /> Create Job
            </Link>
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-[13px] font-medium hover:bg-slate-50 transition-colors"
            >
              <Download className="w-4 h-4" /> Export
            </button>
            <Link
              href="/app/work"
              className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white rounded-lg text-[13px] font-medium hover:bg-violet-700 transition-colors"
            >
              <Sparkles className="w-4 h-4" /> Ask AI
            </Link>
          </>
        }
      />

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-3 h-[68px] animate-pulse">
                <div className="w-9 h-9 rounded-xl bg-slate-100" />
              </div>
            ))
          : kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
      </div>

      {/* Tab Nav */}
      <WorkTabNav />

      {/* Controls bar */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex items-center gap-2 flex-wrap">
        {/* View sub-tabs */}
        <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
          {([
            { label: "Gantt", href: null },
            { label: "Timeline", href: "/app/work/ppm/timeline" },
            { label: "List", href: "/app/work/tasks" },
            { label: "Board", href: "/app/work/board" },
            { label: "Calendar", href: "/app/calendar" },
          ] as const).map((v) =>
            v.href ? (
              <Link
                key={v.label}
                href={v.href}
                className="px-3 py-1.5 rounded-md text-[12px] font-medium transition-all text-slate-500 hover:text-slate-700"
              >
                {v.label}
              </Link>
            ) : (
              <span
                key={v.label}
                className="px-3 py-1.5 rounded-md text-[12px] font-medium bg-white text-[#2563EB] shadow-sm"
              >
                {v.label}
              </span>
            )
          )}
        </div>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* Date navigation */}
        <button
          type="button"
          onClick={() => setOffsetUnits((o) => o - 1)}
          className="p-1.5 rounded-lg hover:bg-slate-100"
          aria-label="Previous period"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-[13px] font-medium text-slate-700 whitespace-nowrap">{dateLabel}</span>
        <button
          type="button"
          onClick={() => setOffsetUnits((o) => o + 1)}
          className="p-1.5 rounded-lg hover:bg-slate-100"
          aria-label="Next period"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setOffsetUnits(0)}
          className="px-3 py-1.5 border border-slate-200 rounded-lg text-[12px] font-medium text-slate-600 hover:bg-slate-50"
        >
          Today
        </button>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* Zoom */}
        <span className="text-[12px] text-slate-500">Zoom:</span>
        {(["Week", "Month", "Quarter"] as Zoom[]).map((z) => (
          <button
            key={z}
            type="button"
            onClick={() => setZoom(z)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all",
              z === zoom
                ? "bg-blue-50 text-[#2563EB] border border-[#BFDBFE]"
                : "text-slate-500 hover:text-slate-700 border border-transparent"
            )}
          >
            {z}
          </button>
        ))}

        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* Critical Path toggle (visual) */}
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-slate-600">Critical Path</span>
          <button type="button" className="w-9 h-5 rounded-full bg-[#2563EB] relative" aria-label="Critical path">
            <span className="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow-sm" />
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/app/work/tasks"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-[12px] text-slate-600 hover:bg-slate-50"
          >
            <Filter className="w-3.5 h-3.5" /> Filters
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] text-slate-500">Group by</span>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
              className="border border-slate-200 rounded-lg px-2 py-1.5 text-[12px] text-slate-700 bg-white"
            >
              <option value="Property">Property</option>
              <option value="Assignee">Assignee</option>
              <option value="Status">Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Gantt table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden overflow-x-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-9 rounded-lg bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-[13px] text-slate-400">
            No tasks or jobs with dates to display yet.
          </div>
        ) : (
          <>
            <GanttHeader columns={columns} />
            {rows.map((row, i) => (
              <GanttRowItem key={row.id} row={row} index={i} onOpen={(href) => router.push(href)} />
            ))}
          </>
        )}
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Milestones */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold text-slate-700">Milestones</h3>
            <Link href="/app/work/jobs" className="text-[11px] text-[#2563EB] hover:underline">View all →</Link>
          </div>
          <div className="space-y-3">
            {milestones.length === 0 ? (
              <p className="text-[11px] text-slate-400">No upcoming milestones.</p>
            ) : (
              milestones.map((m, i) => (
                <div key={`${m.name}-${i}`} className="flex items-start gap-2">
                  <span className="text-violet-600 text-[10px] mt-0.5">◆</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium text-slate-700 truncate">{m.name}</p>
                    <p className="text-[10px] text-slate-400">{m.date}</p>
                  </div>
                  <span className={cn("text-[10px] font-semibold shrink-0", m.color)}>{m.status}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bottlenecks */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
          <h3 className="text-[13px] font-semibold text-slate-700 mb-3">Bottlenecks</h3>
          <div className="space-y-3">
            {bottlenecks.length === 0 ? (
              <p className="text-[11px] text-slate-400">No bottlenecks detected.</p>
            ) : (
              bottlenecks.map((b, i) => {
                const Icon = b.icon
                return (
                  <div key={`${b.title}-${i}`} className="flex items-start gap-2">
                    <Icon className={cn("w-3.5 h-3.5 shrink-0 mt-0.5", b.color)} />
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-slate-700">{b.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{b.desc}</p>
                      <span
                        className={cn(
                          "inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                          b.priority === "High" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                        )}
                      >
                        {b.priority}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-violet-500" />
            <h3 className="text-[13px] font-semibold text-slate-700">AI Recommendations</h3>
            <span className="ml-auto text-[9px] font-medium text-slate-400 uppercase tracking-wide">Heuristic</span>
          </div>
          <div className="space-y-3">
            {aiRecs.map((r, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[11.5px] text-slate-700">{r.text}</p>
                  <p className="text-[10px] text-emerald-600 mt-0.5">{r.sub}</p>
                </div>
                <Link
                  href="/app/work"
                  className="shrink-0 px-2 py-1 text-[10px] font-semibold text-[#2563EB] border border-[#BFDBFE] rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Apply
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
          <h3 className="text-[13px] font-semibold text-slate-700 mb-3">Legend</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {LEGEND.map((l) => (
              <div key={l.label} className="flex items-center gap-2">
                <div className={cn("w-3 h-3 rounded-sm shrink-0", l.color)} />
                <span className="text-[11px] text-slate-600">{l.label}</span>
              </div>
            ))}
            {/* Milestone swatch */}
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-violet-600 rotate-45 shrink-0" />
              <span className="text-[11px] text-slate-600">Milestone</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-sm shrink-0" />
              <span className="text-[11px] text-slate-600">In Progress</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
