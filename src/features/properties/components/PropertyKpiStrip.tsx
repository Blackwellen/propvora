"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Building2, Home, AlertTriangle, CheckCircle } from "lucide-react"

export interface PropertyKpiData {
  total: number
  active: number
  vacant: number
  atRisk: number
}

export interface PropertyKpiStripProps {
  data: PropertyKpiData
}

export function PropertyKpiStrip({ data }: PropertyKpiStripProps) {
  const occupancyRate = data.total > 0 ? Math.round((data.active / data.total) * 100) : 0

  const kpis = [
    { label: "Total Properties", value: String(data.total),        sub: "Across portfolio",      color: "text-[var(--brand)]",   bg: "bg-[var(--brand-soft)]",    icon: Building2     },
    { label: "Active",           value: String(data.active),       sub: "Currently occupied",    color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle   },
    { label: "Vacant",           value: String(data.vacant),       sub: "Available units",       color: "text-amber-600",   bg: "bg-amber-50",   icon: Home          },
    { label: "Occupancy Rate",   value: `${occupancyRate}%`,       sub: "Portfolio occupancy",   color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle   },
    { label: "At Risk",          value: String(data.atRisk),       sub: "Need attention",        color: "text-red-600",     bg: "bg-red-50",     icon: AlertTriangle },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {kpis.map((k) => {
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

export default PropertyKpiStrip
