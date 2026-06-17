import Image from 'next/image'
import Link from 'next/link'
import { Heart, Star, MapPin, Clock, Check, Users, Zap } from 'lucide-react'
import { formatPence } from '@/lib/marketplace/money'
import type { PublicServiceOffer } from '@/lib/public-marketplace/types'

// ─── FEATURED (large, used in horizontal scroll) ─────────────────────────────
function FeaturedServiceOfferCard({ offer, basePath }: { offer: PublicServiceOffer; basePath: string }) {
  const isUrgent = !!offer.urgent

  return (
    <div className="flex flex-col border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white hover:shadow-lg transition-shadow min-w-[280px]">
      {/* Image */}
      <div className="relative aspect-[16/9] shrink-0">
        <Image
          src={offer.heroImage}
          alt={offer.title}
          fill
          className="object-cover"
          sizes="320px"
        />
        {/* Featured badge top-left */}
        <div className="absolute top-3 left-3 bg-violet-600 text-white text-xs px-2.5 py-1 rounded-full">
          {isUrgent ? 'Urgent' : offer.featured ? 'Featured' : 'Popular'}
        </div>
        {/* Verified badge right */}
        {offer.verified && (
          <div className="absolute top-3 right-10 bg-white/90 text-emerald-600 rounded-full px-2 py-0.5 text-xs flex items-center gap-1">
            <Check className="w-3 h-3" />Verified
          </div>
        )}
        {/* Heart */}
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation() }}
          aria-label="Save offer"
          className="absolute top-3 right-3 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-sm transition-colors"
        >
          <Heart className="w-3.5 h-3.5 text-slate-600" />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 space-y-2">
        <h3 className="font-semibold text-slate-900 text-[15px] leading-tight line-clamp-2">{offer.title}</h3>

        {/* Provider row */}
        <div className="flex items-center gap-2">
          <div className="relative w-7 h-7 rounded-full overflow-hidden shrink-0">
            <Image src={offer.providerAvatar} alt={offer.providerName} fill className="object-cover" sizes="28px" />
          </div>
          <span className="text-slate-600 text-sm truncate">{offer.providerName}</span>
          {offer.providerPro && <span className="shrink-0 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded font-semibold">Pro</span>}
          <span className="shrink-0 text-slate-400 text-xs">Business account</span>
        </div>

        {/* Rating + response + size */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" />{offer.rating} ({offer.reviewCount})</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{offer.responseTime}</span>
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{offer.jobsDone}+ jobs</span>
        </div>

        {/* Deliverables */}
        <div className="space-y-1">
          {offer.deliverables.slice(0, 3).map(d => (
            <div key={d} className="flex items-center gap-1 text-xs text-slate-600">
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />{d}
            </div>
          ))}
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 text-slate-500 text-xs">
          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />{offer.location}
        </div>

        {/* Next available */}
        <div className="flex items-center gap-1 text-xs">
          <span className="text-slate-400">Next available:</span>
          <span className={`font-medium ${isUrgent ? 'text-red-600' : 'text-blue-600'}`}>
            {isUrgent ? 'Today — urgent' : offer.nextAvailable}
          </span>
        </div>

        {/* Price + CTA */}
        <div className="mt-auto pt-1">
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-xl font-bold text-slate-900">{formatPence(offer.basePrice)}</span>
            <span className="text-xs text-slate-400 ml-1">Fixed price</span>
          </div>
          <Link
            href={`${basePath}/${offer.slug}`}
            className="block w-full border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl py-2 text-sm font-medium text-center transition-colors"
          >
            View details →
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── COMPACT (small, used in category grid) ───────────────────────────────────
function CompactServiceOfferCard({ offer, basePath }: { offer: PublicServiceOffer; basePath: string }) {
  return (
    <div className="flex flex-col h-full border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white hover:shadow-md transition-shadow">
      {/* Two-column: image left, content right */}
      <div className="flex flex-row flex-1">
        {/* Image */}
        <div className="relative w-24 shrink-0">
          <Image
            src={offer.heroImage}
            alt={offer.title}
            fill
            className="object-cover"
            sizes="96px"
          />
        </div>
        {/* Content */}
        <div className="flex flex-col flex-1 p-3 min-w-0 space-y-1.5">
          {/* Top badges */}
          <div className="flex flex-wrap gap-1">
            {offer.verified && (
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded-full">Verified</span>
            )}
            {offer.providerPro && (
              <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded">Pro</span>
            )}
          </div>

          <h3 className="font-semibold text-slate-800 text-sm leading-tight line-clamp-2">{offer.title}</h3>

          <div className="flex items-center gap-1 text-xs text-slate-500">
            <span>{offer.providerName}</span>
          </div>

          <div className="flex items-center gap-1 text-xs">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="font-semibold text-slate-700">{offer.rating}</span>
            <span className="text-slate-400">({offer.reviewCount})</span>
          </div>

          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Clock className="w-3 h-3 text-slate-400 shrink-0" />{offer.responseTime}
          </div>

          {/* Deliverables */}
          <div className="space-y-0.5">
            {offer.deliverables.slice(0, 3).map(d => (
              <div key={d} className="flex items-center gap-1 text-[10px] text-slate-600">
                <Check className="w-2.5 h-2.5 text-emerald-500 shrink-0" />{d}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1 text-[10px] text-slate-500">
            <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />{offer.location}
          </div>

          <div className="flex items-center gap-1 text-[10px]">
            <span className="text-slate-400">Next:</span>
            <span className={`font-medium ${offer.urgent ? 'text-red-600' : 'text-blue-600'}`}>{offer.nextAvailable}</span>
          </div>
        </div>
      </div>

      {/* Bottom: price + link */}
      <div className="flex items-center justify-between px-3 pb-3 pt-1 border-t border-slate-100 mt-auto">
        <div>
          <span className="text-lg font-bold text-slate-900">{formatPence(offer.basePrice)}</span>
          <span className="text-xs text-slate-400 ml-0.5">/ fixed</span>
        </div>
        <Link
          href={`${basePath}/${offer.slug}`}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          View details →
        </Link>
      </div>
    </div>
  )
}

// ─── PUBLIC EXPORT ─────────────────────────────────────────────────────────────
export default function ServiceOfferCard({
  offer,
  featured,
  basePath = '/services',
}: {
  offer: PublicServiceOffer
  featured?: boolean
  basePath?: string
}) {
  if (featured) {
    return <FeaturedServiceOfferCard offer={offer} basePath={basePath} />
  }
  return <CompactServiceOfferCard offer={offer} basePath={basePath} />
}
