"use client"

import React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { X, Save, ChevronLeft, ChevronRight, Check, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { useWizard } from "./WizardContext"

const WIZARD_STEPS = [
  { num: 1, label: "Profile",              subtitle: "Choose operation type",           dataSteps: [1] },
  { num: 2, label: "Basics",               subtitle: "Name & location",                 dataSteps: [2] },
  { num: 3, label: "Income",               subtitle: "Revenue model",                   dataSteps: [3] },
  { num: 4, label: "Expenses & Bills",     subtitle: "Operating costs & running bills", dataSteps: [4, 5] },
  { num: 5, label: "Upfront & Compliance", subtitle: "Upfront investment & legal",      dataSteps: [6, 7] },
  { num: 6, label: "LL Offer",             subtitle: "Landlord arrangement",            dataSteps: [8] },
  { num: 7, label: "Forecast",             subtitle: "5-year projection",               dataSteps: [9] },
  { num: 8, label: "Risk & AI Review",     subtitle: "Quality-control & insights",      dataSteps: [10, 11] },
  { num: 9, label: "Review",               subtitle: "Confirm & create",                dataSteps: [12] },
]

function WizardStepRail() {
  const { state, setStep } = useWizard()
  return (
    <aside className="hidden lg:flex flex-col w-[160px] shrink-0 border-r border-slate-100 bg-white overflow-y-auto">
      {/* Header */}
      <div className="px-4 py-5 border-b border-slate-100">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Planning Wizard</p>
      </div>

      {/* Steps */}
      <div className="flex-1 py-2 px-1.5">
        {WIZARD_STEPS.map(s => {
          const isActive   = s.num === state.currentStep
          const isComplete = s.num < state.currentStep
          const isPending  = s.num > state.currentStep
          return (
            <button
              key={s.num}
              onClick={() => { if (isComplete) setStep(s.num) }}
              disabled={isPending || isActive}
              className={cn(
                "w-full flex items-start gap-3 px-2.5 py-2.5 rounded-xl text-left transition-all mb-0.5",
                isActive   ? "bg-violet-50" : "",
                isComplete ? "hover:bg-slate-50 cursor-pointer" : "",
                isPending  ? "cursor-default opacity-40" : "",
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 transition-all",
                isActive   ? "bg-[#7C3AED] text-white ring-4 ring-violet-100" : "",
                isComplete ? "bg-[#10B981] text-white" : "",
                isPending  ? "bg-slate-100 text-slate-400" : "",
              )}>
                {isComplete ? <Check className="w-3 h-3" /> : s.num}
              </div>
              <div className="min-w-0">
                <p className={cn(
                  "text-[11.5px] font-semibold leading-tight truncate",
                  isActive   ? "text-violet-700" :
                  isComplete ? "text-slate-700" : "text-slate-400"
                )}>{s.label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{s.subtitle}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* AI Help */}
      <div className="mx-3 mb-3 p-3 rounded-2xl bg-violet-50 border border-violet-100">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-6 h-6 rounded-lg bg-[#7C3AED] flex items-center justify-center shrink-0">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <p className="text-[11px] font-bold text-violet-900">Need help choosing?</p>
        </div>
        <p className="text-[10px] text-violet-600 leading-snug mb-2">
          Our AI will tailor the rest of the plan to your selected profile.
        </p>
        <button className="w-full flex items-center justify-center gap-1.5 h-7 rounded-lg bg-white border border-violet-200 text-[10.5px] font-semibold text-violet-700 hover:bg-violet-50 transition-colors">
          <Sparkles className="w-3 h-3" />
          Get AI Guidance
        </button>
      </div>
    </aside>
  )
}

function WizardTopBar({ planName, onClose }: { planName: string; onClose: () => void }) {
  const { state, setStep } = useWizard()
  const progressPct = ((state.currentStep - 1) / (WIZARD_STEPS.length - 1)) * 100

  return (
    <header className="h-14 shrink-0 flex items-center gap-3 sm:gap-4 px-3 sm:px-5 border-b border-slate-100 bg-white">
      {/* Logo */}
      <Link href="/app" className="flex items-center gap-2 shrink-0">
        <div className="relative h-8 w-[120px]">
          <Image src="/propvora-logo-dark.png" alt="Propvora" fill className="object-contain object-left" priority />
        </div>
      </Link>

      {/* Divider */}
      <div className="w-px h-6 bg-slate-200 shrink-0 hidden sm:block" />

      {/* Title */}
      <div className="hidden sm:block shrink-0">
        <p className="text-[13px] font-bold text-slate-900 leading-tight">{planName || "New Planning Set"}</p>
        <p className="text-[10.5px] text-slate-400">Choose the right strategy for this opportunity</p>
      </div>

      {/* Progress */}
      <div className="flex-1 flex items-center gap-3 min-w-0">
        {/* Step pills — horizontal on large screens */}
        <div className="hidden xl:flex items-center gap-0 flex-1">
          {WIZARD_STEPS.map((s, i) => {
            const isActive   = s.num === state.currentStep
            const isComplete = s.num < state.currentStep
            const isLast     = i === WIZARD_STEPS.length - 1
            return (
              <React.Fragment key={s.num}>
                <div className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-full transition-all whitespace-nowrap text-[10.5px] font-semibold",
                  isActive   ? "bg-[#7C3AED] text-white" : "",
                  isComplete ? "text-emerald-600" : "",
                  !isActive && !isComplete ? "text-slate-400" : "",
                )}>
                  <span className={cn(
                    "w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0",
                    isActive   ? "bg-white/20" : "",
                    isComplete ? "bg-emerald-100" : "",
                    !isActive && !isComplete ? "bg-slate-100" : "",
                  )}>
                    {isComplete ? <Check className="w-2.5 h-2.5" /> : s.num}
                  </span>
                  {s.label}
                </div>
                {!isLast && (
                  <div className={cn("h-px flex-1 min-w-[8px]", isComplete ? "bg-emerald-200" : "bg-slate-200")} />
                )}
              </React.Fragment>
            )
          })}
        </div>

        {/* Compact progress bar for smaller screens */}
        <div className="xl:hidden flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#7C3AED] rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Step counter + mobile step jump */}
      <div className="shrink-0 text-right">
        <p className="text-[11.5px] font-semibold text-slate-500 hidden xl:block">
          Step {state.currentStep} of {WIZARD_STEPS.length}
        </p>
        {/* Mobile / tablet step picker — lets users jump between completed steps */}
        <label htmlFor="wizard-step-select" className="sr-only">
          Jump to wizard step
        </label>
        <select
          id="wizard-step-select"
          value={state.currentStep}
          onChange={(e) => {
            const target = Number(e.target.value)
            if (target <= state.currentStep) setStep(target)
          }}
          className="xl:hidden h-9 min-h-[40px] px-2 rounded-lg border border-slate-200 bg-white text-[12px] font-semibold text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/30 max-w-[150px]"
        >
          {WIZARD_STEPS.map((s) => (
            <option key={s.num} value={s.num} disabled={s.num > state.currentStep}>
              Step {s.num}/{WIZARD_STEPS.length} · {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Close */}
      <button
        onClick={onClose}
        aria-label="Close wizard"
        className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors shrink-0 ml-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/30"
      >
        <X className="w-4 h-4 text-slate-400" />
      </button>
    </header>
  )
}

function WizardBottomBar({
  onPrev,
  onNext,
  onSave,
  isLastStep,
  canContinue,
  nextLabel,
}: {
  onPrev: () => void
  onNext: () => void
  onSave: () => void
  isLastStep: boolean
  canContinue: boolean
  nextLabel: string
}) {
  const { state, isSaving } = useWizard()
  return (
    <footer className="h-16 shrink-0 flex items-center justify-between px-3 sm:px-5 border-t border-slate-100 bg-white">
      <button
        onClick={onPrev}
        disabled={state.currentStep === 1}
        className={cn(
          "flex items-center gap-2 h-10 px-3 sm:px-5 rounded-xl border border-slate-200 text-[13px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/30",
          state.currentStep === 1
            ? "opacity-40 cursor-not-allowed text-slate-400"
            : "text-slate-700 hover:bg-slate-50"
        )}
      >
        <ChevronLeft className="w-4 h-4 shrink-0" />
        <span className="hidden sm:inline">
          {state.currentStep === 1 ? "Previous" : `Back to Step ${state.currentStep - 1}`}
        </span>
        <span className="sm:hidden">Back</span>
      </button>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Autosave indicator */}
        <div className="flex items-center gap-1.5 text-[11.5px] text-slate-400">
          {isSaving ? (
            <>
              <div className="w-3 h-3 rounded-full border-2 border-slate-300 border-t-[#7C3AED] animate-spin" />
              Saving…
            </>
          ) : state.lastSavedAt ? (
            <>
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              Autosaved
            </>
          ) : null}
        </div>

        <button
          onClick={onSave}
          className="flex items-center gap-1.5 h-10 px-3 sm:px-4 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/30"
        >
          <Save className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Save Draft</span>
          <span className="sm:hidden">Save</span>
        </button>

        {!isLastStep && (
          <button
            onClick={onNext}
            disabled={!canContinue}
            className={cn(
              "flex items-center gap-2 h-10 px-4 sm:px-6 rounded-xl text-[13.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/40",
              canContinue
                ? "bg-[#7C3AED] text-white hover:bg-violet-700 shadow-sm"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            )}
          >
            {nextLabel}
            <ChevronRight className="w-4 h-4 shrink-0" />
          </button>
        )}
      </div>
    </footer>
  )
}

interface WizardShellProps {
  step: React.ReactNode
  livePanel: React.ReactNode
  planName?: string
  onClose?: () => void
  onPrev?: () => void
  onNext?: () => void
  onSave?: () => void
  isLastStep?: boolean
  canContinue?: boolean
  nextLabel?: string
}

export function WizardShell({
  step,
  livePanel,
  planName = "",
  onClose,
  onPrev,
  onNext,
  onSave,
  isLastStep = false,
  canContinue = true,
  nextLabel = "Continue",
}: WizardShellProps) {
  const router = useRouter()
  const handleClose = onClose ?? (() => router.push("/app/planning"))
  const handlePrev  = onPrev  ?? (() => undefined)
  const handleNext  = onNext  ?? (() => undefined)
  const handleSave  = onSave  ?? (() => undefined)

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-hidden">
      <WizardTopBar planName={planName} onClose={handleClose} />

      <div className="flex flex-1 overflow-hidden">
        <WizardStepRail />

        {/* Main content + right panel */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main scroll area */}
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-none">
              {step}
            </div>
          </main>

          {/* Right live summary panel */}
          <aside className="hidden xl:flex flex-col w-[260px] shrink-0 border-l border-slate-100 bg-white overflow-y-auto">
            {livePanel}
          </aside>
        </div>
      </div>

      <WizardBottomBar
        onPrev={handlePrev}
        onNext={handleNext}
        onSave={handleSave}
        isLastStep={isLastStep}
        canContinue={canContinue}
        nextLabel={nextLabel}
      />
    </div>
  )
}
