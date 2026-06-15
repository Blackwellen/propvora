"use client"

import React, { useState, useMemo, useCallback } from "react"
import Link from "next/link"
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Plus,
  Sparkles,
  Filter,
  MoreHorizontal,
  CheckCircle2,
  TrendingDown,
  Clock,
  FileText,
  ClipboardList,
  AlertTriangle,
  Calendar,
  Briefcase,
  Download,
  GripVertical,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/layout/PageContainer"
import { WorkTabNav } from "@/components/work/WorkTabNav"
import { MobileTopBar } from "@/components/mobile"
import { WorkKpiStrip, type WorkKpi } from "@/components/work/WorkKpiStrip"
import { useWorkspace } from "@/providers/AuthProvider"
import { useTasks } from "@/hooks/useTasks"
import { createClient } from "@/lib/supabase/client"
import { useQueryClient } from "@tanstack/react-query"
import type { Task, TaskStatus } from "@/types/database"

// ─── Column definitions ────────────────────────────────────────────────────────

interface ColumnDef {
  key: TaskStatus
  label: string
  headerColor: string
  dotColor: string
}

const COLUMN_DEFS: ColumnDef[] = [
  {
    key: "todo",
    label: "To Do",
    headerColor: "border-slate-300",
    dotColor: "bg-slate-400",
  },
  {
    key: "in_progress",
    label: "In Progress",
    headerColor: "border-blue-400",
    dotColor: "bg-blue-500",
  },
  {
    key: "blocked",
    label: "Blocked",
    headerColor: "border-amber-400",
    dotColor: "bg-amber-400",
  },
  {
    key: "done",
    label: "Done",
    headerColor: "border-emerald-400",
    dotColor: "bg-emerald-500",
  },
  {
    key: "cancelled",
    label: "Cancelled",
    headerColor: "border-slate-300",
    dotColor: "bg-slate-400",
  },
]

// Set of valid column status keys for quick look-up
const COLUMN_STATUS_SET = new Set<string>(COLUMN_DEFS.map((c) => c.key))

// ─── Priority colours ──────────────────────────────────────────────────────────

const PRIORITY_RAIL: Record<string, string> = {
  urgent: "bg-red-500",
  high:   "bg-orange-400",
  medium: "bg-amber-400",
  low:    "bg-slate-300",
}

const PRIORITY_BADGE: Record<string, string> = {
  urgent: "bg-red-100 text-red-700",
  high:   "bg-orange-100 text-orange-700",
  medium: "bg-amber-100 text-amber-700",
  low:    "bg-slate-100 text-slate-600",
}

// ─── KPI Strip (live-computed) ─────────────────────────────────────────────────

function buildKpis(tasks: Task[]): WorkKpi[] {
  const open      = tasks.filter(t => t.status !== "done" && t.status !== "cancelled").length
  const overdue   = tasks.filter(t => {
    if (!t.due_date) return false
    return new Date(t.due_date) < new Date() && t.status !== "done" && t.status !== "cancelled"
  }).length
  const cancelled = tasks.filter(t => t.status === "cancelled").length
  const blocked   = tasks.filter(t => t.status === "blocked").length
  const doneCount = tasks.filter(t => t.status === "done").length
  const total     = tasks.length
  const rate      = total > 0 ? Math.round((doneCount / total) * 100) : 0

  return [
    {
      icon: Briefcase,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      value: open,
      label: "Open Work",
    },
    {
      icon: AlertTriangle,
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
      value: overdue,
      label: "Overdue",
    },
    {
      icon: TrendingDown,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      value: blocked,
      label: "Blocked",
    },
    {
      icon: Clock,
      iconBg: "bg-slate-50",
      iconColor: "text-slate-600",
      value: cancelled,
      label: "Cancelled",
    },
    {
      ring: true,
      ringColor: "#2563EB",
      value: rate,
      label: "Completion Rate",
    },
  ]
}

// ─── Determine target status from an over id ──────────────────────────────────
// over.id is either a column status string OR a task UUID.
// If it's a column key we use it directly; otherwise we search the task list.

function resolveTargetStatus(
  overId: UniqueIdentifier,
  tasks: Task[]
): TaskStatus | null {
  const overStr = String(overId)
  if (COLUMN_STATUS_SET.has(overStr)) {
    return overStr as TaskStatus
  }
  const found = tasks.find((t) => t.id === overStr)
  return found ? found.status : null
}

// ─── TaskCard (plain display, used inside SortableTaskCard + DragOverlay) ─────

interface TaskCardProps {
  task: Task
  isDragging?: boolean
}

function TaskCard({ task, isDragging = false }: TaskCardProps) {
  const isOverdue = task.due_date
    ? new Date(task.due_date) < new Date() && task.status !== "done"
    : false
  const isDone = task.status === "done"

  return (
    <div
      className={cn(
        "bg-white border rounded-xl p-3 transition-all group select-none",
        isOverdue ? "border-red-200 bg-red-50/30" : "border-slate-200",
        isDone && "opacity-70",
        isDragging
          ? "shadow-2xl ring-2 ring-blue-400/50 opacity-90 rotate-1 cursor-grabbing"
          : "hover:shadow-md cursor-grab"
      )}
    >
      {/* Drag handle row */}
      <div className="flex items-start gap-2 mb-2">
        <GripVertical className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-1" />
        <div
          className={cn(
            "w-1 h-10 rounded-full shrink-0 mt-0.5",
            PRIORITY_RAIL[task.priority ?? "low"] ?? "bg-slate-300"
          )}
        />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-slate-800 leading-snug group-hover:text-[#2563EB] transition-colors truncate">
            {isDone && (
              <CheckCircle2 className="inline w-3.5 h-3.5 text-emerald-500 mr-1" />
            )}
            {task.title}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5 truncate">
            {task.property_id ?? "—"}
          </p>
        </div>
      </div>

      {/* Due + priority badge */}
      {task.due_date && (
        <div className="flex items-center gap-2 mb-2 pl-5">
          <div
            className={cn(
              "flex items-center gap-1 text-[11px] font-medium",
              isOverdue ? "text-red-500" : "text-slate-500"
            )}
          >
            <Calendar className="w-3 h-3" />
            {new Date(task.due_date).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}
            {isOverdue && (
              <span className="text-[10px] text-red-500">· Overdue</span>
            )}
          </div>
          {task.priority && (
            <span
              className={cn(
                "text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize",
                PRIORITY_BADGE[task.priority] ?? "bg-slate-100 text-slate-600"
              )}
            >
              {task.priority}
            </span>
          )}
        </div>
      )}

      {/* Detail link — only rendered when not in overlay (no pointer events while dragging anyway) */}
      {!isDragging && (
        <Link
          href={`/app/work/tasks/${task.id}`}
          onClick={(e) => e.stopPropagation()}
          className="block text-[11px] text-[#2563EB] hover:underline pl-5 truncate"
        >
          View details →
        </Link>
      )}
    </div>
  )
}

// ─── SortableTaskCard ──────────────────────────────────────────────────────────

function SortableTaskCard({ task }: { task: Task }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    // keep a ghost placeholder visible in the source column while dragging
    opacity: isDragging ? 0.35 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} isDragging={false} />
    </div>
  )
}

// ─── DroppableColumn wrapper ───────────────────────────────────────────────────

function DroppableColumn({
  columnKey,
  children,
}: {
  columnKey: TaskStatus
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnKey })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col gap-2.5 min-h-[120px] rounded-xl transition-colors p-1 -m-1",
        isOver && "bg-blue-50/60"
      )}
    >
      {children}
    </div>
  )
}

// ─── KanbanColumn ──────────────────────────────────────────────────────────────

function KanbanColumn({
  col,
  tasks,
}: {
  col: ColumnDef
  tasks: Task[]
}) {
  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks])

  return (
    <div className="w-64 flex-shrink-0">
      {/* Column header */}
      <div
        className={cn(
          "flex items-center justify-between mb-3 pb-2 border-b-2",
          col.headerColor
        )}
      >
        <div className="flex items-center gap-2">
          <span className={cn("w-2 h-2 rounded-full", col.dotColor)} />
          <span className="text-sm font-semibold text-slate-700">{col.label}</span>
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
            {tasks.length}
          </span>
        </div>
        <button className="p-1 rounded hover:bg-slate-100 text-slate-400">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Sortable card list + column drop target */}
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <DroppableColumn columnKey={col.key}>
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} />
          ))}

          {/* Add task button always visible at bottom */}
          <Link
            href="/app/work/tasks/new"
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl border border-dashed border-slate-200 text-[12.5px] text-slate-400 hover:border-slate-300 hover:text-slate-600 hover:bg-slate-50 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Task
          </Link>
        </DroppableColumn>
      </SortableContext>
    </div>
  )
}

// ─── Loading skeleton ──────────────────────────────────────────────────────────

function BoardSkeleton() {
  return (
    <div className="flex gap-4 items-start overflow-x-auto pb-4">
      {COLUMN_DEFS.map((col) => (
        <div key={col.key} className="w-64 flex-shrink-0 space-y-2.5">
          <div className="h-8 bg-slate-100 rounded-lg animate-pulse" />
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function WorkBoardPage() {
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id
  const queryClient = useQueryClient()
  const supabase = createClient()

  const { data: tasks = [], isLoading, error, refetch } = useTasks(workspaceId)

  const [priorityFilter, setPriorityFilter] = useState("all")

  // Local task list for optimistic updates
  const [localTasks, setLocalTasks] = useState<Task[] | null>(null)
  // Use localTasks if set (during/after drag), otherwise fall back to server tasks
  const displayTasks = localTasks ?? tasks

  // Sync localTasks when server data refreshes (if no active drag)
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  // Keep localTasks in sync with server data whenever it changes and we're not mid-drag
  React.useEffect(() => {
    if (!activeTask) {
      setLocalTasks(null) // let displayTasks fall back to fresh server data
    }
  }, [tasks, activeTask])

  const filteredTasks = useMemo(() => {
    if (priorityFilter === "all") return displayTasks
    return displayTasks.filter((t) => t.priority === priorityFilter)
  }, [displayTasks, priorityFilter])

  const kpis = useMemo(() => buildKpis(displayTasks), [displayTasks])

  // Group tasks by column
  const columnTasks = useMemo(() => {
    const map: Record<string, Task[]> = {}
    for (const col of COLUMN_DEFS) {
      map[col.key] = filteredTasks.filter((t) => t.status === col.key)
    }
    return map
  }, [filteredTasks])

  // ─── dnd-kit sensors ───────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // Require a small movement before triggering drag so clicks on links still work
        distance: 6,
      },
    })
  )

  // ─── Drag start ────────────────────────────────────────────────────────────
  function handleDragStart(event: DragStartEvent) {
    const { active } = event
    const found = displayTasks.find((t) => t.id === String(active.id))
    if (found) {
      setActiveTask(found)
      // Snapshot current display tasks into local state so optimistic moves work
      setLocalTasks([...displayTasks])
    }
  }

  // ─── Drag over (live column highlight handled by DroppableColumn) ──────────
  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over || !localTasks) return

    const targetStatus = resolveTargetStatus(over.id, localTasks)
    if (!targetStatus) return

    const activeId = String(active.id)
    const currentTask = localTasks.find((t) => t.id === activeId)
    if (!currentTask || currentTask.status === targetStatus) return

    // Optimistically move the task to the target column while hovering
    setLocalTasks((prev) =>
      (prev ?? []).map((t) =>
        t.id === activeId ? { ...t, status: targetStatus } : t
      )
    )
  }

  // ─── Drag end ──────────────────────────────────────────────────────────────
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      setActiveTask(null)

      if (!over) {
        // Dropped outside — revert
        setLocalTasks(null)
        return
      }

      const activeId = String(active.id)
      const targetStatus = resolveTargetStatus(over.id, localTasks ?? tasks)

      if (!targetStatus) {
        setLocalTasks(null)
        return
      }

      const originalTask = tasks.find((t) => t.id === activeId)
      if (!originalTask) {
        setLocalTasks(null)
        return
      }

      // No-op if status unchanged
      if (originalTask.status === targetStatus) {
        setLocalTasks(null)
        return
      }

      // Persist to Supabase
      try {
        const { error: updateError } = await supabase
          .from("tasks")
          .update({ status: targetStatus })
          .eq("id", activeId)

        if (updateError) throw updateError

        // Invalidate query cache so background data stays in sync
        await queryClient.invalidateQueries({ queryKey: ["tasks", workspaceId] })
      } catch {
        // On error, revert optimistic update
        setLocalTasks(null)
      }
    },
    [localTasks, tasks, supabase, queryClient, workspaceId]
  )

  // ─── Drag cancel ───────────────────────────────────────────────────────────
  function handleDragCancel() {
    setActiveTask(null)
    setLocalTasks(null)
  }

  return (
    <div className="space-y-5">
      {/* Mobile top bar */}
      <MobileTopBar
        title="Board"
        subtitle="Kanban — swipe columns"
        primaryAction={{ label: "Create task", icon: Plus, href: "/app/work/tasks/new" }}
        overflowActions={[
          { label: "Create job", icon: Plus, href: "/app/work/jobs/new" },
          { label: "Refresh", icon: ClipboardList, onClick: () => refetch() },
        ]}
      />
      <div className="md:hidden -mx-4">
        <WorkTabNav />
      </div>

      {/* Page header */}
      <div className="hidden md:block">
      <PageHeader
        title="Board"
        description="Kanban operations control"
        actions={
          <>
            <Link
              href="/app/work/tasks/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Create Task
            </Link>
            <Link
              href="/app/work/jobs/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Create Job
            </Link>
            <button
              onClick={() => {
                const rows = displayTasks.map(t => [t.id, t.title, t.status, t.priority ?? "", t.property_id ?? "", t.due_date ?? ""].join(","))
                const csv = ["ID,Title,Status,Priority,Property,Due Date", ...rows].join("\n")
                const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "board-tasks.csv"; a.click()
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors shadow-sm">
              <Sparkles className="w-4 h-4" />
              Ask AI
            </button>
          </>
        }
      />
      </div>

      {/* KPI Strip */}
      <WorkKpiStrip kpis={kpis} />

      {/* Tab nav (desktop) */}
      <div className="hidden md:block">
        <WorkTabNav />
      </div>

      {/* Board controls bar */}
      <div className="hidden md:flex items-center gap-2 flex-wrap bg-white border border-slate-200 rounded-xl px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500 text-[13px]">Group by</span>
          <select className="border border-slate-200 rounded-lg px-3 py-1 text-[12.5px] text-slate-700 bg-white">
            <option>Status</option>
            <option>Priority</option>
            <option>Assignee</option>
            <option>Property</option>
          </select>
        </div>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-[12.5px] font-medium text-slate-600 hover:bg-slate-50">
          <Filter className="w-3.5 h-3.5" /> Filters
        </button>

        {/* Priority filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-[12.5px] text-slate-700 bg-white"
        >
          <option value="all">Priority: All</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="text-[12.5px] text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Mobile priority filter */}
      <div className="md:hidden flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden -mx-1 px-1">
        {[
          { value: "all", label: "All" },
          { value: "urgent", label: "Urgent" },
          { value: "high", label: "High" },
          { value: "medium", label: "Medium" },
          { value: "low", label: "Low" },
        ].map((p) => (
          <button
            key={p.value}
            onClick={() => setPriorityFilter(p.value)}
            aria-pressed={priorityFilter === p.value}
            className={cn(
              "shrink-0 min-h-[36px] px-3.5 rounded-xl text-[13px] font-semibold border transition-colors",
              priorityFilter === p.value
                ? "bg-[#2563EB] border-[#2563EB] text-white"
                : "bg-white border-[#E2EAF6] text-slate-600"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Failed to load tasks. Please refresh.
        </div>
      )}

      {/* Main board */}
      {isLoading ? (
        <BoardSkeleton />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="flex gap-4 items-start overflow-x-auto pb-4">
            {/* Kanban columns */}
            <div className="flex gap-4 min-w-0 flex-1">
              {COLUMN_DEFS.map((col) => (
                <KanbanColumn
                  key={col.key}
                  col={col}
                  tasks={columnTasks[col.key] ?? []}
                />
              ))}
            </div>

            {/* Right insight panel */}
            <div className="hidden xl:flex flex-col gap-4 w-72 shrink-0">
              {/* Board summary */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-900">Board Summary</h3>
                </div>
                {COLUMN_DEFS.map((col) => (
                  <div key={col.key} className="flex items-center gap-2 mb-2">
                    <span className={cn("w-2 h-2 rounded-full shrink-0", col.dotColor)} />
                    <span className="text-[12px] text-slate-700 flex-1">{col.label}</span>
                    <span className="text-[11px] font-semibold text-slate-600">
                      {columnTasks[col.key]?.length ?? 0}
                    </span>
                  </div>
                ))}
                <div className="pt-2 mt-2 border-t border-slate-100 flex justify-between text-[12px]">
                  <span className="text-slate-500">Total</span>
                  <span className="font-bold text-slate-800">{displayTasks.length}</span>
                </div>
              </div>

              {/* AI Recommendations */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-violet-600" />
                  <h3 className="text-sm font-semibold text-slate-900">AI Recommendations</h3>
                </div>
                {[
                  { icon: TrendingDown, text: "Review any blocked tasks",          action: "Review",   color: "text-red-500",    href: "/app/work/tasks" },
                  { icon: Clock,        text: "Check waiting-on-supplier items",   action: "Schedule", color: "text-amber-500",  href: "/app/work/ppm" },
                  { icon: FileText,     text: "Review supplier quotes",            action: "Review",   color: "text-violet-500", href: "/app/work/suppliers" },
                ].map((item, i) => {
                  const Icon = item.icon
                  return (
                    <div key={i} className="flex items-center gap-2 mb-2.5">
                      <Icon className={cn("w-3.5 h-3.5 shrink-0", item.color)} />
                      <span className="text-[12px] text-slate-600 flex-1">{item.text}</span>
                      <Link href={item.href} className="text-[11px] font-semibold text-[#2563EB] hover:underline shrink-0">
                        {item.action}
                      </Link>
                    </div>
                  )
                })}
                <Link href="/app/work" className="text-[12px] font-semibold text-violet-600 hover:underline mt-1 block">
                  Ask AI for more insights →
                </Link>
              </div>

              {/* Recent Activity */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-900">Recently Updated</h3>
                  <Link href="/app/work" className="text-[12px] text-[#2563EB] hover:underline">View all</Link>
                </div>
                {displayTasks.slice(0, 4).map((t) => (
                  <div key={t.id} className="flex items-start gap-2 mb-3">
                    <ClipboardList className="w-4 h-4 mt-0.5 text-blue-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-slate-700 leading-snug truncate">{t.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 capitalize">{t.status?.replace("_", " ")}</p>
                    </div>
                  </div>
                ))}
                {displayTasks.length === 0 && (
                  <p className="text-[12px] text-slate-400">No tasks yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Drag overlay — floats above everything while dragging */}
          <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
            {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}
