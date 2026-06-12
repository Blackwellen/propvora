"use client"
import React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface StepperStep {
  number: number
  label: string
  sublabel?: string
}

interface AccountingStepperProps {
  steps: StepperStep[]
  currentStep: number
  className?: string
}

export function AccountingStepper({ steps, currentStep, className }: AccountingStepperProps) {
  return (
    <div className={cn("flex items-center gap-0", className)}>
      {steps.map((step, idx) => {
        const isCompleted = step.number < currentStep
        const isActive = step.number === currentStep
        const isLast = idx === steps.length - 1
        return (
          <React.Fragment key={step.number}>
            <div className="flex items-center gap-3 shrink-0">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                isCompleted ? "bg-[#2563EB] text-white" :
                isActive ? "bg-[#2563EB] text-white ring-4 ring-[#2563EB]/20" :
                "bg-slate-100 text-slate-400"
              )}>
                {isCompleted ? <Check className="w-4 h-4" /> : step.number}
              </div>
              <div className="flex flex-col">
                <span className={cn("text-sm font-semibold", isActive ? "text-slate-900" : isCompleted ? "text-slate-700" : "text-slate-400")}>
                  {step.label}
                </span>
                {step.sublabel && (
                  <span className="text-xs text-slate-400">{step.sublabel}</span>
                )}
              </div>
            </div>
            {!isLast && (
              <div className={cn("flex-1 h-px mx-4 min-w-[24px]", isCompleted ? "bg-[#2563EB]" : "bg-slate-200")} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}
