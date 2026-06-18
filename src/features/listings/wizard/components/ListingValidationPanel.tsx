"use client"

// Right-rail completion + validation checklist. Renders the 9 publish checks
// with a completion ring; blocked checks are flagged.
import React from "react"
import { Check, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useListingDraft } from "../data/useListingDraft"
import { ScoreRing } from "./primitives"

export function ListingValidationPanel() {
  const { validation, completionPct } = useListingDraft()
  const done = validation.filter((v) => v.complete).length
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <ScoreRing
          value={completionPct}
          size={56}
          colour={completionPct === 100 ? "#10B981" : "#2563EB"}
        />
        <div>
          <p className="text-[13px] font-bold text-slate-900">
            {done}/{validation.length} complete
          </p>
          <p className="text-[11px] text-slate-500">
            {completionPct === 100 ? "Ready to publish" : "Finish all checks to publish"}
          </p>
        </div>
      </div>
      <ul className="mt-3 space-y-1.5">
        {validation.map((v) => (
          <li key={v.key} className="flex items-start gap-2">
            <span
              className={cn(
                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                v.complete ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600",
              )}
            >
              {v.complete ? <Check className="h-2.5 w-2.5" /> : <AlertCircle className="h-2.5 w-2.5" />}
            </span>
            <span
              className={cn(
                "text-[11.5px] leading-tight",
                v.complete ? "text-slate-600" : "font-medium text-slate-800",
              )}
            >
              {v.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
