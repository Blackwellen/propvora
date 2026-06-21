import { cn } from "@/lib/utils"
import type { ListingType } from "@/lib/booking/booking-listings"

const LISTING_TYPES: { value: ListingType; label: string; desc: string }[] = [
  { value: "entire_home", label: "Entire home", desc: "Guests have the whole place to themselves." },
  { value: "serviced_accommodation", label: "Serviced accommodation", desc: "Hotel-alternative with hospitality services." },
  { value: "private_room", label: "Private room", desc: "Guests have a private room; shared spaces." },
  { value: "hmo_room", label: "HMO room", desc: "Room in a house of multiple occupation." },
  { value: "student_room", label: "Student room", desc: "Room in student accommodation." },
  { value: "unit", label: "Unit", desc: "A self-contained unit in a larger development." },
  { value: "other", label: "Other", desc: "Something else." },
]

interface WizardTypeStepProps {
  value: ListingType
  onChange: (v: ListingType) => void
}

export function WizardTypeStep({ value, onChange }: WizardTypeStepProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
      {LISTING_TYPES.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value)}
          className={cn(
            "text-left p-4 rounded-xl border transition-colors",
            value === t.value
              ? "border-[#2563EB] bg-blue-50/50"
              : "border-slate-200 bg-white hover:bg-slate-50"
          )}
        >
          <p
            className={cn(
              "text-sm font-semibold",
              value === t.value ? "text-[#2563EB]" : "text-slate-800"
            )}
          >
            {t.label}
          </p>
          <p className="text-[12px] text-slate-500 mt-0.5">{t.desc}</p>
        </button>
      ))}
    </div>
  )
}
