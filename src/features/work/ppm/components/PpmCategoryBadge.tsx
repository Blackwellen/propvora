import React from "react"
import { Flame, Zap, Shield, Droplets, Wrench, Building2, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

export type PpmCategory =
  | "Gas"
  | "Electrical"
  | "Fire"
  | "Water"
  | "Plumbing"
  | "Mechanical"
  | "Building"
  | "General"

interface Props {
  category: PpmCategory
  size?: "sm" | "md"
}

const CATEGORY_CONFIG: Record<
  PpmCategory,
  { label: string; classes: string; icon: React.ElementType }
> = {
  Gas:        { label: "Gas",        classes: "bg-orange-50 text-orange-700 border-orange-200",   icon: Flame },
  Electrical: { label: "Electrical", classes: "bg-yellow-50 text-yellow-700 border-yellow-200",   icon: Zap },
  Fire:       { label: "Fire",       classes: "bg-red-50 text-red-700 border-red-200",             icon: Shield },
  Water:      { label: "Water",      classes: "bg-teal-50 text-teal-700 border-teal-200",          icon: Droplets },
  Plumbing:   { label: "Plumbing",   classes: "bg-[var(--brand-soft)] text-[var(--brand)] border-[var(--color-brand-100)]",          icon: Droplets },
  Mechanical: { label: "Mechanical", classes: "bg-violet-50 text-violet-700 border-violet-200",    icon: Settings },
  Building:   { label: "Building",   classes: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: Building2 },
  General:    { label: "General",    classes: "bg-slate-100 text-slate-700 border-slate-200",      icon: Wrench },
}

export function PpmCategoryBadge({ category, size = "md" }: Props) {
  const cfg = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.General
  const Icon = cfg.icon
  const iconSize = size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"
  const textSize = size === "sm" ? "text-[10px]" : "text-[11px]"
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold border whitespace-nowrap",
        textSize,
        cfg.classes
      )}
    >
      <Icon className={iconSize} />
      {cfg.label}
    </span>
  )
}
