"use client"

import React from "react"
import { StatCard, type StatAccent, type StatBadgeTone } from "@/components/ui/StatCard"

interface WorkKpiCardProps {
  icon: React.ElementType
  title: string
  value: number | string
  trend?: string
  trendUp?: boolean
  riskLevel?: "low" | "medium" | "high" | "critical"
  onClick?: () => void
  loading?: boolean
}

const RISK_ACCENT: Record<NonNullable<WorkKpiCardProps["riskLevel"]>, StatAccent> = {
  low: "emerald", medium: "amber", high: "orange", critical: "red",
}
const RISK_BADGE: Record<"medium" | "high" | "critical", { text: string; tone: StatBadgeTone }> = {
  medium: { text: "Medium", tone: "amber" },
  high: { text: "High", tone: "orange" },
  critical: { text: "Critical", tone: "red" },
}

// Delegates to the canonical StatCard for one consistent KPI style app-wide.
export function WorkKpiCard({
  icon, title, value, trend, trendUp, riskLevel = "low", onClick, loading = false,
}: WorkKpiCardProps) {
  return (
    <StatCard
      icon={icon}
      label={title}
      value={value}
      accent={RISK_ACCENT[riskLevel]}
      badge={riskLevel !== "low" ? RISK_BADGE[riskLevel] : undefined}
      trend={trend ? { text: trend, up: trendUp } : undefined}
      onClick={onClick}
      loading={loading}
    />
  )
}
