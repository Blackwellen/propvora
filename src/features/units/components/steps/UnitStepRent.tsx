"use client"

import { PoundSterling } from "lucide-react"

interface UnitStepRentData {
  target_rent: number
  notes: string
}

interface UnitStepRentProps {
  data: UnitStepRentData
  onChange: (d: Partial<UnitStepRentData>) => void
}

export function UnitStepRent({ data, onChange }: UnitStepRentProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Target monthly rent (£)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">£</span>
          <input
            type="number"
            min={0}
            placeholder="500"
            value={data.target_rent || ""}
            onChange={(e) => onChange({ target_rent: Number(e.target.value) })}
            className="w-full h-10 pl-7 pr-3 rounded-lg border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] transition-all"
          />
        </div>
      </div>

      {data.target_rent > 0 && (
        <div className="bg-emerald-50 rounded-xl p-4 flex items-center gap-3">
          <PoundSterling className="w-5 h-5 text-emerald-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              Target: £{data.target_rent.toLocaleString()}/mo
            </p>
            <p className="text-xs text-emerald-600">
              £{(data.target_rent * 12).toLocaleString()}/yr · £{(data.target_rent / 4.33).toFixed(0)}/wk
            </p>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes (optional)</label>
        <textarea
          rows={3}
          placeholder="Add any notes about this unit…"
          value={data.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] transition-all resize-none"
        />
      </div>
    </div>
  )
}
