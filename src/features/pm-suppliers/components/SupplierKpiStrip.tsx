import React from "react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KpiItem {
  label: string
  value: string
  sub: string
  icon: React.ElementType
  bg: string
  color: string
}

export interface SupplierKpiStripProps {
  items: KpiItem[]
  columns?: "4" | "6"
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SupplierKpiStrip({ items, columns = "6" }: SupplierKpiStripProps) {
  const gridCols =
    columns === "4"
      ? "grid-cols-2 sm:grid-cols-4"
      : "grid-cols-2 sm:grid-cols-3 xl:grid-cols-6"

  return (
    <div className={cn("grid gap-3", gridCols)}>
      {items.map((kpi) => {
        const Icon = kpi.icon
        return (
          <div key={kpi.label} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide leading-tight">
                {kpi.label}
              </p>
              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", kpi.bg)}>
                <Icon className={cn("w-3.5 h-3.5", kpi.color)} />
              </div>
            </div>
            <p className="text-xl font-bold text-slate-900 leading-none mb-1">{kpi.value}</p>
            <p className="text-[11px] text-slate-500">{kpi.sub}</p>
          </div>
        )
      })}
    </div>
  )
}
