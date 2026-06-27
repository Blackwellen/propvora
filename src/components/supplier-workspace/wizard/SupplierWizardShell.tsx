"use client"

import React from "react"
import { X, ChevronLeft, ChevronRight, Check, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { MobileSheet } from "@/components/mobile"

/* ──────────────────────────────────────────────────────────────────────────
   SupplierWizardShell — a generic, prop-driven wizard shell that mirrors the
   planning-set wizard's layout and styling (left step rail, top bar, scrollable
   step body, right live-summary panel, bottom navigation) WITHOUT coupling to
   planning's state. Used by the supplier onboarding + service-creation wizards.

   Light tokens only; supplier blue (var(--brand)) accent instead of planning violet.
─────────────────────────────────────────────────────────────────────────── */

export interface WizardStepMeta {
  label: string
  subtitle: string
  icon?: LucideIcon
}

export function SupplierWizardShell({
  title,
  steps,
  current,
  onStepSelect,
  children,
  livePanel,
  onClose,
  onPrev,
  onNext,
  onFinish,
  canContinue = true,
  finishing = false,
  nextLabel = "Continue",
  finishLabel = "Finish",
}: {
  title: string
  steps: WizardStepMeta[]
  current: number // 0-based index
  onStepSelect: (index: number) => void
  children: React.ReactNode
  livePanel?: React.ReactNode
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  onFinish: () => void
  canContinue?: boolean
  finishing?: boolean
  nextLabel?: string
  finishLabel?: string
}) {
  const isLast = current === steps.length - 1
  const [summaryOpen, setSummaryOpen] = React.useState(false)
  const step = steps[current]

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between gap-3 h-16 px-4 md:px-6 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onClose} aria-label="Close wizard" className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{title}</p>
            <p className="text-sm font-semibold text-slate-900 truncate">{step?.label}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-400">Step {current + 1} of {steps.length}</span>
          {livePanel && (
            <button onClick={() => setSummaryOpen(true)} className="xl:hidden text-xs font-semibold text-[var(--brand)]">Summary</button>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Step rail */}
        <aside className="hidden lg:flex flex-col w-[180px] shrink-0 border-r border-slate-100 bg-white overflow-y-auto py-2 px-1.5">
          {steps.map((s, i) => {
            const isActive = i === current
            const isComplete = i < current
            const isPending = i > current
            const Icon = s.icon
            return (
              <button
                key={i}
                onClick={() => { if (isComplete) onStepSelect(i) }}
                disabled={isPending || isActive}
                className={cn(
                  "w-full flex items-start gap-3 px-2.5 py-2.5 rounded-xl text-left transition-all mb-0.5",
                  isActive && "bg-[var(--brand-soft)]",
                  isComplete && "hover:bg-slate-50 cursor-pointer",
                  isPending && "cursor-default opacity-40"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 transition-all",
                  isActive && "bg-[var(--brand)] text-white ring-4 ring-[var(--color-brand-100)]",
                  isComplete && "bg-[#10B981] text-white",
                  isPending && "bg-slate-100 text-slate-400"
                )}>
                  {isComplete ? <Check className="w-3 h-3" /> : Icon ? <Icon className="w-3 h-3" /> : i + 1}
                </div>
                <div className="min-w-0">
                  <p className={cn("text-[13px] font-semibold leading-tight", isActive ? "text-slate-900" : "text-slate-600")}>{s.label}</p>
                  <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{s.subtitle}</p>
                </div>
              </button>
            )
          })}
        </aside>

        {/* Body */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-10">{children}</div>
        </main>

        {/* Live panel */}
        {livePanel && (
          <aside className="hidden xl:flex flex-col w-[280px] shrink-0 border-l border-slate-100 bg-slate-50/40 overflow-y-auto p-5">
            {livePanel}
          </aside>
        )}
      </div>

      {/* Bottom bar */}
      <footer className="flex items-center justify-between gap-3 h-16 px-4 md:px-6 border-t border-slate-100 shrink-0 bg-white">
        <button
          onClick={onPrev}
          disabled={current === 0}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        {isLast ? (
          <button
            onClick={onFinish}
            disabled={!canContinue || finishing}
            className="inline-flex items-center gap-1.5 h-10 px-5 rounded-xl text-sm font-semibold bg-[#10B981] text-white hover:bg-[#059669] disabled:opacity-50"
          >
            {finishing && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            <Check className="w-4 h-4" /> {finishLabel}
          </button>
        ) : (
          <button
            onClick={onNext}
            disabled={!canContinue}
            className="inline-flex items-center gap-1.5 h-10 px-5 rounded-xl text-sm font-semibold bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)] disabled:opacity-50"
          >
            {nextLabel} <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </footer>

      {livePanel && (
        <MobileSheet open={summaryOpen} onClose={() => setSummaryOpen(false)} title="Summary">
          <div className="p-4">{livePanel}</div>
        </MobileSheet>
      )}
    </div>
  )
}
