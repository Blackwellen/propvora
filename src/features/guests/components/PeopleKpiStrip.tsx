import React from "react"
import { cn } from "@/lib/utils"

interface KpiCardProps {
  icon: React.ElementType
  label: string
  value: number
  iconColour: string
  bg: string
  sub?: string
}

export function PeopleKpiCard({ icon: Icon, label, value, iconColour, bg, sub }: KpiCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-md hover:border-slate-300 transition-all duration-200">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", bg)}>
        <Icon className="w-4 h-4" style={{ color: iconColour }} />
      </div>
      <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
      <p className="text-xs font-medium text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}
