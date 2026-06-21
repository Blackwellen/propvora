"use client"

import React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

export interface WizardStep {
  num: number
  label: string
  icon: LucideIcon
}

interface InvoiceWizardStepperProps {
  steps: WizardStep[]
  currentStep: number
  onStepClick: (num: number) => void
}

export function InvoiceWizardStepper({ steps, currentStep, onStepClick }: InvoiceWizardStepperProps) {
  return (
    <aside className="hidden lg:block w-[240px] shrink-0 sticky top-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-3">Steps</p>
        {steps.map((step) => {
          const isDone = currentStep > step.num
          const isActive = currentStep === step.num
          const Icon = step.icon
          return (
            <button
              key={step.num}
              onClick={() => currentStep !== 9 && onStepClick(step.num)}
              disabled={step.num === 9}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-sm",
                isActive
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : isDone
                  ? "text-emerald-700 hover:bg-emerald-50"
                  : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <span
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                  isActive
                    ? "bg-blue-600 text-white"
                    : isDone
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-100 text-slate-400"
                )}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : step.num}
              </span>
              <span className="truncate">{step.label}</span>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
