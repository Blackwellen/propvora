"use client"

import React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { WIZARD_STEPS } from "../data/useListingDraft"

export function ListingWizardStepper({
  currentStep,
  onJump,
}: {
  currentStep: number
  onJump: (slug: string, num: number) => void
}) {
  return (
    <nav className="flex items-center gap-1" aria-label="Wizard steps">
      {WIZARD_STEPS.map((s, i) => {
        const isActive = s.num === currentStep
        const isComplete = s.num < currentStep
        const isLast = i === WIZARD_STEPS.length - 1
        return (
          <React.Fragment key={s.slug}>
            <button
              type="button"
              onClick={() => {
                if (s.num <= currentStep) onJump(s.slug, s.num)
              }}
              disabled={s.num > currentStep}
              className={cn(
                "flex items-center gap-2 rounded-full px-2.5 py-1.5 text-[12px] font-semibold transition-colors whitespace-nowrap",
                isActive && "bg-blue-600 text-white",
                isComplete && "text-emerald-600 hover:bg-emerald-50",
                !isActive && !isComplete && "text-slate-400 cursor-default",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                  isActive && "bg-white/20",
                  isComplete && "bg-emerald-100",
                  !isActive && !isComplete && "bg-slate-100",
                )}
              >
                {isComplete ? <Check className="h-3 w-3" /> : s.num}
              </span>
              <span className="hidden md:inline">{s.label}</span>
            </button>
            {!isLast && (
              <div
                className={cn(
                  "h-px w-3 shrink-0 lg:w-6",
                  s.num < currentStep ? "bg-emerald-200" : "bg-slate-200",
                )}
              />
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
