import React from "react"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/* Profile colour mapping using design tokens                          */
/* ------------------------------------------------------------------ */
const PROFILE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  "Long-Term Let":          { label: "Long-Term Let",          color: "text-blue-700",     bg: "bg-blue-50",     border: "border-blue-200" },
  "Rent-to-Rent":           { label: "Rent-to-Rent",           color: "text-violet-700",   bg: "bg-violet-50",   border: "border-violet-200" },
  "HMO":                    { label: "HMO",                    color: "text-indigo-700",   bg: "bg-indigo-50",   border: "border-indigo-200" },
  "Student Let":            { label: "Student Let",            color: "text-sky-700",      bg: "bg-sky-50",      border: "border-sky-200" },
  "Serviced Accommodation": { label: "Serviced Acc.",          color: "text-cyan-700",     bg: "bg-cyan-50",     border: "border-cyan-200" },
  "Holiday Let":            { label: "Holiday Let",            color: "text-teal-700",     bg: "bg-teal-50",     border: "border-teal-200" },
  "Build-to-Rent":          { label: "Build-to-Rent",          color: "text-emerald-700",  bg: "bg-emerald-50",  border: "border-emerald-200" },
  "Social Housing":         { label: "Social Housing",         color: "text-green-700",    bg: "bg-green-50",    border: "border-green-200" },
  "Commercial":             { label: "Commercial",             color: "text-amber-700",    bg: "bg-amber-50",    border: "border-amber-200" },
  "Mixed Use":              { label: "Mixed Use",              color: "text-orange-700",   bg: "bg-orange-50",   border: "border-orange-200" },
  "Dev / Flip":             { label: "Dev / Flip",             color: "text-red-700",      bg: "bg-red-50",      border: "border-red-200" },
  "Co-Living":              { label: "Co-Living",              color: "text-purple-700",   bg: "bg-purple-50",   border: "border-purple-200" },
  "Unassigned":             { label: "Unassigned",             color: "text-slate-600",    bg: "bg-slate-100",   border: "border-slate-200" },
}

/* ------------------------------------------------------------------ */
/* Component                                                            */
/* ------------------------------------------------------------------ */
interface OperationProfileBadgeProps {
  profile: string | null | undefined
  size?: "xs" | "sm" | "md"
  showDot?: boolean
  className?: string
}

export function OperationProfileBadge({ profile, size = "sm", showDot = false, className }: OperationProfileBadgeProps) {
  const key = profile ?? "Unassigned"
  const cfg = PROFILE_CONFIG[key] ?? PROFILE_CONFIG["Unassigned"]

  const sizeClasses = {
    xs: "text-[9px] px-1.5 py-0.5 rounded-md",
    sm: "text-[10px] px-2 py-0.5 rounded-md",
    md: "text-xs px-2.5 py-1 rounded-lg",
  }

  return (
    <span className={cn(
      "inline-flex items-center gap-1 font-semibold border",
      cfg.color, cfg.bg, cfg.border,
      sizeClasses[size],
      className
    )}>
      {showDot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />}
      {cfg.label}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* All profiles list (for filter UIs)                                  */
/* ------------------------------------------------------------------ */
export const ALL_OPERATION_PROFILES = Object.keys(PROFILE_CONFIG)
