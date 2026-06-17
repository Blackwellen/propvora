import Image from 'next/image'
import Link from 'next/link'
import { Heart, Clock, MapPin, AlertCircle } from 'lucide-react'
import { formatPence } from '@/lib/marketplace/money'
import type { PublicEmergencyService } from '@/lib/public-marketplace/types'

export default function EmergencyServiceCard({ service, basePath = '/emergency' }: { service: PublicEmergencyService; basePath?: string }) {
  return (
    <div className="flex flex-col border-2 border-red-200 shadow-sm rounded-2xl overflow-hidden bg-white hover:shadow-md transition-shadow">
      {/* Two-column top section */}
      <div className="relative flex flex-row gap-3 p-4">
        {/* Emergency badge — top left (absolute over image) */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 rounded-full px-2.5 py-0.5 text-xs font-medium">
          <AlertCircle className="w-3 h-3" />
          Emergency service
        </div>
        {/* Heart — top right */}
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation() }}
          aria-label="Save service"
          className="absolute top-3 right-3 z-10 bg-white/90 hover:bg-white rounded-full p-2 transition-colors"
        >
          <Heart className="w-4 h-4 text-slate-600" />
        </button>

        {/* LEFT: image */}
        <div className="relative w-28 h-28 rounded-xl overflow-hidden shrink-0 mt-7">
          <Image
            src={service.heroImage}
            alt={service.title}
            fill
            className="object-cover"
            sizes="112px"
          />
        </div>

        {/* RIGHT: content */}
        <div className="flex-1 space-y-1.5 mt-7">
          <h3 className="font-bold text-slate-900 text-[15px] leading-tight">{service.title}</h3>
          <div className="flex items-center gap-1 text-red-600 text-sm font-medium">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            {service.responseTimeMin}–{service.responseTimeMax} min response
          </div>
          {service.description && (
            <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">{service.description}</p>
          )}
          <div className="flex items-center gap-1 text-slate-500 text-xs">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            {service.location}
          </div>
        </div>
      </div>

      {/* Feature chips — 2x2 grid */}
      <div className="px-4 pb-3 grid grid-cols-2 gap-2">
        {[
          '24/7 Available',
          '30min Avg arrival',
          'Fixed price',
          'Police vetted',
        ].map(label => (
          <span key={label} className="flex items-center gap-1 bg-red-50 text-red-700 text-xs px-2.5 py-1.5 rounded-full">
            <AlertCircle className="w-3 h-3 shrink-0" />
            {label}
          </span>
        ))}
      </div>

      {/* Bottom row: price + CTA */}
      <div className="flex items-center justify-between gap-3 px-4 pb-4">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Call-out from</p>
          <span className="text-2xl font-bold text-slate-900">{formatPence(service.baseCalloutPrice)}</span>
        </div>
        <Link
          href={`${basePath}/${service.slug}`}
          className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap"
        >
          Request now →
        </Link>
      </div>
    </div>
  )
}
