import Link from "next/link"
import { Store, ArrowRight, BadgeCheck, ShieldCheck, MapPin, Star } from "lucide-react"

const TRADES = [
  "Plumbing & Heating",
  "Electrical",
  "Gas Safe",
  "Roofing",
  "Painting & Decorating",
  "Cleaning",
  "Locksmith",
  "Pest Control",
]

const TRUST = [
  { icon: BadgeCheck, label: "ID & business verified" },
  { icon: ShieldCheck, label: "Insurance checked" },
  { icon: Star, label: "Real job reviews" },
]

export default function MarketplaceTeaser() {
  return (
    <section className="py-24 relative overflow-hidden" style={{ background: "var(--bg-marketing-dark)" }}>
      {/* Dot overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "28px 28px",
        }}
      />
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-15 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, var(--color-sky-500, #0EA5E9) 0%, transparent 70%)" }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-sky-500/20 text-sky-300 rounded-full px-4 py-1.5 text-sm font-medium mb-6 border border-sky-500/30">
              <Store className="h-3.5 w-3.5" />
              Supplier Marketplace
            </div>
            <h2 className="text-[32px] sm:text-[44px] font-bold text-white mb-5 leading-tight">
              Access verified contractors,{" "}
              <span className="text-sky-400">matched to your patch</span>
            </h2>
            <p className="text-white/70 text-[16px] leading-relaxed mb-8">
              Tap into a growing network of verified tradespeople. Browse by trade and location,
              check insurance and reviews, then invite them straight into a job — without leaving
              Propvora.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-8">
              {TRUST.map((t) => {
                const Icon = t.icon
                return (
                  <div
                    key={t.label}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 text-center"
                  >
                    <Icon className="h-5 w-5 text-sky-400 mx-auto mb-2" />
                    <div className="text-white/70 text-[11px] font-medium leading-snug">
                      {t.label}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/marketplace/suppliers"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[14.5px] transition-colors"
              >
                Browse suppliers
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/suppliers"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 font-semibold text-[14.5px] transition-colors"
              >
                Register as a supplier
              </Link>
            </div>
          </div>

          {/* Right: trade chips grid */}
          <div className="grid grid-cols-2 gap-3">
            {TRADES.map((trade) => (
              <div
                key={trade}
                className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 hover:bg-white/8 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-sky-500/15 flex items-center justify-center flex-shrink-0">
                  <Store className="h-4 w-4 text-sky-300" />
                </div>
                <div className="min-w-0">
                  <div className="text-white text-[13px] font-semibold truncate">{trade}</div>
                  <div className="flex items-center gap-1 text-white/40 text-[10px]">
                    <MapPin className="h-2.5 w-2.5" />
                    Local & verified
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
