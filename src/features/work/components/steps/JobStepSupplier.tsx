import React from "react"
import { cn } from "@/lib/utils"
import { type JobWizardData, inputClass, labelClass } from "./job-wizard-shared"

interface JobStepSupplierProps {
  data: JobWizardData
  onChange: (d: Partial<JobWizardData>) => void
}

export function JobStepSupplier({ data, onChange }: JobStepSupplierProps) {
  return (
    <div className="space-y-5">
      <div>
        <label className={labelClass}>Supplier / Contractor name</label>
        <input type="text" placeholder="e.g. HeatPro Heating Ltd" value={data.supplierName} onChange={(e) => onChange({ supplierName: e.target.value })} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Contact name</label>
        <input type="text" placeholder="Contact person" value={data.supplierContact} onChange={(e) => onChange({ supplierContact: e.target.value })} className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Email</label>
          <input type="email" placeholder="email@company.com" value={data.supplierEmail} onChange={(e) => onChange({ supplierEmail: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Phone</label>
          <input type="tel" placeholder="07xxx xxxxxx" value={data.supplierPhone} onChange={(e) => onChange({ supplierPhone: e.target.value })} className={inputClass} />
        </div>
      </div>
      <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
        <div className="relative w-10 h-5 flex-shrink-0">
          <input type="checkbox" checked={data.sendPortalLink} onChange={(e) => onChange({ sendPortalLink: e.target.checked })} className="sr-only" />
          <div className={cn("w-10 h-5 rounded-full transition-colors", data.sendPortalLink ? "bg-[var(--brand)]" : "bg-slate-200")} />
          <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform", data.sendPortalLink ? "translate-x-5 left-0.5" : "translate-x-0 left-0.5")} />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700">Send portal link automatically</p>
          <p className="text-xs text-slate-400">Supplier gets a secure link to submit quotes &amp; evidence</p>
        </div>
      </label>
    </div>
  )
}
