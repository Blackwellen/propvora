import { Wrench } from "lucide-react"
import { cn } from "@/lib/utils"
import { type PpmWizardData, ppmInputClass, ppmLabelClass } from "./ppm-wizard-shared"

interface PpmStepSupplierProps {
  data: PpmWizardData
  onChange: (d: Partial<PpmWizardData>) => void
}

export function PpmStepSupplier({ data, onChange }: PpmStepSupplierProps) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={ppmLabelClass}>
            Supplier <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <div className="relative">
            <Wrench className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={data.supplierName}
              onChange={(e) => onChange({ supplierName: e.target.value })}
              placeholder="e.g. HeatPro Ltd"
              className={cn(ppmInputClass, "pl-9")}
            />
          </div>
        </div>
        <div>
          <label className={ppmLabelClass}>Estimated cost (£)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={data.estimatedCost || ""}
            onChange={(e) => onChange({ estimatedCost: e.target.value ? Math.max(0, parseFloat(e.target.value)) : 0 })}
            placeholder="0.00"
            className={ppmInputClass}
          />
        </div>
      </div>

      <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 cursor-pointer hover:border-slate-300 transition-colors">
        <span className="flex items-center gap-2 text-sm text-slate-700">
          <Wrench className="w-4 h-4 text-[var(--brand)]" /> Auto-generate a job when this plan is due
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={data.autoGenerateJob}
          aria-label="Auto-generate a job when this plan is due"
          onClick={() => onChange({ autoGenerateJob: !data.autoGenerateJob })}
          className={cn(
            "relative w-11 h-6 rounded-full transition-colors shrink-0",
            data.autoGenerateJob ? "bg-[var(--brand)]" : "bg-slate-200",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all",
              data.autoGenerateJob ? "left-[22px]" : "left-0.5",
            )}
          />
        </button>
      </label>
    </div>
  )
}
