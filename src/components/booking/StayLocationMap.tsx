"use client"

import dynamic from "next/dynamic"
import { MapPin } from "lucide-react"

/* ──────────────────────────────────────────────────────────────────────────
   StayLocationMap — the location panel for the public stay detail page.

   Wraps the shared LocationMap (Leaflet, dynamically loaded, ssr:false). It
   plots the listing's APPROXIMATE area only — coordinates are the property's
   stored lat/lng or a city centroid resolved upstream (never the exact street
   address, which is not exposed on the public surface). When there is no
   mappable location we show an honest empty state.
─────────────────────────────────────────────────────────────────────────── */

const LocationMap = dynamic(() => import("@/components/maps/LocationMap"), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full animate-pulse rounded-2xl bg-slate-100" />,
})

export default function StayLocationMap({
  title,
  place,
  latitude,
  longitude,
}: {
  title: string
  place: string
  latitude: number | null
  longitude: number | null
}) {
  const hasCoords = latitude != null && longitude != null

  return (
    <section>
      <h2 className="mb-3 text-[16px] font-semibold text-[#0B1B3F]">Where you&apos;ll be</h2>
      {hasCoords ? (
        <>
          <LocationMap
            markers={[{ id: "stay", lat: latitude, lng: longitude, label: title, sublabel: place }]}
            height={300}
            zoom={13}
            title={place || title}
            caption="Approximate area — exact address shared after booking"
            className="overflow-hidden rounded-2xl"
          />
          <p className="mt-2 flex items-center gap-1.5 text-[12px] text-slate-500">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            The pin shows the general area. The host shares the exact address once your booking is confirmed.
          </p>
        </>
      ) : (
        <div className="flex h-[180px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#D6E0F0] bg-white text-center">
          <MapPin className="mb-2 h-7 w-7 text-slate-300" />
          <p className="text-[13px] font-medium text-slate-600">{place || "Location shared after booking"}</p>
          <p className="mt-1 text-[12px] text-slate-400">The host shares the exact address once confirmed.</p>
        </div>
      )}
    </section>
  )
}
