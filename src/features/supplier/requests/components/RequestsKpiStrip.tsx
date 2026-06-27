"use client"

import { SupplierCard } from "@/components/supplier-workspace/ui"

interface RequestStat {
  label: string
  value: string
  tone: "blue" | "amber" | "emerald" | "slate"
}

interface RequestsKpiStripProps {
  stats: RequestStat[]
}

export function RequestsKpiStrip({ stats }: RequestsKpiStripProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      {stats.map((s) => {
        const c =
          s.tone === "blue"
            ? "text-[var(--brand)]"
            : s.tone === "amber"
              ? "text-amber-600"
              : s.tone === "emerald"
                ? "text-emerald-600"
                : "text-slate-900"
        return (
          <SupplierCard key={s.label} className="p-3.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
              {s.label}
            </span>
            <p className={`text-lg font-bold mt-1 ${c}`}>{s.value}</p>
          </SupplierCard>
        )
      })}
    </div>
  )
}
