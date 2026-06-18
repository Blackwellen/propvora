"use client"

import React from "react"
import { ChevronLeft, ChevronRight, Save } from "lucide-react"
import { cn } from "@/lib/utils"

export function ListingWizardFooter({
  onBack,
  onSave,
  onNext,
  backDisabled,
  isLastStep,
  nextLabel,
  isSaving,
}: {
  onBack: () => void
  onSave: () => void
  onNext: () => void
  backDisabled: boolean
  isLastStep: boolean
  nextLabel: string
  isSaving: boolean
}) {
  return (
    <footer className="sticky bottom-0 z-20 flex items-center justify-between gap-2 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onBack}
        disabled={backDisabled}
        className={cn(
          "inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-[13px] font-semibold transition-colors sm:px-4",
          backDisabled
            ? "cursor-not-allowed text-slate-300"
            : "text-slate-700 hover:bg-slate-50",
        )}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Back</span>
      </button>

      <div className="flex items-center gap-2 sm:gap-3">
        <span className="hidden items-center gap-1.5 text-[11px] text-slate-400 sm:flex">
          {isSaving ? (
            <>
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500" />
              Saving…
            </>
          ) : null}
        </span>
        <button
          type="button"
          onClick={onSave}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 sm:px-4"
        >
          <Save className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Save draft</span>
        </button>
        {!isLastStep && (
          <button
            type="button"
            onClick={onNext}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-blue-600 px-4 text-[13px] font-semibold text-white shadow-sm hover:bg-blue-700 sm:px-5"
          >
            <span className="truncate">{nextLabel}</span>
            <ChevronRight className="h-4 w-4 shrink-0" />
          </button>
        )}
      </div>
    </footer>
  )
}
