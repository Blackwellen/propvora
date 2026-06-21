"use client"

import React from "react"
import { cn } from "@/lib/utils"
import {
  Calendar, Briefcase, AlertTriangle, Clock, Receipt, TrendingDown,
} from "lucide-react"

export interface JobItem {
  status: string
  invoiceStatus: string
  quoteValue: string
}

export interface JobsKpiStripProps {
  jobs: JobItem[]
}

export function JobsKpiStrip({ jobs }: JobsKpiStripProps) {
  const scheduledCount      = jobs.filter((j) => j.status === "scheduled").length
  const inProgressCount     = jobs.filter((j) => j.status === "in_progress").length
  const overdueCount        = jobs.filter((j) => j.status === "overdue").length
  const waitingCount        = jobs.filter((j) => j.status === "waiting").length
  const invoicePendingCount = jobs.filter((j) => j.invoiceStatus === "Not Invoiced" || j.invoiceStatus === "none").length
  const costAtRiskCount     = jobs.filter((j) => j.status === "overdue" || j.status === "waiting").length

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      {[
        { label: "Scheduled Jobs",   value: String(scheduledCount),      sub: "Upcoming this week", color: "text-[#2563EB]",   bg: "bg-blue-50",    icon: Calendar      },
        { label: "In Progress",      value: String(inProgressCount),     sub: "Currently active",   color: "text-[#2563EB]",   bg: "bg-blue-50",    icon: Briefcase     },
        { label: "Overdue",          value: String(overdueCount),        sub: "Past due date",      color: "text-red-600",     bg: "bg-red-50",     icon: AlertTriangle },
        { label: "Waiting Supplier", value: String(waitingCount),        sub: "Pending response",   color: "text-amber-600",   bg: "bg-amber-50",   icon: Clock         },
        { label: "Invoice Pending",  value: String(invoicePendingCount), sub: "Awaiting invoice",   color: "text-violet-600",  bg: "bg-violet-50",  icon: Receipt       },
        { label: "Cost at Risk",     value: String(costAtRiskCount),     sub: "Jobs at risk",       color: "text-red-600",     bg: "bg-red-50",     icon: TrendingDown  },
      ].map((k) => {
        const Icon = k.icon
        return (
          <div key={k.label} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center mb-2", k.bg)}>
              <Icon className={cn("w-4 h-4", k.color)} />
            </div>
            <p className={cn("text-2xl font-bold", k.color)}>{k.value}</p>
            <p className="text-[11px] font-semibold text-slate-700 mt-0.5">{k.label}</p>
            <p className="text-[10px] text-slate-400">{k.sub}</p>
          </div>
        )
      })}
    </div>
  )
}

export default JobsKpiStrip
