import React from "react"
import { cn } from "@/lib/utils"

interface YieldComparisonBarProps {
  propertyName: string
  portfolioYield: number
  marketYield: number
  maxValue?: number
}

export function YieldComparisonBar({ propertyName, portfolioYield, marketYield, maxValue = 16 }: YieldComparisonBarProps) {
  const isAbove = portfolioYield >= marketYield
  const portW  = Math.min(100, (portfolioYield / maxValue) * 100)
  const benchW = Math.min(100, (marketYield    / maxValue) * 100)

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-slate-600 font-medium">{propertyName}</span>
        <div className="flex items-center gap-3">
          <span className={cn("text-[11px] font-semibold", isAbove ? "text-emerald-600" : "text-red-500")}>
            {portfolioYield}%
          </span>
          <span className="text-[11px] text-slate-400">vs {marketYield}% mkt</span>
        </div>
      </div>
      <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden">
        {/* Benchmark marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-slate-500 z-10"
          style={{ left: `${benchW}%` }}
        />
        {/* Portfolio yield bar */}
        <div
          className={cn(
            "absolute top-1 bottom-1 rounded-full transition-all duration-500",
            isAbove ? "bg-emerald-400" : "bg-red-400"
          )}
          style={{ width: `${portW}%`, opacity: 0.8 }}
        />
      </div>
    </div>
  )
}
