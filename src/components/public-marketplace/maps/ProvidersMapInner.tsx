'use client'

import { Fragment } from 'react'
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

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
const TILE_ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>'

function createProviderPin(initials: string, color: string) {
  return L.divIcon({
    html: `<div style="width:40px;height:40px;background:${color};border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:13px;border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.18),0 1px 4px rgba(0,0,0,0.10);letter-spacing:0.02em">${initials}</div>`,
    className: '',
    iconAnchor: [20, 20],
  })
}

export default function ProvidersMapInner({ providers }: { providers: PublicProvider[] }) {
  return (
    <MapContainer
      center={[53.4808, -2.2426]}
      zoom={11}
      style={{ height: '100%', width: '100%' }}
      zoomControl
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} subdomains="abcd" maxZoom={19} />

      {providers.map(p => (
        <Fragment key={p.id}>
          <Circle
            center={[p.lat, p.lng]}
            radius={p.coverageRadius * 1609}
            pathOptions={{ color: '#2563eb', weight: 1.5, fillColor: '#3b82f6', fillOpacity: 0.07, dashArray: '6,6' }}
          />
          <Marker position={[p.lat, p.lng]} icon={createProviderPin(p.initials, p.pinColor)}>
            <Popup>
              <div className="w-52">
                <p className="font-bold text-slate-900 text-sm">{p.companyName}</p>
                <p className="text-xs text-slate-500 capitalize">{p.trade}</p>
                <p className="text-xs text-slate-500 mt-1">{p.location}</p>
                <p className="text-xs font-medium text-emerald-600 mt-0.5">~{p.responseTime} response</p>
                {p.vetted && (
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    ✓ Vetted provider
                  </span>
                )}
                <a href={`/providers/${p.slug}`} className="block mt-2.5 text-center text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 py-1.5 rounded-lg transition-colors">
                  View profile
                </a>
              </div>
            </Popup>
          </Marker>
        </Fragment>
      ))}
    </MapContainer>
  )
}
