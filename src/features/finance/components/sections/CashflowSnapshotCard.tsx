"use client"

import React from "react"
import Link from "next/link"
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { CashflowBars } from "./CashflowBars"
import { fmtGBP } from "./MoneyFormatUtils"
import { ActionMenu } from "@/components/portfolio/ActionMenu"

interface CashflowSnapshotCardProps {
  incomeReceived: number
  expensesPaid: number
  netCashflow: number
}

export function CashflowSnapshotCard({
  incomeReceived,
  expensesPaid,
  netCashflow,
}: CashflowSnapshotCardProps) {
  const isEmpty = incomeReceived === 0 && expensesPaid === 0

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Cashflow Snapshot</h2>
          <p className="text-xs text-slate-500 mt-0.5">Received income vs paid expenses</p>
        </div>
        <ActionMenu
          items={[
            { label: "View Income", icon: TrendingUp, onClick: () => { window.location.href = "/property-manager/money/income" } },
            { label: "View Expenses", icon: TrendingDown, onClick: () => { window.location.href = "/property-manager/money/expenses" } },
            { label: "Open Accounting Ledger", icon: BarChart3, onClick: () => { window.location.href = "/property-manager/accounting" } },
          ]}
        />
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
          <BarChart3 className="w-10 h-10 text-slate-200" />
          <p className="text-sm font-medium text-slate-500">No cashflow recorded yet</p>
          <p className="text-xs text-slate-500">Add income and log expenses to see your cashflow here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <CashflowBars income={incomeReceived} expenses={expensesPaid} />
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-500">Net cashflow</span>
            <span className={cn("text-base font-bold", netCashflow >= 0 ? "text-emerald-600" : "text-red-500")}>
              {fmtGBP(netCashflow)}
            </span>
          </div>
        </div>
      )}

      <p className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
        For full ledgers, journals and reports, see{" "}
        <Link href="/property-manager/accounting" className="text-[var(--brand)] font-medium hover:underline">Accounting</Link>.
      </p>
    </div>
  )
}
