"use client"

import { useEffect, useRef } from "react"
import { MAP_TILE_URL, MAP_TILE_ATTRIBUTION } from "@/lib/maps/tiles"
import type { ServiceZone, LngLat } from "@/lib/supplier/zones"

/* ──────────────────────────────────────────────────────────────────────────
   ZoneEditorMap — an interactive Leaflet canvas for the supplier zone editor.

   Leaflet is a dependency loaded DYNAMICALLY (touches window) so this component
   is imported via next/dynamic({ ssr:false }). It renders every saved zone as
   its shape (radius circle / drawn polygon) in the zone's colour, plus the
   in-progress draft. Two interaction modes:
     - "radius": a single click sets the radius CENTRE (radius km is set in the
       form); the circle previews live.
     - "polygon": each click appends a vertex; double-click closes the ring.
   All edits are reported up via callbacks; the map holds no source-of-truth.
─────────────────────────────────────────────────────────────────────────── */

type Mode = "view" | "radius" | "polygon"

interface Props {
  zones: ServiceZone[]
  mode: Mode
  /** Active draft being placed (colour + current geometry). */
  draftColour: string
  draftRadiusKm: number | null
  draftCentre: { lat: number; lng: number } | null
  draftPolygon: LngLat[]
  highlightId?: string | null
  onSetCentre: (lat: number, lng: number) => void
  onAppendVertex: (lng: number, lat: number) => void
  onClosePolygon: () => void
  className?: string
}

export default function ZoneEditorMap({
  zones,
  mode,
  draftColour,
  draftRadiusKm,
  draftCentre,
  draftPolygon,
  highlightId,
  onSetCentre,
  onAppendVertex,
  onClosePolygon,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layerRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LRef = useRef<any>(null)

  // Keep latest callbacks/state in refs so the map click handler is stable.
  const stateRef = useRef({ mode, onSetCentre, onAppendVertex, onClosePolygon })
  stateRef.current = { mode, onSetCentre, onAppendVertex, onClosePolygon }

  // Init map once.
  useEffect(() => {
    let cancelled = false
    let cleanup = () => {}
    async function init() {
      if (!containerRef.current || mapRef.current) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let L: any
      try {
        L = (await import("leaflet")).default
      } catch {
        return
      }
      if (cancelled || !containerRef.current || mapRef.current) return
      LRef.current = L

      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link")
        link.id = "leaflet-css"
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)
      }

      const map = L.map(containerRef.current, { scrollWheelZoom: true }).setView([54.5, -3], 5)
      mapRef.current = map
      L.tileLayer(MAP_TILE_URL, {
        maxZoom: 19,
        subdomains: "abc",
        attribution: MAP_TILE_ATTRIBUTION,
      }).addTo(map)
      layerRef.current = L.layerGroup().addTo(map)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.on("click", (e: any) => {
        const { mode, onSetCentre, onAppendVertex } = stateRef.current
        if (mode === "radius") onSetCentre(e.latlng.lat, e.latlng.lng)
        else if (mode === "polygon") onAppendVertex(e.latlng.lng, e.latlng.lat)
      })
      map.on("dblclick", () => {
        if (stateRef.current.mode === "polygon") stateRef.current.onClosePolygon()
      })

      cleanup = () => {
        map.remove()
        mapRef.current = null
        layerRef.current = null
      }
    }
    void init()
    return () => {
      cancelled = true
      cleanup()
    }
  }, [])

  // Disable double-click-zoom while drawing a polygon (so dbl-click closes ring).
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (mode === "polygon") map.doubleClickZoom?.disable()
    else map.doubleClickZoom?.enable()
  }, [mode])

  // Redraw all shapes whenever zones / draft change.
  useEffect(() => {
    const L = LRef.current
    const layer = layerRef.current
    if (!L || !layer) return
    layer.clearLayers()
    const allBounds: [number, number][] = []

    for (const z of zones) {
      const dim = highlightId && highlightId !== z.id
      const colour = z.colour || "#2563EB"
      const opacity = dim ? 0.12 : 0.22
      if (z.shape_type === "radius" && z.centre_lat != null && z.centre_lng != null && z.radius_km != null) {
        L.circle([z.centre_lat, z.centre_lng], {
          radius: z.radius_km * 1000,
          color: colour,
          weight: 2,
          fillColor: colour,
          fillOpacity: opacity,
        })
          .bindTooltip(z.name)
          .addTo(layer)
        allBounds.push([z.centre_lat, z.centre_lng])
      } else if (z.shape_type === "polygon" && z.polygon && z.polygon.length >= 3) {
        const latlngs = z.polygon.map(([lng, lat]) => [lat, lng] as [number, number])
        L.polygon(latlngs, { color: colour, weight: 2, fillColor: colour, fillOpacity: opacity })
          .bindTooltip(z.name)
          .addTo(layer)
        allBounds.push(...latlngs)
      }
    }

    // Draft preview.
    if (mode === "radius" && draftCentre) {
      const r = (draftRadiusKm ?? 5) * 1000
      L.circle([draftCentre.lat, draftCentre.lng], {
        radius: r,
        color: draftColour,
        weight: 2,
        dashArray: "6 4",
        fillColor: draftColour,
        fillOpacity: 0.18,
      }).addTo(layer)
      L.circleMarker([draftCentre.lat, draftCentre.lng], { radius: 4, color: draftColour, fillOpacity: 1 }).addTo(layer)
      allBounds.push([draftCentre.lat, draftCentre.lng])
    }
    if (mode === "polygon" && draftPolygon.length > 0) {
      const latlngs = draftPolygon.map(([lng, lat]) => [lat, lng] as [number, number])
      for (const ll of latlngs) {
        L.circleMarker(ll, { radius: 4, color: draftColour, fillOpacity: 1 }).addTo(layer)
        allBounds.push(ll)
      }
      if (latlngs.length >= 2) {
        L.polyline(latlngs, { color: draftColour, weight: 2, dashArray: "6 4" }).addTo(layer)
      }
      if (latlngs.length >= 3) {
        L.polygon(latlngs, { color: draftColour, weight: 1, fillColor: draftColour, fillOpacity: 0.1 }).addTo(layer)
      }
    }

    if (allBounds.length > 1 && mode === "view") {
      try {
        mapRef.current?.fitBounds(allBounds, { padding: [40, 40], maxZoom: 12 })
      } catch {
        /* noop */
      }
    }
  }, [zones, mode, draftColour, draftRadiusKm, draftCentre, draftPolygon, highlightId])

  return (
    <div className={className} style={{ position: "relative" }}>
      <div ref={containerRef} className="w-full h-full rounded-2xl overflow-hidden border border-slate-200" />
      {mode !== "view" && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[500] rounded-full bg-slate-900/90 px-3.5 py-1.5 text-[12px] font-semibold text-white shadow-lg pointer-events-none">
          {mode === "radius"
            ? "Click the map to drop the zone centre"
            : "Click to add points · double-click to close the shape"}
        </div>
      )}
    </div>
  )
}
