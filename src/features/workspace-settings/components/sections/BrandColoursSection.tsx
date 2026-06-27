"use client"

import React from "react"
import { Loader2, Check } from "lucide-react"

export interface BrandColours {
  primary: string
  secondary: string
  accent: string
  background: string
}

const COLOUR_ROWS: { key: keyof BrandColours; label: string; hint: string }[] = [
  { key: "primary", label: "Primary colour", hint: "Main brand colour used for buttons and highlights" },
  { key: "secondary", label: "Secondary colour", hint: "Used for hover states and secondary actions" },
  { key: "accent", label: "Accent colour", hint: "Used for badges, tags and highlight elements" },
  { key: "background", label: "Background colour", hint: "Page and panel background colour" },
]

export interface BrandColoursSectionProps {
  colours: BrandColours
  saving: boolean
  saved: boolean
  saveError: string | null
  onChange: (key: keyof BrandColours, value: string) => void
  onSave: () => void
  onReset: () => void
}

export function BrandColoursSection({
  colours,
  saving,
  saved,
  saveError,
  onChange,
  onSave,
  onReset,
}: BrandColoursSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
      <h3 className="text-[14px] font-bold text-slate-900 mb-1">Brand Colours</h3>
      <p className="text-[12px] text-slate-500 mb-4">Set the colours used throughout your workspace</p>
      <div>
        {COLOUR_ROWS.map((row) => (
          <div key={row.key} className="flex items-center gap-4 py-3.5 border-b border-slate-100 last:border-0">
            <input
              type="color"
              value={colours[row.key]}
              onChange={(e) => onChange(row.key, e.target.value)}
              className="w-10 h-10 rounded-xl cursor-pointer border-2 border-slate-200 p-0.5 shrink-0"
              aria-label={row.label}
            />
            <div className="flex-1">
              <p className="text-[13px] font-medium text-slate-800">{row.label}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{row.hint}</p>
            </div>
            <span className="text-[12px] font-mono text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
              {colours[row.key].toUpperCase()}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--brand)] text-white text-[13px] font-semibold hover:bg-[var(--brand-strong)] transition-colors disabled:opacity-70"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
          {saving ? "Saving…" : saved ? "Saved" : "Save branding"}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="px-5 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Reset to defaults
        </button>
      </div>
      {saveError && <p className="text-[12px] text-amber-600 mt-3">{saveError}</p>}
    </div>
  )
}
