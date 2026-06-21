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
const TILE_ATTRIBUTION =
  '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>'

/**
 * Premium provider pin — circular badge with initials and brand colour.
 * Has a subtle outer ring on hover via the data-hover attribute.
 */
function createProviderPin(initials: string, color: string, vetted: boolean) {
  const vetRing = vetted
    ? `<div style="position:absolute;inset:-4px;border-radius:50%;border:2px solid #10b981;opacity:0.7;pointer-events:none"></div>`
    : ''
  return L.divIcon({
    html: `
      <div style="position:relative;width:44px;height:44px">
        ${vetRing}
        <div style="
          width:44px;height:44px;
          background:${color};
          border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          color:white;font-weight:800;font-size:13px;
          border:3px solid white;
          box-shadow:0 4px 14px rgba(0,0,0,0.22),0 1px 4px rgba(0,0,0,0.10);
          letter-spacing:0.03em;
          transition:transform 0.15s;
        ">${initials}</div>
      </div>
    `,
    className: '',
    iconAnchor: [22, 22],
    popupAnchor: [0, -26],
  })
}

interface ProvidersMapInnerProps {
  providers: PublicProvider[]
  /** Base path for "View profile" links. Defaults to /property-manager/marketplace/suppliers-hub */
  basePath?: string
}

export default function ProvidersMapInner({
  providers,
  basePath = '/property-manager/marketplace/suppliers-hub',
}: ProvidersMapInnerProps) {
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
          {/* Coverage radius ring */}
          <Circle
            center={[p.lat, p.lng]}
            radius={p.coverageRadius * 1609}
            pathOptions={{
              color: '#2563eb',
              weight: 1.5,
              fillColor: '#3b82f6',
              fillOpacity: 0.06,
              dashArray: '6,6',
            }}
          />
          <Marker position={[p.lat, p.lng]} icon={createProviderPin(p.initials, p.pinColor, p.vetted)}>
            <Popup minWidth={220} maxWidth={260}>
              {/* Premium popup card */}
              <div style={{ width: '220px', fontFamily: 'inherit', padding: 0 }}>
                {/* Header */}
                <div style={{ background: '#f8fafc', borderRadius: '10px 10px 0 0', padding: '12px 14px 10px', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Avatar circle */}
                    <div style={{
                      width: '38px', height: '38px',
                      borderRadius: '50%',
                      background: p.pinColor,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 800, fontSize: '13px',
                      flexShrink: 0,
                    }}>
                      {p.initials}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '13px', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.companyName}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b', textTransform: 'capitalize' }}>{p.trade}</p>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: '10px 14px' }}>
                  {/* Rating row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                    <span style={{ color: '#f59e0b', fontSize: '12px' }}>★</span>
                    <span style={{ fontWeight: 700, fontSize: '12px', color: '#0f172a' }}>{p.rating}</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>({p.reviewCount} reviews)</span>
                  </div>

                  {/* Location */}
                  <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b' }}>
                    📍 {p.location}
                  </p>

                  {/* Response time */}
                  <p style={{ margin: '0 0 6px', fontSize: '11px', color: '#059669', fontWeight: 600 }}>
                    ⚡ ~{p.responseTime} response
                  </p>

                  {/* Badges */}
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    {p.vetted && (
                      <span style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '20px', padding: '2px 8px', fontSize: '10px', fontWeight: 700 }}>
                        ✓ Vetted
                      </span>
                    )}
                    {p.insured && (
                      <span style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '20px', padding: '2px 8px', fontSize: '10px', fontWeight: 700 }}>
                        🛡 Insured
                      </span>
                    )}
                    {p.emergency24h && (
                      <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '20px', padding: '2px 8px', fontSize: '10px', fontWeight: 700 }}>
                        24/7
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>From</span>
                    <span style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>£{(p.fromPrice / 100).toFixed(0)}</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>/visit</span>
                  </div>

                  {/* CTA */}
                  <a
                    href={`${basePath}/${p.slug}`}
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
                      transition: 'background 0.15s',
                    }}
                    onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.background = '#1d4ed8' }}
                    onMouseOut={(e)  => { (e.currentTarget as HTMLElement).style.background = '#2563eb' }}
                  >
                    View profile →
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
