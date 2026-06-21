import { Bath, BedDouble, Calendar, MapPin, Maximize, ShieldCheck, Sofa } from "lucide-react"
import type { LetProperty } from "../../../data/lets"

function Spec({ icon: Icon, label }: { icon: typeof BedDouble; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12.5px] text-slate-700">
      <Icon className="w-4 h-4 text-slate-400" /> {label}
    </span>
  )
}

export default function LetInfoSection({ p }: { p: LetProperty }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900">{p.title}</h1>
          <p className="text-[13px] text-slate-500 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-slate-400" /> {p.location}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-600 bg-emerald-50 rounded-full px-3 py-1.5">
          <ShieldCheck className="w-4 h-4" /> Verified landlord
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-100">
        <Spec icon={BedDouble} label={`${p.beds} bedrooms`} />
        <Spec icon={Bath} label={`${p.baths} bathrooms`} />
        <Spec icon={Maximize} label="78 m²" />
        <Spec icon={Sofa} label={p.furnished ? "Furnished" : "Unfurnished"} />
        <Spec icon={Calendar} label={p.available} />
      </div>
    </div>
  )
}
