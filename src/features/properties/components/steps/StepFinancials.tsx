"use client"

interface StepFinancialsData {
  purchasePrice: number
  currentValue: number
  monthlyMortgage: number
  targetRent: number
}

interface StepFinancialsProps {
  data: StepFinancialsData
  onChange: (d: Partial<StepFinancialsData>) => void
}

const FIELDS: { key: keyof StepFinancialsData; label: string; placeholder: string }[] = [
  { key: "purchasePrice",    label: "Purchase Price (£)",        placeholder: "185000" },
  { key: "currentValue",     label: "Current Value (£)",          placeholder: "210000" },
  { key: "monthlyMortgage",  label: "Monthly Mortgage (£)",       placeholder: "750" },
  { key: "targetRent",       label: "Target Monthly Rent (£)",    placeholder: "2800" },
]

export function StepFinancials({ data, onChange }: StepFinancialsProps) {
  return (
    <div className="flex flex-col gap-4">
      {FIELDS.map((field) => (
        <div key={field.key}>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{field.label}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">£</span>
            <input
              type="number"
              min={0}
              placeholder={field.placeholder}
              value={data[field.key] || ""}
              onChange={(e) => onChange({ [field.key]: Number(e.target.value) })}
              className="w-full h-10 pl-7 pr-3 rounded-lg border border-[#E2E8F0] text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
            />
          </div>
        </div>
      ))}
    </div>
  )
}
