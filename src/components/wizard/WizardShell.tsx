"use client"

import React from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Check, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================================
// Shared in-page wizard shell for simple operator wizards
// (Create Task, Create Job, etc.). Premium side-step rail on
// desktop (the Propvora standard for in-app wizards — top
// steppers are reserved for onboarding), collapsing to a step
// dropdown on mobile/PWA. Accent intentionally uses literal
// `blue-*` to stay consistent with the Work section, which is
// built on literal blue throughout. (The `brand-*` token scale
// is overridden per-workspace by BrandingStyle and currently
// resolves to grey for some workspaces, so token adoption is an
// app-wide concern, not a per-wizard one.)
//
// Steps already completed (index < current) are clickable to
// jump back; future steps are locked. The parent owns the data
// and validation (`canAdvance`) and the submit handler.
// ============================================================

export interface WizardStepDef {
  label: string
  description?: string
}

interface WizardShellProps {
  title: string
  backHref: string
  backLabel: string
  steps: WizardStepDef[]
  /** 1-based index of the active step */
  current: number
  onStepSelect: (step: number) => void
  onBack: () => void
  onNext: () => void
  onSubmit: () => void
  canAdvance: boolean
  submitting?: boolean
  submitLabel: string
  error?: string | null
  /** Optional notice rendered above the step card (e.g. a restored-draft banner). */
  banner?: React.ReactNode
  children: React.ReactNode
}

export function WizardShell({
  title,
  backHref,
  backLabel,
  steps,
  current,
  onStepSelect,
  onBack,
  onNext,
  onSubmit,
  canAdvance,
  submitting = false,
  submitLabel,
  error,
  banner,
  children,
}: WizardShellProps) {
  const total = steps.length
  const isLast = current === total
  const active = steps[current - 1]

  return (
    // Full content width (no mx-auto) so the wizard aligns with every other page
    // type and the quick action bar. The side-step rail sits flush at the page's
    // left edge; the form panel is width-capped for readability (see below).
    <div className="w-full">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" /> {backLabel}
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Step {current} of {total} — {active?.label}
        </p>
      </div>

      {/* Mobile / tablet step selector — keeps the stepper usable below lg */}
      <div className="lg:hidden mb-5">
        <label htmlFor="wizard-step-select" className="sr-only">Jump to step</label>
        <select
          id="wizard-step-select"
          value={current}
          onChange={(e) => {
            const target = Number(e.target.value)
            if (target <= current) onStepSelect(target)
          }}
          className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]"
        >
          {steps.map((s, i) => (
            <option key={s.label} value={i + 1} disabled={i + 1 > current}>
              Step {i + 1} of {total} · {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="lg:grid lg:grid-cols-[210px_1fr] lg:gap-8">
        {/* Side-step rail — desktop only */}
        <nav aria-label="Wizard steps" className="hidden lg:block">
          <ol className="sticky top-6 space-y-1">
            {steps.map((s, i) => {
              const stepNum = i + 1
              const isActive = stepNum === current
              const isComplete = stepNum < current
              const isPending = stepNum > current
              return (
                <li key={s.label}>
                  <button
                    type="button"
                    onClick={() => { if (isComplete) onStepSelect(stepNum) }}
                    disabled={isPending || isActive}
                    aria-current={isActive ? "step" : undefined}
                    className={cn(
                      "w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-all",
                      isActive && "bg-[var(--brand-soft)]",
                      isComplete && "hover:bg-slate-50 cursor-pointer",
                      isPending && "cursor-default opacity-50",
                    )}
                  >
                    <span
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all",
                        isActive && "bg-[var(--brand)] text-white ring-4 ring-[var(--color-brand-100)]",
                        isComplete && "bg-emerald-500 text-white",
                        isPending && "bg-slate-100 text-slate-400",
                      )}
                    >
                      {isComplete ? <Check className="w-3.5 h-3.5" /> : stepNum}
                    </span>
                    <span className="min-w-0 pt-0.5">
                      <span
                        className={cn(
                          "block text-sm font-semibold leading-tight",
                          isActive ? "text-slate-900" : isComplete ? "text-slate-700" : "text-slate-400",
                        )}
                      >
                        {s.label}
                      </span>
                      {s.description && (
                        <span className="block text-xs text-slate-400 mt-0.5 leading-tight">{s.description}</span>
                      )}
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </nav>

        {/* Step content + footer — capped for form readability while the rail
            stays left-aligned to the page edge (avoids an awkward full-bleed form). */}
        <div className="min-w-0 max-w-3xl">
          {banner}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
            <h2 className="text-base font-semibold text-slate-900 mb-5">{active?.label}</h2>
            {children}
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              disabled={current === 1}
              className="inline-flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            {!isLast ? (
              <button
                type="button"
                onClick={onNext}
                disabled={!canAdvance}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all",
                  canAdvance ? "bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)] shadow-sm" : "bg-slate-200 text-slate-400 cursor-not-allowed",
                )}
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving…
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> {submitLabel}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
