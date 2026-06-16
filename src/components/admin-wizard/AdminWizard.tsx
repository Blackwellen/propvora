"use client"

import React, { useState } from "react"
import { Check, ChevronLeft, ChevronRight, X, AlertTriangle } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/Dialog"
import { cn } from "@/lib/utils"

/**
 * Shared multi-step admin creation wizard.
 *
 * A contained modal stepper styled after the planning-set wizard (numbered rail,
 * progress, complete/pending states) but sized for the admin console. Each step
 * supplies a `validate()` gate; the final step submits via `onSubmit`. Mobile
 * collapses the rail into a compact progress bar.
 */

export interface WizardStepDef {
  /** Stable key. */
  key: string
  /** Short label shown in the rail. */
  label: string
  /** One-line helper under the label. */
  subtitle?: string
  /** Step body. */
  content: React.ReactNode
  /** Return true when this step is complete enough to advance. */
  validate?: () => boolean
}

interface AdminWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  subtitle?: string
  steps: WizardStepDef[]
  submitLabel?: string
  submitting?: boolean
  error?: string | null
  /** Called on the final step's primary action. */
  onSubmit: () => void | Promise<void>
}

export function AdminWizard({
  open,
  onOpenChange,
  title,
  subtitle,
  steps,
  submitLabel = "Create",
  submitting = false,
  error,
  onSubmit,
}: AdminWizardProps) {
  const [current, setCurrent] = useState(0)
  const isLast = current === steps.length - 1
  const step = steps[current]
  const canAdvance = step?.validate ? step.validate() : true

  function reset() {
    setCurrent(0)
  }

  function handleClose(next: boolean) {
    if (!next) reset()
    onOpenChange(next)
  }

  const progressPct = steps.length > 1 ? (current / (steps.length - 1)) * 100 : 100

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent size="xl" hideClose className="p-0 overflow-hidden">
        <div className="flex flex-col sm:flex-row max-h-[calc(100dvh-2rem)]">
          {/* Rail — desktop */}
          <aside className="hidden sm:flex flex-col w-[200px] shrink-0 bg-[#0D1B2A] p-4">
            <p className="text-[10px] font-bold text-[#8EA9D8] uppercase tracking-widest mb-1">{title}</p>
            {subtitle && <p className="text-[11px] text-[#5d7299] mb-4 leading-snug">{subtitle}</p>}
            <div className="flex-1 space-y-1">
              {steps.map((s, i) => {
                const isActive = i === current
                const isComplete = i < current
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => { if (isComplete) setCurrent(i) }}
                    disabled={!isComplete && !isActive}
                    className={cn(
                      "w-full flex items-start gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all",
                      isActive ? "bg-white/[0.08]" : "",
                      isComplete ? "hover:bg-white/[0.05] cursor-pointer" : "",
                      !isActive && !isComplete ? "opacity-45 cursor-default" : "",
                    )}
                  >
                    <span className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5",
                      isActive ? "bg-[#2563EB] text-white ring-4 ring-[#2563EB]/20" : "",
                      isComplete ? "bg-[#10B981] text-white" : "",
                      !isActive && !isComplete ? "bg-white/10 text-[#8EA9D8]" : "",
                    )}>
                      {isComplete ? <Check className="w-3 h-3" /> : i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className={cn(
                        "block text-[11.5px] font-semibold leading-tight truncate",
                        isActive ? "text-white" : isComplete ? "text-[#DCEBFF]" : "text-[#8EA9D8]",
                      )}>{s.label}</span>
                      {s.subtitle && <span className="block text-[10px] text-[#5d7299] mt-0.5 leading-tight">{s.subtitle}</span>}
                    </span>
                  </button>
                )
              })}
            </div>
          </aside>

          {/* Body */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#E2E8F0]">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{step?.label}</p>
                <p className="text-[11px] text-slate-400">Step {current + 1} of {steps.length}</p>
              </div>
              <button
                type="button"
                onClick={() => handleClose(false)}
                aria-label="Close"
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile progress */}
            <div className="sm:hidden h-1 bg-slate-100">
              <div className="h-full bg-[#2563EB] transition-all" style={{ width: `${Math.max(progressPct, 8)}%` }} />
            </div>

            {/* Step content */}
            <div className="flex-1 overflow-y-auto px-5 py-5 min-h-[260px]">
              {step?.content}
            </div>

            {/* Error */}
            {error && (
              <div className="mx-5 mb-3 flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-[12px] text-red-700">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between gap-2 px-5 py-3.5 border-t border-[#E2E8F0] bg-slate-50/60">
              <button
                type="button"
                onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                disabled={current === 0 || submitting}
                className={cn(
                  "flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-[13px] font-semibold transition-colors",
                  current === 0 ? "opacity-40 cursor-not-allowed text-slate-400" : "text-slate-700 hover:bg-white border border-[#E2E8F0]",
                )}
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              {isLast ? (
                <button
                  type="button"
                  onClick={() => { void onSubmit() }}
                  disabled={!canAdvance || submitting}
                  className={cn(
                    "flex items-center gap-1.5 h-9 px-5 rounded-lg text-[13px] font-semibold transition-all",
                    !canAdvance || submitting ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-[#2563EB] text-white hover:bg-[#1d4fd7] shadow-sm",
                  )}
                >
                  {submitting && <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
                  {submitLabel}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { if (canAdvance) setCurrent((c) => Math.min(steps.length - 1, c + 1)) }}
                  disabled={!canAdvance}
                  className={cn(
                    "flex items-center gap-1.5 h-9 px-5 rounded-lg text-[13px] font-semibold transition-all",
                    canAdvance ? "bg-[#2563EB] text-white hover:bg-[#1d4fd7] shadow-sm" : "bg-slate-200 text-slate-400 cursor-not-allowed",
                  )}
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Shared field primitives for wizard/inline forms ──────────────────────────

export function Field({ label, hint, children, required }: { label: string; hint?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
      {hint && <span className="block text-[11px] text-slate-400 mt-1">{hint}</span>}
    </label>
  )
}

export function NativeSelect({
  value, onChange, options, className,
}: {
  value: string
  onChange: (v: string) => void
  options: Array<{ value: string; label: string }>
  className?: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "w-full h-9 px-3 rounded-lg border border-[#E2E8F0] bg-white text-sm text-slate-900",
        "focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]",
        className,
      )}
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}
