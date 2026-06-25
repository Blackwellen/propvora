"use client"

import { History, X } from "lucide-react"

// Shown above a wizard's step card when in-progress data was restored from a
// saved draft, so the restore is never silent/confusing. "Start fresh" discards.
export function WizardDraftBanner({ onDiscard }: { onDiscard: () => void }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50">
      <span className="flex items-center gap-2 text-sm text-amber-800">
        <History className="w-4 h-4 flex-shrink-0" />
        Draft restored — we kept your unsaved changes.
      </span>
      <button
        type="button"
        onClick={onDiscard}
        className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-900 underline-offset-2 hover:underline shrink-0"
      >
        <X className="w-3.5 h-3.5" /> Start fresh
      </button>
    </div>
  )
}
