import { MapPin } from "lucide-react"

export default function StayMapHero() {
  return (
    <section className="border-b border-[#E2EAF6] bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-7">
        <div className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-soft)] px-3 py-1 text-[12px] font-semibold text-[var(--brand)]">
          <MapPin className="w-3.5 h-3.5" /> Map search
        </div>
        <h1 className="mt-3 text-[24px] sm:text-[28px] font-bold tracking-tight text-[#0B1B3F]">
          Stays on the map
        </h1>
        <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-slate-600">
          Compare stays by area and nightly price. Listings without a plotted location still appear in the list.
        </p>
      </div>
    </section>
  )
}
