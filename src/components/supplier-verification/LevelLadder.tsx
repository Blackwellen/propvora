import React from "react"
import { Check, Circle } from "lucide-react"
import { LEVEL_LABELS, LEVEL_DESCRIPTIONS, type SupplierVerificationLevel } from "@/lib/supplier-verification"

/**
 * The L0–L5 verification ladder. Achieved levels are ticked; the current level is
 * highlighted. Labels are the honest, evidence-reviewed wording from levels.ts.
 */
export default function LevelLadder({ level }: { level: SupplierVerificationLevel }) {
  const steps: SupplierVerificationLevel[] = [1, 2, 3, 4, 5]
  return (
    <ol className="space-y-2.5">
      {steps.map((s) => {
        const done = level >= s
        const current = level === s
        return (
          <li key={s} className="flex items-start gap-3">
            <span
              className={
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full " +
                (done ? "bg-[#ECFDF5] text-[#059669]" : "bg-slate-100 text-slate-300")
              }
            >
              {done ? <Check className="h-3 w-3" /> : <Circle className="h-2.5 w-2.5" />}
            </span>
            <div>
              <p
                className={
                  "text-[13px] font-medium " +
                  (done ? "text-slate-800" : "text-slate-500") +
                  (current ? " " : "")
                }
              >
                L{s} · {LEVEL_LABELS[s]}
                {current && (
                  <span className="ml-2 rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[10px] font-semibold text-[#2563EB] align-middle">
                    current
                  </span>
                )}
              </p>
              <p className="text-[11.5px] text-slate-400">{LEVEL_DESCRIPTIONS[s]}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
