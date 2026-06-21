"use client"

import type { NewMaintenanceRequest } from "@/lib/portal/data-extra"

const PRIORITIES: NewMaintenanceRequest["priority"][] = ["low", "medium", "high", "urgent"]

interface TenantPortalMaintenanceWizardStep2Props {
  priority: NewMaintenanceRequest["priority"]
  onPriorityChange: (v: NewMaintenanceRequest["priority"]) => void
  onBack: () => void
  onNext: () => void
}

export function TenantPortalMaintenanceWizardStep2({
  priority,
  onPriorityChange,
  onBack,
  onNext,
}: TenantPortalMaintenanceWizardStep2Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[11.5px] font-semibold text-slate-500 mb-2">Priority</label>
        <div className="flex gap-1.5 flex-wrap">
          {PRIORITIES.map((p) => (
            <button
              key={p}
              onClick={() => onPriorityChange(p)}
              className={`capitalize rounded-lg px-3 py-1.5 text-[12px] font-semibold border ${
                priority === p
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={onBack}
          className="rounded-xl border border-slate-200 px-4 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-50"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-semibold text-white bg-[#0D1B2A] hover:bg-[#0b1622] transition-colors"
        >
          Review &amp; submit
        </button>
      </div>
    </div>
  )
}
