import { Building2, Globe2, ShieldCheck, Star } from "lucide-react"

const SIGNALS = [
  { icon: Building2, label: "Built for every operating model" },
  { icon: Globe2, label: "Multi-currency & multi-language ready" },
  { icon: ShieldCheck, label: "GDPR compliant · ICO registered" },
  { icon: Star, label: "Designed with property operators" },
]

/**
 * Social proof strip. Deliberately avoids fabricated logos or invented customer
 * counts — uses honest, verifiable trust signals only.
 */
export default function SocialProofBar() {
  return (
    <section className="bg-slate-50 border-y border-slate-200 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-[12px] font-semibold text-slate-400 uppercase tracking-wide mb-6">
          Trusted by property operators across the UK and beyond
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {SIGNALS.map((s) => {
            const Icon = s.icon
            return (
              <div
                key={s.label}
                className="flex items-center gap-3 justify-center rounded-xl border border-slate-200 bg-white px-4 py-3"
              >
                <Icon className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <span className="text-[13px] font-medium text-slate-600 leading-snug">
                  {s.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
