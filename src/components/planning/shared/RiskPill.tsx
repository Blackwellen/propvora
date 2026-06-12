"use client"

import { cn } from "@/lib/utils"

interface RiskPillProps {
  level: "Low" | "Medium" | "High" | "low" | "medium" | "high"
  size?: "sm" | "md"
  showDot?: boolean
}

const COLOUR_MAP: Record<string, { pill: string; dot: string }> = {
  low: {
    pill: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    dot: "bg-emerald-500",
  },
  medium: {
    pill: "bg-amber-50 text-amber-700 border border-amber-200",
    dot: "bg-amber-500",
  },
  high: {
    pill: "bg-red-50 text-red-700 border border-red-200",
    dot: "bg-red-500",
  },
}

export default function RiskPill({ level, size = "md", showDot = false }: RiskPillProps) {
  const normalised = level.charAt(0).toUpperCase() + level.slice(1).toLowerCase() as
    | "Low"
    | "Medium"
    | "High"
  const key = level.toLowerCase() as "low" | "medium" | "high"
  const colours = COLOUR_MAP[key] ?? COLOUR_MAP.medium

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold",
        size === "sm" ? "text-[10.5px] px-2 py-0.5" : "text-[11.5px] px-2.5 py-1",
        colours.pill
      )}
    >
      {showDot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", colours.dot)}
          aria-hidden="true"
        />
      )}
      {normalised} Risk
    </span>
  )
}
