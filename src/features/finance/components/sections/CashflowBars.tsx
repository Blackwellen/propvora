"use client"

import { cn } from "@/lib/utils"
import { fmtGBP } from "./MoneyFormatUtils"

interface CashflowBarsProps {
  income: number
  expenses: number
}

export function CashflowBars({ income, expenses }: CashflowBarsProps) {
  const max = Math.max(income, expenses, 1)
  const rows = [
    { label: "Income", value: income, color: "bg-emerald-500", text: "text-emerald-600" },
    { label: "Expenses", value: expenses, color: "bg-red-500", text: "text-red-500" },
  ]

  return (
    <div className="flex flex-col gap-4">
      {rows.map((r) => (
        <div key={r.label} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-600">{r.label}</span>
            <span className={cn("font-semibold", r.text)}>{fmtGBP(r.value)}</span>
          </div>
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full", r.color)}
              style={{ width: `${(r.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
