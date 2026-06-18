'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import type { PublicLongTermRental } from '@/lib/public-marketplace/types'

// Fix Leaflet default icon paths (Next.js bundler breaks the default resolution)
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
const TILE_ATTRIBUTION =
  '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>'

function createRentPin(monthlyPence: number) {
  const label = `£${Math.round(monthlyPence / 100).toLocaleString('en-GB')}/mo`
  return L.divIcon({
    html: `<div style="background:#fff;color:#0f172a;padding:5px 11px;border-radius:20px;font-weight:700;font-size:12px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.14),0 1px 3px rgba(0,0,0,0.08);border:2px solid #e2e8f0;cursor:pointer;letter-spacing:-0.01em">${label}</div>`,
    className: '',
    iconAnchor: [42, 14],
  })
}

interface LongTermRentalMapInnerProps {
  rentals: PublicLongTermRental[]
  basePath?: string
}

export default function LongTermRentalMapInner({
  rentals,
  basePath = '/stays/long-term',
}: LongTermRentalMapInnerProps) {
  // Centre on the first rental or default to Manchester
  const centre: [number, number] =
    rentals.length > 0 ? [rentals[0].lat, rentals[0].lng] : [53.4808, -2.2426]

  return (
    <MapContainer
      center={centre}
      zoom={11}
      style={{ height: '100%', width: '100%' }}
      zoomControl
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} subdomains="abcd" maxZoom={19} />

      {rentals.map((rental) => (
        <Marker
          key={rental.id}
          position={[rental.lat, rental.lng]}
          icon={createRentPin(rental.monthlyRentPence)}
        >
          <Popup>
            <div className="w-56">
              <img
                src={rental.heroImage}
                alt={rental.title}
                className="w-full h-28 object-cover rounded-t-lg"
              />
              <div className="p-2">
                <p className="font-semibold text-slate-900 text-sm line-clamp-1">{rental.title}</p>
                <p className="text-xs text-slate-500">{rental.location}</p>
                <p className="font-bold text-blue-600 mt-1">
                  £{Math.round(rental.monthlyRentPence / 100).toLocaleString('en-GB')}/mo
                </p>
                <p className="text-xs text-slate-400">
                  {rental.beds} bed · {rental.propertyType}
                </p>
                <a
                  href={`${basePath}/${rental.slug}`}
                  className="block mt-2 text-center text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 py-1.5 rounded-lg"
                >
                  View details
                </a>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
