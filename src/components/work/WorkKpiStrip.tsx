"use client"

import React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export interface WorkKpi {
  icon?: React.ElementType
  iconBg?: string
  iconColor?: string
  value: string | number
  label: string
  sub?: string
  subColor?: string
  ring?: boolean
  ringColor?: string
  /** When provided the card is rendered as a Link to this href */
  href?: string
}

interface WorkKpiStripProps {
  kpis: WorkKpi[]
}

export function WorkKpiStrip({ kpis }: WorkKpiStripProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {kpis.map((kpi, i) => (
        <KpiCard key={i} kpi={kpi} />
      ))}
    </div>
  )
}

function KpiCard({ kpi }: { kpi: WorkKpi }) {
  const {
    icon: Icon,
    iconBg,
    iconColor,
    value,
    label,
    sub,
    subColor,
    ring,
    ringColor = "#2563EB",
    href,
  } = kpi

  const inner = (
    <>
      {ring ? (
        <div className="relative w-10 h-10 shrink-0">
          <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="15.9"
              fill="none"
              stroke="#E2E8F0"
              strokeWidth="3"
            />
            <circle
              cx="18"
              cy="18"
              r="15.9"
              fill="none"
              stroke={ringColor}
              strokeWidth="3"
              strokeDasharray={`${value} ${100 - Number(value)}`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-slate-700">
            {value}%
          </span>
        </div>
      ) : Icon ? (
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
            iconBg
          )}
        >
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
      ) : null}

      <div className="min-w-0">
        <p className="text-2xl font-bold text-slate-900 leading-none">{value}</p>
        <p className="text-xs font-medium text-slate-600 mt-0.5 truncate">{label}</p>
        {sub && (
          <p className={cn("text-[11px] mt-0.5", subColor ?? "text-slate-400")}>
            {sub}
          </p>
        )}
      </div>
    </>
  )

  const baseClass = "bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 hover:shadow-md transition-shadow"

  if (href) {
    return (
      <Link href={href} className={cn(baseClass, "cursor-pointer")}>
        {inner}
      </Link>
    )
  }

  return (
    <div className={baseClass}>
      {inner}
    </div>
  )
}
