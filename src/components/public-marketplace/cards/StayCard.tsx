'use client'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, Star, MapPin, BedDouble, Bath, Users, Zap, Check, Shield } from 'lucide-react'
import { formatPence } from '@/lib/marketplace/money'
import type { PublicStay } from '@/lib/public-marketplace/types'

interface StayCardProps {
  stay: PublicStay
  basePath?: string
}

export default function StayCard({ stay, basePath = '/stays' }: StayCardProps) {
  return (
    <div className="flex flex-col h-full border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="relative aspect-[4/3] shrink-0">
        <Image
          src={stay.heroImage}
          alt={stay.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        {/* Verified badge — top left */}
        {stay.verified && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/90 text-emerald-600 border border-emerald-200 rounded-full px-2.5 py-0.5 text-xs font-medium">
            <Check className="w-3 h-3" />
            Verified stay
          </div>
        )}
        {/* Heart — top right */}
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation() }}
          aria-label="Save stay"
          className="absolute top-3 right-3 bg-white/90 hover:bg-white rounded-full p-2 shadow-sm transition-colors"
        >
          <Heart className="w-4 h-4 text-slate-600" />
        </button>
        {/* Rating chip — bottom left */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-slate-900/80 text-white rounded-full px-2.5 py-1 text-sm font-semibold">
          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          {stay.rating}
          <span className="text-xs text-white/80 font-normal">({stay.reviewCount})</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 space-y-2.5">
        <div className="flex-1 space-y-2">
          {/* Title + type pill */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-slate-900 text-[15px] leading-tight line-clamp-2">{stay.title}</h3>
            <span className="shrink-0 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">{stay.stayType}</span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1 text-slate-500 text-sm">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{stay.location}</span>
          </div>

          {/* Beds / baths / guests */}
          <div className="flex items-center gap-3 text-slate-600 text-sm">
            <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5 text-slate-400" />{stay.beds} bed{stay.beds !== 1 ? 's' : ''}</span>
            <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5 text-slate-400" />{stay.bathrooms} bath</span>
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-slate-400" />{stay.guests} guests</span>
          </div>

          {/* Feature chips */}
          <div className="flex flex-wrap gap-1.5">
            {stay.instantBook && (
              <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-600 text-xs px-2 py-1 rounded-full">
                <Zap className="w-3 h-3 text-blue-500" />Instant book
              </span>
            )}
            {stay.freeCancellation && (
              <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-600 text-xs px-2 py-1 rounded-full">
                <Check className="w-3 h-3 text-emerald-500" />Free cancellation
              </span>
            )}
            {stay.verified && (
              <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-600 text-xs px-2 py-1 rounded-full">
                <Shield className="w-3 h-3 text-emerald-500" />Licence verified
              </span>
            )}
          </div>
        </div>

        {/* Price + CTA — pinned to bottom */}
        <div className="mt-auto pt-1">
          <div className="flex items-baseline gap-1 mb-2.5">
            <span className="text-2xl font-bold text-slate-900">{formatPence(stay.pricePerNight)}</span>
            <span className="text-slate-500 text-sm"> / night</span>
          </div>
          <Link
            href={`${basePath}/${stay.slug}`}
            className="block w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2.5 text-sm font-semibold text-center transition-colors"
          >
            View details →
          </Link>
        </div>
      </div>
    </div>
  )
}
