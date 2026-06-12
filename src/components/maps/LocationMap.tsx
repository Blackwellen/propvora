"use client"

import React, { useEffect, useRef, useState } from "react"

/* ------------------------------------------------------------------ */
/* LocationMap — one reusable OpenStreetMap (Leaflet) used everywhere   */
/* a record has a place: property/unit/tenancy/supplier detail, etc.    */
/*                                                                      */
/* • Tiles: CartoDB Positron (OpenStreetMap data) — clean light style.  */
/* • Markers: inline SVG pins (divIcon) so NO external image assets.    */
/* • Coordinates: pass lat/lng when stored; otherwise pass `address`    */
/*   and the map geocodes it once via OSM Nominatim (live data, never   */
/*   fabricated). Records with neither show the graceful empty state.   */
/* ------------------------------------------------------------------ */

export interface MapMarker {
  id: string
  /** Use stored coordinates when available. */
  lat?: number | null
  lng?: number | null
  /** Fallback: a real address string to geocode via OSM when lat/lng are absent. */
  address?: string | null
  label?: string
  sublabel?: string
  href?: string
  /** Pin colour (hex). Defaults to Propvora blue. */
  color?: string
  /** Optional fully-custom popup HTML (overrides label/sublabel). */
  popupHtml?: string
}

interface LocationMapProps {
  markers: MapMarker[]
  className?: string
  /** Map height (px or any CSS length). Default 320. */
  height?: number | string
  /** Zoom used when a single marker is shown. Default 15. */
  zoom?: number
  onSelect?: (id: string) => void
  selectedId?: string | null
  /** Optional glass chip shown top-left over the map (e.g. the place name). */
  title?: string
  /** Optional small caption under the title chip (e.g. the full address). */
  caption?: string
}

const PROPVORA_BLUE = "#2563EB"

function pinSvg(color: string, size: number, pulse: boolean): string {
  // A premium teardrop pin with a soft brand-tinted gradient body, glossy
  // highlight and an animated pulsing halo — not a bare default marker.
  const halo = pulse
    ? `<span class="pv-pin-halo" style="--pv-pin:${color};"></span>`
    : ""
  return `
    <div class="pv-pin" style="width:${size}px;height:${size}px;position:relative;">
      ${halo}
      <div style="
        width:${size}px;height:${size}px;
        background:radial-gradient(circle at 32% 28%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 42%), linear-gradient(150deg, ${color} 0%, ${color} 55%, rgba(0,0,0,0.18) 130%);
        border:3px solid #fff;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:0 4px 14px rgba(2,6,23,0.32);
      ">
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;transform:rotate(45deg);">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
      </div>
    </div>`
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string),
  )
}

function defaultPopupHtml(m: MapMarker): string {
  const label = m.label ? escapeHtml(m.label) : "Location"
  const sub = m.sublabel ? `<p style="font-size:11px;color:#64748b;margin:2px 0 0;">${escapeHtml(m.sublabel)}</p>` : ""
  const link = m.href
    ? `<a href="${escapeHtml(m.href)}" style="display:inline-flex;align-items:center;gap:4px;margin-top:8px;background:#2563eb;color:#fff;font-size:11.5px;font-weight:600;padding:6px 10px;border-radius:9px;text-decoration:none;">Open →</a>`
    : ""
  return `
    <div style="font-family:system-ui,sans-serif;min-width:180px;padding:10px 12px;">
      <p style="font-size:13px;font-weight:700;color:#0f172a;margin:0;line-height:1.3;">${label}</p>
      ${sub}
      ${link}
    </div>`
}

/* Tiny in-memory geocode cache so repeated addresses don't re-hit OSM. */
const geocodeCache = new Map<string, { lat: number; lng: number } | null>()

async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  const key = address.trim().toLowerCase()
  if (!key) return null
  if (geocodeCache.has(key)) return geocodeCache.get(key)!
  try {
    const url =
      "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=gb&q=" +
      encodeURIComponent(address)
    const res = await fetch(url, { headers: { Accept: "application/json" } })
    if (!res.ok) throw new Error(String(res.status))
    const data: Array<{ lat: string; lon: string }> = await res.json()
    const hit = data[0]
    const result = hit ? { lat: parseFloat(hit.lat), lng: parseFloat(hit.lon) } : null
    geocodeCache.set(key, result)
    return result
  } catch {
    geocodeCache.set(key, null)
    return null
  }
}

export default function LocationMap({
  markers,
  className = "",
  height = 320,
  zoom = 15,
  onSelect,
  selectedId,
  title,
  caption,
}: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null)
  const layerRef = useRef<import("leaflet").LayerGroup | null>(null)
  const [resolved, setResolved] = useState<Array<MapMarker & { lat: number; lng: number }>>([])
  const [geocoding, setGeocoding] = useState(false)

  /* Resolve every marker to real coordinates (stored, else geocoded). */
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const out: Array<MapMarker & { lat: number; lng: number }> = []
      let didGeocode = false
      for (const m of markers) {
        if (typeof m.lat === "number" && typeof m.lng === "number" && Number.isFinite(m.lat) && Number.isFinite(m.lng)) {
          out.push({ ...m, lat: m.lat, lng: m.lng })
        } else if (m.address && m.address.trim()) {
          didGeocode = true
          const g = await geocode(m.address)
          if (g) out.push({ ...m, lat: g.lat, lng: g.lng })
        }
      }
      if (didGeocode && !cancelled) setGeocoding(false)
      if (!cancelled) setResolved(out)
    })()
    const anyNeedsGeocode = markers.some(
      (m) => !(typeof m.lat === "number" && Number.isFinite(m.lat)) && !!m.address?.trim(),
    )
    if (anyNeedsGeocode) setGeocoding(true)
    return () => {
      cancelled = true
    }
  }, [markers])

  /* Init the Leaflet map once. */
  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current || mapInstanceRef.current) return
    let disposed = false

    ;(async () => {
      const L = (await import("leaflet")).default
      if (disposed || !mapRef.current || mapInstanceRef.current) return

      // Leaflet stylesheet — inject once (id-guarded).
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link")
        link.id = "leaflet-css"
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)
      }

      const map = L.map(mapRef.current, { zoomControl: false, attributionControl: true, scrollWheelZoom: false }).setView(
        [53.0, -1.5],
        6,
      )
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
        subdomains: "abcd",
      }).addTo(map)
      L.control.zoom({ position: "bottomright" }).addTo(map)
      layerRef.current = L.layerGroup().addTo(map)
      mapInstanceRef.current = map
      // Tiles can mis-size inside flex/hidden containers — settle after mount.
      setTimeout(() => map.invalidateSize(), 80)
    })()

    return () => {
      disposed = true
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
      layerRef.current = null
    }
  }, [])

  /* Sync markers + view whenever resolved coords change. */
  useEffect(() => {
    if (!mapInstanceRef.current || !layerRef.current) return
    ;(async () => {
      const L = (await import("leaflet")).default
      const map = mapInstanceRef.current!
      const layer = layerRef.current!
      layer.clearLayers()
      if (!resolved.length) return

      const latlngs: [number, number][] = []
      for (const m of resolved) {
        const isSel = m.id === selectedId
        const size = isSel ? 42 : 34
        const pulse = isSel || resolved.length === 1
        const icon = L.divIcon({
          className: "",
          iconSize: [size, size],
          iconAnchor: [size / 2, size],
          popupAnchor: [0, -size],
          html: pinSvg(m.color ?? PROPVORA_BLUE, size, pulse),
        })
        const marker = L.marker([m.lat, m.lng], { icon })
        marker.bindPopup(m.popupHtml ?? defaultPopupHtml(m), { maxWidth: 280, className: "propvora-popup" })
        if (onSelect) marker.on("click", () => onSelect(m.id))
        marker.addTo(layer)
        latlngs.push([m.lat, m.lng])
      }

      if (latlngs.length === 1) {
        map.setView(latlngs[0], zoom, { animate: true })
      } else {
        map.fitBounds(latlngs as [number, number][], { padding: [40, 40], maxZoom: 14 })
      }
      setTimeout(() => map.invalidateSize(), 60)
    })()
  }, [resolved, selectedId, zoom, onSelect])

  const hasAny = resolved.length > 0

  return (
    <div className={className} style={{ position: "relative", height, width: "100%" }}>
      <style>{`
        .propvora-popup .leaflet-popup-content-wrapper{border-radius:14px!important;padding:0!important;box-shadow:0 8px 28px rgba(0,0,0,0.16)!important;border:1px solid #e2e8f0!important;overflow:hidden;}
        .propvora-popup .leaflet-popup-content{margin:0!important;width:auto!important;}
        .propvora-popup .leaflet-popup-tip{box-shadow:0 8px 28px rgba(0,0,0,0.12)!important;}
        .leaflet-control-attribution{font-size:9px!important;background:rgba(255,255,255,0.82)!important;backdrop-filter:blur(4px);border-radius:8px 0 0 0!important;padding:1px 6px!important;}
        .leaflet-control-zoom{border:none!important;box-shadow:0 4px 14px rgba(2,6,23,0.14)!important;border-radius:12px!important;overflow:hidden;margin:0 14px 16px 0!important;}
        .leaflet-control-zoom-in,.leaflet-control-zoom-out{border:none!important;color:#334155!important;width:32px!important;height:32px!important;line-height:30px!important;font-size:17px!important;background:rgba(255,255,255,0.92)!important;backdrop-filter:blur(6px);}
        .leaflet-control-zoom-in:hover,.leaflet-control-zoom-out:hover{background:#fff!important;color:#2563eb!important;}
        .pv-pin-halo{position:absolute;left:50%;top:50%;width:${"38px"};height:38px;margin:-19px 0 0 -19px;border-radius:50%;background:radial-gradient(circle, var(--pv-pin) 0%, transparent 70%);opacity:0.45;animation:pvPulse 2s ease-out infinite;pointer-events:none;}
        @keyframes pvPulse{0%{transform:scale(0.6);opacity:0.5;}70%{transform:scale(1.9);opacity:0;}100%{opacity:0;}}
      `}</style>
      <div ref={mapRef} className="w-full h-full rounded-2xl overflow-hidden" style={{ background: "#e8eef4" }} />

      {/* Premium frame: crisp inset ring + soft top/bottom vignette for depth. */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.08), inset 0 22px 44px -36px rgba(2,6,23,0.55), inset 0 -22px 44px -40px rgba(2,6,23,0.4)",
        }}
      />

      {/* Glass info chip (top-left) */}
      {title && hasAny && (
        <div className="pointer-events-none absolute left-3 top-3 max-w-[70%] rounded-xl border border-white/70 bg-white/85 px-3 py-2 shadow-[0_6px_20px_rgba(2,6,23,0.12)] backdrop-blur-md">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-[#2563EB] shadow-[0_0_0_3px_rgba(37,99,235,0.18)]" />
            <p className="text-[12.5px] font-semibold text-slate-800 leading-tight truncate">{title}</p>
          </div>
          {caption && <p className="text-[11px] text-slate-500 leading-tight mt-0.5 truncate">{caption}</p>}
        </div>
      )}
      {!hasAny && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl bg-slate-50/80 backdrop-blur-[1px] text-center px-6 pointer-events-none">
          <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <p className="text-[13px] font-semibold text-slate-600">
            {geocoding ? "Locating address…" : "No location to map yet"}
          </p>
          {!geocoding && (
            <p className="text-[11.5px] text-slate-400 max-w-[220px]">
              Add an address or coordinates to plot this on the map.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
