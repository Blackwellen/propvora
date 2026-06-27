"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Calendar, CheckCircle, AlertTriangle, Clock, BarChart3, Wrench } from "lucide-react"

export interface PpmKpiData {
  totalScheduled: number
  completedThisMonth: number
  overdue: number
  upcoming30Days: number
  complianceRate: number
  activeContracts: number
}

export interface PpmKpiStripProps {
  data: PpmKpiData
  loading?: boolean
}

export function PpmKpiStrip({ data, loading }: PpmKpiStripProps) {
  const kpis = [
    { label: "Scheduled PPM",     value: String(data.totalScheduled),     sub: "Total planned",         color: "text-[var(--brand)]",   bg: "bg-[var(--brand-soft)]",    icon: Calendar    },
    { label: "Completed (Month)", value: String(data.completedThisMonth), sub: "This month",            color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle },
    { label: "Overdue",           value: String(data.overdue),            sub: "Past schedule",         color: "text-red-600",     bg: "bg-red-50",     icon: AlertTriangle},
    { label: "Next 30 Days",      value: String(data.upcoming30Days),     sub: "Upcoming",              color: "text-amber-600",   bg: "bg-amber-50",   icon: Clock       },
    { label: "Compliance Rate",   value: `${data.complianceRate}%`,       sub: "On-time completion",    color: "text-emerald-600", bg: "bg-emerald-50", icon: BarChart3   },
    { label: "Active Contracts",  value: String(data.activeContracts),    sub: "Service contracts",     color: "text-violet-600",  bg: "bg-violet-50",  icon: Wrench      },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      {kpis.map((k) => {
        const Icon = k.icon
        return (
          <div key={k.label} className={cn("bg-white border border-slate-200 rounded-2xl p-4 shadow-sm", loading && "animate-pulse")}>
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center mb-2", k.bg)}>
              <Icon className={cn("w-4 h-4", k.color)} />
            </div>
            <p className={cn("text-2xl font-bold", k.color)}>{loading ? "—" : k.value}</p>
            <p className="text-[11px] font-semibold text-slate-700 mt-0.5">{k.label}</p>
            <p className="text-[10px] text-slate-400">{k.sub}</p>
          </div>
        )
      })}
    </div>
  )
}

export default PpmKpiStrip
