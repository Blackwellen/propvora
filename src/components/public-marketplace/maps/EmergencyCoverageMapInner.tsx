'use client'

import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const TILE_ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

interface EmergencyCoverageMapInnerProps {
  lat: number
  lng: number
  radiusMiles?: number
}

function createEmergencyPin() {
  return L.divIcon({
    html: `<div style="width:40px;height:40px;background:#dc2626;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:18px;border:3px solid white;box-shadow:0 2px 12px rgba(220,38,38,0.4)">🚨</div>`,
    className: '',
    iconAnchor: [20, 20],
  })
}

export default function EmergencyCoverageMapInner({ lat, lng, radiusMiles = 15 }: EmergencyCoverageMapInnerProps) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={12}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
      <Circle
        center={[lat, lng]}
        radius={radiusMiles * 1609}
        pathOptions={{ color: '#dc2626', weight: 2, fillColor: '#ef4444', fillOpacity: 0.12, dashArray: '5,5' }}
      />
      <Marker position={[lat, lng]} icon={createEmergencyPin()} />
    </MapContainer>
  )
}
