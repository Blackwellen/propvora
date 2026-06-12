"use client"

import { cn } from "@/lib/utils"
import type { RiskLevelType, IntensityType } from "@/lib/planning/profile-config"

interface ProfileStatusPillProps {
  label: string
  level: RiskLevelType | IntensityType | string
  size?: "sm" | "md"
  className?: string
}

type PillStyle = { pill: string; dot: string }

const LEVEL_STYLES: Record<string, PillStyle> = {
  Low: {
    pill: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    dot: "bg-emerald-500",
  },
  Medium: {
    pill: "bg-amber-50 text-amber-700 border border-amber-200",
    dot: "bg-amber-500",
  },
  High: {
    pill: "bg-orange-50 text-orange-700 border border-orange-200",
    dot: "bg-orange-500",
  },
  Critical: {
    pill: "bg-red-50 text-red-700 border border-red-200",
    dot: "bg-red-500",
  },
}

const DEFAULT_STYLE: PillStyle = {
  pill: "bg-slate-100 text-slate-600 border border-slate-200",
  dot: "bg-slate-400",
}

export default function ProfileStatusPill({
  label,
  level,
  size = "sm",
  className,
}: ProfileStatusPillProps) {
  const style = LEVEL_STYLES[level] ?? DEFAULT_STYLE

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap",
        size === "sm"
          ? "text-[10.5px] px-2 py-0.5"
          : "text-[11.5px] px-2.5 py-1",
        style.pill,
        className
      )}
    >
      <span
        className={cn("w-1.5 h-1.5 rounded-full shrink-0", style.dot)}
        aria-hidden="true"
      />
      <span className="text-slate-500 font-normal">{label}:</span>
      <span>{level}</span>
    </span>
  )
}
