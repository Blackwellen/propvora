import React from "react"
import Link from "next/link"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ComplianceSlice {
  name: string
  value: number
  pct: number
  fill: string
}

export interface ComplianceDonutCardProps {
  data: ComplianceSlice[]
  /** Link to the full compliance view */
  detailHref?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ComplianceDonutCard({
  data,
  detailHref = "/property-manager/suppliers/compliance",
}: ComplianceDonutCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-semibold text-slate-800">Compliance Status</h3>
        <Link href={detailHref} className="text-[11px] text-[var(--brand)] hover:underline font-medium">
          View all
        </Link>
      </div>
      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={60}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((d, i) => (
                <Cell key={i} fill={d.fill} />
              ))}
            </Pie>
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(val: any) => [`${val} suppliers`]}
              contentStyle={{ borderRadius: 10, fontSize: 12, border: "1px solid #e2e8f0" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-1.5 mt-2">
        {data.map((d) => (
          <div key={d.name} className="flex items-center justify-between text-[12px]">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.fill }} />
              <span className="text-slate-600">{d.name}</span>
            </div>
            <span className="font-semibold text-slate-800">{d.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
