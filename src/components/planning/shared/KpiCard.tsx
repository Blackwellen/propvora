"use client"

import React from "react"
import { StatCard, type StatAccent } from "@/components/ui/StatCard"

interface KpiCardProps {
  label: string
  value: string | number
  subtitle?: string
  trend?: { value: string; positive: boolean }
  icon?: React.ElementType<{ className?: string }>
  iconColour?: string
  loading?: boolean
  onClick?: () => void
  accent?: string
}

/** Map a hex/colour hint to the nearest named accent (planning is violet-themed). */
function toAccent(hex?: string): StatAccent {
  const h = (hex ?? "").toLowerCase()
  if (/#?(25|3b|1d).*(eb|f6|d8)/.test(h) || h.includes("blue")) return "blue"
  if (h.includes("10b981") || h.includes("emerald") || h.includes("059669")) return "emerald"
  if (h.includes("f59e0b") || h.includes("amber") || h.includes("d97706")) return "amber"
  if (h.includes("ef4444") || h.includes("red") || h.includes("dc2626")) return "red"
  if (h.includes("0ea5e9") || h.includes("sky")) return "sky"
  return "violet"
}

// Delegates to the canonical StatCard for one consistent KPI style app-wide.
export default function KpiCard({
  label, value, subtitle, trend, icon, iconColour, loading = false, onClick, accent,
}: KpiCardProps) {
  return (
    <StatCard
      icon={icon}
      label={label}
      value={value}
      sub={subtitle}
      accent={toAccent(iconColour ?? accent)}
      trend={trend ? { text: trend.value, up: trend.positive } : undefined}
      onClick={onClick}
      loading={loading}
    />
  )
}
