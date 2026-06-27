import React from "react"
import { cn } from "@/lib/utils"

type PpmStatus = "scheduled" | "due-soon" | "overdue" | "completed"

interface Props {
  status: PpmStatus
}

const STATUS_CONFIG: Record<PpmStatus, { label: string; classes: string }> = {
  scheduled:  { label: "Scheduled", classes: "bg-[var(--brand-soft)] text-[var(--brand)] border-[var(--color-brand-100)]" },
  "due-soon": { label: "Due Soon",  classes: "bg-amber-50 text-amber-700 border-amber-200" },
  overdue:    { label: "Overdue",   classes: "bg-red-50 text-red-700 border-red-200" },
  completed:  { label: "Completed", classes: "bg-emerald-50 text-emerald-700 border-emerald-200" },
}

export function PpmScheduleStatusBadge({ status }: Props) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.scheduled
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap",
        cfg.classes
      )}
    >
      {cfg.label}
    </span>
  )
}
