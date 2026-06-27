'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap, AttributionControl } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { MAP_TILE_URL, MAP_TILE_ATTRIBUTION } from '@/lib/maps/tiles'
import type { PublicStay } from '@/lib/public-marketplace/types'
import { formatPence } from '@/lib/marketplace/money'

function FitToStays({ stays }: { stays: PublicStay[] }) {
  const map = useMap()
  useEffect(() => {
    if (!stays.length) return
    if (stays.length === 1) { map.setView([stays[0].lat, stays[0].lng], 13, { animate: false }); return }
    map.fitBounds(L.latLngBounds(stays.map(s => [s.lat, s.lng] as [number, number])), { padding: [60, 60], maxZoom: 14 })
  }, [map, stays])
  return null
}

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const TILE_URL = MAP_TILE_URL
const TILE_ATTRIBUTION = MAP_TILE_ATTRIBUTION

const MANCHESTER_POLYGON: [number, number][] = [
  [53.5200, -2.3200],
  [53.5100, -2.1800],
  [53.4400, -2.1600],
  [53.4000, -2.2000],
  [53.4100, -2.3400],
  [53.4700, -2.3500],
  [53.5200, -2.3200],
]

function createPricePin(pricePence: number, selected = false) {
  const bg = selected ? 'var(--brand-strong)' : '#fff'
  const color = selected ? '#fff' : '#0f172a'
  const border = selected ? '2px solid var(--brand-strong)' : '2px solid #e2e8f0'
  const shadow = selected
    ? '0 4px 16px rgba(37,99,235,0.45),0 1px 4px rgba(0,0,0,0.12)'
    : '0 2px 8px rgba(0,0,0,0.14),0 1px 3px rgba(0,0,0,0.08)'
  const label = formatPence(pricePence)
  return L.divIcon({
    html: `<div style="background:${bg};color:${color};padding:5px 11px;border-radius:20px;font-weight:700;font-size:13px;white-space:nowrap;box-shadow:${shadow};border:${border};cursor:pointer;letter-spacing:-0.01em">${label}</div>`,
    className: '',
    iconAnchor: [32, 14],
  })
}

interface StaysMapInnerProps {
  stays: PublicStay[]
}

export default function StaysMapInner({ stays }: StaysMapInnerProps) {
  return (
    <MapContainer
      center={[53.4808, -2.2426]}
      zoom={12}
      style={{ height: '100%', width: '100%' }}
      zoomControl={true}
      attributionControl={false}
    >
      <AttributionControl prefix={false} position="bottomright" />
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} subdomains="abc" maxZoom={19} />
      <FitToStays stays={stays} />

      {/* Manchester area polygon */}
      <Polygon
        positions={MANCHESTER_POLYGON}
        pathOptions={{ color: '#2563eb', weight: 2, fillColor: '#3b82f6', fillOpacity: 0.07, dashArray: '5,5' }}
      />

      {/* Stay markers */}
      {stays.map(stay => (
        <Marker
          key={stay.id}
          position={[stay.lat, stay.lng]}
          icon={createPricePin(stay.pricePerNight)}
        >
          <Popup className="propvora-map-popup" maxWidth={232} closeButton autoPan>
            <div className="w-[232px] font-sans text-slate-900">
              {/* Hero */}
              <div className="relative h-[72px] w-full overflow-hidden bg-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={stay.heroImage} alt={stay.title} className="h-full w-full object-cover" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                {stay.verified && (
                  <span className="absolute left-2 top-2 rounded-full bg-emerald-500/95 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">✓ Verified</span>
                )}
                <span className="absolute bottom-1.5 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold capitalize text-slate-800 shadow-sm backdrop-blur-sm">
                  {stay.stayType}
                </span>
              </div>

              {/* Body */}
              <div className="p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-[13px] font-bold text-slate-900">{stay.title}</p>
                  <span className="flex shrink-0 items-center gap-0.5 text-[11.5px]">
                    <span className="text-amber-400">★</span>
                    <span className="font-bold text-slate-900">{stay.rating}</span>
                    <span className="text-slate-400">({stay.reviewCount})</span>
                  </span>
                </div>

                <div className="mt-0.5 flex items-center justify-between gap-2 text-[11px]">
                  <span className="truncate text-slate-500">{stay.location}</span>
                  <span className="shrink-0 font-extrabold text-slate-900">
                    {formatPence(stay.pricePerNight)}<span className="text-[10px] font-normal text-slate-400">/night</span>
                  </span>
                </div>

                <div className="mt-2 flex gap-1.5">
                  <a href={`/stays/${stay.slug}`} className="flex-1 rounded-lg border border-slate-200 py-1.5 text-center text-[11px] font-bold no-underline transition-colors hover:bg-slate-50">
                    <span className="text-slate-700">Details</span>
                  </a>
                  <a href={`/stays/${stay.slug}`} className="flex-1 rounded-lg bg-[var(--brand)] py-1.5 text-center text-[11px] font-bold no-underline transition-colors hover:bg-[var(--brand-strong)]">
                    <span className="text-white">Book →</span>
                  </a>
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
