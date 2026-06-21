import React from "react"
import { cn } from "@/lib/utils"

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  Active:       { label: "Active",       cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  active:       { label: "Active",       cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  paid_on_time: { label: "Paid on time", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  paid_late:    { label: "Paid late",    cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
  overdue:      { label: "Overdue",      cls: "bg-red-50 text-red-700 ring-1 ring-red-200" },
  upcoming:     { label: "Upcoming",     cls: "bg-slate-100 text-slate-600 ring-1 ring-slate-200" },
  current:      { label: "Current",      cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  due_renewal:  { label: "Due renewal",  cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
  expired:      { label: "Expired",      cls: "bg-red-50 text-red-700 ring-1 ring-red-200" },
  Protected:    { label: "Protected",    cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  Resolved:     { label: "Resolved",     cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  High:         { label: "High",         cls: "bg-red-50 text-red-700 ring-1 ring-red-200" },
  Medium:       { label: "Medium",       cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
  Low:          { label: "Low",          cls: "bg-slate-100 text-slate-600 ring-1 ring-slate-200" },
}

interface TenancyStatusPillProps {
  status: string
}

export function TenancyStatusPill({ status }: TenancyStatusPillProps) {
  const cfg = STATUS_MAP[status] ?? { label: status, cls: "bg-slate-100 text-slate-600" }
  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full", cfg.cls)}>
      {cfg.label}
    </span>
  )
}
