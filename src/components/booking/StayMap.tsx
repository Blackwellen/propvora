"use client"

import { useEffect, useRef } from "react"
import { formatMoney } from "./format"
import type { PublicListingCard } from "@/lib/booking/public"

/* ──────────────────────────────────────────────────────────────────────────
   StayMap — the premium split-view Leaflet map for /stay.

   Leaflet is loaded DYNAMICALLY (window) so this is imported via
   next/dynamic({ssr:false}). Features:
     - price-pill markers (Airbnb-style) linking to the stay detail,
     - hover sync (the active card raises + recolours its pin),
     - light clustering: at low zoom, nearby pins collapse into a count bubble,
     - "search as I move the map": debounced moveend emits the current bounds.
   Listings without coordinates aren't plotted; the list rail still shows them.
─────────────────────────────────────────────────────────────────────────── */

export default function StayMap({
  listings,
  activeId,
  hrefFor,
  onHoverId,
  onBoundsChange,
  className,
}: {
  listings: PublicListingCard[]
  activeId?: string | null
  hrefFor: (l: PublicListingCard) => string
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
  const cbRef = useRef({ onBoundsChange, onHoverId, hrefFor })
  cbRef.current = { onBoundsChange, onHoverId, hrefFor }

  const points = listings.filter((l) => l.latitude != null && l.longitude != null)

  function pinHtml(l: PublicListingCard, active: boolean): string {
    const label = l.fromNightlyPence != null ? formatMoney(l.fromNightlyPence, l.currency) : "View"
    const bg = active ? "#0B1B3F" : "#ffffff"
    const fg = active ? "#ffffff" : "#0B1B3F"
    const scale = active ? "transform:scale(1.08);" : ""
    return `<a href="${cbRef.current.hrefFor(l)}" data-id="${l.id}" style="display:inline-block;background:${bg};color:${fg};border:1px solid rgba(15,23,42,.12);border-radius:9999px;padding:5px 11px;font:700 12.5px system-ui;box-shadow:0 3px 10px rgba(0,0,0,.2);white-space:nowrap;text-decoration:none;${scale}transition:transform .12s">${label}</a>`
  }

  // Init once.
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
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        subdomains: "abcd",
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
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

  // Render markers + light clustering when the point set changes.
  useEffect(() => {
    const L = LRef.current
    const map = mapRef.current
    const layer = layerRef.current
    if (!L || !map || !layer) return

    function render() {
      layer.clearLayers()
      markersRef.current.clear()
      const zoom = map.getZoom()

      // Light clustering at low zoom: bucket points onto a coarse grid.
      const cluster = zoom < 8 && points.length > 12
      if (cluster) {
        const cell = zoom < 6 ? 1.5 : 0.6 // degrees
        const buckets = new Map<string, PublicListingCard[]>()
        for (const l of points) {
          const key = `${Math.floor((l.latitude as number) / cell)}:${Math.floor((l.longitude as number) / cell)}`
          const arr = buckets.get(key) ?? []
          arr.push(l)
          buckets.set(key, arr)
        }
        for (const arr of buckets.values()) {
          if (arr.length === 1) {
            addMarker(arr[0])
          } else {
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

    function addMarker(l: PublicListingCard) {
      const icon = L.divIcon({
        className: "",
        html: pinHtml(l, l.id === activeId),
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      })
      const marker = L.marker([l.latitude as number, l.longitude as number], { icon }).addTo(layer)
      marker.on("mouseover", () => cbRef.current.onHoverId?.(l.id))
      marker.on("mouseout", () => cbRef.current.onHoverId?.(null))
      markersRef.current.set(l.id, marker)
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

  // Re-skin active marker on hover sync.
  useEffect(() => {
    const L = LRef.current
    if (!L) return
    for (const [id, marker] of markersRef.current) {
      const l = points.find((p) => p.id === id)
      if (!l || typeof marker.setIcon !== "function") continue
      marker.setIcon(
        L.divIcon({ className: "", html: pinHtml(l, id === activeId), iconSize: [0, 0], iconAnchor: [0, 0] })
      )
      if (id === activeId && typeof marker.getLatLng === "function") mapRef.current?.panTo(marker.getLatLng())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId])

  return (
    <div className={className} style={{ position: "relative" }}>
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
