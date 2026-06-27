import React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PerfMetric {
  label: string
  value: number
  color: string
}

export interface PerformanceMetricsCardProps {
  metrics: PerfMetric[]
  detailHref?: string
}

// ─── Sub-component ────────────────────────────────────────────────────────────

function PerformanceBar({ label, value, color }: PerfMetric) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12.5px] text-slate-600">{label}</span>
        <span className="text-[12px] font-bold text-slate-800">{value}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-slate-100">
        <div className={cn("h-2 rounded-full transition-all", color)} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PerformanceMetricsCard({
  metrics,
  detailHref = "/property-manager/suppliers/performance",
}: PerformanceMetricsCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-semibold text-slate-800">Performance</h3>
        <Link href={detailHref} className="text-[11px] text-[var(--brand)] hover:underline font-medium">
          View all
        </Link>
      </div>
      <div className="space-y-3">
        {metrics.map((m) => (
          <PerformanceBar key={m.label} label={m.label} value={m.value} color={m.color} />
        ))}
      </div>
    </div>
  )
}
