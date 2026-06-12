"use client"
import React from "react"
import { StatCard } from "@/components/ui/StatCard"

interface LegalKpiCardProps {
  icon: React.ElementType
  iconColor: string
  value: string | number
  label: string
  sublabel?: string
  trendText?: string
  trendColor?: string
}

// Delegates to the canonical StatCard for one consistent KPI style app-wide.
export function LegalKpiCard({
  icon: Icon, iconColor, value, label, sublabel, trendText, trendColor = "text-slate-500",
}: LegalKpiCardProps) {
  const up = /emerald|green/.test(trendColor)
  return (
    <StatCard
      icon={Icon}
      chipClass={iconColor}
      value={value}
      label={label}
      sub={sublabel}
      trend={trendText ? { text: trendText, up } : undefined}
    />
  )
}
