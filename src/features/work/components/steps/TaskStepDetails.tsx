import React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { type TaskWizardData, CATEGORIES, PRIORITIES, inputClass, labelClass } from "./task-wizard-shared"

interface TaskStepDetailsProps {
  data: TaskWizardData
  onChange: (d: Partial<TaskWizardData>) => void
  properties: { id: string; name: string }[]
  propertiesLoading: boolean
}

export function TaskStepDetails({ data, onChange, properties, propertiesLoading }: TaskStepDetailsProps) {
  return (
    <div className="space-y-5">
      <div>
        <label className={labelClass}>Task title <span className="text-red-500">*</span></label>
        <input type="text" placeholder="e.g. Fix leaking tap in Room 3" value={data.title} onChange={(e) => onChange({ title: e.target.value })} className={inputClass} autoFocus />
      </div>
      <div>
        <label className={labelClass}>Description</label>
        <textarea placeholder="Describe the task in detail..." value={data.description} onChange={(e) => onChange({ description: e.target.value })} rows={3} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] resize-none bg-white placeholder:text-slate-400" />
      </div>
      <div>
        <label className={labelClass}>Category</label>
        <div className="grid grid-cols-4 gap-2">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            return (
              <button key={cat.key} type="button" onClick={() => onChange({ category: cat.key })} className={cn("flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all", data.category === cat.key ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]" : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50")}>
                <Icon className="w-4 h-4" />
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>
      <div>
        <label className={labelClass}>Priority <span className="text-red-500">*</span></label>
        <div className="grid grid-cols-2 gap-2">
          {PRIORITIES.map((p) => (
            <button key={p.key} type="button" onClick={() => onChange({ priority: p.key as TaskWizardData["priority"] })} className={cn("flex items-center gap-2.5 p-3 rounded-xl border text-sm font-medium transition-all", data.priority === p.key ? p.activeClass : "border-slate-200 hover:border-slate-300")}>
              <span className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", p.dotColor)} />
              <span className={data.priority === p.key ? p.textColor : "text-slate-600"}>{p.label}</span>
              {data.priority === p.key && <Check className={cn("w-3.5 h-3.5 ml-auto", p.textColor)} />}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className={labelClass}>Property</label>
        <select
          value={data.propertyId}
          onChange={(e) => { const prop = properties.find((p) => p.id === e.target.value); onChange({ propertyId: e.target.value, propertyName: prop?.name ?? "" }) }}
          disabled={propertiesLoading}
          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] cursor-pointer bg-white disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <option value="">{propertiesLoading ? "Loading properties…" : "Select property..."}</option>
          {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
    </div>
  )
}
