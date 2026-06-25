import { cn } from "@/lib/utils"
import { type PpmWizardData, PPM_PRIORITIES, ppmFrequencyLabel, ppmReminderLabel } from "./ppm-wizard-shared"

interface PpmStepReviewProps {
  data: PpmWizardData
}

export function PpmStepReview({ data }: PpmStepReviewProps) {
  const rows: [string, string][] = [
    ["Plan name", data.name || "—"],
    ["Category", data.category || "—"],
    ["Priority", PPM_PRIORITIES.find((p) => p.key === data.priority)?.label ?? data.priority],
    ["Property", data.propertyName || "No property"],
    ["Unit", data.unitName || "—"],
    ["Frequency", data.frequency ? ppmFrequencyLabel(data.frequency) : "—"],
    ["Start date", data.startDate ? new Date(data.startDate).toLocaleDateString("en-GB") : "—"],
    ["Next due date", data.nextDueDate ? new Date(data.nextDueDate).toLocaleDateString("en-GB") : "—"],
    ["Supplier", data.supplierName || "—"],
    ["Est. cost", data.estimatedCost ? `£${data.estimatedCost.toLocaleString()}` : "—"],
    ["Reminders", data.reminders.length ? data.reminders.map(ppmReminderLabel).join(", ") : "None"],
    ["Auto-generate job", data.autoGenerateJob ? "Enabled" : "Off"],
  ]

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-200">
        {rows.map(([label, value], i) => (
          <div
            key={label}
            className={cn("flex items-center justify-between px-4 py-3 text-sm", i % 2 === 0 ? "bg-white" : "bg-slate-50")}
          >
            <span className="text-slate-500">{label}</span>
            <span className="font-medium text-slate-900 text-right">{value}</span>
          </div>
        ))}
      </div>
      <p className="text-[12px] text-slate-500 leading-snug px-1">
        {data.autoGenerateJob
          ? "A job will be auto-generated when this plan becomes due."
          : "Auto job generation is off — you can generate jobs manually from the plan."}
      </p>
    </div>
  )
}
