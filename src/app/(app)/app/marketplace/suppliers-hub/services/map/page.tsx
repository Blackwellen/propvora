import type { Metadata } from "next"
import { Suspense } from "react"
import SuppliersHubNav from "@/components/marketplace/SuppliersHubNav"
import PublicSearchBar from "@/components/public-marketplace/PublicSearchBar"
import PublicFilterChips from "@/components/public-marketplace/PublicFilterChips"
import PublicResultsToolbar from "@/components/public-marketplace/PublicResultsToolbar"
import ServiceOfferCard from "@/components/public-marketplace/cards/ServiceOfferCard"
import MapAreaChips from "@/components/public-marketplace/maps/MapAreaChips"
import MapSearchToggle from "@/components/public-marketplace/maps/MapSearchToggle"
import ServicesMap from "@/components/public-marketplace/maps/ServicesMap"
import { getPublicServiceOffers } from "@/lib/public-marketplace/queries"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Map view · Services · Propvora",
  description: "Browse services on a map.",
}

const FILTER_CHIPS = [
  { id: "verified",  label: "Verified only" },
  { id: "urgent",    label: "Urgent" },
  { id: "emergency", label: "Emergency", danger: true },
]

const HUB = "/property-manager/marketplace/suppliers-hub"
const SERVICES_BASE = `${HUB}/services`

export default async function ServicesHubMapPage() {
  const offers = await getPublicServiceOffers()

  return (
    <div className="flex flex-col">
      <SuppliersHubNav />

      <div className="px-4 pb-3 bg-white border-b border-slate-100">
        <Suspense>
          <PublicSearchBar variant="services" />
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
            count={offers.length}
            location="Your area"
            mapHref={`${SERVICES_BASE}/map`}
            listHref={`${HUB}?tab=services`}
            viewMode="map"
            showSaveSearch
          />
        </Suspense>
      </div>

      <div className="px-4 py-2 bg-white border-b border-slate-100">
        <div className="flex items-center justify-between gap-4">
          <Suspense>
            <MapAreaChips variant="services" />
          </Suspense>
          <Suspense>
            <MapSearchToggle />
          </Suspense>
        </div>
      </div>

      <div className="flex overflow-hidden" style={{ height: "calc(100vh - 320px)" }}>
        <div className="w-96 shrink-0 overflow-y-auto border-r border-slate-200 p-3 space-y-3">
          {offers.map((offer) => (
            <ServiceOfferCard key={offer.id} offer={offer} basePath={SERVICES_BASE} />
          ))}
        </div>
        <div className="flex-1 relative">
          <ServicesMap offers={offers} />
          <div className="absolute bottom-4 left-4 bg-white rounded-xl shadow-lg px-4 py-2 text-sm text-slate-700 border border-slate-200 pointer-events-none">
            <strong>{offers.length}</strong> services in this area
          </div>
        </div>
      </div>
    </div>
  )
}
