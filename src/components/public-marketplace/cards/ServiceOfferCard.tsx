'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, MapPin, Shield, Star } from 'lucide-react'
import { formatPence } from '@/lib/marketplace/money'
import type { PublicServiceOffer } from '@/lib/public-marketplace/types'

/* ─────────────────────────────────────────────────────────────────────────
   ServiceOfferCard — Airbnb/Fiverr-style clean card (no box/border).

   Image (aspect-[3/2], rounded-2xl) with status badge + heart, then minimal
   text below. Whole card is a Link → service profile page.
   No dark: classes. No hardcoded hex.
───────────────────────────────────────────────────────────────────────── */

const STORAGE_KEY = 'propvora_saved_services'

function getSaved(): string[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}
function toggleSaved(id: string): boolean {
  const list = getSaved(); const idx = list.indexOf(id)
  if (idx === -1) { list.push(id) } else { list.splice(idx, 1) }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); return idx === -1
}

export default function ServiceOfferCard({
  offer,
  featured = false,
  basePath = '/property-manager/marketplace/suppliers-hub/services',
}: {
  offer: PublicServiceOffer
  featured?: boolean
  basePath?: string
}) {
  const [saved, setSaved] = useState(false)
  const [imgErr, setImgErr] = useState(false)
  const [avatarErr, setAvatarErr] = useState(false)

  useEffect(() => { setSaved(getSaved().includes(offer.slug)) }, [offer.slug])

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    setSaved(toggleSaved(offer.slug))
  }

  const showImg = !!offer.heroImage && !imgErr
  const pkgs = offer.packages && offer.packages.length >= 2 ? offer.packages.slice(0, 3) : null

  const topBadge = featured
    ? { label: '⭐ Featured', cls: 'bg-amber-400/95 text-amber-900' }
    : offer.urgent
      ? { label: '🚨 Urgent', cls: 'bg-red-600/95 text-white' }
      : offer.verified
        ? { label: '✓ Verified', cls: 'bg-emerald-600/95 text-white' }
        : null

  return (
    <Link href={`${basePath}/${offer.slug}`} className="group block font-sans">
      {/* ── Image ─────────────────────────────────────────────────────────── */}
      <div className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl bg-slate-200">
        {showImg ? (
          <Image
            src={offer.heroImage}
            alt={offer.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-violet-700" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

        {/* Status badge — top-left */}
        {topBadge && (
          <span className={`absolute top-3 left-3 z-10 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm backdrop-blur-sm ${topBadge.cls}`}>
            {topBadge.label}
          </span>
        )}

        {/* Heart — top-right */}
        <button
          type="button"
          onClick={handleSave}
          aria-label={saved ? 'Remove from saved' : 'Save service'}
          className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-slate-700 shadow-sm backdrop-blur-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <Heart className={`h-4 w-4 ${saved ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>

        {/* Provider avatar + name — bottom-left */}
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2">
          <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border border-white/60 bg-slate-300">
            {offer.providerAvatar && !avatarErr ? (
              <Image src={offer.providerAvatar} alt={offer.providerName} fill className="object-cover" sizes="28px" onError={() => setAvatarErr(true)} />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-blue-600 text-white text-[10px] font-bold">{offer.providerName.charAt(0)}</div>
            )}
          </div>
          <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-semibold text-slate-800 backdrop-blur-sm shadow-sm max-w-[140px] truncate">
            {offer.providerName}
          </span>
        </div>
      </div>

      {/* ── Text body ─────────────────────────────────────────────────────── */}
      <div className="mt-2.5 space-y-0.5 px-0.5">
        {/* Row 1: Title + rating */}
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-1 text-[14px] font-semibold text-slate-900">{offer.title}</p>
          <span className="flex shrink-0 items-center gap-0.5 text-[13px] text-slate-800">
            <Star className="h-3.5 w-3.5 fill-slate-800 text-slate-800" />
            <span className="font-semibold">{offer.rating}</span>
            <span className="text-slate-500 text-[12px]"> ({offer.reviewCount})</span>
          </span>
        </div>
        {/* Row 2: Category + location */}
        <p className="flex items-center gap-2 text-[13px] text-slate-500 truncate">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{offer.category}</span>
          <span className="flex items-center gap-1 truncate"><MapPin className="h-3 w-3 shrink-0" />{offer.location}</span>
        </p>
        {/* Row 3: Insurance badge */}
        {offer.insured && (
          <p className="flex items-center gap-1 text-[12px] text-slate-400">
            <Shield className="h-3 w-3" /> Fully insured
          </p>
        )}
        {/* Row 4: Pricing */}
        {pkgs ? (
          <div className="flex gap-1.5 pt-1">
            {pkgs.map((pkg, i) => (
              <span
                key={pkg.name}
                className={`rounded-lg px-2 py-1 text-[11px] font-semibold border ${i === 1 ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}
              >
                {pkg.name} · {formatPence(pkg.price)}
              </span>
            ))}
          </div>
        ) : (
          <p className="pt-1 text-[14px] text-slate-900">
            <span className="font-bold">From {formatPence(offer.basePrice)}</span>
          </p>
        )}
      </div>
    </Link>
  )
}
