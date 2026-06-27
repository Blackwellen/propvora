"use client"

import React from "react"
import Link from "next/link"
import type { Unit } from "@/hooks/useUnits"
import type { Tenancy } from "@/hooks/useTenancies"
import { ArrowUpRight, TrendingUp } from "lucide-react"
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts"
import { fmtGBP, type IncomeChartPoint } from "./shared"

export function UnitFinanceTab({ incomeChart, tenancy, unit }: { incomeChart: IncomeChartPoint[]; tenancy: Tenancy | null; unit: Unit }) {
  const rent = tenancy?.rent_amount ?? unit.target_rent ?? null
  const deposit = tenancy?.deposit_amount ?? null
  const hasIncomeData = incomeChart.length > 0

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-slate-500">Rent derived from the active tenancy. Full transactions live in Money.</p>
        <Link href="/property-manager/money" className="flex items-center gap-1.5 px-4 py-2 bg-[var(--brand)] text-white rounded-xl text-[12px] font-semibold hover:bg-[var(--brand-strong)] transition-colors shadow-sm">
          Open Money <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* KPI Strip — live */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Monthly Rent", value: rent != null ? fmtGBP(rent) : "—", sub: tenancy ? "Active tenancy" : "No tenancy" },
          { label: "Annualised", value: rent != null ? fmtGBP(rent * 12) : "—", sub: "Rent × 12" },
          { label: "Deposit Held", value: deposit != null ? fmtGBP(deposit) : "—", sub: tenancy?.deposit_scheme ?? "—" },
          { label: "Status", value: tenancy ? (tenancy.status.charAt(0).toUpperCase() + tenancy.status.slice(1)) : "Vacant", sub: "Tenancy" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{k.label}</div>
            <div className="text-[20px] font-bold tabular-nums text-slate-900 mt-1">{k.value}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Income trend — only if live data exists */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-[13px] font-bold text-slate-900 mb-3">Income Trend</h3>
        {hasIncomeData ? (
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={incomeChart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #E2E8F0" }} />
                <Line type="monotone" dataKey="income" stroke="#2563EB" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-10 flex flex-col items-center justify-center text-center">
            <TrendingUp className="w-8 h-8 text-slate-200 mb-2" />
            <p className="text-[13px] font-semibold text-slate-500">No income recorded yet</p>
            <p className="text-[12px] text-slate-500 mt-1">Logged payments will chart here. Track income in the Money section.</p>
          </div>
        )}
      </div>
    </div>
  )
}
