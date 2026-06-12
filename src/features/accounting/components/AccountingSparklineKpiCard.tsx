"use client"
import React from "react"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"

interface SparklineKpiCardProps {
  label: string
  value: string
  trend: string
  trendUp: boolean
  sparkData: number[]
  sparkColor: string
  className?: string
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const w = 100
  const h = 28
  const minV = Math.min(...data)
  const maxV = Math.max(...data)
  const range = maxV - minV || 1
  const xs = data.map((_, i) => (i / (data.length - 1)) * w)
  const ys = data.map((v) => h - ((v - minV) / range) * (h - 4) - 2)
  const d = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ")
  const areaD = `${d} L${w},${h} L0,${h} Z`
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#grad-${color.replace("#","")})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

export function AccountingSparklineKpiCard({
  label,
  value,
  trend,
  trendUp,
  sparkData,
  sparkColor,
  className,
}: SparklineKpiCardProps) {
  return (
    <div className={cn("bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 flex flex-col gap-2", className)}>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <div className="flex items-end justify-between gap-2">
        <span className="text-2xl font-bold text-slate-900 leading-tight">{value}</span>
        <div className={cn("flex items-center gap-1 text-xs font-semibold mb-0.5", trendUp ? "text-emerald-600" : "text-red-500")}>
          {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trend}
        </div>
      </div>
      <div className="mt-1">
        <MiniSparkline data={sparkData} color={sparkColor} />
      </div>
    </div>
  )
}
