'use client'

import { Fragment } from 'react'
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

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
const TILE_ATTRIBUTION =
  '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>'

/** Premium price-pill pin */
function createServicePin(price: number, urgent: boolean) {
  const bg = urgent ? '#dc2626' : '#ffffff'
  const color = urgent ? '#ffffff' : '#0f172a'
  const border = urgent ? '#dc2626' : '#e2e8f0'
  return L.divIcon({
    html: `<div style="background:${bg};color:${color};padding:5px 12px;border-radius:20px;font-weight:800;font-size:13px;white-space:nowrap;box-shadow:0 3px 10px rgba(0,0,0,0.16),0 1px 3px rgba(0,0,0,0.08);border:2px solid ${border};cursor:pointer;letter-spacing:-0.01em">£${price}</div>`,
    className: '',
    iconAnchor: [32, 14],
    popupAnchor: [0, -18],
  })
}

function hexPolygon(lat: number, lng: number, radiusDeg: number): [number, number][] {
  const sides = 6
  return Array.from({ length: sides }, (_, i) => {
    const angle = (Math.PI / 3) * i
    return [lat + radiusDeg * Math.cos(angle), lng + radiusDeg * 1.4 * Math.sin(angle)] as [number, number]
  })
}

interface ServicesMapInnerProps {
  offers: PublicServiceOffer[]
  /** Base path for "View service" links. */
  basePath?: string
}

export default function ServicesMapInner({
  offers,
  basePath = '/property-manager/marketplace/suppliers-hub/services',
}: ServicesMapInnerProps) {
  return (
    <MapContainer
      center={[53.4808, -2.2426]}
      zoom={11}
      style={{ height: '100%', width: '100%' }}
      zoomControl
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} subdomains="abcd" maxZoom={19} />

      {offers.map(offer => (
        <Fragment key={offer.id}>
          <Polygon
            positions={hexPolygon(offer.lat, offer.lng, 0.08)}
            pathOptions={{
              color: '#2563eb',
              weight: 1.5,
              fillColor: '#3b82f6',
              fillOpacity: 0.08,
            }}
          />
          <Marker
            position={[offer.lat, offer.lng]}
            icon={createServicePin(Math.round(offer.basePrice / 100), offer.urgent)}
          >
            <Popup minWidth={220} maxWidth={260}>
              {/* Premium popup card */}
              <div style={{ width: '220px', fontFamily: 'inherit', padding: 0 }}>
                {/* Hero image */}
                <div style={{ position: 'relative', height: '96px', overflow: 'hidden', borderRadius: '10px 10px 0 0' }}>
                  <img
                    src={offer.heroImage}
                    alt={offer.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {offer.urgent && (
                    <span style={{ position: 'absolute', top: '8px', left: '8px', background: '#dc2626', color: 'white', borderRadius: '20px', padding: '2px 8px', fontSize: '10px', fontWeight: 700 }}>
                      Urgent
                    </span>
                  )}
                </div>
                {/* Body */}
                <div style={{ padding: '10px 14px' }}>
                  <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: '13px', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{offer.title}</p>
                  <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b' }}>{offer.providerName}</p>

                  {/* Rating */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                    <span style={{ color: '#f59e0b', fontSize: '12px' }}>★</span>
                    <span style={{ fontWeight: 700, fontSize: '12px', color: '#0f172a' }}>{offer.rating}</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>({offer.reviewCount})</span>
                    {offer.verified && (
                      <span style={{ marginLeft: '4px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '20px', padding: '1px 6px', fontSize: '10px', fontWeight: 700 }}>
                        ✓ Vetted
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>From</span>
                    <span style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>£{(offer.basePrice / 100).toFixed(0)}</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>/visit</span>
                  </div>

                  {/* CTA */}
                  <a
                    href={`${basePath}/${offer.slug}`}
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      background: '#2563eb',
                      color: 'white',
                      borderRadius: '8px',
                      padding: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    View service →
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        </Fragment>
      ))}
    </MapContainer>
  )
}
