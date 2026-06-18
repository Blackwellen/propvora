"use client"

import React from "react"
import { Check, AlertCircle, User, Building2 } from "lucide-react"
import type { WizardState, EntityType } from "./types"
import { CONTACT_TYPE_OPTIONS } from "./constants"

export default function Step1TypeSelector({
  state,
  setState,
  errors,
}: {
  state: WizardState
  setState: React.Dispatch<React.SetStateAction<WizardState>>
  errors: string[]
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Contact Type</h2>
        <p className="text-sm text-slate-500">What kind of contact are you adding?</p>
      </div>

      {errors.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
          <div style={{ color: "#ef4444" }}><AlertCircle className="w-4 h-4" /></div>
          <p className="text-sm text-red-600">{errors[0]}</p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {CONTACT_TYPE_OPTIONS.map(({ value, label, icon: Icon, desc, colour }) => {
          const selected = state.contactType === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => setState((s) => ({ ...s, contactType: value }))}
              className={[
                "flex flex-col items-start gap-2 rounded-xl border-2 p-3 text-left transition",
                selected
                  ? "ring-2 ring-blue-500 border-blue-400 bg-blue-50"
                  : `${colour} hover:opacity-90`,
              ].join(" ")}
            >
              <Icon className="w-5 h-5" />
              <div>
                <p className="text-xs font-semibold leading-tight">{label}</p>
                <p className="text-[10px] leading-snug opacity-70 mt-0.5">{desc}</p>
              </div>
              {selected && (
                <div className="self-end ml-auto mt-auto">
                  <div style={{ color: "#2563EB" }}><Check className="w-3.5 h-3.5" /></div>
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div>
        <p className="text-sm font-medium text-slate-700 mb-2">Entity type</p>
        <div className="flex gap-3">
          {(["person", "organisation"] as EntityType[]).map((et) => (
            <button
              key={et}
              type="button"
              onClick={() => setState((s) => ({ ...s, entityType: et }))}
              className={[
                "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition",
                state.entityType === et
                  ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500"
                  : "border-slate-200 text-slate-600 hover:border-blue-300",
              ].join(" ")}
            >
              {et === "person" ? <User className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
              {et === "person" ? "Person" : "Organisation"}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
