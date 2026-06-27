"use client"

import { SupplierCard } from "@/components/supplier-workspace/ui"

const APPROVAL_STAGES = ["Drafted", "Submitted", "Approved", "Sent"] as const

/**
 * Team-gated approval workflow panel for the quote overview tab.
 * Shows estimator/reviewer assignments, margin estimate, and a stage progress bar.
 */
export function QuoteApprovalWorkflow() {
  return (
    <SupplierCard className="p-5">
      <h2 className="text-sm font-semibold text-slate-900 mb-3">Approval workflow &amp; margin</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        <div>
          <p className="text-[11px] text-slate-400">Estimator</p>
          <p className="text-sm font-semibold text-slate-800">—</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-400">Reviewer</p>
          <p className="text-sm font-semibold text-slate-800">—</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-400">Margin estimate</p>
          <p className="text-sm font-semibold text-emerald-600">47%</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-400">Approval</p>
          <p className="text-sm font-semibold text-amber-600">Awaiting sign-off</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {APPROVAL_STAGES.map((s, i) => (
          <div key={s} className="flex items-center gap-1 flex-1">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                i < 2 ? "bg-[var(--brand)] text-white" : "bg-slate-100 text-slate-400"
              }`}
            >
              {i < 2 ? "✓" : i + 1}
            </span>
            <span className="text-[11px] text-slate-500">{s}</span>
            {i < APPROVAL_STAGES.length - 1 && (
              <span className={`flex-1 h-0.5 ${i < 1 ? "bg-[var(--brand)]" : "bg-slate-200"}`} />
            )}
          </div>
        ))}
      </div>
    </SupplierCard>
  )
}
