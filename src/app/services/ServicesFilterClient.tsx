'use client'

import { Suspense, useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import ProviderCard from '@/components/public-marketplace/cards/ProviderCard'
import ServiceOfferCard from '@/components/public-marketplace/cards/ServiceOfferCard'
import EmergencyServiceCard from '@/components/public-marketplace/cards/EmergencyServiceCard'
import FilterBar, { type FilterDef, type FilterState, rangeOf, selectedOf, countOf, toggleOf } from '@/components/public-marketplace/FilterBar'
import type { PublicProvider, PublicServiceOffer, PublicEmergencyService } from '@/lib/public-marketplace/types'

const PAGE_SIZE = 12

// Build a £ range def from a set of pence values.
function priceDef(id: string, pences: number[]): Extract<FilterDef, { kind: 'range' }> {
  const pounds = pences.map(p => Math.round(p / 100)).filter(n => n > 0)
  const min = pounds.length ? Math.max(0, Math.floor(Math.min(...pounds) / 10) * 10) : 0
  const max = pounds.length ? Math.ceil(Math.max(...pounds) / 50) * 50 : 1000
  return { id, label: 'Price', kind: 'range', min, max: Math.max(max, min + 50), step: 10, prefix: '£' }
}

function multiDef(id: string, label: string, values: string[]): Extract<FilterDef, { kind: 'multi' }> {
  const uniq = [...new Set(values.filter(Boolean))].sort()
  return { id, label, kind: 'multi', options: uniq.map(v => ({ value: v, label: v })) }
}

const TABS = [
  { key: 'suppliers', label: 'Suppliers & Trades' },
  { key: 'services', label: 'Service Packages' },
  { key: 'emergency', label: '🚨 Emergency' },
] as const

type TabKey = (typeof TABS)[number]['key']

interface Props {
  providers: PublicProvider[]
  allOffers: PublicServiceOffer[]
  emergency: PublicEmergencyService[]
}

function ServicesInner({ providers, allOffers, emergency }: Props) {
  const searchParams = useSearchParams()
  const queryParam = searchParams?.get('q')?.toLowerCase() ?? ''
  const locationParam = searchParams?.get('location')?.toLowerCase() ?? ''

  const [activeTab, setActiveTab] = useState<TabKey>('suppliers')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [fSuppliers, setFSuppliers] = useState<FilterState>({})
  const [fServices, setFServices] = useState<FilterState>({})
  const [fEmergency, setFEmergency] = useState<FilterState>({})
  const sentinelRef = useRef<HTMLDivElement>(null)

  // ── Filter schemas (data-driven) ──
  const supplierDefs = useMemo<FilterDef[]>(() => [
    priceDef('price', providers.map(p => p.fromPrice)),
    multiDef('trade', 'Trade', providers.map(p => p.trade)),
    { id: 'rating', label: 'Rating', kind: 'stepper', min: 0, max: 5, suffix: '★' },
    { id: 'vetted', label: 'Vetted', kind: 'toggle' },
    { id: 'insured', label: 'Insured', kind: 'toggle' },
    { id: 'pro', label: 'Pro', kind: 'toggle' },
    { id: 'emergency24h', label: '24/7', kind: 'toggle' },
  ], [providers])

  const serviceDefs = useMemo<FilterDef[]>(() => [
    priceDef('price', allOffers.map(o => o.basePrice)),
    multiDef('category', 'Category', allOffers.map(o => o.category)),
    { id: 'rating', label: 'Rating', kind: 'stepper', min: 0, max: 5, suffix: '★' },
    { id: 'verified', label: 'Verified', kind: 'toggle' },
    { id: 'insured', label: 'Insured', kind: 'toggle' },
    { id: 'urgent', label: 'Urgent', kind: 'toggle' },
  ], [allOffers])

  const emergencyDefs = useMemo<FilterDef[]>(() => {
    const resp = emergency.map(e => e.responseTimeMax).filter(n => n > 0)
    const maxResp = resp.length ? Math.ceil(Math.max(...resp) / 15) * 15 : 120
    return [
      multiDef('category', 'Category', emergency.map(e => e.category)),
      { id: 'response', label: 'Response', kind: 'range', min: 0, max: maxResp, step: 5, unit: ' min' },
      { id: 'available24h', label: 'Available 24/7', kind: 'toggle' },
      { id: 'policeVetted', label: 'Police vetted', kind: 'toggle' },
      { id: 'insured', label: 'Insured', kind: 'toggle' },
      { id: 'noCalloutFee', label: 'No call-out fee', kind: 'toggle' },
    ]
  }, [emergency])

  const filteredProviders = useMemo(() => {
    let r = providers
    if (queryParam) r = r.filter(p => p.trade.toLowerCase().includes(queryParam) || p.companyName.toLowerCase().includes(queryParam))
    if (locationParam) r = r.filter(p => p.location.toLowerCase().includes(locationParam) || p.city.toLowerCase().includes(locationParam))
    const pr = rangeOf(fSuppliers, 'price')
    if (pr) { const def = supplierDefs.find(d => d.id === 'price'); const hb = def && def.kind === 'range' ? def.max : pr[1]; r = r.filter(p => { const v = p.fromPrice / 100; return v >= pr[0] && (pr[1] >= hb ? true : v <= pr[1]) }) }
    const trades = selectedOf(fSuppliers, 'trade')
    if (trades.length) r = r.filter(p => trades.includes(p.trade))
    const minR = countOf(fSuppliers, 'rating')
    if (minR > 0) r = r.filter(p => p.rating >= minR)
    if (toggleOf(fSuppliers, 'vetted')) r = r.filter(p => p.vetted)
    if (toggleOf(fSuppliers, 'insured')) r = r.filter(p => p.insured)
    if (toggleOf(fSuppliers, 'pro')) r = r.filter(p => p.proBadge)
    if (toggleOf(fSuppliers, 'emergency24h')) r = r.filter(p => p.emergency24h)
    return r
  }, [providers, queryParam, locationParam, fSuppliers, supplierDefs])

  const filteredOffers = useMemo(() => {
    let r = allOffers
    if (queryParam) r = r.filter(o => o.title.toLowerCase().includes(queryParam) || o.category.toLowerCase().includes(queryParam))
    if (locationParam) r = r.filter(o => o.location.toLowerCase().includes(locationParam) || o.city.toLowerCase().includes(locationParam))
    const pr = rangeOf(fServices, 'price')
    if (pr) { const def = serviceDefs.find(d => d.id === 'price'); const hb = def && def.kind === 'range' ? def.max : pr[1]; r = r.filter(o => { const v = o.basePrice / 100; return v >= pr[0] && (pr[1] >= hb ? true : v <= pr[1]) }) }
    const cats = selectedOf(fServices, 'category')
    if (cats.length) r = r.filter(o => cats.includes(o.category))
    const minR = countOf(fServices, 'rating')
    if (minR > 0) r = r.filter(o => o.rating >= minR)
    if (toggleOf(fServices, 'verified')) r = r.filter(o => o.verified)
    if (toggleOf(fServices, 'insured')) r = r.filter(o => o.insured)
    if (toggleOf(fServices, 'urgent')) r = r.filter(o => o.urgent)
    return r
  }, [allOffers, queryParam, locationParam, fServices, serviceDefs])

  const filteredEmergency = useMemo(() => {
    let r = emergency
    if (queryParam) r = r.filter(e => e.title.toLowerCase().includes(queryParam) || e.category.toLowerCase().includes(queryParam))
    if (locationParam) r = r.filter(e => e.location.toLowerCase().includes(locationParam))
    const cats = selectedOf(fEmergency, 'category')
    if (cats.length) r = r.filter(e => cats.includes(e.category))
    const rr = rangeOf(fEmergency, 'response')
    if (rr) r = r.filter(e => e.responseTimeMax >= rr[0] && e.responseTimeMax <= rr[1])
    if (toggleOf(fEmergency, 'available24h')) r = r.filter(e => e.available24h)
    if (toggleOf(fEmergency, 'policeVetted')) r = r.filter(e => e.policeVetted)
    if (toggleOf(fEmergency, 'insured')) r = r.filter(e => e.insured)
    if (toggleOf(fEmergency, 'noCalloutFee')) r = r.filter(e => e.noCalloutFee)
    return r
  }, [emergency, queryParam, locationParam, fEmergency])

  const counts = { suppliers: filteredProviders.length, services: filteredOffers.length, emergency: filteredEmergency.length }

  useEffect(() => { setVisibleCount(PAGE_SIZE) }, [activeTab, queryParam, locationParam, fSuppliers, fServices, fEmergency])

  const currentList = activeTab === 'suppliers' ? filteredProviders : activeTab === 'services' ? filteredOffers : filteredEmergency
  const visible = currentList.slice(0, visibleCount)
  const hasMore = visibleCount < currentList.length

  const loadMore = useCallback(() => {
    setVisibleCount(c => Math.min(c + PAGE_SIZE, currentList.length))
  }, [currentList.length])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting && hasMore) loadMore() },
      { rootMargin: '200px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loadMore])

  return (
    <>
      {/* ── Active search context ── */}
      {(queryParam || locationParam) && (
        <div className="bg-blue-50 border-b border-blue-100 px-6 lg:px-10 py-3 flex flex-wrap items-center gap-2 text-[13px]">
          <span className="text-slate-500">Results for</span>
          {queryParam && <span className="bg-blue-100 text-blue-800 rounded-full px-3 py-0.5 font-medium">{queryParam}</span>}
          {locationParam && <span className="bg-blue-100 text-blue-800 rounded-full px-3 py-0.5 font-medium">📍 {locationParam}</span>}
          <a href="/services" className="ml-auto text-slate-500 hover:text-slate-700 underline underline-offset-2 text-[12px]">Clear</a>
        </div>
      )}

      {/* ── Tab bar ── */}
      <div className="border-b border-slate-200 bg-white px-6 lg:px-10">
        <div className="flex gap-0 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {TABS.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={[
                'shrink-0 px-5 py-4 text-[14px] font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800',
              ].join(' ')}
            >
              {tab.label}
              <span className={[
                'ml-1.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold',
                activeTab === tab.key ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500',
              ].join(' ')}>
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Filter bar (per tab) ── */}
      <div className="border-b border-slate-100 bg-white px-6 lg:px-10 py-3 sticky top-20 z-30">
        <div className="max-w-[1400px] mx-auto">
          {activeTab === 'suppliers' && <FilterBar filters={supplierDefs} value={fSuppliers} onChange={setFSuppliers} />}
          {activeTab === 'services' && <FilterBar filters={serviceDefs} value={fServices} onChange={setFServices} />}
          {activeTab === 'emergency' && <FilterBar filters={emergencyDefs} value={fEmergency} onChange={setFEmergency} />}
        </div>
      </div>

      {/* ── Results ── */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8">
        {activeTab === 'suppliers' && (
          filteredProviders.length === 0 ? (
            <EmptyState message="No suppliers found. Try adjusting your search." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {(visible as PublicProvider[]).map(p => (
                <ProviderCard key={p.id} provider={p} basePath="/providers" />
              ))}
            </div>
          )
        )}

        {activeTab === 'services' && (
          filteredOffers.length === 0 ? (
            <EmptyState message="No service packages found. Try adjusting your search." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(visible as PublicServiceOffer[]).map(o => (
                <ServiceOfferCard key={o.id} offer={o} basePath="/services/offer" />
              ))}
            </div>
          )
        )}

        {activeTab === 'emergency' && (
          filteredEmergency.length === 0 ? (
            <EmptyState message="No emergency services found in your area." />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {(visible as PublicEmergencyService[]).map(e => (
                <EmergencyServiceCard key={e.id} service={e} basePath="/emergency" />
              ))}
            </div>
          )
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-4" />
        {hasMore && (
          <div className="flex items-center justify-center py-8 gap-2 text-slate-500 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading more…
          </div>
        )}
      </div>
    </>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-2xl mb-4">🔍</div>
      <p className="text-slate-600 text-[15px]">{message}</p>
    </div>
  )
}

export default function ServicesFilterClient(props: Props) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20 text-slate-400 text-[14px]">
        Loading services…
      </div>
    }>
      <ServicesInner {...props} />
    </Suspense>
  )
}
