"use client"

import { useEffect, useRef } from "react"
import { formatMoney } from "./format"
import type { PublicListingCard } from "@/lib/booking/public"

/**
 * Lightweight Leaflet map for the /stay split view. Leaflet is already a dep and
 * is loaded DYNAMICALLY (touches window), so this is imported via
 * next/dynamic({ssr:false}). Markers are price pills linking to the stay detail.
 * Listings without coordinates aren't plotted; the list rail still shows them.
 * Map is purely additive — failure to load never hides data.
 */
export default function StayMap({
  listings,
  activeId,
  hrefFor,
  className,
}: {
  listings: PublicListingCard[]
  activeId?: string | null
  hrefFor: (l: PublicListingCard) => string
  className?: string
}) {
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
        return
      }
      if (cancelled || !containerRef.current || mapRef.current) return

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
        : [54.5, -3]

      const map = L.map(containerRef.current, {
        scrollWheelZoom: false,
        attributionControl: true,
      }).setView(center, first ? 11 : 5)
      mapRef.current = map

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        subdomains: "abcd",
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
      }).addTo(map)

      const bounds: [number, number][] = []
      for (const l of points) {
        const lat = l.latitude as number
        const lng = l.longitude as number
        bounds.push([lat, lng])
        const label = l.fromNightlyPence != null ? formatMoney(l.fromNightlyPence, l.currency) : "View"
        const icon = L.divIcon({
          className: "",
          html: `<a href="${hrefFor(l)}" style="display:inline-block;background:#1D4ED8;border-radius:9999px;padding:4px 10px;font:600 12px system-ui;color:#fff;box-shadow:0 2px 8px rgba(0,0,0,.22);white-space:nowrap;text-decoration:none">${label}</a>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        })
        const marker = L.marker([lat, lng], { icon }).addTo(map)
        markersRef.current.set(l.id, marker)
      }
      if (bounds.length > 1) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 })

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points.map((p) => p.id).join(",")])

  useEffect(() => {
    if (!activeId || !mapRef.current) return
    const m = markersRef.current.get(activeId)
    if (m && typeof m.getLatLng === "function") mapRef.current.panTo(m.getLatLng())
  }, [activeId])

  return (
    <div className={className} style={{ position: "relative" }}>
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
