"use client"

import React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { X, ChevronLeft, ChevronRight, Check, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/* ──────────────────────────────────────────────────────────────────────────
   CustomerWizardShell — a focused, full-screen multi-step wizard for the
   guest workspace (issue report, change request). Mirrors the planning-set
   wizard shell's layout (fixed overlay, left step rail, top progress, sticky
   bottom bar) but in the customer blue token set, and is self-contained
   (no WizardContext). Heavily mobile-aware: the rail collapses to a step
   picker and a progress bar below `lg`.
─────────────────────────────────────────────────────────────────────────── */

export interface WizardStepDef {
  num: number
  label: string
  subtitle: string
  icon: LucideIcon
}

export function CustomerWizardShell({
  steps,
  current,
  onStep,
  onPrev,
  onNext,
  onClose,
  closeHref = "/user/bookings",
  title,
  subtitle,
  isLastStep,
  canContinue = true,
  nextLabel = "Continue",
  submitLabel = "Submit",
  submitting = false,
  children,
}: {
  steps: WizardStepDef[]
  current: number
  onStep: (n: number) => void
  onPrev: () => void
  onNext: () => void
  onClose?: () => void
  closeHref?: string
  title: string
  subtitle?: string
  isLastStep: boolean
  canContinue?: boolean
  nextLabel?: string
  submitLabel?: string
  submitting?: boolean
  children: React.ReactNode
}) {
  const router = useRouter()
  const handleClose = onClose ?? (() => router.push(closeHref))
  const progressPct = ((current - 1) / Math.max(1, steps.length - 1)) * 100

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="h-14 shrink-0 flex items-center gap-3 sm:gap-4 px-3 sm:px-5 border-b border-slate-100 bg-white">
        <Link href="/user" className="flex items-center gap-2 shrink-0">
          <div className="relative h-8 w-[120px]">
            <Image src="/propvora-logo-dark.png" alt="Propvora" fill className="object-contain object-left" priority />
          </div>
        </Link>
        <div className="w-px h-6 bg-slate-200 shrink-0 hidden sm:block" />
        <div className="hidden sm:block shrink-0 min-w-0">
          <p className="text-[13px] font-bold text-slate-900 leading-tight truncate">{title}</p>
          {subtitle && <p className="text-[10.5px] text-slate-400 truncate">{subtitle}</p>}
        </div>

        <div className="flex-1 flex items-center gap-3 min-w-0">
          <div className="lg:hidden flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#2563EB] rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-[11.5px] font-semibold text-slate-500 hidden lg:block">Step {current} of {steps.length}</p>
          <select
            value={current}
            onChange={(e) => { const t = Number(e.target.value); if (t <= current) onStep(t) }}
            aria-label="Jump to step"
            className="lg:hidden h-9 px-2 rounded-lg border border-slate-200 bg-white text-[12px] font-semibold text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30 max-w-[150px]"
          >
            {steps.map((s) => (
              <option key={s.num} value={s.num} disabled={s.num > current}>
                Step {s.num}/{steps.length} · {s.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleClose}
          aria-label="Close"
          className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Step rail (desktop) */}
        <aside className="hidden lg:flex flex-col w-[180px] shrink-0 border-r border-slate-100 bg-white overflow-y-auto">
          <div className="px-4 py-5 border-b border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
          </div>
          <div className="flex-1 py-2 px-1.5">
            {steps.map((s) => {
              const isActive = s.num === current
              const isComplete = s.num < current
              const isPending = s.num > current
              const Icon = s.icon
              return (
                <button
                  key={s.num}
                  onClick={() => { if (isComplete) onStep(s.num) }}
                  disabled={isPending || isActive}
                  className={cn(
                    "w-full flex items-start gap-3 px-2.5 py-2.5 rounded-xl text-left transition-all mb-0.5",
                    isActive ? "bg-blue-50" : "",
                    isComplete ? "hover:bg-slate-50 cursor-pointer" : "",
                    isPending ? "cursor-default opacity-40" : ""
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 transition-all",
                    isActive ? "bg-[#2563EB] text-white ring-4 ring-blue-100" : "",
                    isComplete ? "bg-emerald-500 text-white" : "",
                    isPending ? "bg-slate-100 text-slate-400" : ""
                  )}>
                    {isComplete ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                  </div>
                  <div className="min-w-0">
                    <p className={cn(
                      "text-[11.5px] font-semibold leading-tight truncate",
                      isActive ? "text-blue-700" : isComplete ? "text-slate-700" : "text-slate-400"
                    )}>{s.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{s.subtitle}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24">{children}</div>
        </main>
      </div>

      {/* Bottom bar */}
      <footer
        className="shrink-0 flex items-center justify-between gap-2 px-3 sm:px-5 py-2.5 sm:h-16 border-t border-slate-100 bg-white"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)" }}
      >
        <button
          onClick={onPrev}
          disabled={current === 1}
          className={cn(
            "flex items-center justify-center gap-2 h-11 px-3 sm:px-5 rounded-xl border border-slate-200 text-[13px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30 shrink-0",
            current === 1 ? "opacity-40 cursor-not-allowed text-slate-400" : "text-slate-700 hover:bg-slate-50"
          )}
        >
          <ChevronLeft className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <button
          onClick={onNext}
          disabled={!canContinue || submitting}
          className={cn(
            "flex items-center justify-center gap-2 h-11 px-4 sm:px-6 rounded-xl text-[13.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40",
            canContinue && !submitting ? "bg-[#2563EB] text-white hover:bg-[#1d4ed8] shadow-sm" : "bg-slate-200 text-slate-400 cursor-not-allowed"
          )}
        >
          {submitting && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
          {isLastStep ? submitLabel : nextLabel}
          {!isLastStep && <ChevronRight className="w-4 h-4 shrink-0" />}
        </button>
      </footer>
    </div>
  )
}
