import { Store, CheckCircle2, Star, MapPin, ShieldCheck, BadgeCheck } from "lucide-react"

interface SupplierCard {
  category: string
  name: string
  rating: number
  reviews: number
  location: string
  verified: boolean
  bgColor: string
  iconColor: string
}

const suppliers: SupplierCard[] = [
  {
    category: "Plumbing & Heating",
    name: "AquaFlow Services",
    rating: 4.8,
    reviews: 124,
    location: "Manchester, M1",
    verified: true,
    bgColor: "bg-blue-500/20",
    iconColor: "text-blue-300",
  },
  {
    category: "Electrical",
    name: "SparkElec Ltd",
    rating: 4.9,
    reviews: 88,
    location: "Birmingham, B2",
    verified: true,
    bgColor: "bg-amber-500/20",
    iconColor: "text-amber-300",
  },
  {
    category: "Roofing & Guttering",
    name: "RoofPro Ltd",
    rating: 4.7,
    reviews: 61,
    location: "Leeds, LS1",
    verified: true,
    bgColor: "bg-teal-500/20",
    iconColor: "text-teal-300",
  },
  {
    category: "Painting & Decorating",
    name: "FreshCoat Decs",
    rating: 4.8,
    reviews: 42,
    location: "Bristol, BS1",
    verified: true,
    bgColor: "bg-pink-500/20",
    iconColor: "text-pink-300",
  },
]

const trustIndicators = [
  { icon: BadgeCheck, label: "Verified traders", sub: "ID & business checked" },
  { icon: ShieldCheck, label: "Insurance checked", sub: "Public liability confirmed" },
  { icon: Star, label: "Review verified", sub: "Real job reviews only" },
]

const bullets = [
  "Browse by trade category and location",
  "Verified supplier profiles with reviews",
  "Invite suppliers directly to jobs",
  "Track supplier performance over time",
  "Insurance and certification status visible",
]

export default function SupplierMarketplaceSection() {
  return (
    <section
      id="supplier-marketplace"
      className="py-24 relative overflow-hidden"
      style={{ background: "#06122F" }}
    >
      {/* Dot overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "28px 28px",
        }}
      />
      {/* Bottom glow */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-15 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, #0EA5E9 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left: copy */}
          <div>
            <div className="inline-flex items-center gap-2 bg-sky-500/20 text-sky-300 rounded-full px-4 py-1.5 text-sm font-medium mb-6 border border-sky-500/30">
              <Store className="h-3.5 w-3.5" />
              Supplier Marketplace
            </div>

            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
              Find, verify, and manage{" "}
              <span className="text-sky-400">your trade suppliers</span>
            </h2>

            <p className="text-white/70 text-lg leading-relaxed mb-8">
              Browse a network of verified tradespeople, check their reviews and insurance status, and
              invite them directly to jobs in your Work Hub — all without leaving Propvora.
            </p>

            <ul className="space-y-3 mb-10">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-sky-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white/80">{b}</span>
                </li>
              ))}
            </ul>

            {/* Trust indicators */}
            <div className="grid grid-cols-3 gap-3">
              {trustIndicators.map((ti) => {
                const Icon = ti.icon
                return (
                  <div
                    key={ti.label}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 text-center"
                  >
                    <Icon className="h-5 w-5 text-sky-400 mx-auto mb-2" />
                    <div className="text-white text-xs font-semibold">{ti.label}</div>
                    <div className="text-white/50 text-[10px] mt-0.5">{ti.sub}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right: supplier cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {suppliers.map((s) => (
              <div
                key={s.name}
                className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/8 transition-colors"
              >
                {/* Icon + verified */}
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${s.bgColor} flex items-center justify-center`}>
                    <Store className={`h-5 w-5 ${s.iconColor}`} />
                  </div>
                  {s.verified && (
                    <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                      <BadgeCheck className="h-2.5 w-2.5" />
                      Verified
                    </span>
                  )}
                </div>

                {/* Trade category */}
                <div className="text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-1">
                  {s.category}
                </div>

                {/* Name */}
                <div className="text-sm font-bold text-white mb-2">{s.name}</div>

                {/* Rating */}
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-3 w-3 ${
                          star <= Math.round(s.rating)
                            ? "text-amber-400 fill-amber-400"
                            : "text-white/20"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-white">{s.rating}</span>
                  <span className="text-[10px] text-white/40">({s.reviews} reviews)</span>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1.5 mb-4">
                  <MapPin className="h-3 w-3 text-white/40" />
                  <span className="text-xs text-white/50">{s.location}</span>
                </div>

                {/* CTA */}
                <button className="w-full bg-sky-600/30 hover:bg-sky-600/50 border border-sky-500/30 text-sky-300 text-xs font-semibold py-2 rounded-lg transition-colors">
                  Invite to job
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
