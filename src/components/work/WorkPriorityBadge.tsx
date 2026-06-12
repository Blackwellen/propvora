"use client"

import React from "react"
import { cn } from "@/lib/utils"

type Priority = "urgent" | "high" | "medium" | "low" | "critical" | string

const priorityConfig: Record<string, { label: string; dotClass: string; textClass: string }> = {
  urgent: { label: "Urgent", dotClass: "bg-red-500", textClass: "text-red-700" },
  critical: { label: "Critical", dotClass: "bg-red-500", textClass: "text-red-700" },
  high: { label: "High", dotClass: "bg-orange-500", textClass: "text-orange-700" },
  medium: { label: "Medium", dotClass: "bg-amber-500", textClass: "text-amber-700" },
  low: { label: "Low", dotClass: "bg-slate-400", textClass: "text-slate-600" },
}

interface WorkPriorityBadgeProps {
  priority: Priority
  showLabel?: boolean
}

export function WorkPriorityBadge({ priority, showLabel = true }: WorkPriorityBadgeProps) {
  const config = priorityConfig[priority] ?? { label: priority, dotClass: "bg-slate-400", textClass: "text-slate-600" }

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("w-2 h-2 rounded-full flex-shrink-0", config.dotClass)} />
      {showLabel && (
        <span className={cn("text-xs font-semibold", config.textClass)}>{config.label}</span>
      )}
    </span>
  )
}
