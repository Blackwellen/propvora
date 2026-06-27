"use client"

import { cn } from "@/lib/utils"
import { SupplierCard } from "@/components/supplier-workspace/ui"

interface JobStat {
  label: string
  value: string
  tone: "blue" | "amber" | "red" | "slate"
}

interface JobsKpiStripProps {
  stats: JobStat[]
}

export function JobsKpiStrip({ stats }: JobsKpiStripProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      {stats.map((s) => {
        const c =
          s.tone === "blue"
            ? "text-[var(--brand)]"
            : s.tone === "amber"
              ? "text-amber-600"
              : s.tone === "red"
                ? "text-red-600"
                : "text-slate-900"
        return (
          <SupplierCard key={s.label} className="p-3.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
              {s.label}
            </span>
            <p className={cn("text-lg font-bold mt-1", c)}>{s.value}</p>
          </SupplierCard>
        )
      })}
    </div>
  )
}
