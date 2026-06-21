'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Clock, Heart, MapPin, Phone, ShieldCheck, Siren, Tag, Timer } from 'lucide-react'
import { formatPence } from '@/lib/marketplace/money'
import type { PublicEmergencyService } from '@/lib/public-marketplace/types'

const FEATURES = [
  { icon: Clock, label: '24/7', sub: 'Available' },
  { icon: Timer, label: '30 min', sub: 'Avg. arrival' },
  { icon: Tag, label: 'Fixed price', sub: 'No call-out fees' },
  { icon: ShieldCheck, label: 'DBS vetted', sub: 'Police checked' },
]

export default function EmergencyServiceCard({ service, basePath = '/emergency' }: { service: PublicEmergencyService; basePath?: string }) {
  const [saved, setSaved] = useState(false)
  const description =
    service.description ||
    'Lockouts, broken locks and post-break-in board-ups. Non-destructive entry where possible.'

  return (
    <article className="overflow-hidden rounded-2xl border-2 border-red-200 bg-red-50 font-sans transition-shadow duration-200 hover:shadow-md">
      {/* Header strip — "Available Now" prominent */}
      <div className="flex items-center justify-between gap-3 bg-red-600 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Siren className="h-4 w-4 text-white" />
          <span className="text-[13px] font-bold text-white">Emergency Service</span>
          <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-red-600">Available Now</span>
        </div>
        <button
          type="button"
          onClick={() => setSaved((s) => !s)}
          aria-label={saved ? 'Remove from saved' : 'Save service'}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
        >
          <Heart className={`h-4 w-4 transition-colors ${saved ? 'fill-white' : ''}`} />
        </button>
      </div>

      {/* Body */}
      <div className="flex gap-4 p-4">
        {/* Image */}
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-200">
          <Image
            src={service.heroImage}
            alt={service.title}
            fill
            className="object-cover"
            sizes="112px"
          />
        </div>
        {/* Details */}
        <div className="min-w-0 flex-1">
          <h3 className="text-[16px] font-bold text-slate-900">{service.title}</h3>
          {/* Response time — very prominent */}
          <p className="mt-1 flex items-center gap-1.5 text-[15px] font-bold text-red-600">
            <Clock className="h-4 w-4" />
            {service.responseTimeMin}–{service.responseTimeMax} min response
          </p>
          <p className="mt-2 line-clamp-2 text-[13px] text-slate-600">{description}</p>
          <p className="mt-2 flex items-center gap-1 text-[12px] text-slate-500">
            <MapPin className="h-3.5 w-3.5" />
            {service.location}
          </p>
        </div>
      </div>

      {/* Feature strip */}
      <div className="grid grid-cols-4 border-y border-red-200 bg-white px-2 py-3">
        {FEATURES.map(({ icon: Icon, label, sub }) => (
          <div key={label} className="flex flex-col items-center gap-1 text-center">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-red-600">
              <Icon className="h-4 w-4" />
            </span>
            <span className="text-[11px] font-bold text-slate-900">{label}</span>
            <span className="text-[10px] text-slate-500">{sub}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Call-out from</p>
          <p className="text-[22px] font-bold text-slate-900">{formatPence(service.baseCalloutPrice)}</p>
        </div>
        <div className="flex items-center gap-2">
          {service.phone && (
            <a
              href={`tel:${service.phone}`}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-[13px] font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              <Phone className="h-4 w-4" />
              Call
            </a>
          )}
          <Link
            href={`${basePath}/${service.slug}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-red-700"
          >
            Request now
          </Link>
        </div>
      </div>
    </article>
  )
}
