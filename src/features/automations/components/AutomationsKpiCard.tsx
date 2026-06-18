"use client"

import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type KpiTone = "blue" | "violet" | "emerald" | "amber" | "red" | "slate"

const TONES: Record<KpiTone, string> = {
  blue: "bg-blue-50 text-blue-600",
  violet: "bg-violet-50 text-violet-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
  slate: "bg-slate-100 text-slate-500",
}

export default function AutomationsKpiCard({
  label,
  value,
  sub,
  trend,
  trendDir = "up",
  icon: Icon,
  tone = "blue",
  progress,
  children,
}: {
  label: string
  value: string | number
  sub?: string
  trend?: string
  trendDir?: "up" | "down"
  icon: LucideIcon
  tone?: KpiTone
  /** 0-100 to render a thin progress bar instead of a sparkline */
  progress?: number
  /** optional sparkline / mini-chart node */
  children?: React.ReactNode
}) {
  const trendCls = trendDir === "down" ? "text-red-600" : "text-emerald-600"
  const TrendIcon = trendDir === "down" ? ArrowDownRight : ArrowUpRight
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
        <span className={`grid h-8 w-8 place-items-center rounded-xl ${TONES[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-2 flex items-end gap-2">
        <div className="text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
        {trend && (
          <span className={`mb-1 inline-flex items-center gap-0.5 text-xs font-semibold ${trendCls}`}>
            <TrendIcon className="h-3.5 w-3.5" />
            {trend}
          </span>
        )}
      </div>
      {sub && <div className="mt-0.5 text-xs text-slate-400">{sub}</div>}
      {progress != null && (
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full ${tone === "red" ? "bg-red-500" : tone === "amber" ? "bg-amber-500" : tone === "emerald" ? "bg-emerald-500" : tone === "violet" ? "bg-violet-500" : "bg-blue-500"}`}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
      {children && <div className="mt-2 h-10">{children}</div>}
    </div>
  )
}
