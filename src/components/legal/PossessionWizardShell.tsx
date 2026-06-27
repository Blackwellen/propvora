"use client"
import React from "react"
import { useRouter } from "next/navigation"
import { Gavel, Check, ChevronLeft, Save, ChevronRight } from "lucide-react"
import { LegalDisclaimer } from "./LegalDisclaimer"

const WIZARD_STEPS = [
  { label: "Select Tenancy", href: "/property-manager/legal/possession/new/select-tenancy" },
  { label: "Select Grounds", href: "/property-manager/legal/possession/new/select-grounds" },
  { label: "Review Evidence", href: "/property-manager/legal/possession/new/review-evidence" },
  { label: "Notice Preview", href: "/property-manager/legal/possession/new/notice-preview" },
  { label: "Record Service", href: "/property-manager/legal/possession/new/record-service" },
]

interface PossessionWizardShellProps {
  currentStep: 1 | 2 | 3 | 4 | 5
  title?: string
  subtitle?: string
  children: React.ReactNode
  rightRail?: React.ReactNode
  onBack?: () => void
  onNext?: () => void
  onSaveDraft?: () => void
  nextLabel?: string
  backLabel?: string
  nextDisabled?: boolean
  showSaveDraft?: boolean
  customFooter?: React.ReactNode
}

export function PossessionWizardShell({
  currentStep,
  title = "Possession Wizard",
  subtitle = "Record possession case details and generate a review-only draft notice.",
  children,
  rightRail,
  onBack,
  onNext,
  onSaveDraft,
  nextLabel = "Next",
  backLabel = "Back",
  nextDisabled = false,
  showSaveDraft = true,
  customFooter,
}: PossessionWizardShellProps) {
  const router = useRouter()

  function handleBack() {
    if (onBack) {
      onBack()
    } else if (currentStep > 1) {
      router.push(WIZARD_STEPS[currentStep - 2].href)
    } else {
      router.push("/property-manager/legal/possession")
    }
  }

  function handleNext() {
    if (onNext) {
      onNext()
    } else if (currentStep < 5) {
      router.push(WIZARD_STEPS[currentStep].href)
    }
  }

  return (
    <div className="flex flex-col min-h-0">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push("/property-manager/legal/possession")}
            aria-label="Back to possession cases"
            className="text-slate-400 hover:text-slate-600 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40 rounded"
          >
            <Gavel className="w-4 h-4" />
          </button>
          <span className="text-slate-300 shrink-0">/</span>
          <div className="min-w-0">
            <h1 className="text-[15px] font-semibold text-slate-900 truncate">{title}</h1>
            <p className="text-xs text-slate-500 truncate">{subtitle}</p>
          </div>
        </div>
        <span className="bg-[var(--brand-soft)] text-[var(--brand)] border border-[var(--color-brand-100)] px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap shrink-0">
          Step {currentStep} of 5
        </span>
      </div>

      {/* Stepper — full on md+, compact indicator on mobile */}
      <div className="bg-white border-b border-slate-100 px-4 sm:px-6 py-4">
        {/* Mobile compact indicator */}
        <div className="md:hidden flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--brand)] text-white flex items-center justify-center text-[12px] font-bold shrink-0">
            {currentStep}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-slate-900 truncate">
              {WIZARD_STEPS[currentStep - 1]?.label}
            </p>
            <div
              className="mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={currentStep}
              aria-valuemin={1}
              aria-valuemax={5}
              aria-label={`Step ${currentStep} of 5`}
            >
              <div
                className="h-full bg-[var(--brand)] rounded-full transition-all"
                style={{ width: `${(currentStep / 5) * 100}%` }}
              />
            </div>
          </div>
          <span className="text-[11px] font-medium text-slate-400 shrink-0">{currentStep}/5</span>
        </div>

        {/* Full stepper (md+) */}
        <div className="hidden md:flex items-center">
          {WIZARD_STEPS.map((step, i) => {
            const stepNum = i + 1
            const done = stepNum < currentStep
            const active = stepNum === currentStep
            return (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center gap-1 min-w-[90px]">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold border-2 transition-all ${
                      done
                        ? "bg-[var(--brand)] border-[var(--brand)] text-white"
                        : active
                        ? "bg-white border-[var(--brand)] text-[var(--brand)]"
                        : "bg-white border-slate-200 text-slate-400"
                    }`}
                  >
                    {done ? <Check className="w-4 h-4" /> : stepNum}
                  </div>
                  <span
                    className={`text-[10px] font-medium text-center leading-tight ${
                      active ? "text-[var(--brand)]" : done ? "text-slate-600" : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {i < WIZARD_STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mb-5 transition-colors ${
                      stepNum < currentStep ? "bg-[var(--brand)]" : "bg-slate-200"
                    }`}
                  />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* Disclaimer (persistent, non-dismissible) */}
      <div className="px-4 sm:px-6 pt-4">
        <LegalDisclaimer />
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 sm:px-6 pt-4 pb-0">
        <div className={`grid gap-6 ${rightRail ? "grid-cols-1 lg:grid-cols-12" : "grid-cols-1 max-w-3xl"}`}>
          <div className={rightRail ? "lg:col-span-8" : "col-span-1"}>
            {children}
          </div>
          {rightRail && (
            <div className="lg:col-span-4 space-y-4">
              {rightRail}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-slate-200 px-4 sm:px-6 py-4 flex items-center justify-between mt-6 gap-3">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium px-3 sm:px-4 py-2 min-h-[40px] rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40"
        >
          <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
          {backLabel}
        </button>

        {customFooter ?? (
          <div className="flex items-center gap-2 sm:gap-3">
            {showSaveDraft && (
              <button
                onClick={onSaveDraft}
                className="flex items-center gap-1.5 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium px-3 sm:px-4 py-2 min-h-[40px] rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40"
              >
                <Save className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Save Draft</span>
                <span className="sm:hidden">Save</span>
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={nextDisabled}
              className="flex items-center gap-1.5 bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)] disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium px-3 sm:px-4 py-2 min-h-[40px] rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/50"
            >
              {nextLabel}
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
