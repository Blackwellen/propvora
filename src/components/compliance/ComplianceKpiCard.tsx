"use client"

import { cn } from "@/lib/utils"
import { StatCard } from "@/components/ui/StatCard"

interface ComplianceKpiCardProps {
  label: string
  value: string | number
  subtitle?: string
  trend?: string
  trendPositive?: boolean
  icon: React.ComponentType<{ className?: string }>
  iconBg?: string
  iconColor?: string
  href?: string
}

// Delegates to the canonical StatCard for one consistent KPI style app-wide.
export function ComplianceKpiCard({
  label, value, subtitle, trend, trendPositive,
  icon: Icon, iconBg = "bg-blue-100", iconColor = "text-blue-600", href,
}: ComplianceKpiCardProps) {
  return (
    <StatCard
      icon={Icon}
      chipClass={cn(iconBg, iconColor)}
      label={label}
      value={value}
      sub={subtitle}
      trend={trend ? { text: trend, up: trendPositive } : undefined}
      href={href}
    />
  )
}
