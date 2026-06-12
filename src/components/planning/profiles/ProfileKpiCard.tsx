"use client"

import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProfileKpiCardProps {
  label: string
  value: string
  sublabel?: string
  trend?: "up" | "down" | "neutral"
  highlight?: boolean
  accentColor?: string
  className?: string
}

export default function ProfileKpiCard({
  label,
  value,
  sublabel,
  trend,
  highlight = false,
  accentColor,
  className,
}: ProfileKpiCardProps) {
  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus

  const trendColor =
    trend === "up"
      ? "text-emerald-500"
      : trend === "down"
        ? "text-red-500"
        : "text-slate-400"

  return (
    <div
      className={cn(
        "bg-white rounded-2xl shadow-sm border border-slate-100/80 p-5 relative overflow-hidden",
        "transition-all duration-150 hover:shadow-md hover:border-slate-200",
        className
      )}
    >
      {/* Highlight accent bar on left */}
      {highlight && accentColor && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
          style={{ backgroundColor: accentColor }}
          aria-hidden="true"
        />
      )}

      <div className={cn("flex flex-col gap-1", highlight && accentColor && "pl-2")}>
        <p className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-widest leading-none">
          {label}
        </p>

        <div className="flex items-end justify-between gap-2 mt-1">
          <p className="text-2xl font-bold text-slate-900 leading-none tabular-nums">
            {value}
          </p>
          {trend && (
            <TrendIcon
              className={cn("w-4 h-4 shrink-0 mb-0.5", trendColor)}
              aria-label={`Trend: ${trend}`}
            />
          )}
        </div>

        {sublabel && (
          <p className="text-xs text-slate-400 leading-snug">{sublabel}</p>
        )}
      </div>
    </div>
  )
}
