"use client"

import React from "react"
import { Mail, Phone } from "lucide-react"
import type { WizardState } from "./types"
import { STEP_TIPS } from "./types"
import { CONTACT_TYPE_OPTIONS } from "./constants"

export default function SummaryRail({
  state,
  currentStep,
}: {
  state: WizardState
  currentStep: number
}) {
  const typeOption = CONTACT_TYPE_OPTIONS.find((c) => c.value === state.contactType)
  const displayName =
    state.entityType === "organisation"
      ? state.organisationName
      : [state.firstName, state.lastName].filter(Boolean).join(" ")

  return (
    <div className="w-full xl:w-[280px] flex-shrink-0 xl:sticky xl:top-[60px] self-start space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Contact Summary</p>
        </div>
        <div className="px-4 py-3 space-y-3">
          {typeOption ? (
            <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${typeOption.colour}`}>
              <typeOption.icon className="w-3 h-3" />
              {typeOption.label}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No type selected</p>
          )}

          {displayName ? (
            <p className="text-sm font-semibold text-slate-800">{displayName}</p>
          ) : (
            <p className="text-xs text-slate-300 italic">Name will appear here</p>
          )}

          {state.email && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Mail className="w-3 h-3" />
              <span className="truncate">{state.email}</span>
            </div>
          )}

          {state.phone && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Phone className="w-3 h-3" />
              {state.phone}
            </div>
          )}

          {state.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {state.tags.map((t) => (
                <span key={t.id} className="rounded-full bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5">
                  {t.label}
                </span>
              ))}
            </div>
          )}

          {state.entityType === "organisation" && state.primaryContactName && (
            <p className="text-xs text-slate-400">Contact: {state.primaryContactName}</p>
          )}

          {state.contactType === "supplier" && state.supplierServices.length > 0 && (
            <p className="text-xs text-slate-400">
              Services: {state.supplierServices.slice(0, 3).join(", ")}
              {state.supplierServices.length > 3 && ` +${state.supplierServices.length - 3} more`}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 space-y-1">
        <p className="text-xs font-semibold text-blue-700">Tip</p>
        <p className="text-xs text-blue-600 leading-relaxed">{STEP_TIPS[currentStep]}</p>
      </div>
    </div>
  )
}
