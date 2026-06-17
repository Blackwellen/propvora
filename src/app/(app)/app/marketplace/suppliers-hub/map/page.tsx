import type { Metadata } from "next"
import SuppliersHubNav from "@/components/marketplace/SuppliersHubNav"
import PublicSearchBar from "@/components/public-marketplace/PublicSearchBar"
import PublicFilterChips from "@/components/public-marketplace/PublicFilterChips"
import PublicResultsToolbar from "@/components/public-marketplace/PublicResultsToolbar"
import ProviderCard from "@/components/public-marketplace/cards/ProviderCard"
import MapAreaChips from "@/components/public-marketplace/maps/MapAreaChips"
import MapSearchToggle from "@/components/public-marketplace/maps/MapSearchToggle"
import ProvidersMap from "@/components/public-marketplace/maps/ProvidersMap"
import { getPublicProviders } from "@/lib/public-marketplace/queries"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Map view · Suppliers · Propvora",
  description: "Browse suppliers on a map across Greater Manchester.",
}

const FILTER_CHIPS = [
  { id: "vetted",        label: "Vetted",          dropdown: true },
  { id: "insured",       label: "Fully insured" },
  { id: "certified",     label: "Certified" },
  { id: "commercial",    label: "Commercial" },
  { id: "residential",   label: "Residential" },
  { id: "fast-response", label: "Fast response" },
  { id: "24-7",          label: "24/7 service" },
  { id: "top-rated",     label: "Top rated" },
]

export default async function SuppliersHubMapPage() {
  const providers = await getPublicProviders()

  return (
    <div className="flex flex-col">
      <SuppliersHubNav />

      <div className="px-4 pb-3 bg-white border-b border-slate-100">
        <PublicSearchBar variant="providers" />
        <div className="mt-3">
          <PublicFilterChips chips={FILTER_CHIPS} />
        </div>
      </div>

      <div className="px-4 py-3 bg-white border-b border-slate-100">
        <PublicResultsToolbar
          count={248}
          location="Manchester, within 15 miles"
          mapHref="/app/marketplace/suppliers-hub/map"
          listHref="/app/marketplace/suppliers-hub"
          viewMode="map"
          showSaveSearch
        />
      </div>

      <div className="px-4 py-2 bg-white border-b border-slate-100">
        <div className="flex items-center justify-between gap-4">
          <MapAreaChips variant="providers" />
          <MapSearchToggle />
        </div>
      </div>

      <div className="flex overflow-hidden" style={{ height: "calc(100vh - 320px)" }}>
        <div className="w-96 shrink-0 overflow-y-auto border-r border-slate-200 p-3 space-y-3">
          {providers.map((p) => (
            <ProviderCard key={p.id} provider={p} basePath="/app/marketplace/suppliers-hub" />
          ))}
        </div>
        <div className="flex-1 relative">
          <ProvidersMap providers={providers} />
          <div className="absolute bottom-4 left-4 bg-white rounded-xl shadow-lg px-4 py-2 text-sm text-slate-700 border border-slate-200">
            Search area · Manchester, 15 miles · <strong>{providers.length}</strong> suppliers
          </div>
          <div className="absolute bottom-4 right-4 bg-white rounded-xl shadow-lg p-3 text-xs text-slate-600 space-y-1.5 border border-slate-200">
            <p className="font-semibold text-slate-900 mb-1">Coverage key</p>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-blue-600" />
              Exact location
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 border-b border-dashed border-blue-400" />
              Service coverage
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
