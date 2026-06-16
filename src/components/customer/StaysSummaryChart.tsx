"use client"

import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { CustomerCard } from "./ui"
import { moneyPence } from "./format"
import type { CustomerStaySummary } from "@/lib/customer/types"

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number)
  if (!y || !m) return key
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "short" })
}

export default function StaysSummaryChart({ summary }: { summary: CustomerStaySummary }) {
  const data = summary.by_month.map((m) => ({
    label: monthLabel(m.month),
    nights: m.nights,
    spend_pence: m.spend_pence,
  }))

  return (
    <CustomerCard className="p-5">
      <h2 className="text-base font-semibold text-slate-900 mb-1">Your stays</h2>
      <p className="text-[13px] text-slate-500 mb-4">A quick rollup of where your travel has gone.</p>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <p className="text-2xl font-bold text-slate-900 leading-none">{summary.total_stays}</p>
          <p className="mt-1 text-[12px] text-slate-500">Stays</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900 leading-none">{summary.total_nights}</p>
          <p className="mt-1 text-[12px] text-slate-500">Nights</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900 leading-none">{moneyPence(summary.total_spend_pence, summary.currency)}</p>
          <p className="mt-1 text-[12px] text-slate-500">Total spend</p>
        </div>
      </div>

      {data.length > 0 ? (
        <div className="h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: "rgba(37,99,235,0.06)" }}
                formatter={((value: number) => [String(value), "Nights"]) as never}
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
              />
              <Bar dataKey="nights" radius={[6, 6, 0, 0]} maxBarSize={36}>
                {data.map((_, i) => (
                  <Cell key={i} fill="#2563EB" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-[13px] text-slate-400 py-6 text-center">Your nights-per-month chart appears once you have a completed stay.</p>
      )}
    </CustomerCard>
  )
}
