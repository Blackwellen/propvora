"use client"

import type { ReactNode } from "react"
import { StatCard } from "@/components/ui/StatCard"

interface ContactsKpiCardProps {
  label: string
  value: string | number
  trend?: string
  trendUp?: boolean
  icon: ReactNode
  accentColor?: string
  alert?: string
  className?: string
}

// Delegates to the canonical StatCard for one consistent KPI style app-wide.
export default function ContactsKpiCard({
  label, value, trend, trendUp, icon, accentColor = "bg-[var(--brand-soft)]", alert, className = "",
}: ContactsKpiCardProps) {
  return (
    <StatCard
      iconNode={icon}
      chipClass={accentColor}
      label={label}
      value={value}
      trend={trend ? { text: trend, up: trendUp } : undefined}
      badge={alert ? { text: alert, tone: "red" } : undefined}
      className={className}
    />
  )
}
