import { CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  steps: string[]
  currentStep: number
  onStepClick: (i: number) => void
}

export default function WizardStepper({ steps, currentStep, onStepClick }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <ol className="flex items-start justify-between gap-2">
        {steps.map((s, i) => {
          const done = i < currentStep
          const current = i === currentStep
          return (
            <li key={s} className="flex-1 flex flex-col items-center text-center relative">
              {i < steps.length - 1 && (
                <span className={cn("absolute top-[14px] left-1/2 w-full h-0.5", done ? "bg-emerald-400" : "bg-slate-200")} />
              )}
              <button
                onClick={() => onStepClick(i)}
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold z-10",
                  done ? "bg-emerald-500 text-white" : current ? "bg-[var(--brand)] text-white" : "bg-slate-100 text-slate-400"
                )}
              >
                {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </button>
              <p className={cn("text-[11px] font-semibold mt-2", current ? "text-[var(--brand)]" : done ? "text-slate-700" : "text-slate-400")}>
                {s}
              </p>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
