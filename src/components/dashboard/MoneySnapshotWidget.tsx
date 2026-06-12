"use client"

import React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { PoundSterling, TrendingUp, TrendingDown, ArrowRight, AlertTriangle, CalendarDays } from "lucide-react"

export interface MoneySnapshotData {
  monthlyIncome: number
  monthlyExpenses: number
  netCashflow: number
  arrearsAmount: number
  nextWeekBills: number
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

export function MoneySnapshotWidget({ data }: { data: MoneySnapshotData }) {
  const incomeBarWidth = Math.min(100, (data.monthlyIncome / Math.max(data.monthlyIncome, data.monthlyExpenses)) * 100)
  const expenseBarWidth = Math.min(100, (data.monthlyExpenses / Math.max(data.monthlyIncome, data.monthlyExpenses)) * 100)
  const isPositive = data.netCashflow >= 0

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
          <PoundSterling className="w-4 h-4 text-[#10B981]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Money Snapshot</h3>
          <p className="text-xs text-slate-500">This month</p>
        </div>
      </div>

      {/* Net cashflow hero */}
      <div className={cn(
        "rounded-xl p-4 flex items-center justify-between",
        isPositive ? "bg-emerald-50" : "bg-red-50"
      )}>
        <div>
          <p className="text-xs font-medium text-slate-500 mb-0.5">Net Cashflow</p>
          <p className={cn(
            "text-2xl font-bold tracking-tight",
            isPositive ? "text-[#10B981]" : "text-[#EF4444]"
          )}>
            {formatCurrency(data.netCashflow)}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">This month</p>
        </div>
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          isPositive ? "bg-emerald-100" : "bg-red-100"
        )}>
          {isPositive ? (
            <TrendingUp className="w-5 h-5 text-[#10B981]" />
          ) : (
            <TrendingDown className="w-5 h-5 text-[#EF4444]" />
          )}
        </div>
      </div>

      {/* Income vs Expenses bars */}
      <div className="flex flex-col gap-2.5">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-500">Income</span>
            <span className="text-xs font-semibold text-[#10B981]">{formatCurrency(data.monthlyIncome)}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#10B981] rounded-full transition-all duration-500"
              style={{ width: `${incomeBarWidth}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-500">Expenses</span>
            <span className="text-xs font-semibold text-[#EF4444]">{formatCurrency(data.monthlyExpenses)}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#EF4444] rounded-full transition-all duration-500"
              style={{ width: `${expenseBarWidth}%` }}
            />
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="flex flex-col gap-2">
        {data.arrearsAmount > 0 && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 border border-red-100">
            <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444] shrink-0" />
            <span className="text-xs text-slate-600">
              <span className="font-semibold text-[#EF4444]">{formatCurrency(data.arrearsAmount)}</span> in arrears
            </span>
          </div>
        )}
        {data.nextWeekBills > 0 && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-100">
            <CalendarDays className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
            <span className="text-xs text-slate-600">
              <span className="font-semibold text-[#F59E0B]">{formatCurrency(data.nextWeekBills)}</span> bills due next 7 days
            </span>
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-slate-100">
        <Button variant="ghost" size="sm" asChild className="w-full justify-center text-[#2563EB] hover:bg-blue-50">
          <Link href="/app/money">
            View money
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
