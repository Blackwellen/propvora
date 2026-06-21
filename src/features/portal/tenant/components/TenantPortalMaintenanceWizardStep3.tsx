"use client"

import { Loader2, CheckCircle } from "lucide-react"
import type { NewMaintenanceRequest } from "@/lib/portal/data-extra"

interface TenantPortalMaintenanceWizardStep3Props {
  title: string
  description: string
  priority: NewMaintenanceRequest["priority"]
  submitting: boolean
  error: string | null
  onBack: () => void
  onSubmit: () => void
}

export function TenantPortalMaintenanceWizardStep3({
  title,
  description,
  priority,
  submitting,
  error,
  onBack,
  onSubmit,
}: TenantPortalMaintenanceWizardStep3Props) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500">Issue</span>
          <span className="font-semibold text-slate-900">{title}</span>
        </div>
        {description && (
          <div className="flex justify-between gap-4">
            <span className="text-slate-500 shrink-0">Details</span>
            <span className="text-slate-700 text-right">{description}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-slate-500">Priority</span>
          <span className="font-semibold capitalize text-slate-900">{priority}</span>
        </div>
      </div>
      {error && <p className="text-[12px] text-red-600">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onBack}
          disabled={submitting}
          className="rounded-xl border border-slate-200 px-4 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-semibold text-white bg-[#0D1B2A] hover:bg-[#0b1622] disabled:bg-slate-300 transition-colors"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? "Submitting…" : "Submit request"}
        </button>
      </div>
    </div>
  )
}
