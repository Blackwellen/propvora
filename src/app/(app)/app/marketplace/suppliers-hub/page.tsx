import type { Metadata } from "next"
import SuppliersHubNav from "@/components/marketplace/SuppliersHubNav"
import PublicSearchBar from "@/components/public-marketplace/PublicSearchBar"
import PublicFilterChips from "@/components/public-marketplace/PublicFilterChips"
import PublicResultsToolbar from "@/components/public-marketplace/PublicResultsToolbar"
import MarketplaceTrustStrip from "@/components/public-marketplace/MarketplaceTrustStrip"
import ProviderCard from "@/components/public-marketplace/cards/ProviderCard"
import ProviderFeaturedCard from "@/components/public-marketplace/cards/ProviderFeaturedCard"
import { getPublicProviders, getFeaturedProviders } from "@/lib/public-marketplace/queries"
import { CheckCircle, Shield, Star } from "lucide-react"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Suppliers · Marketplace · Propvora",
  description: "Search and compare verified suppliers and service providers.",
}

const FILTER_CHIPS = [
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

export default async function SuppliersHubPage() {
  const [providers, featured] = await Promise.all([getPublicProviders(), getFeaturedProviders()])

  return (
    <div>
      <SuppliersHubNav />

      {/* Hero */}
      <section className="bg-gradient-to-b from-violet-50 to-white pt-8 pb-6 px-4 rounded-2xl mb-2">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Find trusted suppliers</h1>
        <p className="text-base text-slate-500 mb-6">Search and compare verified businesses serving your area.</p>
        <PublicSearchBar variant="providers" />
      </section>

      {/* Filters */}
      <div className="bg-white border-b border-slate-100 px-4 py-3">
        <PublicFilterChips chips={FILTER_CHIPS} />
      </div>

      {/* Toolbar */}
      <div className="px-4 py-4">
        <PublicResultsToolbar
          count={1248}
          location="Manchester, within 25 miles"
          mapHref="/app/marketplace/suppliers-hub/map"
          listHref="/app/marketplace/suppliers-hub"
          viewMode="grid"
          showSaveSearch
        />
      </div>

      {/* Featured section */}
      {featured.length > 0 && (
        <section className="pb-6 px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-400 fill-amber-400" /> Featured suppliers
            </h2>
            <button className="text-sm font-semibold text-blue-600 hover:text-blue-700">View all featured →</button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {featured.map((p) => (
              <ProviderFeaturedCard key={p.id} provider={p} basePath="/app/marketplace/suppliers-hub" />
            ))}
          </div>
        </section>
      )}

      {/* Supplier grid */}
      <section className="pb-10 px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {providers.map((p) => (
            <ProviderCard key={p.id} provider={p} basePath="/app/marketplace/suppliers-hub" />
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
