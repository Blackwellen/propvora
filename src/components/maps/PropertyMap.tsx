"use client"

import dynamic from "next/dynamic"
import type { PropertyMapItem } from "./PropertyMapInner"

// Leaflet is incompatible with SSR -- load only on the client
const PropertyMapInner = dynamic(() => import("./PropertyMapInner"), {
  ssr: false,
  loading: () => (
    <div
      className="w-full flex items-center justify-center bg-slate-100 rounded-xl border border-slate-200"
      style={{ minHeight: "400px" }}
    >
      <p className="text-sm text-slate-400">Loading map...</p>
    </div>
  ),
})

export type { PropertyMapItem }

interface PropertyMapProps {
  properties: PropertyMapItem[]
}

export default function PropertyMap({ properties }: PropertyMapProps) {
  return (
    <div className="w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm" style={{ minHeight: "400px" }}>
      <PropertyMapInner properties={properties} />
    </div>
  )
}
