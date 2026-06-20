import PublicSearchBar from "@/components/public-marketplace/PublicSearchBar"
import PublicFilterChips from "@/components/public-marketplace/PublicFilterChips"
import PublicResultsToolbar from "@/components/public-marketplace/PublicResultsToolbar"
import MarketplaceTrustStrip from "@/components/public-marketplace/MarketplaceTrustStrip"
import ProviderCard from "@/components/public-marketplace/cards/ProviderCard"
import ProviderFeaturedCard from "@/components/public-marketplace/cards/ProviderFeaturedCard"
import ServiceOfferCard from "@/components/public-marketplace/cards/ServiceOfferCard"
import EmergencyServiceCard from "@/components/public-marketplace/cards/EmergencyServiceCard"
import {
  getPublicProviders,
  getFeaturedProviders,
  getPublicServiceOffers,
  getFeaturedServiceOffers,
  getPublicEmergencyServices,
} from "@/lib/public-marketplace/queries"
import { CheckCircle, Shield, Star, AlertTriangle, Clock, Phone } from "lucide-react"

/* ──────────────────────────────────────────────────────────────────────────
   Unified PM suppliers marketplace — the three tab bodies. Each reuses the
   exact public-marketplace card components (1:1 with the public marketplace)
   and the same `getPublic*` data layer. Card `basePath` keeps the existing
   detail routes (suppliers-hub/[slug], /services/[slug], /emergency/[slug]).
─────────────────────────────────────────────────────────────────────────── */

const HUB = "/app/marketplace/suppliers-hub"

const SUPPLIER_CHIPS = [
  { id: "vetted",        label: "Vetted ✓",      dropdown: true },
  { id: "emergency",     label: "Emergency cover" },
  { id: "insurance",     label: "Insurance" },
  { id: "commercial",    label: "Commercial" },
  { id: "residential",   label: "Residential" },
  { id: "gas-safe",      label: "Gas Safe",       dropdown: true },
  { id: "niceic",        label: "NICEIC" },
  { id: "top-rated",     label: "Top rated" },
  { id: "fast-response", label: "Fast response" },
]

const WHY_PROPVORA = [
  { icon: CheckCircle, title: "All suppliers vetted",   desc: "Every supplier goes through our rigorous DBS, insurance and certification check." },
  { icon: Shield,      title: "Protected payments",     desc: "Escrow-backed payments mean you only pay when work is complete." },
  { icon: Star,        title: "Genuine reviews",        desc: "Reviews from confirmed customers only — no fake ratings." },
]

export async function SuppliersSection() {
  const [providers, featured] = await Promise.all([getPublicProviders(), getFeaturedProviders()])

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-violet-50 to-white pt-8 pb-6 px-4 rounded-2xl mb-2">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Find trusted suppliers</h1>
        <p className="text-base text-slate-500 mb-6">Search and compare verified businesses serving your area.</p>
        <PublicSearchBar variant="providers" />
      </section>

      {/* Filters */}
      <div className="bg-white border-b border-slate-100 px-4 py-3">
        <PublicFilterChips chips={SUPPLIER_CHIPS} />
      </div>

      {/* Toolbar */}
      <div className="px-4 py-4">
        <PublicResultsToolbar
          count={providers.length}
          location="Manchester, within 25 miles"
          mapHref={`${HUB}/map`}
          listHref={`${HUB}?tab=suppliers`}
          viewMode="grid"
          showSaveSearch
        />
      </div>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="pb-6 px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-400 fill-amber-400" /> Featured suppliers
            </h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            {featured.map((p) => (
              <ProviderFeaturedCard key={p.id} provider={p} basePath={HUB} />
            ))}
          </div>
        </section>
      )}

      {/* Grid */}
      <section className="pb-10 px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {providers.map((p) => (
            <ProviderCard key={p.id} provider={p} basePath={HUB} />
          ))}
        </div>
      </section>

      {/* Why verified */}
      <section className="py-8 px-4 bg-slate-50 border-t border-slate-100 rounded-2xl">
        <h2 className="text-lg font-bold text-slate-900 mb-5">Why choose verified suppliers?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {WHY_PROPVORA.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-4 p-4 bg-white rounded-2xl border border-slate-200">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">{title}</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6">
        <MarketplaceTrustStrip />
      </div>
    </div>
  )
}

const SERVICE_CHIPS = [
  { id: "trade",        label: "Trade",        dropdown: true },
  { id: "price",        label: "Price",        dropdown: true },
  { id: "availability", label: "Availability", dropdown: true },
  { id: "verified",     label: "Verified" },
  { id: "urgent",       label: "Urgent" },
  { id: "residential",  label: "Residential" },
  { id: "commercial",   label: "Commercial" },
  { id: "hmo",          label: "HMO" },
  { id: "emergency",    label: "Emergency",    danger: true },
  { id: "top-rated",    label: "Top rated" },
]

const SERVICE_CATEGORIES = [
  { label: "All services", count: 1248, id: "all" },
  { label: "Cleaning",     count: 186,  id: "cleaning" },
  { label: "Plumbing",     count: 142,  id: "plumbing" },
  { label: "Electrical",   count: 128,  id: "electrical" },
  { label: "Heating",      count: 98,   id: "heating" },
  { label: "Gardening",    count: 96,   id: "gardening" },
  { label: "Handyman",     count: 86,   id: "handyman" },
  { label: "Waste Removal",count: 64,   id: "waste" },
]

export async function ServicesSection() {
  const [offers, featured] = await Promise.all([getPublicServiceOffers(), getFeaturedServiceOffers()])
  const SERVICES_BASE = `${HUB}/services`

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-emerald-50 to-white pt-8 pb-6 px-4 rounded-2xl mb-2">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-1">
          Find trusted services for your properties
        </h1>
        <p className="text-base text-slate-500 mb-6">
          Vetted professionals. Transparent pricing. Quality work, every time.
        </p>
        <PublicSearchBar variant="services" />
      </section>

      {/* Filters */}
      <div className="bg-white border-b border-slate-100 px-4 py-3">
        <PublicFilterChips chips={SERVICE_CHIPS} />
      </div>

      {/* Toolbar */}
      <div className="px-4 py-4">
        <PublicResultsToolbar
          count={offers.length}
          location="Across Greater Manchester"
          mapHref={`${SERVICES_BASE}/map`}
          listHref={`${HUB}?tab=services`}
          viewMode="grid"
        />
      </div>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="pb-6 px-4">
          <h2 className="text-base font-bold text-slate-900 mb-4">Featured service offers</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            {featured.map((offer) => (
              <ServiceOfferCard key={offer.id} offer={offer} featured basePath={SERVICES_BASE} />
            ))}
          </div>
        </section>
      )}

      {/* Category tabs */}
      <div className="px-4 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {SERVICE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`shrink-0 px-4 py-2 rounded-full border text-sm font-medium transition-colors whitespace-nowrap ${
                cat.id === "all"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              {cat.label} <span className="opacity-70">({cat.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <section className="pb-10 px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {offers.map((offer) => (
            <ServiceOfferCard key={offer.id} offer={offer} basePath={SERVICES_BASE} />
          ))}
        </div>
      </section>

      <MarketplaceTrustStrip />
    </div>
  )
}

const EMERGENCY_TRUST = [
  { icon: Clock,         title: "30-90 min response",     desc: "Fast dispatch to your location" },
  { icon: Shield,        title: "Police vetted & insured", desc: "DBS checked, fully covered" },
  { icon: AlertTriangle, title: "24/7/365 availability",  desc: "Never closed, always ready" },
  { icon: Phone,         title: "Upfront pricing",        desc: "Quoted before work starts" },
]

export async function EmergencySection() {
  let services: Awaited<ReturnType<typeof getPublicEmergencyServices>> = []
  try {
    services = await getPublicEmergencyServices()
  } catch {
    // graceful empty state
  }
  const EMERGENCY_BASE = `${HUB}/emergency`

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-red-50 to-white pt-8 pb-6 px-4 rounded-2xl mb-6 border border-red-100">
        <div className="inline-flex items-center gap-2 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full mb-3">
          🚨 EMERGENCY CALLOUT — We&apos;re on call and ready to go
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Emergency services</h1>
        <p className="text-base text-slate-500 mb-0">
          24/7 emergency response. Police vetted. Fully insured. Fast dispatch.
        </p>
      </section>

      {/* Trust strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 px-0">
        {EMERGENCY_TRUST.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm"
          >
            <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
              <Icon className="h-4.5 w-4.5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Grid */}
      {services.length > 0 ? (
        <section className="pb-10 px-4">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Available emergency services</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {services.map((service) => (
              <EmergencyServiceCard key={service.id} service={service} basePath={EMERGENCY_BASE} />
            ))}
          </div>
        </section>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertTriangle className="h-12 w-12 text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">No emergency services found</p>
          <p className="text-sm text-slate-400 mt-1">Check back shortly or contact support.</p>
        </div>
      )}
    </div>
  )
}
