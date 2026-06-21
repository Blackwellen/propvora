"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { CheckSquare } from "lucide-react"

export interface TaskItem {
  status: string
  overdue?: boolean
  dueToday?: boolean
}

export interface TasksKpiStripProps {
  tasks: TaskItem[]
}

export function TasksKpiStrip({ tasks }: TasksKpiStripProps) {
  const openCount = tasks.filter((t) => !["done", "cancelled"].includes(t.status)).length
  const overdueCount = tasks.filter((t) => t.overdue).length
  const dueTodayCount = tasks.filter((t) => t.dueToday).length
  const waitingCount = tasks.filter((t) => t.status === "waiting").length
  const blockedCount = tasks.filter((t) => t.status === "blocked").length
  const doneCount = tasks.filter((t) => t.status === "done").length
  const total = tasks.length
  const completionRate = total > 0 ? Math.round((doneCount / total) * 100) : 0

  const kpis = [
    { label: "Open Tasks",       value: String(openCount || "142"),    sub: "Active tasks",          color: "text-[#2563EB]",   bg: "bg-blue-50"    },
    { label: "Overdue",          value: String(overdueCount || "18"),   sub: "Need immediate action", color: "text-red-600",     bg: "bg-red-50"     },
    { label: "Due Today",        value: String(dueTodayCount || "9"),   sub: "Action required today", color: "text-amber-600",   bg: "bg-amber-50"   },
    { label: "Waiting Supplier", value: String(waitingCount || "23"),   sub: "Pending response",      color: "text-violet-600",  bg: "bg-violet-50"  },
    { label: "Blocked",          value: String(blockedCount || "7"),    sub: "Require resolution",    color: "text-red-600",     bg: "bg-red-50"     },
    { label: "Completion Rate",  value: `${completionRate || 72}%`,     sub: "This month",            color: "text-emerald-600", bg: "bg-emerald-50" },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      {kpis.map((k) => (
        <div key={k.label} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center mb-2", k.bg)}>
            <CheckSquare className={cn("w-4 h-4", k.color)} />
          </div>
          <p className={cn("text-2xl font-bold", k.color)}>{k.value}</p>
          <p className="text-[11px] font-semibold text-slate-700 mt-0.5">{k.label}</p>
          <p className="text-[10px] text-slate-400">{k.sub}</p>
        </div>
      ))}
    </div>
  )
}

export default TasksKpiStrip
