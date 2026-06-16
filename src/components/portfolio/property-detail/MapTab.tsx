"use client"

import React from "react"
import nextDynamic from "next/dynamic"
import type { Property } from "@/types/database"
import { MapPin } from "lucide-react"
import { Card } from "./shared"

const LocationMap = nextDynamic(() => import("@/components/maps/LocationMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full rounded-2xl bg-slate-100 animate-pulse" />,
})

export function MapTab({ prop }: { prop: Property }) {
  return (
    <Card className="p-3 sm:p-4">
      <LocationMap
        height={560}
        zoom={16}
        title={prop.name}
        caption={[prop.address_line1, prop.city, prop.postcode].filter(Boolean).join(", ") || undefined}
        markers={[
          {
            id: prop.id,
            lat: prop.latitude,
            lng: prop.longitude,
            address: [prop.address_line1, prop.address_line2, prop.city, prop.postcode]
              .filter(Boolean)
              .join(", ") || null,
            label: prop.name,
            sublabel: [prop.city, prop.postcode].filter(Boolean).join(" ") || undefined,
            href: `/app/portfolio/properties/${prop.id}`,
          },
        ]}
      />
      {(prop.address_line1 || (Number.isFinite(prop.latitude) && Number.isFinite(prop.longitude))) && (
        <div className="flex items-center justify-end px-1 pt-3">
          <a
            href={
              Number.isFinite(prop.latitude) && Number.isFinite(prop.longitude)
                ? `https://www.openstreetmap.org/?mlat=${prop.latitude}&mlon=${prop.longitude}#map=17/${prop.latitude}/${prop.longitude}`
                : `https://www.openstreetmap.org/search?query=${encodeURIComponent([prop.address_line1, prop.city, prop.postcode].filter(Boolean).join(", "))}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[12.5px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            <MapPin size={14} /> Open in OpenStreetMap
          </a>
        </div>
      )}
    </Card>
  )
}
