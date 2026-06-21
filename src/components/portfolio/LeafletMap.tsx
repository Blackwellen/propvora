"use client"

import React, { useEffect, useRef } from "react"
import type { MapProperty } from "@/app/(app)/app/portfolio/map/page"
import { HEALTH_CONFIG, STATUS_LABELS, formatCurrency } from "@/app/(app)/app/portfolio/map/page"

/* ------------------------------------------------------------------ */
/* Props                                                                */
/* ------------------------------------------------------------------ */
interface LeafletMapProps {
  properties: MapProperty[]
  selectedId: string | null
  onSelect: (id: string) => void
}

/* ------------------------------------------------------------------ */
/* Popup card rendered outside React (injected as HTML string)         */
/* ------------------------------------------------------------------ */
function buildPopupHtml(p: MapProperty): string {
  const health = HEALTH_CONFIG[p.healthScore]
  const occupancyPct = p.units > 0 ? Math.round((p.occupied / p.units) * 100) : 0
  const rent = p.monthlyRent > 0 ? formatCurrency(p.monthlyRent) : "—"
  const statusLabel = STATUS_LABELS[p.status] ?? p.status

  return `
    <div style="font-family:system-ui,sans-serif;width:240px;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.12);">
      <div style="position:relative;height:110px;overflow:hidden;background:${p.coverImage ? '#f1f5f9' : (p.type === 'HMO' ? 'linear-gradient(135deg,#1D4ED8 0%,#2563EB 100%)' : p.type === 'BTL' ? 'linear-gradient(135deg,#059669 0%,#10B981 100%)' : p.type === 'SA' ? 'linear-gradient(135deg,#7C3AED 0%,#8B5CF6 100%)' : p.type === 'R2R' ? 'linear-gradient(135deg,#EA580C 0%,#F97316 100%)' : p.type === 'Student' ? 'linear-gradient(135deg,#0891B2 0%,#0EA5E9 100%)' : p.type === 'Co-Living' ? 'linear-gradient(135deg,#DB2777 0%,#EC4899 100%)' : 'linear-gradient(135deg,#475569 0%,#64748B 100%)')};">
        ${p.coverImage ? `<img src="${p.coverImage}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;" />` : ""}
        <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.55),transparent)"></div>
        <div style="position:absolute;bottom:8px;left:10px;right:10px;">
          <p style="font-size:13px;font-weight:700;color:#fff;margin:0;line-height:1.3;">${p.name}</p>
          <p style="font-size:11px;color:rgba(255,255,255,0.75);margin:2px 0 0;">${p.city} · ${p.postcode}</p>
        </div>
      </div>
      <div style="padding:10px 12px 12px;background:#fff;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;flex-wrap:wrap;">
          <span style="display:inline-flex;align-items:center;gap:4px;background:${p.healthScore === 'healthy' ? '#ecfdf5' : p.healthScore === 'watch' ? '#fffbeb' : '#fef2f2'};color:${p.healthScore === 'healthy' ? '#065f46' : p.healthScore === 'watch' ? '#92400e' : '#991b1b'};font-size:10px;font-weight:600;padding:2px 8px;border-radius:99px;">
            <span style="width:6px;height:6px;border-radius:50%;background:${HEALTH_CONFIG[p.healthScore].mapColor};display:inline-block;"></span>
            ${health.label}
          </span>
          <span style="font-size:10px;background:#f1f5f9;color:#475569;padding:2px 8px;border-radius:99px;">${p.operationProfile}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:8px;">
          <div style="background:#f8fafc;border-radius:8px;padding:6px 4px;text-align:center;">
            <p style="font-size:12px;font-weight:700;color:#0f172a;margin:0;">${rent}</p>
            <p style="font-size:10px;color:#94a3b8;margin:2px 0 0;">Rent</p>
          </div>
          <div style="background:#f8fafc;border-radius:8px;padding:6px 4px;text-align:center;">
            <p style="font-size:12px;font-weight:700;color:#0f172a;margin:0;">${occupancyPct}%</p>
            <p style="font-size:10px;color:#94a3b8;margin:2px 0 0;">Occ.</p>
          </div>
          <div style="background:#f8fafc;border-radius:8px;padding:6px 4px;text-align:center;">
            <p style="font-size:12px;font-weight:700;color:#0f172a;margin:0;">${p.units}</p>
            <p style="font-size:10px;color:#94a3b8;margin:2px 0 0;">Units</p>
          </div>
        </div>
        ${p.arrears > 0 ? `<p style="font-size:10px;color:#dc2626;background:#fef2f2;padding:3px 8px;border-radius:6px;margin-bottom:6px;">⚠ ${formatCurrency(p.arrears)} arrears</p>` : ""}
        <a href="/property-manager/portfolio/properties/${p.id}" style="display:flex;align-items:center;justify-content:center;gap:4px;background:#2563eb;color:#fff;font-size:12px;font-weight:600;padding:7px 0;border-radius:10px;text-decoration:none;">
          Open property →
        </a>
      </div>
    </div>
  `
}

/* ------------------------------------------------------------------ */
/* Component                                                            */
/* ------------------------------------------------------------------ */
export default function LeafletMap({ properties, selectedId, onSelect }: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null)
  const markersRef = useRef<Map<string, import("leaflet").Marker>>(new Map())

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return

    const initMap = async () => {
      const L = (await import("leaflet")).default

      // Leaflet CSS — inject once
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link")
        link.id = "leaflet-css"
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)
      }

      // Fix default icon paths for bundlers
      // @ts-expect-error _getIconUrl is an untyped Leaflet internal
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })

      if (mapInstanceRef.current) return

      // Create map
      const map = L.map(mapRef.current!, {
        zoomControl: false,
        attributionControl: true,
      }).setView([53.0, -1.5], 6)

      // Premium styled tile layer (CartoDB Positron — clean light style)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
        subdomains: "abcd",
      }).addTo(map)

      // Custom zoom control (bottom-right)
      L.control.zoom({ position: "bottomright" }).addTo(map)

      mapInstanceRef.current = map
    }

    initMap()

    return () => {
      // Only destroy on unmount, not on re-render
    }
  }, [])

  // Sync markers with properties
  useEffect(() => {
    if (!mapInstanceRef.current || typeof window === "undefined") return

    const L_import = import("leaflet").then(({ default: L }) => {
      const map = mapInstanceRef.current!
      const currentIds = new Set(properties.map((p) => p.id))

      // Remove stale markers
      markersRef.current.forEach((marker, id) => {
        if (!currentIds.has(id)) {
          marker.remove()
          markersRef.current.delete(id)
        }
      })

      // Add/update markers
      properties.forEach((p) => {
        const health = HEALTH_CONFIG[p.healthScore]
        const isSelected = p.id === selectedId
        const size = isSelected ? 44 : 36

        const icon = L.divIcon({
          className: "",
          iconSize: [size, size],
          iconAnchor: [size / 2, size],
          popupAnchor: [0, -size],
          html: `
            <div style="
              width:${size}px;height:${size}px;
              background:${health.mapColor};
              border:3px solid white;
              border-radius:50% 50% 50% 0;
              transform:rotate(-45deg);
              box-shadow:0 3px 12px rgba(0,0,0,0.25);
              transition:all 0.2s;
              ${isSelected ? "filter:drop-shadow(0 0 8px " + health.mapColor + ");" : ""}
            ">
              <div style="
                position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
                transform:rotate(45deg);
              ">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
            </div>
          `,
        })

        if (markersRef.current.has(p.id)) {
          const existing = markersRef.current.get(p.id)!
          existing.setIcon(icon)
        } else {
          const marker = L.marker([p.lat, p.lng], { icon })
          marker.bindPopup(buildPopupHtml(p), {
            maxWidth: 260,
            minWidth: 240,
            className: "propvora-popup",
          })
          marker.on("click", () => {
            onSelect(p.id)
            marker.openPopup()
          })
          marker.addTo(map)
          markersRef.current.set(p.id, marker)
        }
      })

      // Pan to selected
      if (selectedId) {
        const p = properties.find((p) => p.id === selectedId)
        if (p) {
          map.setView([p.lat, p.lng], Math.max(map.getZoom(), 13), { animate: true, duration: 0.5 })
          const marker = markersRef.current.get(selectedId)
          if (marker) marker.openPopup()
        }
      }
    })
  }, [properties, selectedId, onSelect])

  return (
    <>
      {/* Inject popup styles */}
      <style>{`
        .propvora-popup .leaflet-popup-content-wrapper {
          border-radius: 16px !important;
          padding: 0 !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15) !important;
          border: 1px solid #e2e8f0 !important;
          overflow: hidden;
        }
        .propvora-popup .leaflet-popup-content {
          margin: 0 !important;
          width: auto !important;
        }
        .propvora-popup .leaflet-popup-tip-container {
          display: none;
        }
        .leaflet-control-attribution {
          font-size: 10px !important;
          background: rgba(255,255,255,0.8) !important;
          border-radius: 8px 0 0 0 !important;
        }
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12) !important;
          border-radius: 10px !important;
          overflow: hidden;
        }
        .leaflet-control-zoom-in,
        .leaflet-control-zoom-out {
          border: none !important;
          color: #475569 !important;
          font-size: 16px !important;
        }
        .leaflet-control-zoom-in:hover,
        .leaflet-control-zoom-out:hover {
          background: #f8fafc !important;
          color: #2563eb !important;
        }
      `}</style>
      <div ref={mapRef} className="w-full h-full" style={{ background: "#e8eef4" }} />
    </>
  )
}
