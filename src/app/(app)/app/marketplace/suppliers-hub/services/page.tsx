import type { Metadata } from "next"
import SuppliersHubNav from "@/components/marketplace/SuppliersHubNav"
import PublicSearchBar from "@/components/public-marketplace/PublicSearchBar"
import PublicFilterChips from "@/components/public-marketplace/PublicFilterChips"
import PublicResultsToolbar from "@/components/public-marketplace/PublicResultsToolbar"
import MarketplaceTrustStrip from "@/components/public-marketplace/MarketplaceTrustStrip"
import ServiceOfferCard from "@/components/public-marketplace/cards/ServiceOfferCard"
import { getPublicServiceOffers, getFeaturedServiceOffers } from "@/lib/public-marketplace/queries"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Services · Marketplace · Propvora",
  description: "Vetted professionals. Transparent pricing. Quality work, every time.",
}

const FILTER_CHIPS = [
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

const CATEGORIES = [
  { label: "All services", count: 1248, id: "all" },
  { label: "Cleaning",     count: 186,  id: "cleaning" },
  { label: "Plumbing",     count: 142,  id: "plumbing" },
  { label: "Electrical",   count: 128,  id: "electrical" },
  { label: "Heating",      count: 98,   id: "heating" },
  { label: "Gardening",    count: 96,   id: "gardening" },
  { label: "Handyman",     count: 86,   id: "handyman" },
  { label: "Waste Removal",count: 64,   id: "waste" },
]

export default async function ServicesHubPage() {
  const [offers, featured] = await Promise.all([getPublicServiceOffers(), getFeaturedServiceOffers()])

  return (
    <div>
      <SuppliersHubNav />

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

      {/* Filter chips */}
      <div className="bg-white border-b border-slate-100 px-4 py-3">
        <PublicFilterChips chips={FILTER_CHIPS} />
      </div>

      {/* Toolbar */}
      <div className="px-4 py-4">
        <PublicResultsToolbar
          count={1248}
          location="Across Greater Manchester"
          mapHref="/app/marketplace/suppliers-hub/services/map"
          listHref="/app/marketplace/suppliers-hub/services"
          viewMode="grid"
        />
      </div>

      {/* Featured carousel */}
      {featured.length > 0 && (
        <section className="pb-6 px-4">
          <h2 className="text-base font-bold text-slate-900 mb-4">Featured service offers</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {featured.map((offer) => (
              <ServiceOfferCard key={offer.id} offer={offer} featured basePath="/app/marketplace/suppliers-hub/services" />
            ))}
          </div>
        </section>
      )}

      {/* Category tabs */}
      <div className="px-4 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map((cat) => (
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
          <button className="shrink-0 px-4 py-2 rounded-full border text-sm font-medium bg-white text-slate-600 border-slate-200 hover:border-slate-300 whitespace-nowrap">
            More 10+ ›
          </button>
        </div>
      </div>

      {/* Grid */}
      <section className="pb-10 px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {offers.map((offer) => (
            <ServiceOfferCard key={offer.id} offer={offer} basePath="/app/marketplace/suppliers-hub/services" />
          ))}
        </div>
      </section>

      <MarketplaceTrustStrip />
    </div>
  )
}
