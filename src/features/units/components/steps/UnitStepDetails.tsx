"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const UNIT_TYPES = [
  { key: "room",     label: "Room" },
  { key: "en_suite", label: "En-suite" },
  { key: "studio",   label: "Studio" },
  { key: "flat",     label: "Flat / Apartment" },
  { key: "suite",    label: "Suite" },
  { key: "office",   label: "Office" },
  { key: "other",    label: "Other" },
]

const STATUSES = [
  { key: "vacant",      label: "Vacant" },
  { key: "reserved",    label: "Reserved" },
  { key: "under_works", label: "Under Works" },
]

interface UnitStepDetailsData {
  unit_name: string
  unit_type: string
  floor: number
  bedrooms: number
  bathrooms: number
  floor_area_sqm: number
  status: string
}

interface UnitStepDetailsProps {
  data: UnitStepDetailsData
  onChange: (d: Partial<UnitStepDetailsData>) => void
}

const NUMBER_FIELDS: { key: keyof UnitStepDetailsData; label: string; min: number; max: number }[] = [
  { key: "bedrooms",      label: "Bedrooms",        min: 1,  max: 20 },
  { key: "bathrooms",     label: "Bathrooms",        min: 1,  max: 10 },
  { key: "floor",         label: "Floor",            min: -2, max: 50 },
  { key: "floor_area_sqm", label: "Floor area (m²)", min: 0,  max: 9999 },
]

export function UnitStepDetails({ data, onChange }: UnitStepDetailsProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Unit / Room name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="e.g. Room 1, Studio A, Flat 2"
          value={data.unit_name}
          onChange={(e) => onChange({ unit_name: e.target.value })}
          className="w-full h-10 px-3 rounded-lg border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Unit type <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {UNIT_TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => onChange({ unit_type: t.key })}
              className={cn(
                "px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left",
                data.unit_type === t.key
                  ? "border-[#2563EB] bg-blue-50 text-[#2563EB]"
                  : "border-slate-200 text-slate-700 hover:border-slate-300",
              )}
            >
              {data.unit_type === t.key && <Check className="w-3 h-3 inline mr-1" />}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {NUMBER_FIELDS.map((f) => (
          <div key={f.key}>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{f.label}</label>
            <input
              type="number"
              min={f.min}
              max={f.max}
              value={data[f.key] as number}
              onChange={(e) => onChange({ [f.key]: Number(e.target.value) })}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition-all"
            />
          </div>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Initial status</label>
        <div className="flex gap-2">
          {STATUSES.map((s) => (
            <button
              key={s.key}
              onClick={() => onChange({ status: s.key })}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium border transition-all",
                data.status === s.key
                  ? "border-[#2563EB] bg-blue-50 text-[#2563EB]"
                  : "border-slate-200 text-slate-600 hover:border-slate-300",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
