"use client"

interface StepPhysicalData {
  bedrooms: number
  bathrooms: number
  floorArea: number
  yearBuilt: number
}

interface StepPhysicalProps {
  data: StepPhysicalData
  onChange: (d: Partial<StepPhysicalData>) => void
}

const FIELDS: { key: keyof StepPhysicalData; label: string; min: number; max: number }[] = [
  { key: "bedrooms",  label: "Bedrooms",       min: 1,    max: 50 },
  { key: "bathrooms", label: "Bathrooms",       min: 1,    max: 20 },
  { key: "floorArea", label: "Floor Area (m²)", min: 0,    max: 9999 },
  { key: "yearBuilt", label: "Year Built",      min: 1800, max: new Date().getFullYear() },
]

export function StepPhysical({ data, onChange }: StepPhysicalProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {FIELDS.map((field) => (
        <div key={field.key}>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{field.label}</label>
          <input
            type="number"
            min={field.min}
            max={field.max}
            value={data[field.key]}
            onChange={(e) => onChange({ [field.key]: Number(e.target.value) })}
            className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)] transition-all"
          />
        </div>
      ))}
    </div>
  )
}
