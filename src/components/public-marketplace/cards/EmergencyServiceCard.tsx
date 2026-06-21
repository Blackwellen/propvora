'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, Phone, Shield, Siren, Star, Zap } from 'lucide-react'
import { formatPence } from '@/lib/marketplace/money'
import type { PublicEmergencyService } from '@/lib/public-marketplace/types'

/* ─────────────────────────────────────────────────────────────────────────
   EmergencyServiceCard — Airbnb-style clean card with red urgency treatment.

   Image with red scrim overlays (response time + price), then text below.
   Emergency CTA buttons kept (time-critical UX).
   No dark: classes. No hardcoded hex.
───────────────────────────────────────────────────────────────────────── */

const STORAGE_KEY = 'propvora_saved_emergency'

function getSaved(): string[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}
function toggleSaved(id: string): boolean {
  const list = getSaved(); const idx = list.indexOf(id)
  if (idx === -1) { list.push(id) } else { list.splice(idx, 1) }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); return idx === -1
}

export default function EmergencyServiceCard({
  service,
  basePath = '/property-manager/marketplace/suppliers-hub/emergency',
}: {
  service: PublicEmergencyService
  basePath?: string
}) {
  const [saved, setSaved] = useState(false)
  const [imgErr, setImgErr] = useState(false)

  useEffect(() => { setSaved(getSaved().includes(service.slug)) }, [service.slug])

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    setSaved(toggleSaved(service.slug))
  }

  const showImg = !!service.heroImage && !imgErr
  const shownPcs = service.coveragePostcodes.slice(0, 3)
  const extra = service.coveragePostcodes.length - 3

  return (
    <article className="group block font-sans">
      {/* ── Image ─────────────────────────────────────────────────────────── */}
      <Link href={`${basePath}/${service.slug}`} className="block">
        <div className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl bg-red-950">
          {showImg ? (
            <Image
              src={service.heroImage}
              alt={service.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onError={() => setImgErr(true)}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-red-700 to-red-950" />
          )}

          {/* Deep red scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-red-950/85 via-red-900/20 to-black/30 pointer-events-none" />

          {/* EMERGENCY badge top-left */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-red-600/95 px-2.5 py-1 shadow-md backdrop-blur-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
            </span>
            <Siren className="h-3 w-3 text-white" />
            <span className="text-[11px] font-bold text-white">EMERGENCY 24/7</span>
          </div>

          {/* Heart — top-right */}
          <button
            type="button"
            onClick={handleSave}
            aria-label={saved ? 'Remove from saved' : 'Save service'}
            className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-slate-700 shadow-sm backdrop-blur-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Heart className={`h-4 w-4 ${saved ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>

          {/* Response time — bottom-left */}
          <div className="absolute bottom-3 left-3 z-10">
            <p className="text-[22px] font-black text-white leading-none">
              {service.responseTimeMin}–{service.responseTimeMax}
              <span className="text-[13px] font-bold"> min</span>
            </p>
            <p className="text-[10px] text-white/70 font-semibold uppercase tracking-wider">response</p>
          </div>

          {/* Price — bottom-right */}
          <div className="absolute bottom-3 right-3 z-10 text-right">
            <p className="text-[10px] text-white/60 font-medium leading-none mb-0.5">From</p>
            <p className="text-[15px] font-extrabold text-white">{formatPence(service.baseCalloutPrice)}</p>
            {service.noCalloutFee && (
              <p className="text-[10px] text-emerald-300 font-bold">No call-out fee</p>
            )}
          </div>
        </div>
      </Link>

      {/* ── Text body ─────────────────────────────────────────────────────── */}
      <Link href={`${basePath}/${service.slug}`} className="block mt-2.5 space-y-0.5 px-0.5 focus-visible:outline-none">
        {/* Row 1: Title + rating */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-[14px] font-semibold text-slate-900 truncate">{service.title}</p>
          <span className="flex shrink-0 items-center gap-0.5 text-[13px] text-slate-800">
            <Star className="h-3.5 w-3.5 fill-slate-800 text-slate-800" />
            <span className="font-semibold">{service.rating}</span>
            <span className="text-slate-500 text-[12px]"> ({service.reviewCount})</span>
          </span>
        </div>
        {/* Row 2: Provider + available */}
        <div className="flex items-center gap-2 text-[13px] text-slate-500">
          <span className="truncate">{service.providerName}</span>
          {service.available24h && (
            <span className="flex items-center gap-1 text-emerald-600 font-semibold shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Available now
            </span>
          )}
        </div>
        {/* Row 3: Coverage postcodes */}
        {shownPcs.length > 0 && (
          <p className="text-[12px] text-slate-400 flex flex-wrap gap-1 pt-0.5">
            {shownPcs.map(pc => <span key={pc} className="rounded bg-slate-100 px-1.5 py-0.5">{pc}</span>)}
            {extra > 0 && <span className="text-slate-400">+{extra} more</span>}
          </p>
        )}
        {/* Row 4: Trust */}
        <p className="flex items-center gap-2 text-[12px] text-slate-400 flex-wrap pt-0.5">
          {service.policeVetted && <span>🛡 Police vetted</span>}
          {service.insured && <span className="flex items-center gap-0.5"><Shield className="h-3 w-3" />Insured</span>}
          {service.noCalloutFee && <span className="flex items-center gap-0.5"><Zap className="h-3 w-3" />No call-out fee</span>}
        </p>
      </Link>

      {/* ── Emergency CTAs ───────────────────────────────────────────────── */}
      <div className="flex gap-2 mt-2.5 px-0.5">
        {service.phone && (
          <a
            href={`tel:${service.phone}`}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-red-600 py-2 text-xs font-bold text-white shadow-[0_2px_8px_rgba(220,38,38,0.35)] transition-all hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
          >
            <Phone className="h-3.5 w-3.5" />
            Call Now
          </a>
        )}
        <Link
          href={`${basePath}/${service.slug}`}
          className="flex-1 flex items-center justify-center rounded-xl border border-red-300 py-2 text-xs font-bold text-red-700 transition-all hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
        >
          Book Emergency
        </Link>
      </div>
    </article>
  )
}
