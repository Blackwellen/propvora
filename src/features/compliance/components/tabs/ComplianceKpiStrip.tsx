"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { ShieldCheck, Building2, AlertTriangle, CalendarDays, Clock, BarChart3 } from "lucide-react"

export interface ComplianceKpiData {
  total: number
  trackedProperties: number
  atRiskProperties: number
  expiring: number
  expired: number
  compliant: number
  healthScore: number | null
  loading?: boolean
}

export interface ComplianceKpiStripProps {
  data: ComplianceKpiData
}

export function ComplianceKpiStrip({ data }: ComplianceKpiStripProps) {
  const { total, trackedProperties, atRiskProperties, expiring, expired, compliant, healthScore, loading } = data

  const kpis = [
    {
      label: "Compliance Items",    icon: ShieldCheck,   iconBg: "bg-emerald-100", iconColor: "text-emerald-600",
      value: loading ? "—" : String(total),
      sub: total === 0 && !loading ? "No items tracked yet" : `${compliant} compliant`,
    },
    {
      label: "Properties Tracked",  icon: Building2,     iconBg: "bg-blue-100",    iconColor: "text-blue-600",
      value: loading ? "—" : String(trackedProperties),
      sub: trackedProperties === 0 && !loading ? "Link items to properties" : "With compliance items",
    },
    {
      label: "Properties At Risk",  icon: AlertTriangle, iconBg: "bg-amber-100",   iconColor: "text-amber-600",
      value: loading ? "—" : String(atRiskProperties),
      sub: atRiskProperties === 0 && !loading ? "No at-risk properties" : "Expired or missing items",
    },
    {
      label: "Expiring Soon",       icon: CalendarDays,  iconBg: "bg-orange-100",  iconColor: "text-orange-600",
      value: loading ? "—" : String(expiring),
      sub: "Within 30 days",
    },
    {
      label: "Overdue / Expired",   icon: Clock,         iconBg: "bg-red-100",     iconColor: "text-red-600",
      value: loading ? "—" : String(expired),
      sub: expired === 0 && !loading ? "All up to date" : "Require immediate action",
    },
    {
      label: "Health Score",        icon: BarChart3,     iconBg: "bg-violet-100",  iconColor: "text-violet-600",
      value: loading ? "—" : healthScore == null ? "—" : `${healthScore}%`,
      sub: healthScore == null ? "No data yet" : healthScore >= 80 ? "Healthy" : "Needs attention",
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {kpis.map((k) => {
        const Icon = k.icon
        return (
          <div key={k.label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center mb-3", k.iconBg)}>
              <Icon className={cn("w-4 h-4", k.iconColor)} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{k.value}</p>
            <p className="text-[11px] font-semibold text-slate-700 mt-0.5">{k.label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{k.sub}</p>
          </div>
        )
      })}
    </div>
  )
}

export default ComplianceKpiStrip
