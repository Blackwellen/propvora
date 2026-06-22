'use client'

import { Fragment, useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, AttributionControl } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { MAP_TILE_URL, MAP_TILE_ATTRIBUTION } from '@/lib/maps/tiles'
import type { PublicProvider } from '@/lib/public-marketplace/types'

/**
 * Fits the map to all provider markers on mount / when the set changes, so the
 * results are always framed (instead of opening on a fixed centre). Falls back
 * to a sensible single-pin zoom when there's only one provider.
 */
function FitToProviders({ providers }: { providers: PublicProvider[] }) {
  const map = useMap()
  useEffect(() => {
    if (!providers.length) return
    if (providers.length === 1) {
      map.setView([providers[0].lat, providers[0].lng], 11, { animate: false })
      return
    }
    const bounds = L.latLngBounds(providers.map(p => [p.lat, p.lng] as [number, number]))
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 12 })
  }, [map, providers])
  return null
}

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const TILE_URL = MAP_TILE_URL
const TILE_ATTRIBUTION = MAP_TILE_ATTRIBUTION

/**
 * Premium provider pin — circular badge with initials and brand colour.
 * Has a subtle outer ring on hover via the data-hover attribute.
 */
function createProviderPin(initials: string, _color: string, vetted: boolean) {
  // Premium blue pin — vetted suppliers get an emerald confidence ring.
  const vetRing = vetted
    ? `<div style="position:absolute;inset:-4px;border-radius:50%;border:2px solid #10b981;opacity:0.85;pointer-events:none"></div>`
    : ''
  return L.divIcon({
    html: `
      <div style="position:relative;width:44px;height:44px">
        ${vetRing}
        <div style="
          width:44px;height:44px;
          background:linear-gradient(135deg,#3B82F6 0%,#1D4ED8 100%);
          border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          color:white;font-weight:800;font-size:13px;
          border:3px solid white;
          box-shadow:0 6px 18px rgba(37,99,235,0.42),0 1px 4px rgba(2,6,23,0.16);
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
  const [openId, setOpenId] = useState<string | null>(null)
  return (
    <MapContainer
      center={[53.4808, -2.2426]}
      zoom={11}
      style={{ height: '100%', width: '100%' }}
      zoomControl
      attributionControl={false}
    >
      <AttributionControl prefix={false} position="bottomright" />
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} subdomains="abc" maxZoom={19} />
      <FitToProviders providers={providers} />

      {providers.map(p => (
        <Fragment key={p.id}>
          {/* Coverage radius ring — only for the open marker, so the map stays clean */}
          {openId === p.id && (
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
          )}
          <Marker
            position={[p.lat, p.lng]}
            icon={createProviderPin(p.initials, p.pinColor, p.vetted)}
            eventHandlers={{
              popupopen: () => setOpenId(p.id),
              popupclose: () => setOpenId((cur) => (cur === p.id ? null : cur)),
            }}
          >
            <Popup className="propvora-map-popup" maxWidth={232} closeButton autoPan>
              {/* Premium popup card — compact, flush hero */}
              <div className="w-[232px] font-sans text-slate-900">
                {/* Hero */}
                <div className="relative h-[60px] w-full overflow-hidden bg-slate-200">
                  {p.heroImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.heroImage} alt={p.companyName} className="h-full w-full object-cover" />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${p.pinColor}, rgba(15,23,42,0.85))` }}
                    >
                      <span className="text-2xl font-black text-white/90">{p.initials}</span>
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                  <div className="absolute left-2 top-2 flex gap-1">
                    {p.featured && (
                      <span className="rounded-full bg-amber-400/95 px-1.5 py-0.5 text-[9px] font-bold text-amber-900 shadow-sm">★</span>
                    )}
                    {p.emergency24h && (
                      <span className="rounded-full bg-red-600/95 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">24/7</span>
                    )}
                  </div>
                  <span className="absolute bottom-1.5 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold capitalize text-slate-800 shadow-sm backdrop-blur-sm">
                    {p.trade}
                  </span>
                </div>

                {/* Body */}
                <div className="p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-[13px] font-bold text-slate-900">{p.companyName}</p>
                    <span className="flex shrink-0 items-center gap-0.5 text-[11.5px]">
                      <span className="text-amber-400">★</span>
                      <span className="font-bold text-slate-900">{p.rating}</span>
                      <span className="text-slate-400">({p.reviewCount})</span>
                    </span>
                  </div>

                  <div className="mt-0.5 flex items-center justify-between gap-2 text-[11px]">
                    <span className="flex items-center gap-1 truncate text-slate-500">
                      <span className="text-rose-500">📍</span> {p.location}
                    </span>
                    <span className="shrink-0 font-extrabold text-slate-900">
                      <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">From </span>£{(p.fromPrice / 100).toFixed(0)}
                    </span>
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-1">
                    <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9.5px] font-bold text-emerald-600">⚡ {p.responseTime}</span>
                    {p.vetted && (
                      <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9.5px] font-bold text-emerald-700">✓ Vetted</span>
                    )}
                    {p.insured && (
                      <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[9.5px] font-bold text-blue-700">🛡 Insured</span>
                    )}
                  </div>

                  <div className="mt-2 flex gap-1.5">
                    <a
                      href={`${basePath}/${p.slug}`}
                      className="flex-1 rounded-lg border border-slate-200 py-1.5 text-center text-[11px] font-bold no-underline transition-colors hover:bg-slate-50"
                    >
                      <span className="text-slate-700">Profile</span>
                    </a>
                    <a
                      href={`${basePath}/${p.slug}/book`}
                      className="flex-1 rounded-lg bg-blue-600 py-1.5 text-center text-[11px] font-bold no-underline transition-colors hover:bg-blue-700"
                    >
                      <span className="text-white">Book →</span>
                    </a>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        </Fragment>
      ))}
    </MapContainer>
  )
}
