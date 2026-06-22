"use client"

import { useEffect, useRef } from "react"
import { MAP_TILE_URL, MAP_TILE_ATTRIBUTION } from "@/lib/maps/tiles"
import type { PublicListing } from "@/lib/marketplace/search"
import { formatPence } from "@/components/marketplace/PriceTag"
import { publicListingHref } from "./intent"

/* ──────────────────────────────────────────────────────────────────────────
   MarketplaceMap — the premium split-view Leaflet map for the public
   marketplace (stays AND suppliers). Leaflet is loaded DYNAMICALLY (window) so
   this is imported via next/dynamic({ssr:false}).

   Features (parity with the /stay map): price-pill markers, hover-sync with the
   list, light clustering at low zoom, and "search as I move the map" (debounced
   bounds emit). Listings without coordinates aren't plotted; the list rail
   still shows them, so nothing is hidden.
─────────────────────────────────────────────────────────────────────────── */

export default function MarketplaceMap({
  listings,
  activeId,
  onHoverId,
  onBoundsChange,
  className,
}: {
  listings: PublicListing[]
  activeId?: string | null
  onHoverId?: (id: string | null) => void
  onBoundsChange?: (bounds: [number, number, number, number]) => void
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layerRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Map<string, any>>(new Map())
  const cbRef = useRef({ onBoundsChange, onHoverId })
  cbRef.current = { onBoundsChange, onHoverId }

  const points = listings.filter((l) => l.latitude != null && l.longitude != null)

  function pinHtml(l: PublicListing, active: boolean): string {
    const label = l.basePricePence != null ? formatPence(l.basePricePence, l.currency) : "View"
    const bg = active ? "#0B1B3F" : "#ffffff"
    const fg = active ? "#ffffff" : "#0f172a"
    const scale = active ? "transform:scale(1.08);" : ""
    return `<a href="${publicListingHref({ id: l.id, transactionType: l.transactionType })}" data-id="${l.id}" style="display:inline-block;background:${bg};color:${fg};border:1px solid rgba(15,23,42,.14);border-radius:9999px;padding:5px 11px;font:700 12.5px system-ui;box-shadow:0 3px 10px rgba(0,0,0,.2);white-space:nowrap;text-decoration:none;${scale}transition:transform .12s">${label}</a>`
  }

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
      const map = L.map(containerRef.current, { scrollWheelZoom: false, attributionControl: true }).setView([54.5, -3], 5)
      mapRef.current = map
      L.tileLayer(MAP_TILE_URL, {
        maxZoom: 19,
        subdomains: "abc",
        attribution: MAP_TILE_ATTRIBUTION,
      }).addTo(map)
      layerRef.current = L.layerGroup().addTo(map)

      let t: ReturnType<typeof setTimeout> | null = null
      map.on("moveend", () => {
        if (!cbRef.current.onBoundsChange) return
        if (t) clearTimeout(t)
        t = setTimeout(() => {
          const b = map.getBounds()
          cbRef.current.onBoundsChange?.([b.getSouth(), b.getWest(), b.getNorth(), b.getEast()])
        }, 400)
      })

      cleanup = () => {
        map.remove()
        mapRef.current = null
        layerRef.current = null
        markersRef.current.clear()
      }
    }
    void init()
    return () => {
      cancelled = true
      cleanup()
    }
  }, [])

  useEffect(() => {
    const L = LRef.current
    const map = mapRef.current
    const layer = layerRef.current
    if (!L || !map || !layer) return

    function addMarker(l: PublicListing) {
      const icon = L.divIcon({ className: "", html: pinHtml(l, l.id === activeId), iconSize: [0, 0], iconAnchor: [0, 0] })
      const marker = L.marker([l.latitude as number, l.longitude as number], { icon }).addTo(layer)
      marker.on("mouseover", () => cbRef.current.onHoverId?.(l.id))
      marker.on("mouseout", () => cbRef.current.onHoverId?.(null))
      markersRef.current.set(l.id, marker)
    }

    function render() {
      layer.clearLayers()
      markersRef.current.clear()
      const zoom = map.getZoom()
      const cluster = zoom < 8 && points.length > 12
      if (cluster) {
        const cell = zoom < 6 ? 1.5 : 0.6
        const buckets = new Map<string, PublicListing[]>()
        for (const l of points) {
          const key = `${Math.floor((l.latitude as number) / cell)}:${Math.floor((l.longitude as number) / cell)}`
          const arr = buckets.get(key) ?? []
          arr.push(l)
          buckets.set(key, arr)
        }
        for (const arr of buckets.values()) {
          if (arr.length === 1) addMarker(arr[0])
          else {
            const lat = arr.reduce((s, l) => s + (l.latitude as number), 0) / arr.length
            const lng = arr.reduce((s, l) => s + (l.longitude as number), 0) / arr.length
            const icon = L.divIcon({
              className: "",
              html: `<span style="display:grid;place-items:center;width:38px;height:38px;border-radius:9999px;background:#2563EB;color:#fff;font:700 13px system-ui;box-shadow:0 3px 10px rgba(0,0,0,.28);border:2px solid #fff">${arr.length}</span>`,
              iconSize: [38, 38],
              iconAnchor: [19, 19],
            })
            const m = L.marker([lat, lng], { icon }).addTo(layer)
            m.on("click", () => map.setView([lat, lng], Math.min(zoom + 3, 13)))
          }
        }
      } else {
        for (const l of points) addMarker(l)
      }
    }

    render()
    const bounds = points.map((l) => [l.latitude as number, l.longitude as number]) as [number, number][]
    if (bounds.length > 1) {
      try {
        map.fitBounds(bounds, { padding: [44, 44], maxZoom: 13 })
      } catch {
        /* noop */
      }
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 12)
    }
    map.on("zoomend", render)
    return () => {
      map.off("zoomend", render)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points.map((p) => p.id).join(",")])

  useEffect(() => {
    const L = LRef.current
    if (!L) return
    for (const [id, marker] of markersRef.current) {
      const l = points.find((p) => p.id === id)
      if (!l || typeof marker.setIcon !== "function") continue
      marker.setIcon(L.divIcon({ className: "", html: pinHtml(l, id === activeId), iconSize: [0, 0], iconAnchor: [0, 0] }))
      if (id === activeId && typeof marker.getLatLng === "function") mapRef.current?.panTo(marker.getLatLng())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId])

  return (
    <div className={className}>
      <div ref={containerRef} className="h-full w-full overflow-hidden rounded-2xl border border-slate-200" />
      {points.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="rounded-full bg-white/90 px-3 py-1.5 text-[12px] font-medium text-slate-500 shadow-sm">
            No mapped locations for these results
          </span>
        </div>
      )}
    </div>
  )
}
