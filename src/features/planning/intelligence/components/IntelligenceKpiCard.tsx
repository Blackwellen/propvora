import React from "react"
import { cn } from "@/lib/utils"

interface IntelligenceKpiCardProps {
  label: string
  value: string
  sub: string
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
  iconColor: string
  trend?: {
    label: string
    positive: boolean
  }
  badge?: {
    label: string
    color: string
  }
}

export function IntelligenceKpiCard({
  label,
  value,
  sub,
  icon: Icon,
  iconBg,
  iconColor,
  trend,
  badge,
}: IntelligenceKpiCardProps) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-4 flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
          <Icon className={cn("w-4 h-4", iconColor)} />
        </div>
        {badge && (
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border"
            style={{
              backgroundColor: badge.color + "15",
              color: badge.color,
              borderColor: badge.color + "40",
            }}
          >
            {badge.label}
          </span>
        )}
      </div>
      <p className="text-[12px] text-slate-500 font-medium leading-tight">{label}</p>
      <p className="text-[20px] font-bold text-slate-900 mt-1 leading-tight">{value}</p>
      {trend && (
        <p className={cn("text-[11px] font-medium mt-0.5", trend.positive ? "text-emerald-600" : "text-red-500")}>
          {trend.label}
        </p>
      )}
      <p className="text-[11px] text-slate-400 mt-1 leading-snug">{sub}</p>
    </div>
  )
}
