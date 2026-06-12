import React from "react"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface PpmKpiCardProps {
  icon: LucideIcon
  iconBg: string
  iconColor: string
  value: string | number
  label: string
  sub?: string
  subColor?: string
  valueColor?: string
}

export function PpmKpiCard({
  icon: Icon,
  iconBg,
  iconColor,
  value,
  label,
  sub,
  subColor = "text-slate-500",
  valueColor = "text-slate-900",
}: PpmKpiCardProps) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide leading-tight">
          {label}
        </span>
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
          <Icon className={cn("w-4.5 h-4.5", iconColor)} />
        </div>
      </div>
      <div>
        <p className={cn("text-3xl font-bold leading-none", valueColor)}>{value}</p>
        {sub && (
          <p className={cn("text-[11px] mt-1.5 leading-snug", subColor)}>{sub}</p>
        )}
      </div>
    </div>
  )
}
