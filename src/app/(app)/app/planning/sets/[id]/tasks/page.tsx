"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
  AlertTriangle,
  Plus,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  List,
  LayoutGrid,
  ArrowRight,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { PlanningTask, TaskStatus, TaskPriority } from "@/lib/planning/types"

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className ?? ""}`} />
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

interface KpiProps {
  label: string
  value: React.ReactNode
  trend?: React.ReactNode
  loading?: boolean
  accent?: string
}

function KpiCard({ label, value, trend, loading, accent }: KpiProps) {
  if (loading) return <Skeleton className="h-24 w-full" />
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-1.5">
      <div className="text-xs text-slate-500 font-medium">{label}</div>
      <div className={`text-[17px] font-bold leading-tight ${accent ?? "text-slate-900"}`}>{value}</div>
      {trend && <div className="text-[11px] text-slate-400">{trend}</div>}
    </div>
  )
}

// ── Mini donut for AI score ───────────────────────────────────────────────────

function ScoreDonut({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 16
  const offset = circumference - (score / 100) * circumference
  return (
    <div className="flex items-center gap-1.5">
      <div className="relative w-8 h-8">
        <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="16" fill="none" stroke="#E2E8F0" strokeWidth="4" />
          <circle cx="18" cy="18" r="16" fill="none" stroke="#10B981" strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-slate-700">{score}</span>
      </div>
      <span className="text-[17px] font-bold text-slate-900">{score}/100</span>
    </div>
  )
}

// ── Priority config ───────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; cls: string }> = {
  urgent: { label: "Urgent", cls: "bg-red-200 text-red-800" },
  high:   { label: "High",   cls: "bg-red-100 text-red-700" },
  medium: { label: "Medium", cls: "bg-amber-100 text-amber-700" },
  low:    { label: "Low",    cls: "bg-slate-100 text-slate-600" },
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TaskStatus, { label: string; cls: string }> = {
  not_started: { label: "Not Started", cls: "bg-slate-100 text-slate-600" },
  in_progress: { label: "In Progress", cls: "bg-blue-100 text-blue-700" },
  completed:   { label: "Completed",   cls: "bg-emerald-100 text-emerald-700" },
  overdue:     { label: "Overdue",     cls: "bg-red-100 text-red-700" },
}

// ── Avatar initials ───────────────────────────────────────────────────────────

function Avatar({ name }: { name: string }) {
  const parts = name.trim().split(" ")
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase()
  const colors = ["bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-red-400"]
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 ${color}`}>
      {initials}
    </div>
  )
}

// ── Static task data ──────────────────────────────────────────────────────────

interface DisplayTask {
  id: string
  title: string
  owner: string
  priority: TaskPriority
  dueDate: string
  module: string
  status: TaskStatus
}

const OVERDUE_TASKS: DisplayTask[] = [
  { id: "t1", title: "Confirm planning pre-application", owner: "Emma Turner", priority: "high", dueDate: "10 May 2025", module: "8. Compliance", status: "overdue" },
  { id: "t2", title: "Upload energy assessment", owner: "Michael Chen", priority: "high", dueDate: "12 May 2025", module: "14. Documents", status: "overdue" },
  { id: "t3", title: "Verify landlord offer assumptions", owner: "James Taylor", priority: "high", dueDate: "14 May 2025", module: "9. Landlord Offer", status: "overdue" },
  { id: "t4", title: "Update capex estimates", owner: "Sarah Patel", priority: "medium", dueDate: "15 May 2025", module: "7. Upfront Costs", status: "overdue" },
  { id: "t5", title: "Run sensitivity on rental uplift", owner: "James Taylor", priority: "medium", dueDate: "16 May 2025", module: "11. Scenarios", status: "overdue" },
]

const DUE_SOON_TASKS: DisplayTask[] = [
  { id: "t6", title: "Fire safety compliance check", owner: "Emma Turner", priority: "high", dueDate: "20 May 2025", module: "8. Compliance", status: "in_progress" },
  { id: "t7", title: "Refine operating expenses", owner: "Sarah Patel", priority: "medium", dueDate: "21 May 2025", module: "5. Expenses", status: "in_progress" },
  { id: "t8", title: "Review room mix sensitivity", owner: "James Taylor", priority: "medium", dueDate: "22 May 2025", module: "4. Rooms & Units", status: "in_progress" },
  { id: "t9", title: "Validate management fee", owner: "Michael Chen", priority: "medium", dueDate: "22 May 2025", module: "5. Expenses", status: "not_started" },
  { id: "t10", title: "Update refurbishment schedule", owner: "Sarah Patel", priority: "low", dueDate: "23 May 2025", module: "7. Upfront Costs", status: "not_started" },
  { id: "t11", title: "Confirm mortgage terms", owner: "Michael Chen", priority: "low", dueDate: "24 May 2025", module: "3. Income", status: "not_started" },
]

const COMPLETED_TASKS: DisplayTask[] = [
  { id: "t12", title: "Initial plan setup", owner: "James Taylor", priority: "low", dueDate: "05 May 2025", module: "1. Overview", status: "completed" },
  { id: "t13", title: "Collect property documents", owner: "Emma Turner", priority: "low", dueDate: "06 May 2025", module: "14. Documents", status: "completed" },
]

// ── Task Row ──────────────────────────────────────────────────────────────────

function TaskRow({ task }: { task: DisplayTask }) {
  const priorityCfg = PRIORITY_CONFIG[task.priority]
  const statusCfg = STATUS_CONFIG[task.status]
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
      <div className="w-3.5 h-3.5 rounded border-2 border-slate-300 flex-shrink-0 cursor-pointer hover:border-violet-400 transition-colors" />
      <div className="flex-1 min-w-0 flex items-center gap-2.5 flex-wrap">
        <span className="text-xs font-medium text-slate-800 truncate">{task.title}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
        <div className="flex items-center gap-1.5">
          <Avatar name={task.owner} />
          <span className="text-[10px] text-slate-500 hidden md:inline">{task.owner.split(" ")[0]}</span>
        </div>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${priorityCfg.cls}`}>
          {priorityCfg.label}
        </span>
        <span className="text-[10px] text-slate-400 whitespace-nowrap hidden lg:inline">{task.dueDate}</span>
        <span className="text-[10px] text-slate-400 hidden xl:inline">{task.module}</span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusCfg.cls}`}>
          {statusCfg.label}
        </span>
        <button className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
          <MoreHorizontal className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>
    </div>
  )
}

// ── Section Group ─────────────────────────────────────────────────────────────

function TaskGroup({
  label,
  count,
  tasks,
  labelColor,
  defaultExpanded = true,
}: {
  label: string
  count: number
  tasks: DisplayTask[]
  labelColor: string
  defaultExpanded?: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  return (
    <div className="overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
        )}
        <span className={`text-[11px] font-bold uppercase tracking-wide ${labelColor}`}>{label}</span>
        <span className="text-[10px] font-semibold text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded-full">{count}</span>
      </button>
      {expanded && (
        <div>
          {tasks.map((t) => <TaskRow key={t.id} task={t} />)}
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const params = useParams()
  const id = params.id as string

  const [tasks, setTasks] = useState<PlanningTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"list" | "board">("list")

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const { data, error: err } = await supabase
          .from("planning_tasks")
          .select("*")
          .eq("planning_set_id", id)
          .order("due_date", { ascending: true, nullsFirst: false })
        if (err) throw err
        setTasks((data ?? []) as PlanningTask[])
      } catch {
        setError("Failed to load tasks.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <div className="text-slate-700 font-semibold">{error}</div>
      </div>
    )
  }

  // Merge live tasks into grouped display (use live data if available)
  const overdue = tasks.length > 0
    ? tasks.filter((t) => t.status === "overdue")
    : OVERDUE_TASKS

  const dueSoon = tasks.length > 0
    ? tasks.filter((t) => t.status === "in_progress" || t.status === "not_started")
    : DUE_SOON_TASKS

  const completed = tasks.length > 0
    ? tasks.filter((t) => t.status === "completed")
    : COMPLETED_TASKS

  // Adapter so live tasks can use TaskRow
  function toDisplay(t: PlanningTask): DisplayTask {
    return {
      id: t.id,
      title: t.title,
      owner: t.owner_name ?? "Unassigned",
      priority: t.priority,
      dueDate: t.due_date ? new Date(t.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—",
      module: t.module_ref ?? "—",
      status: t.status,
    }
  }

  const overdueDisplay: DisplayTask[] = tasks.length > 0 ? (overdue as PlanningTask[]).map(toDisplay) : OVERDUE_TASKS
  const dueSoonDisplay: DisplayTask[] = tasks.length > 0 ? (dueSoon as PlanningTask[]).map(toDisplay) : DUE_SOON_TASKS
  const completedDisplay: DisplayTask[] = tasks.length > 0 ? (completed as PlanningTask[]).map(toDisplay) : COMPLETED_TASKS

  const totalTasks = overdueDisplay.length + dueSoonDisplay.length + completedDisplay.length

  return (
    <div className="flex flex-col gap-5">

      {/* ── KPI Strip ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiCard
          loading={loading}
          label="Open Tasks"
          value={overdueDisplay.length + dueSoonDisplay.length}
          trend={
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-red-600">
              <TrendingUp className="w-3 h-3" /> ↑ 3 vs last 7d
            </span>
          }
        />
        <KpiCard
          loading={loading}
          label="Overdue Items"
          value={overdueDisplay.length}
          accent="text-red-600"
          trend={
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600">
              <TrendingDown className="w-3 h-3" /> ↓ 1 vs last 7d
            </span>
          }
        />
        <KpiCard
          loading={loading}
          label="AI Review Score"
          value={<ScoreDonut score={82} />}
          trend="↑ 6 pts vs last review"
        />
        <KpiCard
          loading={loading}
          label="Activity Freshness"
          value="2h"
          trend="Last updated"
        />
      </div>

      {/* ── Section Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-slate-900">10A Tasks</h2>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-xl border border-slate-200 overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={`h-8 px-3 flex items-center gap-1.5 text-xs font-medium transition-colors ${viewMode === "list" ? "bg-[#7C3AED] text-white" : "text-slate-500 hover:bg-slate-50"}`}
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
            <button
              onClick={() => setViewMode("board")}
              className={`h-8 px-3 flex items-center gap-1.5 text-xs font-medium transition-colors ${viewMode === "board" ? "bg-[#7C3AED] text-white" : "text-slate-500 hover:bg-slate-50"}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Board
            </button>
          </div>
          <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            Filter
          </button>
          <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            Group
          </button>
          <button className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl bg-[#7C3AED] text-white text-xs font-semibold hover:bg-violet-700 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Add Task
          </button>
        </div>
      </div>

      {/* ── Task Table ─────────────────────────────────────────────────────── */}
      {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="grid px-4 py-2 bg-slate-50 border-b border-slate-100" style={{ gridTemplateColumns: "1fr auto" }}>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Task</span>
            <div className="flex items-center gap-6 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
              <span className="hidden md:block">Owner</span>
              <span>Priority</span>
              <span className="hidden lg:block">Due Date</span>
              <span className="hidden xl:block">Module</span>
              <span>Status</span>
              <span className="w-6" />
            </div>
          </div>

          <TaskGroup label="Overdue" count={overdueDisplay.length} tasks={overdueDisplay} labelColor="text-red-600" />
          <TaskGroup label="Due Soon" count={dueSoonDisplay.length} tasks={dueSoonDisplay} labelColor="text-amber-600" />
          <TaskGroup label={`Completed (${completedDisplay.length})`} count={completedDisplay.length} tasks={completedDisplay} labelColor="text-emerald-600" defaultExpanded={false} />

          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Showing {totalTasks} of {totalTasks} tasks</span>
            <button className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#7C3AED] hover:underline">
              View completed tasks
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
