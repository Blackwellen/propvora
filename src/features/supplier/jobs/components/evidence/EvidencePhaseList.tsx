"use client"

import { EvidencePhaseCard } from "./EvidencePhaseCard"
import type { EvidenceSlot } from "./EvidencePhaseCard"
import type { EvidencePhase } from "@/features/supplier/jobs/data/completion"

const PHASES: { key: EvidencePhase; label: string }[] = [
  { key: "before", label: "Before" },
  { key: "during", label: "During" },
  { key: "after", label: "After" },
]

export interface EvidencePhaseListProps {
  slots: EvidenceSlot[]
  capturedFiles: Record<string, string>
  onPickSlot: (slotId: string) => void
}

export function EvidencePhaseList({ slots, capturedFiles, onPickSlot }: EvidencePhaseListProps) {
  return (
    <div className="space-y-4 min-w-0">
      {PHASES.map((ph) => {
        const phaseSlots = slots.filter((s) => s.phase === ph.key)
        if (phaseSlots.length === 0) return null
        return (
          <EvidencePhaseCard
            key={ph.key}
            phaseLabel={ph.label}
            slots={phaseSlots}
            capturedFiles={capturedFiles}
            onPickSlot={onPickSlot}
          />
        )
      })}
    </div>
  )
}
