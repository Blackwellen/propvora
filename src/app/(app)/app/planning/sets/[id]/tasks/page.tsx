"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
  Plus,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  List,
  LayoutGrid,
  CheckCircle2,
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

// ── Display adapter ───────────────────────────────────────────────────────────

interface DisplayTask {
  id: string
  title: string
  owner: string
  priority: TaskPriority
  dueDate: string
  module: string
  status: TaskStatus
}

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
  if (tasks.length === 0) return null
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
  const [viewMode, setViewMode] = useState<"list" | "board">("list")

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    async function load() {
      setLoading(true)
      // planning_tasks is not yet provisioned (42P01) — swallow to empty.
      const { data, error } = await supabase
        .from("planning_tasks")
        .select("*")
        .eq("planning_set_id", id)
        .order("due_date", { ascending: true, nullsFirst: false })
      setTasks(error ? [] : ((data ?? []) as PlanningTask[]))
      setLoading(false)
    }
    load()
  }, [id])

  const overdueDisplay = tasks.filter((t) => t.status === "overdue").map(toDisplay)
  const dueSoonDisplay = tasks.filter((t) => t.status === "in_progress" || t.status === "not_started").map(toDisplay)
  const completedDisplay = tasks.filter((t) => t.status === "completed").map(toDisplay)

  const totalTasks = tasks.length

  return (
    <div className="flex flex-col gap-5">

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiCard loading={loading} label="Open Tasks" value={overdueDisplay.length + dueSoonDisplay.length} />
        <KpiCard loading={loading} label="Overdue Items" value={overdueDisplay.length} accent="text-red-600" />
        <KpiCard loading={loading} label="Completed" value={completedDisplay.length} accent="text-emerald-600" />
        <KpiCard loading={loading} label="Total Tasks" value={totalTasks} />
      </div>

      {/* ── Section Header ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-slate-900">10A Tasks</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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
          <button className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl bg-[#7C3AED] text-white text-xs font-semibold hover:bg-violet-700 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Add Task
          </button>
        </div>
      </div>

      {/* ── Task Table / empty state ── */}
      {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : totalTasks === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-slate-400" />
          </div>
          <div className="text-sm font-semibold text-slate-700">No tasks yet</div>
          <p className="text-xs text-slate-400 max-w-sm">
            Add tasks to track the work needed to bring this planning set to conversion.
          </p>
          <button className="mt-1 inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl bg-[#7C3AED] text-white text-xs font-semibold hover:bg-violet-700 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Add Task
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[480px]">
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
              <TaskGroup label="Completed" count={completedDisplay.length} tasks={completedDisplay} labelColor="text-emerald-600" defaultExpanded={false} />
            </div>
          </div>

          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Showing {totalTasks} of {totalTasks} task{totalTasks === 1 ? "" : "s"}</span>
          </div>
        </div>
      )}
    </div>
  )
}
