import React from "react"
import Link from "next/link"
import { Sparkles } from "lucide-react"
import { LineChart, Line, ResponsiveContainer } from "recharts"

const SPARKLINE_DATA = [
  { v: 40 }, { v: 45 }, { v: 42 }, { v: 55 }, { v: 60 }, { v: 58 }, { v: 72 },
]

export function ProductivityInsightsPanel() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900 mb-3">Productivity Insights</h3>
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[11px] text-slate-600">Tasks completed</p>
            <span className="text-[11px] font-semibold text-emerald-600">+18%</span>
          </div>
          <ResponsiveContainer width="100%" height={32}>
            <LineChart data={SPARKLINE_DATA}>
              <Line type="monotone" dataKey="v" stroke="#10B981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[11px] text-slate-600">On-time completion</p>
            <span className="text-[11px] font-semibold text-[#2563EB]">78%</span>
          </div>
          <ResponsiveContainer width="100%" height={32}>
            <LineChart data={[{ v: 60 }, { v: 65 }, { v: 70 }, { v: 68 }, { v: 72 }, { v: 75 }, { v: 78 }]}>
              <Line type="monotone" dataKey="v" stroke="#2563EB" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <Link href="/property-manager/work/tasks" className="mt-3 text-[11px] text-[#2563EB] hover:underline font-medium">View full insights →</Link>
    </div>
  )
}
