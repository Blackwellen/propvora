"use client"

import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface HomeKpiCardProps {
  label: string
  value: string
  trend?: string
  trendUp?: boolean
  trendNeutral?: boolean
  icon: LucideIcon
  iconBg: string
  iconColor: string
  href?: string
  loading?: boolean
}

export function HomeKpiCard({
  label,
  value,
  trend,
  trendUp = true,
  trendNeutral = false,
  icon: Icon,
  iconBg,
  iconColor,
  href,
  loading = false,
}: HomeKpiCardProps) {
  const trendColor = trendNeutral
    ? "text-slate-400"
    : trendUp
    ? "text-emerald-600"
    : "text-red-500"

  const TrendIcon = trendNeutral ? Minus : trendUp ? TrendingUp : TrendingDown

  const inner = (
    <div className={`bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-4 flex flex-col gap-2 h-full transition-shadow ${href ? "hover:shadow-md cursor-pointer" : ""}`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide leading-tight truncate min-w-0 max-w-[calc(100%-44px)]" title={label}>
          {label}
        </span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <Icon className={iconColor} style={{ width: 18, height: 18 }} />
        </div>
      </div>
      {loading ? (
        <div className="h-7 w-20 bg-slate-100 rounded animate-pulse" />
      ) : (
        <div className="text-[22px] font-bold text-slate-900 leading-tight">{value}</div>
      )}
      {trend && (
        <div className={`flex items-center gap-1 text-[11px] ${trendColor}`}>
          <TrendIcon style={{ width: 11, height: 11 }} />
          <span>{trend}</span>
        </div>
      )}
    </div>
  )

  if (href) {
    return <Link href={href} className="block">{inner}</Link>
  }
  return inner
}
