"use client"

import { useEffect, useRef } from "react"
import type { PublicListing } from "@/lib/marketplace/search"
import { formatPence } from "@/components/marketplace/PriceTag"
import { publicListingHref } from "./intent"

/* ──────────────────────────────────────────────────────────────────────────
   MarketplaceMap — a LIGHTWEIGHT Leaflet map for the split (map/list) view.

   Leaflet is already a dependency (`leaflet` + `@types/leaflet`); we load it
   DYNAMICALLY on the client only (it touches `window`), so this component is
   imported via `next/dynamic({ ssr:false })` by the split view. Markers are
   price pills linking to the listing detail. Listings without coordinates are
   simply not plotted — the split view shows them in the list rail regardless,
   so nothing is hidden.

   No tiles key is required: OpenStreetMap raster tiles are used. If Leaflet
   fails to load for any reason, the caller's list rail still renders the full
   result set — the map is purely additive.
─────────────────────────────────────────────────────────────────────────── */

interface MarketplaceMapProps {
  listings: PublicListing[]
  /** Currently highlighted listing id (hover sync from the list). */
  activeId?: string | null
  className?: string
}

export default function MarketplaceMap({ listings, activeId, className }: MarketplaceMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Map<string, any>>(new Map())

  const points = listings.filter((l) => l.latitude != null && l.longitude != null)

  useEffect(() => {
    let cancelled = false
    let cleanup = () => {}

    async function init() {
      if (!containerRef.current) return
      let L: typeof import("leaflet")
      try {
        L = (await import("leaflet")).default
      } catch {
        return // map is additive; list rail covers the data.
      }
      if (cancelled || !containerRef.current) return
      if (mapRef.current) return

      // Leaflet stylesheet — inject once (id-guarded), matching LocationMap.
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link")
        link.id = "leaflet-css"
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)
      }

      const first = points[0]
      const center: [number, number] = first
        ? [first.latitude as number, first.longitude as number]
        : [54.5, -3] // UK centroid fallback

      const map = L.map(containerRef.current, {
        scrollWheelZoom: false,
        attributionControl: true,
      }).setView(center, first ? 11 : 5)
      mapRef.current = map

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        subdomains: "abcd",
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
      }).addTo(map)

      const bounds: [number, number][] = []
      for (const l of points) {
        const lat = l.latitude as number
        const lng = l.longitude as number
        bounds.push([lat, lng])
        const label = l.basePricePence != null ? formatPence(l.basePricePence, l.currency) : "View"
        const icon = L.divIcon({
          className: "",
          html: `<a href="${publicListingHref({ id: l.id, transactionType: l.transactionType })}" style="display:inline-block;background:#fff;border:1px solid #cbd5e1;border-radius:9999px;padding:3px 9px;font:600 12px system-ui;color:#0f172a;box-shadow:0 2px 8px rgba(0,0,0,.18);white-space:nowrap;text-decoration:none">${label}</a>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        })
        const marker = L.marker([lat, lng], { icon }).addTo(map)
        markersRef.current.set(l.id, marker)
      }
      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 })
      }

      cleanup = () => {
        map.remove()
        mapRef.current = null
        markersRef.current.clear()
      }
    }

    void init()
    return () => {
      cancelled = true
      cleanup()
    }
    // Re-init when the plotted point set materially changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points.map((p) => p.id).join(",")])

  // Pan to the active listing when hovered in the list.
  useEffect(() => {
    if (!activeId || !mapRef.current) return
    const m = markersRef.current.get(activeId)
    if (m && typeof m.getLatLng === "function") {
      mapRef.current.panTo(m.getLatLng())
    }
  }, [activeId])

  return (
    <div className={className}>
      <div ref={containerRef} className="w-full h-full rounded-2xl overflow-hidden border border-slate-200" />
      {points.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="rounded-full bg-white/90 px-3 py-1.5 text-[12px] font-medium text-slate-500 shadow-sm">
            No mapped locations for these results
          </span>
        </div>
      )}
    </div>
  )
}
