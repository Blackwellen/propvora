'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Star, MapPin, Zap, Heart, Phone, MessageSquare, Clock, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ──────────────────────────────────────────────────────────────────────────
   ServiceCard — premium hero-image card for services and emergency listings.

   Works with both the typed PublicService shape (public-marketplace/types.ts)
   and the live PublicListing shape from the search layer.

   Design: full-bleed 16:9 hero, provider avatar overlapping bottom-left,
   trade badge top-left, emergency badge when urgent, heart save, trust badges,
   dual CTA footer (Call + Contact/Request now).

   WCAG AA: all images have alt text, all interactive elements have aria-label
   or visible text, focus-visible rings on every interactive element.
   No dark: classes. Min card width 260px.
─────────────────────────────────────────────────────────────────────────── */

export interface PublicService {
  id: string
  slug: string
  title: string
  description: string
  trade: string
  category?: string
  heroImage: string
  providerName: string
  providerLogo: string
  rating: number
  reviewCount: number
  location: string
  responseTimeMin: number
  responseTimeMax: number
  fromPrice: number // pence
  isEmergency: boolean
  phone?: string
  vetted?: boolean
  insured?: boolean
}

interface ServiceCardProps {
  service: PublicService
  basePath?: string
  className?: string
}

export function ServiceCard({
  service,
  basePath = '/services',
  className = '',
}: ServiceCardProps) {
  const [saved, setSaved] = useState(false)
  const [imgErr, setImgErr] = useState(false)
  const [logoErr, setLogoErr] = useState(false)

  const priceFormatted = `£${(service.fromPrice / 100).toFixed(0)}`
  const href = `${basePath}/${service.slug}`

  return (
    <article
      className={cn(
        'group relative flex flex-col rounded-2xl overflow-hidden border bg-white shadow-sm hover:shadow-md transition-shadow duration-200 min-w-[260px]',
        service.isEmergency ? 'border-red-200' : 'border-slate-200',
        className
      )}
      aria-label={`${service.isEmergency ? 'Emergency service: ' : ''}${service.title} by ${service.providerName}`}
    >
      {/* Hero image — 16:9 aspect */}
      <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
        <Link href={href} tabIndex={-1} aria-hidden="true">
          {!imgErr ? (
            <Image
              src={service.heroImage}
              alt={`${service.title} — ${service.trade} service`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onError={() => setImgErr(true)}
            />
          ) : (
            /* Fallback gradient when image fails */
            <div
              className={cn(
                'absolute inset-0 flex items-center justify-center',
                service.isEmergency
                  ? 'bg-gradient-to-br from-red-600 to-red-800'
                  : 'bg-gradient-to-br from-slate-600 to-slate-800'
              )}
            >
              <span className="text-white/30 text-4xl font-bold">{service.trade[0]}</span>
            </div>
          )}
          {/* Gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        </Link>

        {/* Trade badge top-left */}
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 text-slate-700 shadow-sm backdrop-blur-sm border border-white/60 pointer-events-none">
          {service.trade}
        </span>

        {/* Emergency badge — visible when isEmergency, positioned left of heart */}
        {service.isEmergency && (
          <span className="absolute top-3 right-12 px-2.5 py-1 rounded-full text-xs font-bold bg-red-600 text-white shadow-sm flex items-center gap-1 pointer-events-none">
            <Zap className="w-3 h-3" aria-hidden="true" />
            Emergency
          </span>
        )}

        {/* Heart / save button top-right */}
        <button
          type="button"
          onClick={() => setSaved((v) => !v)}
          aria-label={saved ? `Remove ${service.title} from saved` : `Save ${service.title}`}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
        >
          <Heart
            className={cn(
              'w-4 h-4 transition-colors',
              saved ? 'fill-red-500 text-red-500' : 'text-slate-500'
            )}
            aria-hidden="true"
          />
        </button>

        {/* Provider avatar overlapping bottom-left of image */}
        <div className="absolute -bottom-5 left-4 z-10 w-10 h-10 rounded-full border-2 border-white overflow-hidden shadow-md bg-slate-200 shrink-0">
          {!logoErr ? (
            <Image
              src={service.providerLogo}
              alt={`${service.providerName} logo`}
              fill
              className="object-cover"
              sizes="40px"
              onError={() => setLogoErr(true)}
            />
          ) : (
            <div className="w-full h-full bg-slate-400 flex items-center justify-center">
              <span className="text-white text-xs font-bold">{service.providerName[0]}</span>
            </div>
          )}
        </div>
      </div>

      {/* Content area — pt-7 to clear the overlapping avatar */}
      <div className="flex flex-col flex-1 pt-7 px-4 pb-4 gap-2">
        {/* Provider name + rating row */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-slate-500 truncate">{service.providerName}</span>
          <span className="flex items-center gap-1 text-xs font-medium text-slate-700 shrink-0">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" aria-hidden="true" />
            {service.rating.toFixed(1)}
            <span className="text-slate-400">({service.reviewCount})</span>
          </span>
        </div>

        {/* Service title (clickable) */}
        <Link
          href={href}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 rounded"
        >
          <h3 className="text-sm font-bold text-slate-900 leading-tight group-hover:text-[var(--brand)] transition-colors line-clamp-2">
            {service.title}
          </h3>
        </Link>

        {/* Location + response time */}
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
          <span className="flex items-center gap-1 truncate">
            <MapPin className="w-3 h-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{service.location}</span>
          </span>
          {(service.responseTimeMin > 0 || service.responseTimeMax > 0) && (
            <span className="flex items-center gap-1 shrink-0">
              <Clock className="w-3 h-3 shrink-0" aria-hidden="true" />
              {service.responseTimeMin}–{service.responseTimeMax} min
            </span>
          )}
        </div>

        {/* Description — 2-line clamp */}
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
          {service.description}
        </p>

        {/* Trust badges */}
        {(service.vetted || service.insured) && (
          <div className="flex items-center gap-2 flex-wrap">
            {service.vetted && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                Vetted
              </span>
            )}
            {service.insured && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--brand-soft)] text-[var(--brand)] border border-[var(--color-brand-100)]">
                <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                Insured
              </span>
            )}
          </div>
        )}

        {/* Spacer pushes footer down */}
        <div className="flex-1" />

        {/* Divider */}
        <hr className="border-slate-100" />

        {/* Footer: price + CTAs */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400">From</span>
            <span
              className={cn(
                'text-base font-bold',
                service.isEmergency ? 'text-red-600' : 'text-slate-900'
              )}
            >
              {priceFormatted}
              <span className="text-xs font-normal text-slate-400">/visit</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Call button — emergency only, when phone is provided */}
            {service.isEmergency && service.phone && (
              <a
                href={`tel:${service.phone}`}
                aria-label={`Call ${service.providerName} now`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-1"
              >
                <Phone className="w-3 h-3" aria-hidden="true" />
                Call
              </a>
            )}
            {/* Primary CTA */}
            <Link
              href={href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
                service.isEmergency
                  ? 'bg-slate-900 text-white hover:bg-slate-700 focus-visible:ring-slate-900'
                  : 'bg-slate-900 text-white hover:bg-slate-700 focus-visible:ring-slate-900'
              )}
            >
              <MessageSquare className="w-3 h-3" aria-hidden="true" />
              {service.isEmergency ? 'Request now' : 'Contact'}
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}

export default ServiceCard
