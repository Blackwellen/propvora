"use client"

import { fmtGBP, fmtGBP2 } from "./MoneyFormatUtils"

interface DonutSeg {
  label: string
  amount: string
  pct: number
  color: string
}

interface ExpenseDonutProps {
  segments: DonutSeg[]
  total: number
}

export function ExpenseDonut({ segments, total }: ExpenseDonutProps) {
  const cx = 80
  const cy = 80
  const r = 58

  let cumPct = 0
  const segs = segments.map((seg) => {
    const start = cumPct
    cumPct += seg.pct
    const startAngle = (start / 100) * 360 - 90
    const endAngle = (cumPct / 100) * 360 - 90
    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180
    const x1 = cx + r * Math.cos(startRad)
    const y1 = cy + r * Math.sin(startRad)
    const x2 = cx + r * Math.cos(endRad)
    const y2 = cy + r * Math.sin(endRad)
    const large = seg.pct > 50 ? 1 : 0
    const d = `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`
    return { ...seg, d }
  })

  return (
    <svg
      viewBox="0 0 160 160"
      className="w-full max-w-[160px]"
      role="img"
      aria-label={`Cost breakdown donut chart, total ${fmtGBP(total)} across ${segments.length} ${segments.length === 1 ? "category" : "categories"}`}
    >
      {total > 0 ? (
        segs.map((seg) => <path key={seg.label} d={seg.d} fill={seg.color} opacity="0.85" />)
      ) : (
        <circle cx={cx} cy={cy} r={r} fill="#f1f5f9" />
      )}
      <circle cx={cx} cy={cy} r={r * 0.58} fill="white" />
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize="11" fontWeight="700" fill="#0f172a">
        {fmtGBP(total)}
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" fontSize="9" fill="#94a3b8">
        Total
      </text>
    </svg>
  )
}

interface CostBreakdownCardProps {
  segments: DonutSeg[]
  total: number
}

export function CostBreakdownCard({ segments, total }: CostBreakdownCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900">Cost Breakdown</h3>
      </div>
      {segments.length > 0 ? (
        <div className="flex items-center gap-4">
          <ExpenseDonut segments={segments} total={total} />
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            {segments.map((seg) => (
              <div key={seg.label} className="flex items-start gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full mt-0.5 shrink-0"
                  style={{ backgroundColor: seg.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] font-medium text-slate-700 truncate">{seg.label}</span>
                    <span className="text-[11px] font-semibold text-slate-900 shrink-0">{seg.pct}%</span>
                  </div>
                  <p className="text-[10px] text-slate-500">{seg.amount}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-500 text-center py-8">No expense data to chart yet.</p>
      )}
    </div>
  )
}

interface ExpenseSummaryCardProps {
  totalAll: number
  totalPaid: number
  planned: number
  fixedCosts: number
  capitalReno: number
}

export function ExpenseSummaryCard({
  totalAll,
  totalPaid,
  planned,
  fixedCosts,
  capitalReno,
}: ExpenseSummaryCardProps) {
  const rows = [
    { label: "Total Paid", value: totalPaid, dot: "bg-emerald-500" },
    { label: "Total Planned", value: planned, dot: "bg-[var(--brand)]" },
    { label: "Fixed Costs", value: fixedCosts, dot: "bg-slate-400" },
    { label: "Capital / Reno", value: capitalReno, dot: "bg-violet-500" },
  ]

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900">Expense Summary</h3>
      </div>
      <div className="mb-4">
        <p className="text-2xl font-bold text-slate-900">{fmtGBP2(totalAll)}</p>
        <p className="text-xs text-slate-500 font-medium mt-0.5">Total recorded</p>
      </div>
      <div className="flex flex-col gap-2.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full shrink-0 ${row.dot}`} />
              <span className="text-xs text-slate-600">{row.label}</span>
            </div>
            <span className="text-xs font-semibold text-slate-900">{fmtGBP2(row.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
