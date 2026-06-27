"use client"

interface StepAddressData {
  addressLine1: string
  addressLine2: string
  city: string
  county: string
  postcode: string
}

interface StepAddressProps {
  data: StepAddressData
  onChange: (d: Partial<StepAddressData>) => void
}

const FIELDS: { key: keyof StepAddressData; label: string; placeholder: string; required?: boolean }[] = [
  { key: "addressLine1", label: "Address line 1", placeholder: "12 Brunswick Road", required: true },
  { key: "addressLine2", label: "Address line 2", placeholder: "Flat 3 (optional)" },
  { key: "city",         label: "Town / City",    placeholder: "Nottingham",        required: true },
  { key: "county",       label: "County",         placeholder: "Nottinghamshire" },
  { key: "postcode",     label: "Postcode",        placeholder: "NG1 4EX",           required: true },
]

export function StepAddress({ data, onChange }: StepAddressProps) {
  return (
    <div className="flex flex-col gap-4">
      {FIELDS.map((field) => (
        <div key={field.key}>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            placeholder={field.placeholder}
            value={data[field.key]}
            onChange={(e) => onChange({ [field.key]: e.target.value })}
            className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)] transition-all"
          />
        </div>
      ))}
    </div>
  )
}
