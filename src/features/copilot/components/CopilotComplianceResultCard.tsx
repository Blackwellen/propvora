"use client"

import { cn } from "@/lib/utils"

interface ComplianceRow {
  icon: string
  title: string
  detail: string
  badge: "overdue" | "due-soon" | "compliant"
  action: string
}

const ROWS: ComplianceRow[] = [
  {
    icon: "⚠",
    title: "EICR Certificate expired",
    detail: "Expired 8 days ago · 16 Rose Gardens",
    badge: "overdue",
    action: "Create chase →",
  },
  {
    icon: "🕐",
    title: "Gas Safety Certificate expires in 6 days",
    detail: "Due 27 May · 16 Rose Gardens",
    badge: "due-soon",
    action: "Create task →",
  },
  {
    icon: "🛡",
    title: "Fire Risk Assessment due in 11 days",
    detail: "Due 1 Jun · 16 Rose Gardens",
    badge: "due-soon",
    action: "Create task →",
  },
  {
    icon: "ℹ",
    title: "Asbestos Report on file",
    detail: "Last updated 14 Mar 2024 · Valid",
    badge: "compliant",
    action: "View document →",
  },
]

function BadgeChip({ badge }: { badge: ComplianceRow["badge"] }) {
  if (badge === "overdue")
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 shrink-0">
        Overdue
      </span>
    )
  if (badge === "due-soon")
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 shrink-0">
        Due soon
      </span>
    )
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 shrink-0">
      Compliant
    </span>
  )
}

export default function CopilotComplianceResultCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
        <p className="text-[12px] font-semibold text-slate-700 leading-snug">
          Here&apos;s what&apos;s urgent for 16 Rose Gardens based on the{" "}
          <span className="text-blue-600">Compliance › Certificates</span> page.
        </p>
      </div>

      <div className="divide-y divide-slate-50">
        {ROWS.map((row, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2.5">
            <span className="text-[14px] shrink-0">{row.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-slate-800 leading-tight truncate">
                {row.title}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">{row.detail}</p>
            </div>
            <BadgeChip badge={row.badge} />
            <button className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors shrink-0 whitespace-nowrap">
              {row.action}
            </button>
          </div>
        ))}
      </div>

      <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
        <p className="text-[10px] text-slate-400">
          Source: Compliance › Certificates · Updated just now
        </p>
        <div className="flex items-center gap-2">
          <button className="text-[13px] hover:scale-110 transition-transform" title="Helpful">
            👍
          </button>
          <button className="text-[13px] hover:scale-110 transition-transform" title="Not helpful">
            👎
          </button>
        </div>
      </div>
    </div>
  )
}
