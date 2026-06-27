import React from "react"
import { type JobWizardData, inputClass, labelClass } from "./job-wizard-shared"

interface JobStepFinancialsProps {
  data: JobWizardData
  onChange: (d: Partial<JobWizardData>) => void
}

export function JobStepFinancials({ data, onChange }: JobStepFinancialsProps) {
  return (
    <div className="space-y-5">
      <div>
        <label className={labelClass}>Quoted amount (£)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">£</span>
          <input type="number" min={0} step={0.01} value={data.quotedAmount || ""} onChange={(e) => { const v = Number(e.target.value); onChange({ quotedAmount: v, approvedAmount: data.approvedSameAsQuoted ? v : data.approvedAmount }) }} className="w-full h-10 pl-7 pr-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] bg-white" placeholder="0.00" />
        </div>
      </div>
      <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
        <input type="checkbox" checked={data.approvedSameAsQuoted} onChange={(e) => onChange({ approvedSameAsQuoted: e.target.checked, approvedAmount: e.target.checked ? data.quotedAmount : 0 })} className="w-4 h-4 rounded border-slate-300 text-[var(--brand)] focus:ring-[var(--brand)]" />
        <span className="text-sm font-medium text-slate-700">Approved amount same as quoted</span>
      </label>
      {!data.approvedSameAsQuoted && (
        <div>
          <label className={labelClass}>Approved amount (£)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">£</span>
            <input type="number" min={0} step={0.01} value={data.approvedAmount || ""} onChange={(e) => onChange({ approvedAmount: Number(e.target.value) })} className="w-full h-10 pl-7 pr-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] bg-white" placeholder="0.00" />
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Scheduled date</label>
          <input type="date" value={data.scheduledDate} onChange={(e) => onChange({ scheduledDate: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Time</label>
          <input type="time" value={data.scheduledTime} onChange={(e) => onChange({ scheduledTime: e.target.value })} className={inputClass} />
        </div>
      </div>
      <div>
        <label className={labelClass}>Estimated duration</label>
        <input type="text" placeholder="e.g. 2 hours, Half day" value={data.estimatedDuration} onChange={(e) => onChange({ estimatedDuration: e.target.value })} className={inputClass} />
      </div>
    </div>
  )
}
