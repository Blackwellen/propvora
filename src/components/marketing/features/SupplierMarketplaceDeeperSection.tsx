import { Store, CheckCircle2, MapPin, BadgeCheck, Package } from "lucide-react"

const bullets = [
  "Zonal matching — suppliers surfaced by trade and coverage area",
  "Verification stack: ID, business, insurance and licence checks",
  "Service packages and clear, quotable scopes of work",
  "Promoted and Verified Plus tiers, always clearly labelled",
  "Performance history and reviews tied to real completed jobs",
]

const pillars = [
  { icon: MapPin, title: "Zonal matching", desc: "Local suppliers matched to each property's area." },
  { icon: BadgeCheck, title: "Verification", desc: "ID, insurance and licence evidence reviewed." },
  { icon: Package, title: "Packages", desc: "Productised services with clear scope and pricing." },
]

export default function SupplierMarketplaceDeeperSection() {
  return (
    <section id="supplier-marketplace-deeper" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div className="lg:sticky lg:top-24">
            <div className="inline-flex items-center gap-2 bg-sky-50 text-sky-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4 border border-sky-200">
              <Store className="h-3.5 w-3.5" />
              Supplier Marketplace
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 leading-tight">
              A verified supplier network,{" "}
              <span className="text-sky-600">matched to your patch</span>
            </h2>
            <p className="text-slate-600 text-lg leading-relaxed mb-6">
              Go beyond a contact list. Propvora&apos;s marketplace matches verified tradespeople to
              your properties by zone, surfaces their insurance and licence status, and lets them
              offer productised service packages you can quote and book in a few clicks.
            </p>
            <ul className="space-y-3">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-sky-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {pillars.map((p) => {
              const Icon = p.icon
              return (
                <div
                  key={p.title}
                  className="bg-slate-50 rounded-2xl border border-slate-200 p-6 text-center"
                >
                  <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-6 w-6 text-sky-600" />
                  </div>
                  <h3 className="text-[15px] font-bold text-slate-900 mb-1.5">{p.title}</h3>
                  <p className="text-[13px] text-slate-500 leading-relaxed">{p.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
