import type { ReactNode } from "react"
import { BedDouble, Bath, Ruler } from "lucide-react"

interface Props {
  bedrooms: number | null | undefined
  bathrooms: number | null | undefined
  floorAreaSqm: number | null | undefined
}

function Fact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 text-slate-500">
        {icon}
      </span>
      <div>
        <span className="block text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
        <span className="block text-[14px] font-bold text-slate-800">{value}</span>
      </div>
    </div>
  )
}

/**
 * Stay facts panel (bedrooms / bathrooms / floor area).
 * Returns null if there is nothing to display.
 */
export default function StayAmenitiesSection({ bedrooms, bathrooms, floorAreaSqm }: Props) {
  if (bedrooms == null && bathrooms == null && floorAreaSqm == null) return null
  return (
    <div className="flex flex-wrap gap-5 rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
      {bedrooms != null && (
        <Fact icon={<BedDouble className="w-4 h-4" />} label="Bedrooms" value={String(bedrooms)} />
      )}
      {bathrooms != null && (
        <Fact icon={<Bath className="w-4 h-4" />} label="Bathrooms" value={String(bathrooms)} />
      )}
      {floorAreaSqm != null && (
        <Fact
          icon={<Ruler className="w-4 h-4" />}
          label="Floor area"
          value={`${floorAreaSqm} m²`}
        />
      )}
    </div>
  )
}
