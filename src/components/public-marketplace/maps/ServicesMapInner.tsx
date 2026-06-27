'use client'

import { Fragment, useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, AttributionControl } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { MAP_TILE_URL, MAP_TILE_ATTRIBUTION } from '@/lib/maps/tiles'
import type { PublicServiceOffer } from '@/lib/public-marketplace/types'
import { formatPence } from '@/lib/marketplace/money'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const TILE_URL = MAP_TILE_URL
const TILE_ATTRIBUTION = MAP_TILE_ATTRIBUTION

/** Premium blue price pin. */
function createServicePin(pricePence: number) {
  const label = formatPence(pricePence)
  return L.divIcon({
    html: `<div style="background:linear-gradient(135deg,#3B82F6 0%,var(--brand-strong) 100%);color:#fff;padding:5px 12px;border-radius:20px;font-weight:800;font-size:13px;white-space:nowrap;box-shadow:0 6px 18px rgba(37,99,235,0.42),0 1px 4px rgba(2,6,23,0.16);border:2px solid #fff;cursor:pointer;letter-spacing:-0.01em">${label}</div>`,
    className: '',
    iconAnchor: [34, 14],
    popupAnchor: [0, -16],
  })
}

function FitToOffers({ offers }: { offers: PublicServiceOffer[] }) {
  const map = useMap()
  useEffect(() => {
    if (!offers.length) return
    if (offers.length === 1) { map.setView([offers[0].lat, offers[0].lng], 11, { animate: false }); return }
    map.fitBounds(L.latLngBounds(offers.map(o => [o.lat, o.lng] as [number, number])), { padding: [60, 60], maxZoom: 12 })
  }, [map, offers])
  return null
}

export default function ServicesMapInner({ offers, basePath = '/services' }: { offers: PublicServiceOffer[]; basePath?: string }) {
  const [openId, setOpenId] = useState<string | null>(null)
  return (
    <MapContainer center={[53.4808, -2.2426]} zoom={11} style={{ height: '100%', width: '100%' }} attributionControl={false}>
      <AttributionControl prefix={false} position="bottomright" />
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} subdomains="abc" maxZoom={19} />
      <FitToOffers offers={offers} />

      {offers.map(offer => (
        <Fragment key={offer.id}>
          {openId === offer.id && (
            <Circle
              center={[offer.lat, offer.lng]}
              radius={2400}
              pathOptions={{ color: '#2563eb', weight: 1.5, fillColor: '#3b82f6', fillOpacity: 0.06, dashArray: '6,6' }}
            />
          )}
          <Marker
            position={[offer.lat, offer.lng]}
            icon={createServicePin(offer.basePrice)}
            eventHandlers={{
              popupopen: () => setOpenId(offer.id),
              popupclose: () => setOpenId((cur) => (cur === offer.id ? null : cur)),
            }}
          >
            <Popup className="propvora-map-popup" maxWidth={232} closeButton autoPan>
              <div className="w-[232px] font-sans text-slate-900">
                {/* Hero */}
                <div className="relative h-[60px] w-full overflow-hidden bg-slate-200">
                  {offer.heroImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={offer.heroImage} alt={offer.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--brand)] to-violet-700">
                      <span className="text-lg font-black text-white/90">{offer.title.charAt(0)}</span>
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                  <div className="absolute left-2 top-2 flex gap-1">
                    {offer.featured && <span className="rounded-full bg-amber-400/95 px-1.5 py-0.5 text-[9px] font-bold text-amber-900 shadow-sm">★</span>}
                    {offer.urgent && <span className="rounded-full bg-red-600/95 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">Urgent</span>}
                  </div>
                  <span className="absolute bottom-1.5 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold capitalize text-slate-800 shadow-sm backdrop-blur-sm">
                    {offer.category}
                  </span>
                </div>

                {/* Body */}
                <div className="p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-[13px] font-bold text-slate-900">{offer.title}</p>
                    <span className="flex shrink-0 items-center gap-0.5 text-[11.5px]">
                      <span className="text-amber-400">★</span>
                      <span className="font-bold text-slate-900">{offer.rating}</span>
                      <span className="text-slate-400">({offer.reviewCount})</span>
                    </span>
                  </div>

                  <div className="mt-0.5 flex items-center justify-between gap-2 text-[11px]">
                    <span className="truncate text-slate-500">{offer.providerName}</span>
                    <span className="shrink-0 font-extrabold text-slate-900">
                      <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">From </span>{formatPence(offer.basePrice)}
                    </span>
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-1">
                    {offer.verified && <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9.5px] font-bold text-emerald-700">✓ Verified</span>}
                    {offer.insured && <span className="rounded-full bg-[var(--brand-soft)] px-1.5 py-0.5 text-[9.5px] font-bold text-[var(--brand)]">🛡 Insured</span>}
                  </div>

                  <div className="mt-2 flex gap-1.5">
                    <a href={`${basePath}/${offer.slug}`} className="flex-1 rounded-lg border border-slate-200 py-1.5 text-center text-[11px] font-bold no-underline transition-colors hover:bg-slate-50">
                      <span className="text-slate-700">Details</span>
                    </a>
                    <a href={`${basePath}/${offer.slug}/book`} className="flex-1 rounded-lg bg-[var(--brand)] py-1.5 text-center text-[11px] font-bold no-underline transition-colors hover:bg-[var(--brand-strong)]">
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
