"use client"

import React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { TaskItem } from "./TaskListItem"
import { Clock, AlertCircle } from "lucide-react"

const COLUMNS: { key: TaskItem["status"]; label: string; color: string; bg: string }[] = [
  { key: "to_do", label: "To Do", color: "text-slate-600", bg: "bg-slate-100" },
  { key: "in_progress", label: "In Progress", color: "text-[#2563EB]", bg: "bg-blue-100" },
  { key: "waiting", label: "Waiting", color: "text-[#F59E0B]", bg: "bg-amber-100" },
  { key: "blocked", label: "Blocked", color: "text-[#EF4444]", bg: "bg-red-100" },
  { key: "done", label: "Done", color: "text-[#10B981]", bg: "bg-emerald-100" },
]

const priorityDots: Record<string, string> = {
  critical: "bg-[#EF4444]",
  high: "bg-[#F59E0B]",
  medium: "bg-[#2563EB]",
  low: "bg-slate-300",
}

function isOverdue(dateStr?: string) {
  return dateStr ? new Date(dateStr) < new Date() : false
}

interface TaskCardProps { task: TaskItem }

function TaskCard({ task }: TaskCardProps) {
  const overdue = isOverdue(task.dueDate) && task.status !== "done"
  return (
    <Link
      href={`/app/work/${task.type}s/${task.id}`}
      className={cn(
        "block bg-white rounded-xl border border-[#E2E8F0] p-3 shadow-sm",
        "hover:shadow-md hover:-translate-y-0.5 transition-all duration-150"
      )}
    >
      {/* Priority dot + title */}
      <div className="flex items-start gap-2 mb-2">
        <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", priorityDots[task.priority] || "bg-slate-300")} />
        <p className="text-xs font-medium text-slate-900 leading-relaxed line-clamp-2">{task.title}</p>
      </div>

      {/* Property */}
      {task.propertyName && (
        <div className="flex items-center gap-1 text-xs text-slate-400 mb-2 ml-4">
          <span className="truncate">{task.propertyName}</span>
        </div>
      )}

      {/* Due date + assignee */}
      <div className="flex items-center justify-between ml-4">
        {task.dueDate ? (
          <div className={cn("flex items-center gap-1 text-xs", overdue ? "text-[#EF4444]" : "text-slate-400")}>
            {overdue ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            <span>
              {overdue
                ? "Overdue"
                : new Date(task.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </span>
          </div>
        ) : <span />}
        {task.assigneeInitials && (
          <div className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-xs font-semibold">
            {task.assigneeInitials}
          </div>
        )}
      </div>
    </Link>
  )
}

export function TaskBoard({ tasks }: { tasks: TaskItem[] }) {
  const byStatus = COLUMNS.reduce((acc, col) => {
    acc[col.key] = tasks.filter((t) => t.status === col.key)
    return acc
  }, {} as Record<string, TaskItem[]>)

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[400px]">
      {COLUMNS.map((col) => {
        const colTasks = byStatus[col.key] || []
        return (
          <div key={col.key} className="flex flex-col gap-3 min-w-[260px] flex-shrink-0">
            {/* Column header */}
            <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl", col.bg)}>
              <span className={cn("text-xs font-semibold", col.color)}>{col.label}</span>
              <span className={cn(
                "inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold",
                col.bg, col.color
              )}>
                {colTasks.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-2">
              {colTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
              {colTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-slate-100 rounded-xl text-slate-300 text-xs">
                  Empty
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
