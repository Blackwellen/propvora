'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { BadgeCheck, ChevronRight, Clock, Heart, MapPin, Star, Zap } from 'lucide-react'
import { formatPence } from '@/lib/marketplace/money'
import { guardSave } from '@/lib/public-marketplace/save-guard'
import type { PublicProvider } from '@/lib/public-marketplace/types'

/* ─────────────────────────────────────────────────────────────────────────
   ProviderMapCard — premium horizontal card for the map-view left rail.
   Hero thumbnail (with trade pill + trust overlay) left, rich details right.
   Whole card is a Link → provider profile. No dark: classes. No hardcoded hex.
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

export default function ProviderMapCard({
  provider,
  basePath = '/property-manager/marketplace/suppliers-hub',
}: {
  provider: PublicProvider
  basePath?: string
}) {
  const [saved, setSaved] = useState(false)
  const [imgErr, setImgErr] = useState(false)

  useEffect(() => { setSaved(getSaved().includes(provider.slug)) }, [provider.slug])

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    if (!(await guardSave())) return
    setSaved(toggleSaved(provider.slug))
  }

  const showImg = !!provider.heroImage && !imgErr

  return (
    <Link
      href={`${basePath}/${provider.slug}`}
      className="group relative flex gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-0.5 hover:border-[var(--color-brand-100)] hover:shadow-[0_12px_28px_rgba(15,23,42,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
    >
      {/* Thumbnail */}
      <div className="relative h-[116px] w-[116px] shrink-0 overflow-hidden rounded-xl bg-slate-200">
        {showImg ? (
          <Image
            src={provider.heroImage}
            alt={provider.companyName}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.07]"
            sizes="116px"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${provider.pinColor}, rgba(15,23,42,0.85))` }}
          >
            <span className="text-2xl font-black text-white/90 select-none">{provider.initials}</span>
          </div>
        )}

        {/* Scrim + trade pill */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
        <span className="absolute bottom-1.5 left-1.5 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-slate-800 shadow-sm backdrop-blur-sm">
          {provider.trade}
        </span>
        {provider.featured && (
          <span className="absolute left-1.5 top-1.5 rounded-full bg-amber-400/95 px-1.5 py-0.5 text-[9.5px] font-bold text-amber-900 shadow-sm">★</span>
        )}

        {/* Save */}
        <button
          type="button"
          onClick={handleSave}
          aria-label={saved ? 'Remove from saved' : 'Save supplier'}
          className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/85 text-slate-700 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
        >
          <Heart className={`h-3.5 w-3.5 ${saved ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>
      </div>

      {/* Details */}
      <div className="flex min-w-0 flex-1 flex-col py-0.5">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-[14.5px] font-bold text-slate-900">{provider.companyName}</p>
          <span className="flex shrink-0 items-center gap-0.5 text-[12.5px] text-slate-800">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="font-semibold">{provider.rating}</span>
            <span className="text-slate-400">({provider.reviewCount})</span>
          </span>
        </div>

        <p className="mt-0.5 flex items-center gap-1 truncate text-[12px] text-slate-500">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{provider.location}</span>
        </p>

        <p className="mt-1 flex items-center gap-1 text-[12px] font-medium text-emerald-600">
          <Clock className="h-3 w-3 shrink-0" />
          Responds in {provider.responseTime}
        </p>

        {/* Trust / cert chips */}
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          {provider.vetted && (
            <span className="flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
              <BadgeCheck className="h-2.5 w-2.5" /> Vetted
            </span>
          )}
          {provider.gasSafe && (
            <span className="rounded-full bg-orange-50 px-1.5 py-0.5 text-[10px] font-bold text-orange-700">Gas Safe</span>
          )}
          {provider.niceic && (
            <span className="rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-bold text-violet-700">NICEIC</span>
          )}
          {provider.emergency24h && (
            <span className="flex items-center gap-0.5 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
              <Zap className="h-2.5 w-2.5" /> 24/7
            </span>
          )}
        </div>

        {/* Price + view affordance */}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-1.5">
          <p className="text-[14px] font-extrabold text-slate-900">
            {formatPence(provider.fromPrice)}
            <span className="text-[11px] font-normal text-slate-500"> /day</span>
          </p>
          <span className="flex items-center gap-0.5 text-[11px] font-bold text-[var(--brand)] opacity-0 transition-opacity group-hover:opacity-100">
            View <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  )
}
