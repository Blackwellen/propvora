"use client"
import React from "react"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"

interface AccountingKpiCardProps {
  label: string
  value: string
  trend?: string
  trendUp?: boolean
  trendNeutral?: boolean
  icon?: React.ReactNode
  iconBg?: string
  iconColor?: string
  subtitle?: string
  className?: string
}

export function AccountingKpiCard({
  label,
  value,
  trend,
  trendUp,
  trendNeutral,
  icon,
  iconBg = "bg-slate-100",
  iconColor = "text-slate-600",
  subtitle,
  className,
}: AccountingKpiCardProps) {
  const trendColor = trendNeutral
    ? "text-slate-500"
    : trendUp
    ? "text-emerald-600"
    : "text-red-500"

  return (
    <div className={cn("bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
          <span className="text-2xl font-bold text-slate-900 leading-tight truncate">{value}</span>
          {subtitle && <span className="text-xs text-slate-400 truncate">{subtitle}</span>}
          {trend && (
            <div className={cn("flex items-center gap-1 text-xs font-medium mt-0.5", trendColor)}>
              {!trendNeutral && (trendUp ? <TrendingUp className="w-3.5 h-3.5 shrink-0" /> : <TrendingDown className="w-3.5 h-3.5 shrink-0" />)}
              <span>{trend}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", iconBg, iconColor)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
