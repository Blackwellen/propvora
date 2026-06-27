import React from "react"
import { cn } from "@/lib/utils"
import type { HeatProperty } from "../hooks/usePortfolioIntelligence"

interface PropertyPerformanceTileProps {
  property: HeatProperty
}

const TYPE_COLORS: Record<"HMO" | "AST" | "SA", string> = {
  HMO: "bg-violet-50 text-violet-700 border-violet-200",
  AST: "bg-[var(--brand-soft)] text-[var(--brand)] border-[var(--color-brand-100)]",
  SA:  "bg-amber-50 text-amber-700 border-amber-200",
}

const TIER_STYLES: Record<string, string> = {
  star:    "border-amber-200 bg-amber-50/30",
  average: "border-slate-200 bg-white",
  under:   "border-red-200 bg-red-50/30",
}

const AI_VARIANT_STYLES: Record<string, string> = {
  good: "text-emerald-700 bg-emerald-50",
  warn: "text-amber-700 bg-amber-50",
  ok:   "text-slate-500 bg-slate-50",
}

export function PropertyPerformanceTile({ property: p }: PropertyPerformanceTileProps) {
  return (
    <div className={cn("rounded-xl border p-3.5 flex flex-col gap-2", TIER_STYLES[p.tier])}>
      <div className="flex items-start justify-between gap-1">
        <span className="text-[12px] font-semibold text-slate-800 leading-tight line-clamp-2">{p.name}</span>
        <span className={cn("px-1.5 py-0.5 rounded-full text-[10px] font-medium border shrink-0 ml-1", TYPE_COLORS[p.type])}>
          {p.type}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-1 text-center">
        <div>
          <p className="text-[10px] text-slate-400">Net Yield</p>
          <p className={cn("text-[12px] font-bold",
            p.netYield >= 7 ? "text-emerald-600" :
            p.netYield >= 4 ? "text-[var(--brand)]" :
            p.netYield >= 3 ? "text-amber-600" :
            "text-red-600"
          )}>
            {p.netYield}%
          </p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400">Void</p>
          <p className={cn("text-[12px] font-bold",
            p.voidRate >= 5 ? "text-red-600" :
            p.voidRate >= 2 ? "text-amber-600" :
            "text-emerald-600"
          )}>
            {p.voidRate}%
          </p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400">Maint.</p>
          <p className={cn("text-[12px] font-bold",
            p.maintRatio >= 14 ? "text-red-600" :
            p.maintRatio >= 11 ? "text-amber-600" :
            "text-slate-600"
          )}>
            {p.maintRatio}%
          </p>
        </div>
      </div>
      <div className={cn("px-2 py-1 rounded-lg text-[11px] font-medium", AI_VARIANT_STYLES[p.aiVariant])}>
        {p.aiStatus}
      </div>
    </div>
  )
}
