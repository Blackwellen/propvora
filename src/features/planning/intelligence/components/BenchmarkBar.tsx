import React from "react"
import { cn } from "@/lib/utils"
import type { BenchmarkRow } from "../hooks/usePortfolioBenchmarks"

interface BenchmarkBarProps {
  row: BenchmarkRow
}

const RESULT_CONFIG = {
  better: { label: "✓ Better",  color: "text-emerald-700 bg-emerald-50 border-emerald-200", barColor: "bg-emerald-400" },
  worse:  { label: "⚠ Below",  color: "text-amber-700 bg-amber-50 border-amber-200",         barColor: "bg-amber-400" },
  par:    { label: "→ At par", color: "text-slate-500 bg-slate-50 border-slate-200",          barColor: "bg-slate-400" },
}

export function BenchmarkBar({ row }: BenchmarkBarProps) {
  const config = RESULT_CONFIG[row.result]
  const maxVal = Math.max(row.portfolioRaw, row.industryRaw) * 1.3
  const portW  = Math.min(100, (row.portfolioRaw / maxVal) * 100)
  const indW   = Math.min(100, (row.industryRaw  / maxVal) * 100)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-slate-700">{row.metric}</span>
        <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full border", config.color)}>
          {config.label}
        </span>
      </div>
      <div className="space-y-1.5">
        {/* Portfolio bar */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-500 w-24 shrink-0">Your portfolio</span>
          <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", config.barColor)}
              style={{ width: `${portW}%`, opacity: 0.8 }}
            />
          </div>
          <span className="text-[12px] font-semibold text-slate-700 w-14 text-right">{row.portfolio}</span>
        </div>
        {/* Industry avg bar */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400 w-24 shrink-0">Industry avg</span>
          <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-slate-300 transition-all duration-500"
              style={{ width: `${indW}%`, opacity: 0.6 }}
            />
          </div>
          <span className="text-[12px] text-slate-500 w-14 text-right">{row.industry}</span>
        </div>
      </div>
    </div>
  )
}
