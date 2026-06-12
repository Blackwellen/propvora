"use client"

import { cn } from "@/lib/utils"
import { StatCard, type StatBadgeTone } from "@/components/ui/StatCard"

interface MoneyKpiCardProps {
  label: string
  value: string | number
  subtitle?: string
  trend?: string
  trendUp?: boolean
  trendNeutral?: boolean
  icon: React.ReactNode
  iconBg?: string
  iconColor?: string
  href?: string
  alert?: string
  alertColor?: string
  className?: string
}

function toneFromClass(c?: string): StatBadgeTone {
  if (!c) return "amber"
  if (c.includes("red")) return "red"
  if (c.includes("emerald") || c.includes("green")) return "emerald"
  if (c.includes("orange")) return "orange"
  if (c.includes("blue")) return "blue"
  if (c.includes("violet") || c.includes("purple")) return "violet"
  return "amber"
}

// Delegates to the canonical StatCard so every KPI looks identical app-wide.
export default function MoneyKpiCard({
  label, value, subtitle, trend, trendUp, trendNeutral, icon,
  iconBg = "bg-slate-100", iconColor = "text-slate-600", href, alert, alertColor, className,
}: MoneyKpiCardProps) {
  return (
    <StatCard
      iconNode={icon}
      chipClass={cn(iconBg, iconColor)}
      label={label}
      value={typeof value === "number" ? value.toLocaleString() : value}
      sub={subtitle}
      trend={trend ? { text: trend, up: !!trendUp && !trendNeutral } : undefined}
      badge={alert ? { text: alert, tone: toneFromClass(alertColor) } : undefined}
      href={href}
      className={className}
    />
  )
}
