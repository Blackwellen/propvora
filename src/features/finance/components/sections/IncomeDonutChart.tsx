"use client"

import { fmtGBP, fmtGBP2 } from "./MoneyFormatUtils"

interface DonutSegment {
  label: string
  pct: number
  amount: string
  color: string
}

interface IncomeDonutChartProps {
  segments: DonutSegment[]
  total: number
}

export function IncomeDonutChart({ segments, total }: IncomeDonutChartProps) {
  const r = 60
  const cx = 80
  const cy = 80

  let cumPct = 0
  const paths = segments.map((seg) => {
    const startPct = cumPct
    cumPct += seg.pct
    const startAngle = (startPct / 100) * 360 - 90
    const endAngle = (cumPct / 100) * 360 - 90
    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180
    const x1 = cx + r * Math.cos(startRad)
    const y1 = cy + r * Math.sin(startRad)
    const x2 = cx + r * Math.cos(endRad)
    const y2 = cy + r * Math.sin(endRad)
    const largeArc = seg.pct > 50 ? 1 : 0
    const d = `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`
    return { ...seg, d }
  })

  return (
    <svg
      viewBox="0 0 160 160"
      className="w-full max-w-[160px]"
      role="img"
      aria-label={`Income by type donut chart, total ${fmtGBP(total)} across ${segments.length} ${segments.length === 1 ? "type" : "types"}`}
    >
      {total > 0 ? (
        paths.map((seg) => <path key={seg.label} d={seg.d} fill={seg.color} opacity="0.85" />)
      ) : (
        <circle cx={cx} cy={cy} r={r} fill="#f1f5f9" />
      )}
      <circle cx={cx} cy={cy} r={r * 0.6} fill="white" />
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize="11" fontWeight="700" fill="#0f172a">
        {fmtGBP(total)}
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" fontSize="9" fill="#94a3b8">
        Total
      </text>
    </svg>
  )
}

interface IncomeByTypeCardProps {
  segments: DonutSegment[]
  total: number
}

export function IncomeByTypeCard({ segments, total }: IncomeByTypeCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900">Income by Type</h3>
      </div>
      {segments.length > 0 ? (
        <div className="flex items-center gap-4">
          <IncomeDonutChart segments={segments} total={total} />
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
        <p className="text-xs text-slate-500 text-center py-8">No income data to chart yet.</p>
      )}
    </div>
  )
}

interface IncomeSummaryCardProps {
  totalAll: number
  received: number
  expected: number
  overdue: number
  planned: number
}

export function IncomeSummaryCard({ totalAll, received, expected, overdue, planned }: IncomeSummaryCardProps) {
  const rows = [
    { label: "Received", value: received, color: "text-emerald-600", dot: "bg-emerald-500" },
    { label: "Expected", value: expected, color: "text-blue-600", dot: "bg-blue-500" },
    { label: "Overdue", value: overdue, color: "text-red-500", dot: "bg-red-500" },
    { label: "Planned", value: planned, color: "text-amber-600", dot: "bg-amber-500" },
  ]

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900">Income Summary</h3>
      </div>
      <div className="mb-4">
        <p className="text-2xl font-bold text-slate-900">{fmtGBP2(totalAll)}</p>
        <p className="text-xs text-slate-500 font-medium mt-0.5">Across all statuses</p>
      </div>
      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full shrink-0 ${row.dot}`} />
              <span className="text-xs text-slate-600">{row.label}</span>
            </div>
            <span className={`text-xs font-semibold ${row.color}`}>{fmtGBP2(row.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
