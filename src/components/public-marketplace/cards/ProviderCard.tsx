'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Clock, Heart, MapPin, Shield, Star, Zap } from 'lucide-react'
import { formatPence } from '@/lib/marketplace/money'
import type { PublicProvider } from '@/lib/public-marketplace/types'

/* ──────────────────────────────────────────────────────────────────────────
   ProviderCard — Airtasker/Upwork-style card for supplier/trade providers.

   Updated design (FIX-140):
   - 160px full-bleed banner image at top (falls back to gradient)
   - 56px avatar circle overlapping the banner at -bottom-7 left-4
   - Save heart in the banner top-right
   - Provider name, trade, rating, bio snippet, meta, trust badges below
   - No dark: classes. All interactive elements have aria-label + focus rings.
─────────────────────────────────────────────────────────────────────────── */

export default function ProviderCard({
  provider,
  basePath = '/providers',
  bannerImage,
}: {
  provider: PublicProvider
  basePath?: string
  /** Optional override for the banner image. Falls back to provider.heroImage,
   *  then a slate gradient if neither is provided or both fail. */
  bannerImage?: string
}) {
  const [saved, setSaved] = useState(false)
  const [bannerErr, setBannerErr] = useState(false)

  const bannerSrc = bannerImage || provider.heroImage
  const showBanner = !!bannerSrc && !bannerErr

  return (
    <article className="border border-slate-200 rounded-2xl overflow-hidden bg-white transition-shadow duration-200 hover:shadow-md font-sans">
      {/* ── Banner image (160px tall, full-bleed) ── */}
      <div className="relative h-[160px] bg-slate-100 overflow-hidden">
        {showBanner ? (
          <Image
            src={bannerSrc}
            alt={`${provider.companyName} — banner`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
            onError={() => setBannerErr(true)}
          />
        ) : (
          /* Fallback gradient when no image */
          <div className="absolute inset-0 bg-gradient-to-br from-slate-500 to-slate-700" />
        )}
        {/* Subtle scrim for legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />

        {/* Save / heart button — top-right of banner */}
        <button
          type="button"
          onClick={() => setSaved((s) => !s)}
          aria-label={saved ? `Remove ${provider.companyName} from saved` : `Save ${provider.companyName}`}
          className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
        >
          <Heart
            className={`h-4 w-4 transition-colors ${saved ? 'fill-rose-500 text-rose-500' : ''}`}
            aria-hidden="true"
          />
        </button>

        {/* Provider avatar — overlapping bottom-left of banner */}
        <div className="absolute -bottom-7 left-4 z-10 h-14 w-14 overflow-hidden rounded-full border-2 border-white shadow-md bg-slate-100">
          {provider.logo ? (
            <Image
              src={provider.logo}
              alt={`${provider.companyName} logo`}
              fill
              className="object-cover"
              sizes="56px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-200 text-slate-500 text-[18px] font-bold">
              {provider.companyName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* ── Card body — pt-10 clears the overlapping 56px avatar ── */}
      <div className="pt-10 px-4 pb-4">
        {/* Provider name + Pro badge */}
        <div className="flex items-center gap-1.5 min-w-0">
          <h3 className="truncate text-[15px] font-bold text-slate-900">{provider.companyName}</h3>
          {provider.proBadge && (
            <span className="shrink-0 rounded-md bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
              Pro
            </span>
          )}
        </div>

        {/* Trade + rating */}
        <p className="mt-0.5 text-[12px] text-slate-500">{provider.trade} Services</p>
        <div className="mt-1 flex items-center gap-1 text-[13px]">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
          <span className="font-semibold text-slate-900">{provider.rating}</span>
          <span className="text-slate-500">({provider.reviewCount})</span>
        </div>

        {/* Divider */}
        <div className="my-3 border-t border-slate-100" />

        {/* Bio snippet */}
        <p className="line-clamp-2 text-sm text-slate-600">
          {provider.trade} services — expert team covering residential and commercial properties.
        </p>

        {/* Meta row */}
        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-slate-500">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {provider.location}
          </span>
          <span className="flex items-center gap-1 text-amber-600">
            <Zap className="h-3.5 w-3.5" aria-hidden="true" />
            ~{provider.responseTime} response
          </span>
        </div>

        {/* Trust badges */}
        <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
          {provider.vetted && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              <span className="text-emerald-600">✓</span> Vetted
            </span>
          )}
          {provider.insured && (
            <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
              <Shield className="h-3 w-3" aria-hidden="true" /> Insured
            </span>
          )}
          {provider.emergency24h && (
            <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
              <Clock className="h-3 w-3" aria-hidden="true" /> 24/7
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="my-3 border-t border-slate-100" />

        {/* Footer: price + CTA */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">From</p>
            <p className="text-[18px] font-bold text-slate-900">
              {formatPence(provider.fromPrice)}
              <span className="text-[13px] font-normal text-slate-500">/visit</span>
            </p>
          </div>
          <Link
            href={`${basePath}/${provider.slug}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            Contact
          </Link>
        </div>
      </div>
    </article>
  )
}
