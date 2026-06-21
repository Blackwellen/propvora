"use client"

import { ArrowRight } from "lucide-react"
import { SupplierCard } from "@/components/supplier-workspace/ui"
import { humaniseStatus } from "@/components/supplier-workspace/format"

const STAGES = ["assigned", "accepted", "in_progress", "completed"] as const
export type JobStage = (typeof STAGES)[number]

export interface JobLifecycleStepperProps {
  stageIndex: number
}

export function JobLifecycleStepper({ stageIndex }: JobLifecycleStepperProps) {
  return (
    <SupplierCard className="p-4">
      <div className="flex items-center gap-1 overflow-x-auto">
        {STAGES.map((stage, i) => {
          const reached = stageIndex >= i && stageIndex !== -1
          const current = stageIndex === i
          return (
            <div key={stage} className="flex items-center gap-1 shrink-0">
              <div
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${
                  current ? "bg-[#0D1B2A] text-white" : reached ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    current
                      ? "bg-white text-[#0D1B2A]"
                      : reached
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {reached && !current ? "✓" : i + 1}
                </span>
                <span className="text-[12px] font-semibold whitespace-nowrap">{humaniseStatus(stage)}</span>
              </div>
              {i < STAGES.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-slate-300" />}
            </div>
          )
        })}
      </div>
    </SupplierCard>
  )
}

export { STAGES }
