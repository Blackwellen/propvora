import React from "react"
import { cn } from "@/lib/utils"
import type { PricingRecommendation } from "../hooks/usePricingRecommendations"

interface AiRecommendationCardProps {
  rec: PricingRecommendation
  isLast?: boolean
}

const IMPACT_STYLES = {
  high:   "bg-red-100 text-red-600",
  medium: "bg-amber-100 text-amber-600",
  low:    "bg-slate-100 text-slate-500",
}

export function AiRecommendationCard({ rec, isLast }: AiRecommendationCardProps) {
  return (
    <div className={cn("px-4 py-3 flex gap-3 bg-white", !isLast && "border-b border-slate-100")}>
      <span className={cn(
        "mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
        IMPACT_STYLES[rec.impact]
      )}>
        {rec.rank}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-slate-800 leading-tight">{rec.propertyName}</p>
        <p className="text-[11px] text-slate-600 mt-0.5">{rec.recommendationText}</p>
        <div className="flex items-center justify-between mt-1 gap-2">
          <span className="text-[10px] text-slate-400">{rec.metricLine}</span>
          <span className="text-[10px] font-semibold text-emerald-600 shrink-0">{rec.estimatedAnnualGain}</span>
        </div>
      </div>
    </div>
  )
}
