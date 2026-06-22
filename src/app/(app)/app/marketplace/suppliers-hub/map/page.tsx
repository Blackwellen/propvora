import type { Metadata } from "next"
import { Suspense } from "react"
import SuppliersHubNav from "@/components/marketplace/SuppliersHubNav"
import PublicSearchBar from "@/components/public-marketplace/PublicSearchBar"
import PublicFilterChips from "@/components/public-marketplace/PublicFilterChips"
import PublicResultsToolbar from "@/components/public-marketplace/PublicResultsToolbar"
import ProviderMapCard from "@/components/public-marketplace/cards/ProviderMapCard"
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
  const allProviders = await getPublicProviders()

  // Data-driven area chips — distinct cities present in the data, most common first.
  const areaCounts = new Map<string, number>()
  for (const p of allProviders) {
    const city = (p.city || "").trim()
    if (city) areaCounts.set(city, (areaCounts.get(city) ?? 0) + 1)
  }
  const areas = Array.from(areaCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([city]) => city)

  // Filter by the active area (?where=) so the chips actually drive the results.
  const where = (typeof params.where === "string" ? params.where : "").toLowerCase().trim()
  const providers = where
    ? allProviders.filter(
        (p) =>
          p.city.toLowerCase().includes(where) ||
          p.location.toLowerCase().includes(where),
      )
    : allProviders

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
            <MapAreaChips areas={areas} />
          </Suspense>
          <Suspense>
            <MapSearchToggle />
          </Suspense>
        </div>
      </div>

      <div className="flex overflow-hidden" style={{ height: "calc(100vh - 320px)" }}>
        {/* Left rail — scrollable card list */}
        <div className="flex w-[380px] shrink-0 flex-col border-r border-slate-200 bg-slate-50/60">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5">
            <p className="text-[13px] font-semibold text-slate-900">
              {providers.length} supplier{providers.length !== 1 ? "s" : ""} in this area
            </p>
            <span className="text-[12px] text-slate-400">Sorted by relevance</span>
          </div>
          <div className="flex-1 space-y-2.5 overflow-y-auto p-3">
            {providers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-sm font-semibold text-slate-600">No suppliers in view</p>
                <p className="mt-1 text-xs text-slate-400">Zoom out or move the map to see more.</p>
              </div>
            ) : (
              providers.map((p) => (
                <ProviderMapCard key={p.id} provider={p} basePath={HUB} />
              ))
            )}
          </div>
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
