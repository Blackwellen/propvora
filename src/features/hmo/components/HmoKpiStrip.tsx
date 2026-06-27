"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Building2, Home, Users, ShieldCheck, AlertTriangle } from "lucide-react"

export interface HmoKpiData {
  totalHmos: number
  totalRooms: number
  occupiedRooms: number
  licenceValid: number
  licenceAtRisk: number
}

export interface HmoKpiStripProps {
  data: HmoKpiData
}

export function HmoKpiStrip({ data }: HmoKpiStripProps) {
  const occupancyRate = data.totalRooms > 0
    ? Math.round((data.occupiedRooms / data.totalRooms) * 100)
    : 0

  const kpis = [
    { label: "HMO Properties",   value: String(data.totalHmos),      sub: "Managed HMOs",         color: "text-[var(--brand)]",   bg: "bg-[var(--brand-soft)]",    icon: Building2   },
    { label: "Total Rooms",       value: String(data.totalRooms),     sub: "Across all HMOs",      color: "text-slate-700",   bg: "bg-slate-100",  icon: Home        },
    { label: "Occupied Rooms",    value: String(data.occupiedRooms),  sub: `${occupancyRate}% rate`,color: "text-emerald-600", bg: "bg-emerald-50", icon: Users       },
    { label: "Licences Valid",    value: String(data.licenceValid),   sub: "Active HMO licences",  color: "text-emerald-600", bg: "bg-emerald-50", icon: ShieldCheck },
    { label: "Licence At Risk",   value: String(data.licenceAtRisk),  sub: "Expiring / expired",   color: "text-red-600",     bg: "bg-red-50",     icon: AlertTriangle},
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

export default HmoKpiStrip
