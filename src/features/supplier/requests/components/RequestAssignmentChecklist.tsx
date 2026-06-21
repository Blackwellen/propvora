"use client"

import { CheckCircle2 } from "lucide-react"
import { SupplierCard } from "@/components/supplier-workspace/ui"
import { shortDate } from "@/components/supplier-workspace/format"
import type { PipelineRequest } from "@/features/supplier/requests/data/types"

export interface RequestAssignmentChecklistProps {
  request: PipelineRequest
}

/** Team-gated assignment & approval checklist shown on the overview tab. */
export function RequestAssignmentChecklist({ request: r }: RequestAssignmentChecklistProps) {
  const items: [string, boolean][] = [
    ["Coverage & trade fit confirmed", true],
    ["Estimator assigned", true],
    ["Margin target met", false],
    ["Commercial approval", false],
  ]

  return (
    <SupplierCard className="p-5">
      <h2 className="text-sm font-semibold text-slate-900 mb-3">Assignment &amp; approval</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        <div><p className="text-[11px] text-slate-400">Estimator</p><p className="text-sm font-semibold text-slate-800">—</p></div>
        <div><p className="text-[11px] text-slate-400">Owner</p><p className="text-sm font-semibold text-slate-800">—</p></div>
        <div><p className="text-[11px] text-slate-400">Approval</p><p className="text-sm font-semibold text-amber-600">Required</p></div>
        <div>
          <p className="text-[11px] text-slate-400">Quote deadline</p>
          <p className="text-sm font-semibold text-slate-800">{r.dueAt ? shortDate(r.dueAt) : "Flexible"}</p>
        </div>
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Decision checklist</p>
      <ul className="space-y-1.5">
        {items.map(([label, ok]) => (
          <li key={label} className="flex items-center gap-2 text-sm">
            <CheckCircle2 className={`w-4 h-4 ${ok ? "text-emerald-500" : "text-slate-300"}`} />
            <span className={ok ? "text-slate-600" : "text-slate-800 font-medium"}>{label}</span>
          </li>
        ))}
      </ul>
    </SupplierCard>
  )
}
