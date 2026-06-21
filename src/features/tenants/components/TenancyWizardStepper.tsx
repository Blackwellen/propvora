import React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface StepDef {
  number: number
  label: string
  icon: React.ElementType
}

interface TenancyWizardStepperProps {
  steps: StepDef[]
  currentStep: number
  onStepClick?: (step: number) => void
}

export function TenancyWizardStepper({ steps, currentStep, onStepClick }: TenancyWizardStepperProps) {
  return (
    <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
      {steps.map((s, idx) => (
        <React.Fragment key={s.number}>
          <button
            onClick={() => currentStep > s.number && onStepClick?.(s.number)}
            className={cn("flex flex-col items-center gap-1 min-w-[44px]", s.number < currentStep && "cursor-pointer")}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
              s.number === currentStep  ? "bg-[#2563EB] text-white shadow-md shadow-blue-200"
              : s.number < currentStep ? "bg-[#10B981] text-white"
              : "bg-slate-100 text-slate-400"
            )}>
              {s.number < currentStep ? <Check className="w-3.5 h-3.5" /> : s.number}
            </div>
            <span className={cn(
              "text-[10px] whitespace-nowrap",
              s.number === currentStep  ? "text-[#2563EB] font-semibold"
              : s.number < currentStep ? "text-[#10B981]"
              : "text-slate-400"
            )}>
              {s.label}
            </span>
          </button>
          {idx < steps.length - 1 && (
            <div className={cn(
              "flex-1 h-0.5 min-w-[6px] rounded-full transition-all",
              s.number < currentStep ? "bg-[#10B981]" : "bg-slate-100"
            )} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}
