"use client"

import React from "react"
import { InlineEditTextarea } from "@/components/editing"
import { TenancySectionCard } from "./TenancySectionCard"

interface TenancyNotesTabProps {
  notes: string | null | undefined
  onSave: (field: string, value: unknown) => Promise<void>
}

export function TenancyNotesTab({ notes, onSave }: TenancyNotesTabProps) {
  return (
    <div className="mt-4 flex flex-col gap-4">
      <TenancySectionCard className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-slate-800">Tenancy Notes</span>
        </div>
        <InlineEditTextarea
          value={notes ?? ""}
          onSave={(v) => onSave("notes", v)}
          label="Tenancy notes"
          placeholder="Add notes to keep context in one place…"
          displayClassName="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap"
        />
      </TenancySectionCard>
    </div>
  )
}
