import { MapPin, ShieldCheck, Star, Share2, Heart } from "lucide-react"

interface StayTitleRowProps {
  title: string
  rating: number | null
  reviewCount: number | null
  complianceStatus: string | null
  place: string
}

export default function StayTitleRow({
  title,
  rating,
  reviewCount,
  complianceStatus,
  place,
}: StayTitleRowProps) {
  return (
    <div className="mb-4">
      <h1 className="text-[22px] sm:text-[28px] font-bold tracking-tight text-[#0B1B3F] leading-tight">{title}</h1>
      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
        {/* Left: rating + place + badges */}
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-slate-600">
          {rating != null && rating > 0 && (
            <span className="inline-flex items-center gap-1 font-semibold text-[#0B1B3F]">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {rating.toFixed(1)}
              {reviewCount != null && reviewCount > 0 && (
                <span className="font-normal text-slate-500 underline underline-offset-2 cursor-pointer">
                  ({reviewCount} review{reviewCount === 1 ? "" : "s"})
                </span>
              )}
              <span className="text-slate-300 mx-0.5">·</span>
            </span>
          )}
          {complianceStatus === "passed" && (
            <>
              <span className="inline-flex items-center gap-1 font-semibold text-[#0B1B3F]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Licence verified
              </span>
              <span className="text-slate-300 mx-0.5">·</span>
            </>
          )}
          {place && (
            <span className="flex items-center gap-1 text-slate-500 underline underline-offset-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {place}
            </span>
          )}
        </div>
        {/* Right: share + save */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[13px] font-semibold text-[#0B1B3F] hover:bg-slate-100 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[13px] font-semibold text-[#0B1B3F] hover:bg-slate-100 transition-colors"
          >
            <Heart className="w-3.5 h-3.5" /> Save
          </button>
        </div>
      </div>
    </div>
  )
}
