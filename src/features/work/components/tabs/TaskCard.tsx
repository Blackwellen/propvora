import React from "react"
import Link from "next/link"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { WorkPriorityBadge } from "@/components/work/WorkPriorityBadge"
import { WorkStatusBadge } from "@/components/work/WorkStatusBadge"

export interface TaskCardTask {
  id: string
  title: string
  category: string
  property: string
  assigneeInitials: string
  assigneeName: string
  dueDate: string
  status: string
  priority: string
  overdue?: boolean
  dueToday?: boolean
}

interface TaskCardProps {
  task: TaskCardTask
  compact?: boolean
}

export function TaskCard({ task, compact = false }: TaskCardProps) {
  return (
    <Link
      href={`/property-manager/work/tasks/${task.id}`}
      className="block bg-white border border-slate-200 rounded-xl p-3.5 hover:shadow-sm hover:border-slate-300 transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <WorkPriorityBadge priority={task.priority} showLabel={false} />
          <p className="text-sm font-semibold text-slate-900 truncate">{task.title}</p>
        </div>
        {!compact && <WorkStatusBadge status={task.status} />}
      </div>
      <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">{task.category}</span>
        {task.property && task.property !== "—" && (
          <span className="truncate max-w-[140px]">{task.property}</span>
        )}
      </div>
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--brand)] to-[var(--brand-strong)] flex items-center justify-center text-[10px] text-white font-bold">
            {task.assigneeInitials}
          </div>
          <span className="text-[11px] text-slate-500 truncate max-w-[90px]">{task.assigneeName}</span>
        </div>
        <span className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold",
          task.overdue ? "bg-red-50 text-red-600" : task.dueToday ? "bg-amber-50 text-amber-600" : "text-slate-500"
        )}>
          <Clock className="w-3 h-3" /> {task.dueDate}
        </span>
      </div>
    </Link>
  )
}
