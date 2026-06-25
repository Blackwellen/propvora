"use client"

import { usePropertyDetailCtx } from "../layout"
import { MapTab } from "@/components/portfolio/property-detail/MapTab"

export default function PropertyMapPage() {
  const { prop } = usePropertyDetailCtx()
  if (!prop) return null
  return <MapTab prop={prop} />
}
