"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { StatCard } from "@/components/ui/StatCard"
import {
  Building2, TrendingUp, TrendingDown, Minus,
  PoundSterling, Wrench, CalendarClock, FileText,
  Map, Users, AlertTriangle, Home,
} from "lucide-react"
import { LineChart, Line, ResponsiveContainer } from "recharts"

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */
export interface KpiData {
  properties: number
  propertiesTrend: number
  occupancyPct: number
  occupancyTrend: number
  monthlyRentRoll: number
  rentRollTrend: number
  openWork: number
  openWorkTrend: number
  upcomingEvents: number
  outstandingInvoices: number
  activePlanningSets: number
  contactsFollowUp: number
}

/* ------------------------------------------------------------------ */
/* Micro sparkline (7 dummy points — replace with real data)          */
/* ------------------------------------------------------------------ */
function MiniSparkline({ color, trend }: { color: string; trend: number }) {
  const base = 40
  const data = trend >= 0
    ? [
        { v: base - 8 }, { v: base - 4 }, { v: base },
        { v: base + 2 }, { v: base + 5 }, { v: base + 7 }, { v: base + 9 },
      ]
    : [
        { v: base + 8 }, { v: base + 4 }, { v: base },
        { v: base - 2 }, { v: base - 5 }, { v: base - 7 }, { v: base - 9 },
      ]

  return (
    <div
      className="w-16 h-8"
      role="img"
      aria-label={`Trend ${trend >= 0 ? "up" : "down"}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone" dataKey="v" stroke={color}
            strokeWidth={1.5} dot={false} isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Change indicator                                                     */
/* ------------------------------------------------------------------ */
function ChangeIndicator({ value, inverted = false }: { value: number; inverted?: boolean }) {
  if (value === 0) return <span className="text-slate-400 text-[11px] flex items-center gap-0.5"><Minus className="w-3 h-3" />0%</span>
  const isGood = inverted ? value < 0 : value > 0
  return isGood ? (
    <span className="text-emerald-600 text-[11px] font-semibold flex items-center gap-0.5">
      <TrendingUp className="w-3 h-3" />+{Math.abs(value)}%
    </span>
  ) : (
    <span className="text-red-500 text-[11px] font-semibold flex items-center gap-0.5">
      <TrendingDown className="w-3 h-3" />-{Math.abs(value)}%
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Health pill                                                          */
/* ------------------------------------------------------------------ */
function HealthPill({ level }: { level: "healthy" | "warning" | "overdue" | "outstanding" | null }) {
  if (!level) return null
  const cfg = {
    healthy:     { label: "Healthy",     bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
    warning:     { label: "Warning",     bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500" },
    overdue:     { label: "Overdue",     bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-500" },
    outstanding: { label: "Outstanding", bg: "bg-orange-50",  text: "text-orange-700",  dot: "bg-orange-500" },
  }[level]
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border", cfg.bg, cfg.text,
      level === "healthy" ? "border-emerald-100" : level === "warning" ? "border-amber-100" : level === "overdue" ? "border-red-100" : "border-orange-100"
    )}>
      <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Executive KPI Card                                                  */
/* ------------------------------------------------------------------ */
interface KpiCardProps {
  label: string
  value: string
  trend?: number
  trendInverted?: boolean
  icon: React.ElementType
  iconBg: string
  iconColor: string
  valueColor?: string
  subtitle?: string
  sparklineColor?: string
  health?: "healthy" | "warning" | "overdue" | "outstanding" | null
  href?: string
}

function KpiCard({
  label, value, trend, trendInverted, icon: Icon,
  iconBg, iconColor, valueColor, subtitle,
  sparklineColor, health, href,
}: KpiCardProps) {
  // Delegates to the canonical executive StatCard, keeping the sparkline (top-
  // right) and the change-indicator + health-pill (footer) in the same shell.
  return (
    <StatCard
      icon={Icon}
      chipClass={cn(iconBg, iconColor)}
      label={label}
      value={value}
      sub={subtitle}
      valueClass={valueColor}
      href={href}
      topRight={trend !== undefined && sparklineColor ? <MiniSparkline color={sparklineColor} trend={trend} /> : undefined}
      footer={
        (trend !== undefined || health) ? (
          <>
            {trend !== undefined
              ? <ChangeIndicator value={trend} inverted={trendInverted} />
              : <span className="text-[10.5px] text-slate-400">{subtitle ?? ""}</span>}
            {health && <HealthPill level={health} />}
          </>
        ) : undefined
      }
    />
  )
}

/* ------------------------------------------------------------------ */
/* KpiStrip                                                            */
/* ------------------------------------------------------------------ */
export function KpiStrip({ data }: { data: KpiData }) {
  const occupancyHealth = data.occupancyPct >= 90 ? "healthy" : data.occupancyPct >= 70 ? "warning" : "overdue"
  const occupancyColor = data.occupancyPct >= 90 ? "text-[#10B981]" : data.occupancyPct >= 70 ? "text-[#F59E0B]" : "text-[#EF4444]"
  const rentColor = "#10B981"

  const fmtGBP = (n: number) =>
    new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0 }).format(n)

  const cards: KpiCardProps[] = [
    {
      label: "Properties",
      value: String(data.properties),
      trend: data.propertiesTrend,
      icon: Building2,
      iconBg: "bg-blue-50",
      iconColor: "text-[#2563EB]",
      subtitle: "Active in portfolio",
      sparklineColor: "#2563EB",
      health: data.propertiesTrend >= 0 ? "healthy" : "warning",
      href: "/app/portfolio/properties",
    },
    {
      label: "Occupancy",
      value: `${data.occupancyPct}%`,
      trend: data.occupancyTrend,
      icon: TrendingUp,
      iconBg: data.occupancyPct >= 90 ? "bg-emerald-50" : data.occupancyPct >= 70 ? "bg-amber-50" : "bg-red-50",
      iconColor: occupancyColor,
      valueColor: occupancyColor,
      subtitle: "Portfolio average",
      sparklineColor: data.occupancyPct >= 90 ? "#10B981" : data.occupancyPct >= 70 ? "#F59E0B" : "#EF4444",
      health: occupancyHealth,
      href: "/app/portfolio/units",
    },
    {
      label: "Monthly Rent Roll",
      value: fmtGBP(data.monthlyRentRoll),
      trend: data.rentRollTrend,
      icon: PoundSterling,
      iconBg: "bg-emerald-50",
      iconColor: "text-[#10B981]",
      subtitle: "Gross collected",
      sparklineColor: rentColor,
      health: "healthy",
      href: "/app/portfolio/tenancies",
    },
    {
      label: "Open Work",
      value: String(data.openWork),
      trend: data.openWorkTrend,
      trendInverted: true,
      icon: Wrench,
      iconBg: data.openWork > 5 ? "bg-amber-50" : "bg-slate-50",
      iconColor: data.openWork > 5 ? "text-[#F59E0B]" : "text-slate-500",
      valueColor: data.openWork > 5 ? "text-[#F59E0B]" : undefined,
      subtitle: "Tasks & jobs",
      sparklineColor: "#F59E0B",
      health: data.openWork > 10 ? "overdue" : data.openWork > 3 ? "warning" : "healthy",
      href: "/app/work",
    },
    {
      label: "Outstanding Invoices",
      value: fmtGBP(data.outstandingInvoices),
      icon: FileText,
      iconBg: data.outstandingInvoices > 0 ? "bg-orange-50" : "bg-slate-50",
      iconColor: data.outstandingInvoices > 0 ? "text-[#F97316]" : "text-slate-500",
      valueColor: data.outstandingInvoices > 0 ? "text-[#F97316]" : undefined,
      subtitle: "Awaiting payment",
      health: data.outstandingInvoices > 0 ? "outstanding" : "healthy",
      href: "/app/money/invoices",
    },
    {
      label: "Contacts",
      value: String(data.contactsFollowUp),
      icon: Users,
      iconBg: data.contactsFollowUp > 0 ? "bg-amber-50" : "bg-slate-50",
      iconColor: data.contactsFollowUp > 0 ? "text-[#F59E0B]" : "text-slate-500",
      subtitle: "Need follow-up",
      health: data.contactsFollowUp > 0 ? "warning" : "healthy",
      href: "/app/contacts",
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => (
        <KpiCard key={card.label} {...card} />
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Re-export individual pieces for use in portfolio sub-sections      */
/* ------------------------------------------------------------------ */
export { KpiCard, ChangeIndicator, HealthPill, MiniSparkline }
export type { KpiCardProps }
