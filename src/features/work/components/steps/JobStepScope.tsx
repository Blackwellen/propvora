import React from "react"
import { TrendingDown, Home } from "lucide-react"
import { cn } from "@/lib/utils"
import { type JobWizardData, labelClass } from "./job-wizard-shared"

interface JobStepScopeProps {
  data: JobWizardData
  onChange: (d: Partial<JobWizardData>) => void
  properties: { id: string; name: string }[]
  propertiesLoading: boolean
}

export function JobStepScope({ data, onChange, properties, propertiesLoading }: JobStepScopeProps) {
  return (
    <div className="space-y-5">
      <div>
        <label className={labelClass}>Property</label>
        <select
          value={data.propertyId}
          onChange={(e) => { const p = properties.find((p) => p.id === e.target.value); onChange({ propertyId: e.target.value, propertyName: p?.name ?? "" }) }}
          disabled={propertiesLoading}
          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] cursor-pointer bg-white disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <option value="">{propertiesLoading ? "Loading properties…" : "Select property..."}</option>
          {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div>
        <label className={labelClass}>Scope of work</label>
        <textarea placeholder="Detailed description of works to be carried out..." value={data.scopeOfWork} onChange={(e) => onChange({ scopeOfWork: e.target.value })} rows={4} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] resize-none bg-white placeholder:text-slate-400" />
      </div>
      <div>
        <label className={labelClass}>Commercial impact</label>
        <div className="space-y-2">
          {[
            { key: "revenueBlocking" as const, icon: TrendingDown, iconColor: "text-red-500", label: "Revenue blocking", desc: "This job is blocking rent collection" },
            { key: "occupancyBlocking" as const, icon: Home, iconColor: "text-amber-500", label: "Occupancy blocking", desc: "Property cannot be let until resolved" },
          ].map((opt) => {
            const Icon = opt.icon
            return (
              <label key={opt.key} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                <input type="checkbox" checked={data[opt.key]} onChange={(e) => onChange({ [opt.key]: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-[var(--brand)] focus:ring-[var(--brand)]" />
                <div className="flex items-center gap-2">
                  <Icon className={cn("w-4 h-4", opt.iconColor)} />
                  <div>
                    <p className="text-sm font-medium text-slate-700">{opt.label}</p>
                    <p className="text-xs text-slate-400">{opt.desc}</p>
                  </div>
                </div>
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )
}
