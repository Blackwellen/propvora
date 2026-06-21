import React from "react"
import Link from "next/link"
import { Sparkles } from "lucide-react"

export function AiSuggestionsPanel() {
  const suggestions = [
    { text: "3 similar overdue tasks — Consider assigning to available contractors", btn: "Review" },
    { text: "SLA at risk — 8 tasks may breach SLA in next 3 days", btn: "View" },
    { text: "Cost saving opportunity — Group 4 maintenance tasks to reduce costs", btn: "Review" },
  ]

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 text-[11px] font-semibold">
            <Sparkles className="w-3 h-3" /> AI
          </span>
          <h3 className="text-sm font-semibold text-slate-900">AI Suggestions</h3>
        </div>
        <Link href="/property-manager/work/tasks" className="text-[11px] text-[#2563EB] hover:underline">View all →</Link>
      </div>
      <div className="space-y-3">
        {suggestions.map((s, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-violet-50/40 border border-violet-100">
            <p className="flex-1 text-[12px] text-slate-700">{s.text}</p>
            <button className="shrink-0 text-[11px] font-semibold text-violet-700 hover:underline">{s.btn}</button>
          </div>
        ))}
      </div>
    </div>
  )
}
