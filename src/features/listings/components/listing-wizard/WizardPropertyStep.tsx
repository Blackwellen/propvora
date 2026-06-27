import { cn } from "@/lib/utils"
import type { BookingMode } from "@/lib/booking/booking-listings"

const inputCls =
  "w-full h-10 px-3 rounded-xl text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"

interface Property {
  id: string
  label: string
  city: string | null
}

interface WizardPropertyStepProps {
  propertyId: string
  onPropertyIdChange: (v: string) => void
  bookingMode: BookingMode
  onBookingModeChange: (v: BookingMode) => void
  properties: Property[]
}

export function WizardPropertyStep({
  propertyId,
  onPropertyIdChange,
  bookingMode,
  onBookingModeChange,
  properties,
}: WizardPropertyStepProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-600">Property</label>
        <select
          value={propertyId}
          onChange={(e) => onPropertyIdChange(e.target.value)}
          className={inputCls}
        >
          <option value="">Skip — link later</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
              {p.city ? ` — ${p.city}` : ""}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-slate-400">
          Linking to a property is required before publishing.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-600">Booking mode</label>
        <div className="flex gap-2">
          {(["instant", "request", "enquiry"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onBookingModeChange(m)}
              className={cn(
                "flex-1 h-10 rounded-xl text-sm font-medium capitalize transition-colors",
                bookingMode === m
                  ? "bg-[var(--brand)] text-white"
                  : "bg-white text-slate-600 border border-slate-200"
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
