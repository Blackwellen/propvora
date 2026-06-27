"use client"

import React from "react"

export type DigestFrequency = "instant" | "hourly" | "daily" | "weekly"

const FREQUENCY_OPTIONS: { value: DigestFrequency; label: string; description: string }[] = [
  { value: "instant", label: "Instant", description: "Deliver each notification immediately" },
  { value: "hourly", label: "Hourly digest", description: "Bundle notifications into hourly summaries" },
  { value: "daily", label: "Daily digest", description: "Receive a daily morning summary" },
  { value: "weekly", label: "Weekly digest", description: "Receive a weekly summary on Mondays" },
]

export interface DigestFrequencySectionProps {
  frequency: DigestFrequency
  onChange: (frequency: DigestFrequency) => void
}

export function DigestFrequencySection({ frequency, onChange }: DigestFrequencySectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <h3 className="text-[14px] font-bold text-slate-900 mb-1">Email digest frequency</h3>
      <p className="text-[12px] text-slate-400 mb-4">
        How often email notification summaries are sent
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FREQUENCY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`text-left p-4 rounded-xl border-2 transition-all ${
              frequency === opt.value
                ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <p className={`text-[13px] font-semibold ${frequency === opt.value ? "text-[var(--brand)]" : "text-slate-800"}`}>
              {opt.label}
            </p>
            <p className="text-[11.5px] text-slate-400 mt-0.5">{opt.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
