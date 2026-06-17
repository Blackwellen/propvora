'use client'

import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import type { PublicServiceOffer } from '@/lib/public-marketplace/types'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const TILE_ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

function createServicePin(price: number) {
  return L.divIcon({
    html: `<div style="background:#2563eb;color:white;padding:4px 10px;border-radius:20px;font-weight:700;font-size:13px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.2)">£${price}</div>`,
    className: '',
    iconAnchor: [30, 12],
  })
}

function hexPolygon(lat: number, lng: number, radiusDeg: number): [number, number][] {
  const sides = 6
  return Array.from({ length: sides }, (_, i) => {
    const angle = (Math.PI / 3) * i
    return [lat + radiusDeg * Math.cos(angle), lng + radiusDeg * 1.4 * Math.sin(angle)] as [number, number]
  })
}

export default function ServicesMapInner({ offers }: { offers: PublicServiceOffer[] }) {
  return (
    <MapContainer
      center={[53.4808, -2.2426]}
      zoom={11}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />

      {offers.map(offer => (
        <div key={offer.id}>
          <Polygon
            positions={hexPolygon(offer.lat, offer.lng, 0.08)}
            pathOptions={{ color: '#2563eb', weight: 1.5, fillColor: '#3b82f6', fillOpacity: 0.1 }}
          />
          <Marker
            position={[offer.lat, offer.lng]}
            icon={createServicePin(offer.basePrice / 100)}
          >
            <Popup>
              <div className="w-52">
                <img src={offer.heroImage} alt={offer.title} className="w-full h-24 object-cover rounded-t-lg" />
                <div className="p-2">
                  <p className="font-semibold text-slate-900 text-sm line-clamp-1">{offer.title}</p>
                  <p className="text-xs text-slate-500">{offer.providerName}</p>
                  <p className="font-bold text-blue-600 mt-1">From £{(offer.basePrice / 100).toFixed(0)}</p>
                  <a href={`/services/${offer.slug}`} className="block mt-2 text-center text-xs font-semibold text-white bg-blue-600 py-1.5 rounded-lg">View service</a>
                </div>
              </div>
            </Popup>
          </Marker>
        </div>
      ))}
    </MapContainer>
  )
}
