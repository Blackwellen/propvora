"use client"

import React from "react"
import { cn } from "@/lib/utils"
import {
  TrendingUp, TrendingDown, FileText, AlertTriangle, Target, BarChart3,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface FinanceKpiData {
  totalIncome: number
  totalExpenses: number
  netCashflow: number
  overdueReceivables: number
  totalOutstanding: number
  collectionRate: number
}

export interface FinanceMoneyKpiStripProps {
  data: FinanceKpiData
  loading?: boolean
}

const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 })
function fmtGBP(n: number): string {
  return gbp.format(Number.isFinite(n) ? n : 0)
}

export function FinanceMoneyKpiStrip({ data, loading }: FinanceMoneyKpiStripProps) {
  const kpis: { label: string; value: string; sub: string; icon: LucideIcon; color: string; bg: string }[] = [
    { label: "Total Income",        value: fmtGBP(data.totalIncome),        sub: "This month",          icon: TrendingUp,   color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Total Expenses",      value: fmtGBP(data.totalExpenses),      sub: "This month",          icon: TrendingDown, color: "text-red-600",     bg: "bg-red-50"     },
    { label: "Net Cashflow",        value: fmtGBP(data.netCashflow),        sub: "Income - Expenses",   icon: BarChart3,    color: "text-[var(--brand)]",   bg: "bg-[var(--brand-soft)]"    },
    { label: "Overdue Receivables", value: fmtGBP(data.overdueReceivables), sub: "Past due",            icon: AlertTriangle,color: "text-red-600",     bg: "bg-red-50"     },
    { label: "Outstanding",         value: fmtGBP(data.totalOutstanding),   sub: "Total receivables",   icon: FileText,     color: "text-amber-600",   bg: "bg-amber-50"   },
    { label: "Collection Rate",     value: `${data.collectionRate}%`,        sub: "Paid vs issued",      icon: Target,       color: "text-emerald-600", bg: "bg-emerald-50" },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      {kpis.map((k) => {
        const Icon = k.icon
        return (
          <div key={k.label} className={cn("bg-white border border-slate-200 rounded-2xl p-4 shadow-sm", loading && "animate-pulse")}>
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center mb-2", k.bg)}>
              <Icon className={cn("w-4 h-4", k.color)} />
            </div>
            <p className={cn("text-2xl font-bold", k.color)}>{loading ? "—" : k.value}</p>
            <p className="text-[11px] font-semibold text-slate-700 mt-0.5">{k.label}</p>
            <p className="text-[10px] text-slate-400">{k.sub}</p>
          </div>
        )
      })}
    </div>
  )
}

export default FinanceMoneyKpiStrip
