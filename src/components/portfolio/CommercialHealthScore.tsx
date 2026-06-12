import React from "react"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react"

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */
export type HealthLevel = "healthy" | "watch" | "at_risk" | "critical" | "no_data"

export interface HealthInputs {
  occupancyPct?: number         // 0–100
  hasArrears?: boolean
  openWorkCount?: number
  missingDocCount?: number
  daysUntilTenancyEnd?: number  // null if no tenancy
  isVacant?: boolean
  isBehindForecast?: boolean
}

/* ------------------------------------------------------------------ */
/* Score calculation                                                    */
/* ------------------------------------------------------------------ */
export function computeHealthScore(inputs: HealthInputs): { level: HealthLevel; score: number; reasons: string[] } {
  const reasons: string[] = []
  let score = 100

  if (inputs.isVacant) { score -= 40; reasons.push("Unit/property vacant") }
  else if ((inputs.occupancyPct ?? 100) < 75) { score -= 20; reasons.push("Occupancy below 75%") }
  if (inputs.hasArrears) { score -= 30; reasons.push("Rent arrears") }
  if ((inputs.openWorkCount ?? 0) > 3) { score -= 20; reasons.push("Multiple open work orders") }
  else if ((inputs.openWorkCount ?? 0) > 0) { score -= 8; reasons.push("Open work orders") }
  if ((inputs.missingDocCount ?? 0) > 2) { score -= 15; reasons.push("Missing key documents") }
  else if ((inputs.missingDocCount ?? 0) > 0) { score -= 5; reasons.push("Documents incomplete") }
  if (inputs.daysUntilTenancyEnd != null && inputs.daysUntilTenancyEnd >= 0 && inputs.daysUntilTenancyEnd <= 30) { score -= 20; reasons.push("Tenancy ending within 30 days") }
  else if (inputs.daysUntilTenancyEnd != null && inputs.daysUntilTenancyEnd >= 0 && inputs.daysUntilTenancyEnd <= 60) { score -= 10; reasons.push("Tenancy ending within 60 days") }
  if (inputs.isBehindForecast) { score -= 15; reasons.push("Behind forecast") }

  score = Math.max(0, Math.min(100, score))

  let level: HealthLevel
  if (score >= 85) level = "healthy"
  else if (score >= 65) level = "watch"
  else if (score >= 40) level = "at_risk"
  else level = "critical"

  return { level, score, reasons }
}

/* ------------------------------------------------------------------ */
/* Display config                                                       */
/* ------------------------------------------------------------------ */
const LEVEL_CONFIG: Record<HealthLevel, {
  label: string
  color: string
  bg: string
  border: string
  icon: React.ElementType
  barColor: string
}> = {
  healthy:  { label: "Healthy",   color: "text-emerald-700",  bg: "bg-emerald-50",  border: "border-emerald-200", icon: TrendingUp,   barColor: "bg-emerald-500" },
  watch:    { label: "Watch",     color: "text-amber-700",    bg: "bg-amber-50",    border: "border-amber-200",   icon: Minus,        barColor: "bg-amber-500" },
  at_risk:  { label: "At Risk",   color: "text-red-700",      bg: "bg-red-50",      border: "border-red-200",     icon: TrendingDown, barColor: "bg-red-500" },
  critical: { label: "Critical",  color: "text-red-900",      bg: "bg-red-100",     border: "border-red-300",     icon: AlertTriangle,barColor: "bg-red-700" },
  no_data:  { label: "No Data",   color: "text-slate-500",    bg: "bg-slate-50",    border: "border-slate-200",   icon: Minus,        barColor: "bg-slate-300" },
}

/* ------------------------------------------------------------------ */
/* Inline badge (compact)                                               */
/* ------------------------------------------------------------------ */
interface HealthBadgeProps {
  level: HealthLevel
  showDot?: boolean
  className?: string
  size?: "xs" | "sm" | "md"
}

export function CommercialHealthBadge({ level, showDot = true, className, size = "sm" }: HealthBadgeProps) {
  const cfg = LEVEL_CONFIG[level]
  const Icon = cfg.icon
  const sizeClasses = {
    xs: "text-[9px] px-1.5 py-0.5 rounded-md gap-1",
    sm: "text-[10px] px-2 py-0.5 rounded-md gap-1",
    md: "text-xs px-2.5 py-1 rounded-lg gap-1.5",
  }
  return (
    <span className={cn("inline-flex items-center font-semibold border", cfg.color, cfg.bg, cfg.border, sizeClasses[size], className)}>
      {showDot && <span className={cn("w-1.5 h-1.5 rounded-full", cfg.barColor)} />}
      {cfg.label}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Score card (larger display with score bar)                          */
/* ------------------------------------------------------------------ */
interface HealthScoreCardProps {
  inputs: HealthInputs
  className?: string
}

export function CommercialHealthScoreCard({ inputs, className }: HealthScoreCardProps) {
  const { level, score, reasons } = computeHealthScore(inputs)
  const cfg = LEVEL_CONFIG[level]
  const Icon = cfg.icon

  return (
    <div className={cn("bg-white rounded-2xl border shadow-sm p-4", cfg.border, className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", cfg.bg)}>
            <Icon className={cn("w-4 h-4", cfg.color)} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Health Score</p>
            <p className={cn("text-sm font-bold", cfg.color)}>{cfg.label}</p>
          </div>
        </div>
        <div className={cn("text-2xl font-black", cfg.color)}>{score}</div>
      </div>

      {/* Score bar */}
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
        <div className={cn("h-full rounded-full transition-all duration-500", cfg.barColor)} style={{ width: `${score}%` }} />
      </div>

      {/* Reasons */}
      {reasons.length > 0 && (
        <div className="flex flex-col gap-1">
          {reasons.map((r, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-slate-500">
              <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
              {r}
            </div>
          ))}
        </div>
      )}
      {reasons.length === 0 && (
        <p className="text-xs text-emerald-600 font-medium">No issues detected</p>
      )}
    </div>
  )
}
