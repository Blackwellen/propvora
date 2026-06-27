"use client"

import React from "react"
import { Check } from "lucide-react"
import { STEP_NAMES } from "./types"

export default function StepperRail({
  currentStep,
  completedSteps,
}: {
  currentStep: number
  completedSteps: Set<number>
}) {
  return (
    <div className="w-full xl:w-[240px] flex-shrink-0 xl:sticky xl:top-[60px] self-start">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm px-4 py-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Steps</p>
        <ol className="space-y-0">
          {STEP_NAMES.map((name, i) => {
            const stepNum = i + 1
            const isActive = stepNum === currentStep
            const isDone = completedSteps.has(stepNum)

            return (
              <li key={stepNum} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={[
                      "w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0",
                      isDone
                        ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                        : isActive
                        ? "border-[var(--brand)] bg-white text-[var(--brand)]"
                        : "border-slate-200 bg-slate-50 text-slate-400",
                    ].join(" ")}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5" /> : stepNum}
                  </div>
                  {i < STEP_NAMES.length - 1 && (
                    <div
                      className={["w-px flex-1 my-1", isDone ? "bg-[var(--color-brand-300)]" : "bg-slate-200"].join(" ")}
                      style={{ minHeight: 20 }}
                    />
                  )}
                </div>
                <div className="pb-4">
                  <p
                    className={[
                      "text-sm leading-tight mt-1",
                      isActive
                        ? "font-semibold text-[var(--brand)]"
                        : isDone
                        ? "font-medium text-slate-700"
                        : "text-slate-400",
                    ].join(" ")}
                  >
                    {name}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
