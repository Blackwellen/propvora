'use client'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, Star, Zap, CheckCircle, Users, BedDouble, Bath } from 'lucide-react'
import type { PublicStay } from '@/lib/public-marketplace/types'

interface StayCardProps {
  stay: PublicStay
  /** Optional base path prefix for the detail link (default: "/stays"). */
  basePath?: string
}

export default function StayCard({ stay, basePath = '/stays' }: StayCardProps) {
  const priceDisplay = (stay.pricePerNight / 100).toFixed(0)

  return (
    <Link href={`${basePath}/${stay.slug}`} className="group block">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={stay.heroImage}
            alt={stay.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          {/* Badges */}
          {stay.verified && (
            <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/90 text-emerald-700 text-xs font-semibold px-2 py-1 rounded-full backdrop-blur-sm">
              <CheckCircle className="h-3 w-3" />
              Verified stay
            </div>
          )}
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation() }}
            className="absolute top-3 right-3 w-8 h-8 bg-white/80 hover:bg-white backdrop-blur-sm rounded-full flex items-center justify-center transition-colors"
            aria-label="Save stay"
          >
            <Heart className="h-4 w-4 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-sm font-semibold text-slate-900 leading-tight line-clamp-2">{stay.title}</h3>
            <div className="flex items-center gap-1 shrink-0">
              <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              <span className="text-sm font-semibold text-slate-900">{stay.rating}</span>
            </div>
          </div>

          <span className="inline-block text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full mb-2">
            {stay.stayType}
          </span>

          <p className="text-xs text-slate-500 mb-2">{stay.location}</p>

          <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
            <span className="flex items-center gap-1"><BedDouble className="h-3 w-3" />{stay.beds} bed{stay.beds !== 1 ? 's' : ''}</span>
            <span className="flex items-center gap-1"><Bath className="h-3 w-3" />{stay.bathrooms} bath</span>
            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{stay.guests} guests</span>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {stay.instantBook && (
              <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                <Zap className="h-3 w-3" />
                Instant book
              </span>
            )}
            {stay.freeCancellation && (
              <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                Free cancellation
              </span>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden relative shrink-0">
                <Image src={stay.hostAvatar} alt={stay.hostName} fill className="object-cover" sizes="24px" />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-600">{stay.hostName}</span>
                {stay.hostProBadge && (
                  <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded font-semibold">Pro</span>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="text-base font-bold text-slate-900">£{priceDisplay}</span>
              <span className="text-xs text-slate-500"> / night</span>
            </div>
          </div>

          <div className="mt-2 text-right">
            <span className="text-xs font-semibold text-blue-600 group-hover:text-blue-700">
              View details →
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
