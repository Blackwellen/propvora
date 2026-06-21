'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { BadgeCheck, Clock, Heart, MapPin, Shield, Star, Zap } from 'lucide-react'
import { formatPence } from '@/lib/marketplace/money'
import type { PublicProvider } from '@/lib/public-marketplace/types'

/* ─────────────────────────────────────────────────────────────────────────
   ProviderCard — Airbnb-style clean card (no box/border/buttons).

   Image (aspect-[3/2], rounded-2xl) with overlays, then minimal text below.
   Whole card is a Link → provider profile page.
   No dark: classes. No hardcoded hex.
───────────────────────────────────────────────────────────────────────── */

const STORAGE_KEY = 'propvora_saved_suppliers'

function getSaved(): string[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}
function toggleSaved(id: string): boolean {
  const list = getSaved(); const idx = list.indexOf(id)
  if (idx === -1) { list.push(id) } else { list.splice(idx, 1) }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); return idx === -1
}

export default function ProviderCard({
  provider,
  basePath = '/property-manager/marketplace/suppliers-hub',
  featured = false,
}: {
  provider: PublicProvider
  basePath?: string
  featured?: boolean
}) {
  const [saved, setSaved] = useState(false)
  const [imgErr, setImgErr] = useState(false)

  useEffect(() => { setSaved(getSaved().includes(provider.slug)) }, [provider.slug])

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    setSaved(toggleSaved(provider.slug))
  }

  const showImg = !!provider.heroImage && !imgErr

  return (
    <Link href={`${basePath}/${provider.slug}`} className="group block font-sans">
      {/* ── Image ─────────────────────────────────────────────────────────── */}
      <div className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl bg-slate-200">
        {showImg ? (
          <Image
            src={provider.heroImage}
            alt={provider.companyName}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-500 to-slate-800 flex items-center justify-center">
            <span className="text-white/20 text-6xl font-black select-none">{provider.companyName.charAt(0)}</span>
          </div>
        )}

        {/* Bottom scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

        {/* Featured badge — top-left */}
        {featured && (
          <span className="absolute top-3 left-3 z-10 flex items-center gap-1 rounded-full bg-amber-400/95 px-2.5 py-1 text-[11px] font-bold text-amber-900 shadow-sm backdrop-blur-sm">
            <Star className="h-3 w-3 fill-amber-900" /> Featured
          </span>
        )}

        {/* Heart — top-right */}
        <button
          type="button"
          onClick={handleSave}
          aria-label={saved ? 'Remove from saved' : 'Save supplier'}
          className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-slate-700 shadow-sm backdrop-blur-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <Heart className={`h-4 w-4 ${saved ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>

        {/* Trade badge + trust badges — bottom-left */}
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5">
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-800 backdrop-blur-sm shadow-sm">
            {provider.trade}
          </span>
          {provider.vetted && (
            <span className="flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 backdrop-blur-sm shadow-sm">
              <BadgeCheck className="h-3 w-3" /> Vetted
            </span>
          )}
          {provider.emergency24h && (
            <span className="flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-red-700 backdrop-blur-sm shadow-sm">
              <Zap className="h-3 w-3" /> 24/7
            </span>
          )}
        </div>
      </div>

      {/* ── Text body ─────────────────────────────────────────────────────── */}
      <div className="mt-2.5 space-y-0.5 px-0.5">
        {/* Row 1: Name + rating */}
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-[14px] font-semibold text-slate-900">{provider.companyName}</p>
          <span className="flex shrink-0 items-center gap-0.5 text-[13px] text-slate-800">
            <Star className="h-3.5 w-3.5 fill-slate-800 text-slate-800" />
            <span className="font-semibold">{provider.rating}</span>
            <span className="text-slate-500 text-[12px]"> ({provider.reviewCount})</span>
          </span>
        </div>
        {/* Row 2: Location */}
        <p className="flex items-center gap-1 text-[13px] text-slate-500 truncate">
          <MapPin className="h-3 w-3 shrink-0" />
          {provider.location}
        </p>
        {/* Row 3: Response time */}
        <p className="flex items-center gap-1 text-[13px] text-slate-500">
          <Clock className="h-3 w-3 shrink-0 text-blue-500" />
          Responds in {provider.responseTime}
        </p>
        {/* Row 4: Certs */}
        {(provider.gasSafe || provider.niceic || provider.insured) && (
          <p className="flex items-center gap-2 text-[12px] text-slate-400 flex-wrap pt-0.5">
            {provider.gasSafe && <span>🔥 Gas Safe</span>}
            {provider.niceic && <span>⚡ NICEIC</span>}
            {provider.insured && <span className="flex items-center gap-0.5"><Shield className="h-3 w-3" />Insured</span>}
          </p>
        )}
        {/* Row 5: Price */}
        <p className="pt-1 text-[14px] text-slate-900">
          <span className="font-bold">From {formatPence(provider.fromPrice)}</span>
          <span className="text-slate-500 font-normal"> /day</span>
        </p>
      </div>
    </Link>
  )
}
