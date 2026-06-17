import type { Metadata } from "next"
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
  description: "Browse services on a map across Greater Manchester.",
}

const FILTER_CHIPS = [
  { id: "response",      label: "Response time",  dropdown: true },
  { id: "price-range",   label: "Price range",    dropdown: true },
  { id: "verified",      label: "Verified only",  dropdown: true },
  { id: "property-type", label: "Property type",  dropdown: true },
  { id: "emergency",     label: "Emergency",      danger: true },
]

export default async function ServicesHubMapPage() {
  const offers = await getPublicServiceOffers()

  return (
    <div className="flex flex-col">
      <SuppliersHubNav />

      <div className="px-4 pb-3 bg-white border-b border-slate-100">
        <PublicSearchBar variant="services" />
        <div className="mt-3">
          <PublicFilterChips chips={FILTER_CHIPS} />
        </div>
      </div>

      <div className="px-4 py-3 bg-white border-b border-slate-100">
        <PublicResultsToolbar
          count={128}
          location="Across Greater Manchester"
          mapHref="/app/marketplace/suppliers-hub/services/map"
          listHref="/app/marketplace/suppliers-hub/services"
          viewMode="map"
          showSaveSearch
        />
      </div>

      <div className="px-4 py-2 bg-white border-b border-slate-100">
        <div className="flex items-center justify-between gap-4">
          <MapAreaChips variant="services" />
          <MapSearchToggle />
        </div>
      </div>

      <div className="flex overflow-hidden" style={{ height: "calc(100vh - 320px)" }}>
        <div className="w-96 shrink-0 overflow-y-auto border-r border-slate-200 p-3 space-y-3">
          {offers.map((offer) => (
            <ServiceOfferCard key={offer.id} offer={offer} basePath="/app/marketplace/suppliers-hub/services" />
          ))}
        </div>
        <div className="flex-1 relative">
          <ServicesMap offers={offers} />
          <div className="absolute bottom-4 left-4 bg-white rounded-xl shadow-lg px-4 py-2 text-sm text-slate-700 border border-slate-200">
            Showing <strong>{offers.length}</strong> services · In this area
          </div>
        </div>
      </div>
    </div>
  )
}
