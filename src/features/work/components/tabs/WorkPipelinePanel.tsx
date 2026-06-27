import React from "react"
import Link from "next/link"
import { ChevronRight, BarChart3, CheckCircle2 } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

interface PipelineEntry {
  name: string
  value: number
  color: string
}

interface WorkPipelinePanelProps {
  pipelineData: PipelineEntry[]
  completionRate: number
  isLoading: boolean
}

export function WorkPipelinePanel({ pipelineData, completionRate, isLoading }: WorkPipelinePanelProps) {
  const pipelineTotal = pipelineData.reduce((s, d) => s + d.value, 0)

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-slate-900">Work Pipeline</h2>
        <Link
          href="/property-manager/work/board"
          className="text-xs font-semibold text-[var(--brand)] hover:text-[var(--brand-strong)] flex items-center gap-0.5"
        >
          View Board <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      {isLoading ? (
        <div className="h-[180px] bg-slate-50 rounded-xl animate-pulse" />
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={pipelineData} layout="vertical" margin={{ left: 8, right: 16, top: 0, bottom: 0 }}>
            <XAxis type="number" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fontSize: 12, fill: "#64748B" }}
              axisLine={false}
              tickLine={false}
              width={80}
            />
            <Tooltip
              contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12 }}
              cursor={{ fill: "#F8FAFC" }}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={22}>
              {pipelineData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <BarChart3 className="w-3 h-3 text-slate-400" />
          {pipelineTotal} Total Items
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          {completionRate}% Completion Rate
        </span>
      </div>
    </div>
  )
}
