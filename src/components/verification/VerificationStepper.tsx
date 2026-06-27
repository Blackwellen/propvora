"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { STEPPER_STAGES, type VerificationPhase, phaseMeta } from "./status"

/* ──────────────────────────────────────────────────────────────────────────
   VerificationStepper — the canonical 4-stage progress rail.
   Position is derived strictly from the real phase. Horizontal on desktop,
   vertical on mobile (more legible on narrow screens, all targets ≥44px tall).
─────────────────────────────────────────────────────────────────────────── */

export function VerificationStepper({ phase }: { phase: VerificationPhase }) {
  const active = phaseMeta(phase).stepIndex
  const needsInput = phase === "requires_input"

  return (
    <div>
      {/* Desktop / wide: horizontal */}
      <ol className="hidden sm:flex items-center">
        {STEPPER_STAGES.map((stage, i) => {
          const done = i < active || phase === "verified"
          const current = i === active && phase !== "verified"
          const isLast = i === STEPPER_STAGES.length - 1
          return (
            <li key={stage.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center text-center">
                <span
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 transition-colors",
                    done
                      ? "bg-emerald-500 text-white"
                      : current
                        ? needsInput
                          ? "bg-amber-500 text-white"
                          : "bg-[var(--brand)] text-white"
                        : "bg-slate-100 text-slate-400"
                  )}
                >
                  {done ? <Check className="w-4 h-4" /> : i + 1}
                </span>
                <span
                  className={cn(
                    "mt-2 text-[12.5px] font-semibold",
                    done || current ? "text-slate-800" : "text-slate-400"
                  )}
                >
                  {stage.label}
                </span>
              </div>
              {!isLast && (
                <span
                  className={cn(
                    "h-0.5 flex-1 mx-2 rounded-full -mt-6",
                    i < active ? "bg-emerald-400" : "bg-slate-150 bg-slate-100"
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>

      {/* Mobile: vertical */}
      <ol className="sm:hidden space-y-0">
        {STEPPER_STAGES.map((stage, i) => {
          const done = i < active || phase === "verified"
          const current = i === active && phase !== "verified"
          const isLast = i === STEPPER_STAGES.length - 1
          return (
            <li key={stage.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0",
                    done
                      ? "bg-emerald-500 text-white"
                      : current
                        ? needsInput
                          ? "bg-amber-500 text-white"
                          : "bg-[var(--brand)] text-white"
                        : "bg-slate-100 text-slate-400"
                  )}
                >
                  {done ? <Check className="w-4 h-4" /> : i + 1}
                </span>
                {!isLast && (
                  <span className={cn("w-0.5 flex-1 my-1 min-h-[20px]", i < active ? "bg-emerald-400" : "bg-slate-100")} />
                )}
              </div>
              <div className={cn("pb-4", isLast && "pb-0")}>
                <p className={cn("text-[14px] font-semibold leading-tight", done || current ? "text-slate-800" : "text-slate-400")}>
                  {stage.label}
                </p>
                <p className="text-[12px] text-slate-500 leading-tight mt-0.5">{stage.hint}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
