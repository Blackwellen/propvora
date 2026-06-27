import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { type PpmWizardData, PPM_CATEGORIES, PPM_PRIORITIES, ppmInputClass, ppmLabelClass } from "./ppm-wizard-shared"

interface PpmStepServiceProps {
  data: PpmWizardData
  onChange: (d: Partial<PpmWizardData>) => void
}

export function PpmStepService({ data, onChange }: PpmStepServiceProps) {
  return (
    <div className="space-y-5">
      <div>
        <label className={ppmLabelClass}>
          Plan / service name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="e.g. Boiler Annual Service"
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className={ppmInputClass}
          autoFocus
        />
      </div>

      <div>
        <label className={ppmLabelClass}>
          Compliance category <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-4 gap-2">
          {PPM_CATEGORIES.map((cat) => {
            const Icon = cat.icon
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => onChange({ category: cat.key })}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all",
                  data.category === cat.key
                    ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                    : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50",
                )}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label className={ppmLabelClass}>Priority</label>
        <div className="grid grid-cols-2 gap-2">
          {PPM_PRIORITIES.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => onChange({ priority: p.key as PpmWizardData["priority"] })}
              className={cn(
                "flex items-center gap-2.5 p-3 rounded-xl border text-sm font-medium transition-all",
                data.priority === p.key ? p.activeClass : "border-slate-200 hover:border-slate-300",
              )}
            >
              <span className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", p.dotColor)} />
              <span className={data.priority === p.key ? p.textColor : "text-slate-600"}>{p.label}</span>
              {data.priority === p.key && <Check className={cn("w-3.5 h-3.5 ml-auto", p.textColor)} />}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={ppmLabelClass}>Description</label>
        <textarea
          placeholder="Describe the maintenance work to be carried out…"
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value.slice(0, 500) })}
          rows={3}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] resize-none bg-white placeholder:text-slate-400"
        />
        <p className="text-[11px] text-slate-400 mt-1 text-right">{data.description.length}/500</p>
      </div>
    </div>
  )
}
