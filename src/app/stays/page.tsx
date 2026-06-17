import type { Metadata } from "next"
import Link from "next/link"
import PublicNav from "@/components/marketing/PublicNav"
import PublicFooter from "@/components/marketing/PublicFooter"
import { Search, MapPin, Star, Shield, Zap } from "lucide-react"

export const metadata: Metadata = {
  title: "Stays | Propvora — Book quality short-lets & serviced accommodation",
  description:
    "Browse and book verified short-let properties, serviced apartments and holiday lets powered by Propvora.",
  openGraph: {
    title: "Stays | Propvora",
    description: "Browse and book verified short-let properties and serviced accommodation.",
    type: "website",
  },
}

const CATEGORIES = [
  { label: "City apartments", icon: "🏙️" },
  { label: "Serviced suites", icon: "🛎️" },
  { label: "Houses", icon: "🏠" },
  { label: "Cottages", icon: "🌿" },
  { label: "Studios", icon: "🪴" },
  { label: "Penthouses", icon: "🌆" },
  { label: "Waterfront", icon: "🌊" },
  { label: "Rural retreats", icon: "🌳" },
]

const TRUST = [
  { icon: Shield, label: "Verified properties", desc: "Every listing is operator-verified before going live." },
  { icon: Star, label: "Genuine reviews", desc: "Reviews only from confirmed guests — no fakes." },
  { icon: Zap, label: "Instant booking", desc: "Confirm immediately or request-to-book, your choice." },
]

export default function StaysPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight mb-4">
            Find your perfect stay
          </h1>
          <p className="text-lg text-slate-500 mb-10 max-w-xl mx-auto">
            Short-lets, serviced apartments and holiday lets — all managed by verified property operators.
          </p>

          {/* Search bar */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-2 flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200">
              <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Where are you going?"
                className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none"
              />
            </div>
            <Link
              href="/marketplace"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <Search className="h-4 w-4" />
              Search
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Browse by type</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.label}
                href={`/marketplace?type=${encodeURIComponent(cat.label)}`}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-center group"
              >
                <span className="text-3xl">{cat.icon}</span>
                <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust signals */}
      <section className="py-12 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-slate-900 mb-8 text-center">Why book through Propvora?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {TRUST.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{label}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Ready to explore?</h2>
          <p className="text-slate-500 mb-8">Browse thousands of verified stays across the UK.</p>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
          >
            Browse all stays
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
