import { BedDouble, Bath } from "lucide-react"

interface SleepingArrangementsProps {
  bedroomCount: number
  bedsPerRoom: number
  extraBeds: number
  bathrooms: number
}

export default function SleepingArrangements({
  bedroomCount,
  bedsPerRoom,
  extraBeds,
  bathrooms,
}: SleepingArrangementsProps) {
  if (bedroomCount === 0) return null

  return (
    <section className="py-7 border-b border-slate-200">
      <h2 className="text-[19px] font-bold text-[#0B1B3F] mb-4">Sleeping arrangements</h2>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        {Array.from({ length: bedroomCount }, (_, i) => {
          const isLast = i === bedroomCount - 1
          const beds = bedsPerRoom + (isLast ? extraBeds : 0)
          return (
            <div key={i} className="shrink-0 w-44 rounded-2xl border border-slate-200 p-4">
              <BedDouble className="w-6 h-6 text-slate-400 mb-2" />
              <p className="text-[13px] font-semibold text-[#0B1B3F]">Bedroom {i + 1}</p>
              <p className="text-[12px] text-slate-500 mt-0.5">
                {beds} {beds === 1 ? "bed" : "beds"}
              </p>
            </div>
          )
        })}
        {bathrooms > 0 && (
          <div className="shrink-0 w-44 rounded-2xl border border-slate-200 p-4">
            <Bath className="w-6 h-6 text-slate-400 mb-2" />
            <p className="text-[13px] font-semibold text-[#0B1B3F]">{bathrooms === 1 ? "Bathroom" : `${bathrooms} Bathrooms`}</p>
            <p className="text-[12px] text-slate-500 mt-0.5">Private bathroom{bathrooms === 1 ? "" : "s"}</p>
          </div>
        )}
      </div>
    </section>
  )
}
