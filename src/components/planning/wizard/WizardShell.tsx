"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { X, Save, ChevronLeft, ChevronRight, Check, Sparkles, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useWizard } from "./WizardContext"
import { MobileSheet } from "@/components/mobile"

// ============================================================
// Planning Set wizard shell.
//
// Renders INSIDE the app shell (sidebar + topnav stay visible)
// — the Propvora standard for in-app wizards. A single premium
// side-step rail is the canonical stepper on desktop, collapsing
// to a step dropdown below lg. The header carries one progress
// summary (never a second stepper), and the footer is a normal
// (non-sticky) action row below the step card so it can't overlap
// content at any viewport.
// ============================================================

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

const TOTAL_STEPS = WIZARD_STEPS.length

function WizardStepRail() {
  const { state, setStep } = useWizard()
  return (
    <nav
      aria-label="Wizard steps"
      className="hidden lg:flex flex-col w-[190px] shrink-0 self-start sticky top-0"
    >
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-4 py-4 border-b border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Planning Wizard</p>
        </div>

        {/* Steps */}
        <ol className="py-2 px-1.5">
          {WIZARD_STEPS.map(s => {
            const isActive   = s.num === state.currentStep
            const isComplete = s.num < state.currentStep
            const isPending  = s.num > state.currentStep
            return (
              <li key={s.num}>
                <button
                  type="button"
                  onClick={() => { if (isComplete) setStep(s.num) }}
                  disabled={isPending || isActive}
                  aria-current={isActive ? "step" : undefined}
                  className={cn(
                    "w-full flex items-start gap-3 px-2.5 py-2.5 rounded-xl text-left transition-all mb-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/30",
                    isActive   ? "bg-violet-50" : "",
                    isComplete ? "hover:bg-slate-50 cursor-pointer" : "",
                    isPending  ? "cursor-default opacity-40" : "",
                  )}
                >
                  <span className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 transition-all",
                    isActive   ? "bg-[#7C3AED] text-white ring-4 ring-violet-100" : "",
                    isComplete ? "bg-[#10B981] text-white" : "",
                    isPending  ? "bg-slate-100 text-slate-400" : "",
                  )}>
                    {isComplete ? <Check className="w-3 h-3" /> : s.num}
                  </span>
                  <span className="min-w-0">
                    <span className={cn(
                      "block text-[11.5px] font-semibold leading-tight truncate",
                      isActive   ? "text-violet-700" :
                      isComplete ? "text-slate-700" : "text-slate-400"
                    )}>{s.label}</span>
                    <span className="block text-[10px] text-slate-400 mt-0.5 leading-tight">{s.subtitle}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>

        {/* Help — routes to the strategy comparison page (real destination) */}
        <div className="mx-3 mb-3 p-3 rounded-2xl bg-violet-50 border border-violet-100">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-6 h-6 rounded-lg bg-[#7C3AED] flex items-center justify-center shrink-0">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <p className="text-[11px] font-bold text-violet-900">Need help choosing?</p>
          </div>
          <p className="text-[10px] text-violet-600 leading-snug mb-2">
            Compare every operating strategy side-by-side before you commit.
          </p>
          <Link
            href="/property-manager/planning/profiles"
            className="w-full flex items-center justify-center gap-1.5 h-7 rounded-lg bg-white border border-violet-200 text-[10.5px] font-semibold text-violet-700 hover:bg-violet-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/30"
          >
            <Sparkles className="w-3 h-3" />
            Compare strategies
          </Link>
        </div>
      </div>
    </nav>
  )
}

function WizardHeader({ planName, onClose }: { planName: string; onClose: () => void }) {
  const { state, setStep } = useWizard()
  const current = state.currentStep
  const activeLabel = WIZARD_STEPS[current - 1]?.label ?? ""
  const progressPct = ((current - 1) / (TOTAL_STEPS - 1)) * 100

  return (
    <div className="mb-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          {/* Not an <h1>: each step body owns the page's single <h1>
              (e.g. "Opportunity Basics"). This is the contextual wizard label. */}
          <p className="text-2xl font-bold tracking-tight text-slate-900 leading-tight truncate">
            {planName || "New Planning Set"}
          </p>
          <p className="text-sm text-slate-500 mt-0.5">
            Step {current} of {TOTAL_STEPS} — {activeLabel}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile / tablet step jump — rail is hidden below lg */}
          <label htmlFor="wizard-step-select" className="sr-only">Jump to wizard step</label>
          <select
            id="wizard-step-select"
            value={current}
            onChange={(e) => {
              const target = Number(e.target.value)
              if (target <= current) setStep(target)
            }}
            className="lg:hidden h-10 px-2 rounded-xl border border-slate-200 bg-white text-[12px] font-semibold text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/30 max-w-[170px]"
          >
            {WIZARD_STEPS.map((s) => (
              <option key={s.num} value={s.num} disabled={s.num > current}>
                Step {s.num}/{TOTAL_STEPS} · {s.label}
              </option>
            ))}
          </select>

          <button
            onClick={onClose}
            aria-label="Close wizard"
            className="inline-flex items-center gap-1.5 h-10 px-3 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/30"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Close</span>
          </button>
        </div>
      </div>

      {/* Single progress summary (never a second stepper) */}
      <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#7C3AED] rounded-full transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  )
}

function WizardFooter({
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
    <div className="mt-5 flex items-center justify-between gap-2">
      <button
        onClick={onPrev}
        disabled={state.currentStep === 1}
        aria-label="Back"
        className={cn(
          "flex items-center justify-center gap-2 h-11 px-4 sm:px-5 rounded-xl border border-slate-200 text-[13px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/30 shrink-0",
          state.currentStep === 1
            ? "opacity-40 cursor-not-allowed text-slate-400"
            : "text-slate-700 hover:bg-slate-50"
        )}
      >
        <ChevronLeft className="w-4 h-4 shrink-0" />
        Back
      </button>

      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Autosave indicator — hidden on the smallest screens to save room */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11.5px] text-slate-400">
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
          aria-label="Save draft"
          className="flex items-center justify-center gap-1.5 h-11 w-11 sm:w-auto sm:px-4 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/30 shrink-0"
        >
          <Save className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" />
          <span className="hidden sm:inline">Save Draft</span>
        </button>

        {!isLastStep && (
          <button
            onClick={onNext}
            disabled={!canContinue}
            className={cn(
              "flex items-center justify-center gap-2 h-11 px-5 sm:px-6 rounded-xl text-[13.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/40 min-w-0",
              canContinue
                ? "bg-[#7C3AED] text-white hover:bg-violet-700 shadow-sm"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            )}
          >
            <span className="truncate">{nextLabel}</span>
            <ChevronRight className="w-4 h-4 shrink-0" />
          </button>
        )}
      </div>
    </div>
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
  const [summaryOpen, setSummaryOpen] = useState(false)
  const handleClose = onClose ?? (() => router.push("/property-manager/planning"))
  const handlePrev  = onPrev  ?? (() => undefined)
  const handleNext  = onNext  ?? (() => undefined)
  const handleSave  = onSave  ?? (() => undefined)

  return (
    <div className="min-h-full">
      <WizardHeader planName={planName} onClose={handleClose} />

      <div className="flex gap-6 lg:gap-8 items-start">
        {/* Single canonical stepper — side rail (desktop) */}
        <WizardStepRail />

        {/* Step content + footer */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {step}
          </div>

          <WizardFooter
            onPrev={handlePrev}
            onNext={handleNext}
            onSave={handleSave}
            isLastStep={isLastStep}
            canContinue={canContinue}
            nextLabel={nextLabel}
          />
        </div>

        {/* Right live summary panel — desktop xl+ only */}
        <aside className="hidden xl:block w-[280px] shrink-0 self-start sticky top-0">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {livePanel}
          </div>
        </aside>
      </div>

      {/* Mobile / tablet: surface the live summary in a bottom sheet so the
          running calculation is never lost below the xl breakpoint. */}
      <button
        type="button"
        onClick={() => setSummaryOpen(true)}
        className="xl:hidden fixed right-4 z-40 flex items-center gap-2 h-11 px-4 rounded-full bg-[#7C3AED] text-white text-[13px] font-semibold shadow-[0_8px_24px_rgba(124,58,237,0.35)] active:scale-95 transition-transform motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#7C3AED]"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 84px)" }}
        aria-label="View live summary"
      >
        <BarChart3 className="w-4 h-4" />
        Summary
      </button>
      <MobileSheet
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        title="Live summary"
        description="Updates as you complete each step"
        maxHeightVh={0.9}
      >
        {livePanel}
      </MobileSheet>
    </div>
  )
}
