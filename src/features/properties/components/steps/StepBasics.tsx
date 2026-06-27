"use client"

import { Home, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { PROPERTY_TYPE_GROUPS } from "@/lib/constants/propertyTypes"

const STATUSES = [
  { key: "active",     label: "Active" },
  { key: "void",       label: "Void" },
  { key: "off_market", label: "Off Market" },
]

interface StepBasicsData {
  name: string
  propertyType: string
  status: string
}

interface StepBasicsProps {
  data: StepBasicsData
  onChange: (d: Partial<StepBasicsData>) => void
}

export function StepBasics({ data, onChange }: StepBasicsProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Property Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="e.g. Brunswick Road HMO"
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)] transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Property Type <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            value={data.propertyType}
            onChange={(e) => onChange({ propertyType: e.target.value })}
            className="w-full h-10 pl-9 pr-8 rounded-lg border border-[#E2E8F0] bg-white text-slate-900 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)] transition-all"
          >
            <option value="">Select a property type…</option>
            {PROPERTY_TYPE_GROUPS.map((grp) => (
              <optgroup key={grp.group} label={grp.group}>
                {grp.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
        <div className="flex gap-2">
          {STATUSES.map((s) => (
            <button
              key={s.key}
              onClick={() => onChange({ status: s.key })}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-150",
                data.status === s.key
                  ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                  : "border-[#E2E8F0] text-slate-600 hover:border-slate-300"
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
