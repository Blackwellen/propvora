"use client"

import React from "react"
import { cn } from "@/lib/utils"

type TaskStatus = "todo" | "in_progress" | "waiting" | "blocked" | "done" | "cancelled"
type JobStatus =
  | "new"
  | "scoped"
  | "supplier_requested"
  | "quote_received"
  | "approved"
  | "scheduled"
  | "in_progress"
  | "complete"
  | "invoiced"
  | "closed"
  | "disputed"

type AnyStatus = TaskStatus | JobStatus | string

const statusConfig: Record<string, { label: string; className: string }> = {
  // Task statuses
  todo: { label: "To Do", className: "bg-slate-100 text-slate-600" },
  in_progress: { label: "In Progress", className: "bg-blue-50 text-blue-700" },
  waiting: { label: "Waiting", className: "bg-amber-50 text-amber-700" },
  blocked: { label: "Blocked", className: "bg-red-50 text-red-700" },
  done: { label: "Done", className: "bg-emerald-50 text-emerald-700" },
  cancelled: { label: "Cancelled", className: "bg-slate-100 text-slate-500" },
  // Job statuses
  new: { label: "New", className: "bg-slate-100 text-slate-600" },
  scoped: { label: "Scoped", className: "bg-blue-50 text-blue-700" },
  supplier_requested: { label: "Supplier Requested", className: "bg-violet-50 text-violet-700" },
  quote_received: { label: "Quote Received", className: "bg-amber-50 text-amber-700" },
  approved: { label: "Approved", className: "bg-blue-50 text-blue-700" },
  scheduled: { label: "Scheduled", className: "bg-sky-50 text-sky-700" },
  complete: { label: "Complete", className: "bg-emerald-50 text-emerald-700" },
  invoiced: { label: "Invoiced", className: "bg-violet-50 text-violet-700" },
  closed: { label: "Closed", className: "bg-slate-100 text-slate-500" },
  disputed: { label: "Disputed", className: "bg-red-50 text-red-700" },
  overdue: { label: "Overdue", className: "bg-red-50 text-red-700" },
}

interface WorkStatusBadgeProps {
  status: AnyStatus
  size?: "sm" | "md"
}

export function WorkStatusBadge({ status, size = "md" }: WorkStatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, className: "bg-slate-100 text-slate-600" }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        config.className
      )}
    >
      {config.label}
    </span>
  )
}
