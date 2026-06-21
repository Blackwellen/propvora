import type { Metadata } from "next"
import { Suspense } from "react"
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
  { id: "vetted",        label: "Vetted" },
  { id: "insured",       label: "Fully insured" },
  { id: "commercial",    label: "Commercial" },
  { id: "residential",   label: "Residential" },
  { id: "fast-response", label: "Fast response" },
  { id: "24-7",          label: "24/7 service" },
  { id: "top-rated",     label: "Top rated" },
]

const HUB = "/property-manager/marketplace/suppliers-hub"

export default async function SuppliersHubMapPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams ?? {}
  const providers = await getPublicProviders()

  return (
    <div className="flex flex-col">
      <SuppliersHubNav />

      <div className="px-4 pb-3 bg-white border-b border-slate-100">
        <Suspense>
          <PublicSearchBar variant="providers" />
        </Suspense>
        <div className="mt-3">
          <Suspense>
            <PublicFilterChips chips={FILTER_CHIPS} />
          </Suspense>
        </div>
      </div>

      <div className="px-4 py-3 bg-white border-b border-slate-100">
        <Suspense>
          <PublicResultsToolbar
            count={providers.length}
            location="Your area"
            mapHref={`${HUB}/map`}
            listHref={HUB}
            viewMode="map"
            showSaveSearch
          />
        </Suspense>
      </div>

      <div className="px-4 py-2 bg-white border-b border-slate-100">
        <div className="flex items-center justify-between gap-4">
          <Suspense>
            <MapAreaChips variant="providers" />
          </Suspense>
          <Suspense>
            <MapSearchToggle />
          </Suspense>
        </div>
      </div>

      <div className="flex overflow-hidden" style={{ height: "calc(100vh - 320px)" }}>
        {/* Left rail — scrollable card list */}
        <div className="w-96 shrink-0 overflow-y-auto border-r border-slate-200 p-3 space-y-3">
          {providers.map((p) => (
            <ProviderCard key={p.id} provider={p} basePath={HUB} />
          ))}
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <ProvidersMap providers={providers} basePath={HUB} />

          {/* Result count overlay */}
          <div className="absolute bottom-4 left-4 bg-white rounded-xl shadow-lg px-4 py-2 text-sm text-slate-700 border border-slate-200 pointer-events-none">
            <strong>{providers.length}</strong> suppliers in this area
          </div>

          {/* Coverage legend */}
          <div className="absolute bottom-4 right-4 bg-white rounded-xl shadow-lg p-3 text-xs text-slate-600 space-y-1.5 border border-slate-200 pointer-events-none">
            <p className="font-semibold text-slate-900 mb-1">Map key</p>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-blue-600 rounded" />
              <span>Supplier location</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 border-b border-dashed border-blue-400" />
              <span>Coverage radius</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border-2 border-emerald-500 opacity-70" />
              <span>Vetted supplier</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
