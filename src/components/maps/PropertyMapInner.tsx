"use client"

import { useEffect, useRef } from "react"

export interface PropertyMapItem {
  id: string
  address: string
  lat: number
  lng: number
}

interface PropertyMapInnerProps {
  properties: PropertyMapItem[]
}

export default function PropertyMapInner({ properties }: PropertyMapInnerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null)

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return
    if (mapInstanceRef.current) return

    const init = async () => {
      const L = (await import("leaflet")).default
      await import("leaflet/dist/leaflet.css")

      // Fix default icon paths broken by bundlers
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })

      const hasCoords = properties.filter((p) => p.lat && p.lng)
      const centre: [number, number] =
        hasCoords.length > 0
          ? [
              hasCoords.reduce((s, p) => s + p.lat, 0) / hasCoords.length,
              hasCoords.reduce((s, p) => s + p.lng, 0) / hasCoords.length,
            ]
          : [54.0, -2.0]

      const map = L.map(mapRef.current!, {
        zoomControl: true,
        attributionControl: true,
      }).setView(centre, hasCoords.length === 1 ? 14 : 6)

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      hasCoords.forEach((p) => {
        const marker = L.marker([p.lat, p.lng])
        marker.bindPopup(
          `<div style="font-family:system-ui,sans-serif;font-size:13px;min-width:160px;">
            <p style="font-weight:600;margin:0 0 4px;">${p.address}</p>
            <p style="color:#64748b;font-size:11px;margin:0;">${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}</p>
          </div>`
        )
        marker.addTo(map)
      })

      mapInstanceRef.current = map

      // Fit bounds if multiple markers
      if (hasCoords.length > 1) {
        const bounds = L.latLngBounds(hasCoords.map((p) => [p.lat, p.lng] as [number, number]))
        map.fitBounds(bounds, { padding: [40, 40] })
      }
    }

    init()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={mapRef} className="w-full h-full" style={{ minHeight: "400px" }} />
}
