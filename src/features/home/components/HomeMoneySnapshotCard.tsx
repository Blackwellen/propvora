"use client"

import Link from "next/link"
import { PoundSterling, TrendingUp } from "lucide-react"
import type { HomeMoneyData } from "../types"

interface HomeMoneySnapshotCardProps {
  data: HomeMoneyData
}

function StatRow({
  label,
  value,
  dotColor,
  href,
}: {
  label: string
  value: number
  dotColor: string
  href?: string
}) {
  const inner = (
    <>
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-slate-400">{label}</p>
        <p className="text-[14px] font-bold text-slate-900">
          {value === 0 ? "—" : `£${value.toLocaleString("en-GB")}`}
        </p>
      </div>
    </>
  )
  if (href) {
    return (
      <Link href={href} className="flex items-center gap-2.5 -mx-1 px-1 py-0.5 rounded-lg hover:bg-slate-50 transition-colors">
        {inner}
      </Link>
    )
  }
  return <div className="flex items-center gap-2.5">{inner}</div>
}

export function HomeMoneySnapshotCard({ data }: HomeMoneySnapshotCardProps) {
  const hasData = data.income > 0 || data.expenses > 0

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-slate-900">Money snapshot</h3>
        <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
          <PoundSterling className="text-emerald-600" style={{ width: 14, height: 14 }} />
        </div>
      </div>

      <div className="flex flex-col gap-3 flex-1">
        <StatRow label="Rent roll (active)" value={data.income} dotColor="bg-emerald-500" href="/app/money/income" />
        <StatRow label="Outstanding invoices" value={data.expenses} dotColor="bg-red-500" href="/app/money/invoices" />

        <div className="border-t border-slate-100 pt-2">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-slate-400">Net cashflow</p>
              <p className={`text-[14px] font-bold ${data.netCashflow >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                {data.netCashflow === 0 ? "—" : `${data.netCashflow < 0 ? "-" : ""}£${Math.abs(data.netCashflow).toLocaleString("en-GB")}`}
              </p>
            </div>
            {hasData && (
              <TrendingUp
                className={data.netCashflow >= 0 ? "text-emerald-500" : "text-red-500"}
                style={{ width: 16, height: 16 }}
              />
            )}
          </div>
        </div>

        {!hasData && (
          <div className="flex items-center gap-2 py-1">
            <p className="text-[12px] text-slate-400">No financial data yet this month</p>
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-slate-100">
        <Link
          href="/app/money"
          className="text-[12px] font-medium text-blue-600 hover:text-blue-800 transition-colors"
        >
          View money →
        </Link>
      </div>
    </div>
  )
}
