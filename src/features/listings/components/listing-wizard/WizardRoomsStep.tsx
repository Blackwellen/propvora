interface RoomsField {
  label: string
  val: number
  set: (v: number) => void
  min: number
}

interface WizardRoomsStepProps {
  maxGuests: number
  onMaxGuestsChange: (v: number) => void
  bedrooms: number
  onBedroomsChange: (v: number) => void
  beds: number
  onBedsChange: (v: number) => void
  bathrooms: number
  onBathroomsChange: (v: number) => void
}

export function WizardRoomsStep({
  maxGuests,
  onMaxGuestsChange,
  bedrooms,
  onBedroomsChange,
  beds,
  onBedsChange,
  bathrooms,
  onBathroomsChange,
}: WizardRoomsStepProps) {
  const fields: RoomsField[] = [
    { label: "Max guests", val: maxGuests, set: onMaxGuestsChange, min: 1 },
    { label: "Bedrooms", val: bedrooms, set: onBedroomsChange, min: 0 },
    { label: "Beds", val: beds, set: onBedsChange, min: 0 },
    { label: "Bathrooms", val: bathrooms, set: onBathroomsChange, min: 0 },
  ]

  return (
    <div className="grid grid-cols-2 gap-4">
      {fields.map(({ label, val, set, min }) => (
        <div key={label} className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">{label}</label>
          <div className="inline-flex items-center border border-slate-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => set(Math.max(min, val - 1))}
              className="w-9 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-50 text-lg"
            >
              −
            </button>
            <span className="w-12 text-center text-sm font-semibold text-slate-800 select-none">
              {val}
            </span>
            <button
              type="button"
              onClick={() => set(val + 1)}
              className="w-9 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-50 text-lg"
            >
              +
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
