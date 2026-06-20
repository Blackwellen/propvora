import { CheckCircle2 } from "lucide-react"
import AmenitiesModal from "@/components/booking/AmenitiesModal"

interface Amenity {
  key: string
  value?: string | null
  group?: string | null
}

interface StayAmenitiesPreviewProps {
  amenities: Amenity[]
  amenityGroups: Record<string, string[]>
  totalAmenities: number
}

export default function StayAmenitiesPreview({
  amenities,
  amenityGroups,
  totalAmenities,
}: StayAmenitiesPreviewProps) {
  if (totalAmenities === 0) return null

  const amenityPreview = amenities.slice(0, 10)

  return (
    <section className="py-7 border-b border-slate-200">
      <h2 className="text-[19px] font-bold text-[#0B1B3F] mb-4">What this place offers</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
        {amenityPreview.map((a, i) => (
          <div key={i} className="flex items-center gap-3 text-[14px] text-slate-700">
            <CheckCircle2 className="w-5 h-5 text-slate-400 shrink-0" />
            <span>{a.value ?? a.key.replace(/_/g, " ")}</span>
          </div>
        ))}
      </div>
      <AmenitiesModal amenityGroups={amenityGroups} totalCount={totalAmenities} />
    </section>
  )
}
