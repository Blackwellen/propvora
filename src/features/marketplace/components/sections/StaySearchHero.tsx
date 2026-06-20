import { ShieldCheck, Star, Zap } from "lucide-react"

const TRUST_BADGES = [
  { icon: ShieldCheck, label: "Licence verified hosts" },
  { icon: Zap, label: "Instant booking available" },
  { icon: Star, label: "Genuine guest reviews" },
]

export default function StaySearchHero() {
  return (
    <section className="border-b border-[#E2EAF6] bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-11">
        <h1 className="text-[28px] sm:text-[36px] font-bold tracking-tight text-[#0B1B3F] leading-tight">
          Find your next stay
        </h1>
        <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-slate-600">
          Book direct with professional property managers — real availability, transparent total pricing and
          verified host identity shown before you pay.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          {TRUST_BADGES.map(({ icon: Icon, label }) => (
            <span key={label} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-600">
              <Icon className="w-4 h-4 text-[#1D4ED8]" />
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
