"use client"

import { CheckCircle2, Camera } from "lucide-react"
import { SupplierCard } from "@/components/supplier-workspace/ui"
import type { EvidencePhase } from "@/features/supplier/jobs/data/completion"

export interface EvidenceSlot {
  id: string
  label: string
  required: boolean
  phase: EvidencePhase
  fileName?: string
}

export interface EvidencePhaseCardProps {
  phaseLabel: string
  slots: EvidenceSlot[]
  capturedFiles: Record<string, string>
  onPickSlot: (slotId: string) => void
}

export function EvidencePhaseCard({ phaseLabel, slots, capturedFiles, onPickSlot }: EvidencePhaseCardProps) {
  const capturedCount = slots.filter((s) => capturedFiles[s.id]).length

  return (
    <SupplierCard className="p-5">
      <h2 className="text-sm font-semibold text-slate-900 mb-3">
        {phaseLabel}{" "}
        <span className="text-slate-400 font-normal">
          ({capturedCount}/{slots.length})
        </span>
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {slots.map((slot) => {
          const captured = capturedFiles[slot.id]
          return (
            <button
              key={slot.id}
              onClick={() => onPickSlot(slot.id)}
              className={`text-left rounded-xl border p-3 transition-all ${
                captured
                  ? "border-emerald-200 bg-emerald-50/40"
                  : "border-dashed border-slate-300 hover:border-[#2563EB]"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${
                  captured ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                }`}
              >
                {captured ? <CheckCircle2 className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
              </div>
              <p className="text-[13px] font-semibold text-slate-800 leading-tight">{slot.label}</p>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                {captured ?? (slot.required ? "Required · tap to upload" : "Optional · tap to upload")}
              </p>
            </button>
          )
        })}
      </div>
    </SupplierCard>
  )
}
