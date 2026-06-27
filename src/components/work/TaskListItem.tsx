"use client"

import React, { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/Badge"
import { Clock, MoreHorizontal, Eye, Edit2, CheckCircle, Trash2, Building2, AlertCircle } from "lucide-react"

export interface TaskItem {
  id: string
  title: string
  description?: string
  priority: "critical" | "high" | "medium" | "low"
  status: "to_do" | "in_progress" | "waiting" | "blocked" | "done"
  propertyName?: string
  propertyId?: string
  dueDate?: string
  assigneeName?: string
  assigneeInitials?: string
  category?: string
  type: "task" | "job"
}

const priorityConfig = {
  critical: { label: "Critical", variant: "danger" as const, dot: "bg-[#EF4444]" },
  high: { label: "High", variant: "warning" as const, dot: "bg-[#F59E0B]" },
  medium: { label: "Medium", variant: "primary" as const, dot: "bg-[var(--brand)]" },
  low: { label: "Low", variant: "default" as const, dot: "bg-slate-400" },
}

const statusConfig = {
  to_do: { label: "To do", variant: "default" as const },
  in_progress: { label: "In progress", variant: "primary" as const },
  waiting: { label: "Waiting", variant: "warning" as const },
  blocked: { label: "Blocked", variant: "danger" as const },
  done: { label: "Done", variant: "success" as const },
}

function isOverdue(dateStr?: string) {
  return dateStr ? new Date(dateStr) < new Date() : false
}

export function TaskListItem({ task }: { task: TaskItem }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pConfig = priorityConfig[task.priority]
  const sConfig = statusConfig[task.status]
  const overdue = isOverdue(task.dueDate) && task.status !== "done"

  return (
    <div className={cn(
      "group flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 last:border-b-0",
      "hover:bg-slate-50 transition-colors duration-100",
      task.status === "done" && "opacity-60"
    )}>
      {/* Priority dot */}
      <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", pConfig.dot)} />

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/property-manager/work/${task.type}s/${task.id}`}
          className="text-sm font-medium text-slate-900 hover:text-[var(--brand)] transition-colors line-clamp-1"
        >
          {task.title}
        </Link>
        {task.description && (
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{task.description}</p>
        )}
      </div>

      {/* Priority badge */}
      <Badge variant={pConfig.variant} size="sm" className="shrink-0 hidden sm:inline-flex">
        {pConfig.label}
      </Badge>

      {/* Property chip */}
      {task.propertyName && (
        <Link
          href={`/property-manager/portfolio/properties/${task.propertyId}`}
          className="hidden md:flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--brand-soft)] text-[var(--brand)] text-xs font-medium hover:bg-[var(--color-brand-100)] transition-colors shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <Building2 className="w-3 h-3" />
          <span className="max-w-[120px] truncate">{task.propertyName}</span>
        </Link>
      )}

      {/* Status badge */}
      <Badge variant={sConfig.variant} size="sm" dot className="shrink-0 hidden lg:inline-flex">
        {sConfig.label}
      </Badge>

      {/* Due date */}
      {task.dueDate && (
        <div className={cn(
          "flex items-center gap-1 text-xs shrink-0 hidden sm:flex",
          overdue ? "text-[#EF4444]" : "text-slate-400"
        )}>
          {overdue ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
          <span>
            {overdue
              ? "Overdue"
              : new Date(task.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
          </span>
        </div>
      )}

      {/* Assignee avatar */}
      {task.assigneeInitials && (
        <div className="w-7 h-7 rounded-full bg-[var(--brand)] flex items-center justify-center text-white text-xs font-semibold shrink-0 hidden md:flex">
          {task.assigneeInitials}
        </div>
      )}

      {/* Actions menu */}
      <div className="relative shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o) }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-1 w-44 z-30 bg-white rounded-xl shadow-xl border border-slate-200 py-1">
              <Link
                href={`/property-manager/work/${task.type}s/${task.id}`}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => setMenuOpen(false)}
              >
                <Eye className="w-4 h-4" />View
              </Link>
              <Link
                href={`/property-manager/work/${task.type}s/${task.id}/edit`}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => setMenuOpen(false)}
              >
                <Edit2 className="w-4 h-4" />Edit
              </Link>
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#10B981] hover:bg-emerald-50"
                onClick={() => setMenuOpen(false)}
              >
                <CheckCircle className="w-4 h-4" />Mark complete
              </button>
              <div className="border-t border-slate-100 my-1" />
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                onClick={() => setMenuOpen(false)}
              >
                <Trash2 className="w-4 h-4" />Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
