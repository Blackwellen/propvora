import { ShieldCheck, Sparkles } from "lucide-react"
import { STAY_TYPE_LABEL } from "@/components/booking/StayListingCard"

interface StayPropertyTypeBarProps {
  accommodationLabel: string | null
  listingType: string
  city: string | null
  maxGuests: number
  bedrooms: number
  beds: number
  bathrooms: number
  bookingMode: string | null
  complianceStatus: string | null
  hostName: string | null
}

export default function StayPropertyTypeBar({
  accommodationLabel,
  listingType,
  city,
  maxGuests,
  bedrooms,
  beds,
  bathrooms,
  bookingMode,
  complianceStatus,
  hostName,
}: StayPropertyTypeBarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-7 border-b border-slate-200">
      <div className="flex-1 min-w-0">
        <h2 className="text-[19px] font-bold text-[#0B1B3F] leading-tight">
          {accommodationLabel ?? STAY_TYPE_LABEL[listingType] ?? "Stay"}
          {city ? ` in ${city}` : ""}
        </h2>
        <p className="mt-1 text-[14px] text-slate-500">
          {maxGuests} guest{maxGuests === 1 ? "" : "s"}
          {bedrooms > 0 && ` · ${bedrooms} bedroom${bedrooms === 1 ? "" : "s"}`}
          {beds > 0 && ` · ${beds} bed${beds === 1 ? "" : "s"}`}
          {bathrooms > 0 && ` · ${bathrooms} bath${bathrooms === 1 ? "" : "s"}`}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {bookingMode === "instant" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11.5px] font-semibold text-amber-700">
              <Sparkles className="w-3 h-3" /> Instant book
            </span>
          )}
          {complianceStatus === "passed" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11.5px] font-semibold text-emerald-700">
              <ShieldCheck className="w-3 h-3" /> Licence verified
            </span>
          )}
        </div>
      </div>
      {/* Host avatar */}
      {hostName && (
        <div className="shrink-0 flex flex-col items-center gap-1">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#2563EB]/20 to-[#1D4ED8]/30 flex items-center justify-center text-[#1D4ED8] font-bold text-[18px] ring-2 ring-white shadow-md">
            {hostName.slice(0, 1).toUpperCase()}
          </div>
        </div>
      )}
    </div>
  )
}
