"use client"

import React from "react"
import Link from "next/link"
import { AlertTriangle, Clock, ShieldAlert } from "lucide-react"
import { cn } from "@/lib/utils"

export interface TaskForUrgency {
  overdue?: boolean
  dueToday?: boolean
}

export interface UrgentItemsPanelProps {
  tasks: TaskForUrgency[]
}

export function UrgentItemsPanel({ tasks }: UrgentItemsPanelProps) {
  const overdueCount  = tasks.length > 0 ? tasks.filter((t) => t.overdue).length  : 5
  const dueTodayCount = tasks.length > 0 ? tasks.filter((t) => t.dueToday).length : 3

  const items = [
    { icon: AlertTriangle, color: "text-red-500",   bg: "bg-red-50",   count: overdueCount,  label: "Overdue tasks", desc: "Past due date, action needed" },
    { icon: Clock,         color: "text-amber-500", bg: "bg-amber-50", count: dueTodayCount, label: "Due today",      desc: "Complete before end of day"   },
    { icon: ShieldAlert,   color: "text-red-500",   bg: "bg-red-50",   count: 2,             label: "SLA breaches",  desc: "Contract SLA at risk"         },
  ]

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900 mb-3">Urgent Items</h3>
      <div className="space-y-3">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="flex items-start gap-3">
              <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0", item.bg)}>
                <Icon className={cn("w-4 h-4", item.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900">{item.count}</p>
                <p className="text-[11px] font-medium text-slate-700">{item.label}</p>
                <p className="text-[10px] text-slate-400">{item.desc}</p>
              </div>
              <Link href="/property-manager/work/tasks" className="text-[10px] text-[var(--brand)] hover:underline shrink-0 mt-1">
                View all →
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default UrgentItemsPanel
