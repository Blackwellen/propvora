"use client"
import React from "react"
import { useRouter } from "next/navigation"
import { Gavel, Check, ChevronLeft, Save, ChevronRight } from "lucide-react"
import { LegalDisclaimerBanner } from "./LegalDisclaimerBanner"

const WIZARD_STEPS = [
  { label: "Select Tenancy", href: "/app/legal/possession/new/select-tenancy" },
  { label: "Select Grounds", href: "/app/legal/possession/new/select-grounds" },
  { label: "Review Evidence", href: "/app/legal/possession/new/review-evidence" },
  { label: "Notice Preview", href: "/app/legal/possession/new/notice-preview" },
  { label: "Record Service", href: "/app/legal/possession/new/record-service" },
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
  subtitle = "Create a legally compliant possession case with confidence.",
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
      router.push("/app/legal/possession")
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
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/app/legal/possession")}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <Gavel className="w-4 h-4" />
          </button>
          <span className="text-slate-300">/</span>
          <div>
            <h1 className="text-[15px] font-semibold text-slate-900">{title}</h1>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>
        <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full text-[11px] font-medium">
          Step {currentStep} of 5
        </span>
      </div>

      {/* Stepper */}
      <div className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="flex items-center">
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
                        ? "bg-blue-600 border-blue-600 text-white"
                        : active
                        ? "bg-white border-blue-600 text-blue-600"
                        : "bg-white border-slate-200 text-slate-400"
                    }`}
                  >
                    {done ? <Check className="w-4 h-4" /> : stepNum}
                  </div>
                  <span
                    className={`text-[10px] font-medium text-center leading-tight ${
                      active ? "text-blue-600" : done ? "text-slate-600" : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {i < WIZARD_STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mb-5 transition-colors ${
                      stepNum < currentStep ? "bg-blue-600" : "bg-slate-200"
                    }`}
                  />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="px-6 pt-4">
        <LegalDisclaimerBanner />
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 pt-4 pb-0">
        <div className={`grid gap-6 ${rightRail ? "grid-cols-12" : "grid-cols-1 max-w-3xl"}`}>
          <div className={rightRail ? "col-span-8" : "col-span-1"}>
            {children}
          </div>
          {rightRail && (
            <div className="col-span-4 space-y-4">
              {rightRail}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between mt-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          {backLabel}
        </button>

        {customFooter ?? (
          <div className="flex items-center gap-3">
            {showSaveDraft && (
              <button
                onClick={onSaveDraft}
                className="flex items-center gap-1.5 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                Save Draft
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={nextDisabled}
              className="flex items-center gap-1.5 bg-[#2563EB] text-white hover:bg-[#1d4ed8] disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {nextLabel}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
