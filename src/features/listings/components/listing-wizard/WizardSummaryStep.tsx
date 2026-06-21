import { cn } from "@/lib/utils"

const inputCls =
  "w-full h-10 px-3 rounded-xl text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"

interface WizardSummaryStepProps {
  title: string
  onTitleChange: (v: string) => void
  summary: string
  onSummaryChange: (v: string) => void
}

export function WizardSummaryStep({
  title,
  onTitleChange,
  summary,
  onSummaryChange,
}: WizardSummaryStepProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-600">Listing title *</label>
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="e.g. Garden Studio — Central London"
          className={inputCls}
          autoFocus
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-600">Short summary</label>
        <textarea
          value={summary}
          onChange={(e) => onSummaryChange(e.target.value)}
          rows={3}
          placeholder="A brief description to attract guests."
          className={cn(inputCls, "h-auto py-2.5 resize-none")}
        />
      </div>
    </div>
  )
}
