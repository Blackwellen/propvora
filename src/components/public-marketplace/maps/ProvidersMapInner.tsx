'use client'

import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import type { PublicProvider } from '@/lib/public-marketplace/types'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const TILE_ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

function createProviderPin(initials: string, color: string) {
  return L.divIcon({
    html: `<div style="width:36px;height:36px;background:${color};border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:12px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.2)">${initials}</div>`,
    className: '',
    iconAnchor: [18, 18],
  })
}

export default function ProvidersMapInner({ providers }: { providers: PublicProvider[] }) {
  return (
    <MapContainer
      center={[53.4808, -2.2426]}
      zoom={11}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />

      {providers.map(p => (
        <div key={p.id}>
          <Circle
            center={[p.lat, p.lng]}
            radius={p.coverageRadius * 1609}
            pathOptions={{ color: '#2563eb', weight: 1.5, fillColor: '#3b82f6', fillOpacity: 0.06, dashArray: '6,6' }}
          />
          <Marker position={[p.lat, p.lng]} icon={createProviderPin(p.initials, p.pinColor)}>
            <Popup>
              <div className="w-52">
                <p className="font-bold text-slate-900 text-sm">{p.companyName}</p>
                <p className="text-xs text-slate-500">{p.trade}</p>
                <p className="text-xs text-slate-500 mt-1">{p.location}</p>
                <p className="text-xs font-medium text-emerald-600 mt-0.5">~{p.responseTime} response</p>
                <a href={`/providers/${p.slug}`} className="block mt-2 text-center text-xs font-semibold text-white bg-blue-600 py-1.5 rounded-lg">View profile</a>
              </div>
            </Popup>
          </Marker>
        </div>
      ))}
    </MapContainer>
  )
}
