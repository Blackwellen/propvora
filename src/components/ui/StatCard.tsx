"use client"

import React from "react"
import { cn } from "@/lib/utils"

// ============================================================================
// StatCard — the ONE canonical, EXECUTIVE KPI / stat card for the whole app.
//
// This is the top-class Portfolio / Home / Work style: white rounded-2xl card,
// a tinted icon chip, a bold tabular-nums value, a label, a premium layered
// shadow with a hover-lift and a subtle blue border tint on hover. Optional
// slots — `topRight` (e.g. a sparkline) and `footer` (e.g. a health pill) — let
// richer "executive" cards live in the SAME shell instead of a separate variant.
// Every section's KPI card delegates here so the look is identical everywhere.
// ============================================================================

export type StatAccent =
  | "blue" | "emerald" | "amber" | "orange" | "red" | "violet" | "sky" | "slate"

const ACCENT: Record<StatAccent, { chip: string; value: string }> = {
  blue: { chip: "bg-[#EFF6FF] text-[#2563EB]", value: "text-[#2563EB]" },
  emerald: { chip: "bg-emerald-50 text-emerald-600", value: "text-emerald-600" },
  amber: { chip: "bg-amber-50 text-amber-600", value: "text-amber-600" },
  orange: { chip: "bg-orange-50 text-orange-600", value: "text-orange-600" },
  red: { chip: "bg-red-50 text-red-600", value: "text-red-600" },
  violet: { chip: "bg-[#F5F3FF] text-[#7C3AED]", value: "text-[#7C3AED]" },
  sky: { chip: "bg-sky-50 text-sky-600", value: "text-sky-600" },
  slate: { chip: "bg-slate-100 text-slate-600", value: "text-slate-900" },
}

export type StatBadgeTone = "emerald" | "amber" | "orange" | "red" | "blue" | "slate" | "violet"
const BADGE: Record<StatBadgeTone, string> = {
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  orange: "bg-orange-50 text-orange-700",
  red: "bg-red-50 text-red-700",
  blue: "bg-[#EFF6FF] text-[#2563EB]",
  slate: "bg-slate-100 text-slate-600",
  violet: "bg-[#F5F3FF] text-[#7C3AED]",
}

export interface StatCardProps {
  icon?: React.ElementType
  iconNode?: React.ReactNode
  label: string
  value: React.ReactNode
  accent?: StatAccent
  /** Explicit icon-chip classes (bg + text) — overrides `accent`. */
  chipClass?: string
  /** Colour the value to match the accent. Default keeps it slate-900. */
  colorValue?: boolean
  /** Explicit value colour class — overrides colorValue/default. */
  valueClass?: string
  badge?: { text: string; tone?: StatBadgeTone }
  trend?: { text: string; up?: boolean }
  sub?: string
  /** Slot rendered top-right (e.g. a sparkline). Takes priority over `badge`. */
  topRight?: React.ReactNode
  /** Slot rendered in a bottom footer (e.g. a health pill / change indicator). */
  footer?: React.ReactNode
  onClick?: () => void
  href?: string
  loading?: boolean
  size?: "sm" | "md"
  className?: string
}

const SHELL =
  "bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-all duration-200"
const HOVER =
  "hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 hover:border-blue-100/60"

export function StatCard({
  icon: Icon, iconNode, label, value, accent = "blue", chipClass, colorValue, valueClass,
  badge, trend, sub, topRight, footer, onClick, href, loading = false, size = "md", className,
}: StatCardProps) {
  const a = ACCENT[accent]
  const chip = chipClass ?? a.chip
  const pad = size === "sm" ? "p-3.5" : "p-5"
  const iconBox = size === "sm" ? "w-8 h-8" : "w-9 h-9"
  const iconSize = size === "sm" ? "w-4 h-4" : "w-[18px] h-[18px]"
  const valueSize = size === "sm" ? "text-[18px]" : "text-2xl"

  if (loading) {
    return (
      <div className={cn(SHELL, pad, "animate-pulse", className)}>
        <div className="flex items-start justify-between mb-3">
          <div className={cn("rounded-xl bg-slate-100", iconBox)} />
          <div className="w-14 h-5 rounded-full bg-slate-100" />
        </div>
        <div className="w-12 h-7 rounded bg-slate-100 mb-1.5" />
        <div className="w-24 h-4 rounded bg-slate-100" />
      </div>
    )
  }

  const interactive = !!(onClick || href)
  const content = (
    <>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className={cn("rounded-xl flex items-center justify-center shrink-0", iconBox, chip)}>
          {iconNode ? iconNode : Icon ? <Icon className={iconSize} /> : null}
        </div>
        {topRight ? (
          topRight
        ) : badge ? (
          <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold", BADGE[badge.tone ?? "slate"])}>
            {badge.text}
          </span>
        ) : null}
      </div>
      <p className={cn("font-black tracking-tight tabular-nums leading-none whitespace-nowrap", valueSize, valueClass ?? (colorValue ? a.value : "text-slate-900"))}>
        {value}
      </p>
      <p className="text-[12px] font-medium text-slate-500 mt-1 truncate">{label}</p>
      {sub && <p className="text-[10.5px] text-slate-400 mt-0.5 truncate">{sub}</p>}
      {trend && (
        <p className={cn("text-[11.5px] mt-1.5 font-semibold", trend.up ? "text-emerald-600" : "text-slate-400")}>{trend.text}</p>
      )}
      {footer && <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-50">{footer}</div>}
    </>
  )

  const base = cn(SHELL, interactive && cn(HOVER, "cursor-pointer active:translate-y-0"), !interactive && HOVER, pad, className)

  if (href) return <a href={href} className={base}>{content}</a>
  return <div onClick={onClick} className={base}>{content}</div>
}

export default StatCard
