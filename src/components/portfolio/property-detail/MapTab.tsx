"use client"

import React from "react"
import nextDynamic from "next/dynamic"
import type { Property } from "@/types/database"
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
        interactive
        enlargeable={false}
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
            href: `/property-manager/portfolio/properties/${prop.id}`,
          },
        ]}
      />
    </Card>
  )
}
