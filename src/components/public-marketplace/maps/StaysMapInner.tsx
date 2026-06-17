'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import Link from 'next/link'
import type { PublicStay } from '@/lib/public-marketplace/types'

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const TILE_ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

const MANCHESTER_POLYGON: [number, number][] = [
  [53.5200, -2.3200],
  [53.5100, -2.1800],
  [53.4400, -2.1600],
  [53.4000, -2.2000],
  [53.4100, -2.3400],
  [53.4700, -2.3500],
  [53.5200, -2.3200],
]

function createPricePin(price: number) {
  return L.divIcon({
    html: `<div style="background:#2563eb;color:white;padding:4px 10px;border-radius:20px;font-weight:700;font-size:13px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.2);cursor:pointer">£${price}</div>`,
    className: '',
    iconAnchor: [30, 12],
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
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />

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
          icon={createPricePin(stay.pricePerNight / 100)}
        >
          <Popup>
            <div className="w-56">
              <img src={stay.heroImage} alt={stay.title} className="w-full h-28 object-cover rounded-t-lg" />
              <div className="p-2">
                <p className="font-semibold text-slate-900 text-sm line-clamp-1">{stay.title}</p>
                <p className="text-xs text-slate-500">{stay.location}</p>
                <p className="font-bold text-blue-600 mt-1">£{(stay.pricePerNight / 100).toFixed(0)}/night</p>
                <a href={`/stays/${stay.slug}`} className="block mt-2 text-center text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 py-1.5 rounded-lg">View stay</a>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
