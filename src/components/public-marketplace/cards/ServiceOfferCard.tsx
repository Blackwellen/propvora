import Image from 'next/image'
import Link from 'next/link'
import { Star, MapPin, Clock, Zap, CheckCircle } from 'lucide-react'
import type { PublicServiceOffer } from '@/lib/public-marketplace/types'

export default function ServiceOfferCard({ offer, featured }: { offer: PublicServiceOffer; featured?: boolean }) {
  const price = (offer.basePrice / 100).toFixed(0)

  if (featured) {
    return (
      <Link href={`/services/${offer.slug}`} className="group block min-w-72 max-w-80">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all">
          <div className="relative h-44 overflow-hidden">
            <Image src={offer.heroImage} alt={offer.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="320px" />
            <div className="absolute top-2 left-2 flex gap-1.5">
              <span className="bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full">Featured</span>
              {offer.verified && <span className="bg-emerald-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">Verified</span>}
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-bold text-slate-900 text-sm mb-1">{offer.title}</h3>
            <div className="flex items-center gap-2 mb-2">
              <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0">
                <Image src={offer.providerAvatar} alt={offer.providerName} fill className="object-cover" sizes="24px" />
              </div>
              <span className="text-xs text-slate-600">{offer.providerName}</span>
              {offer.providerPro && <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded font-semibold">Pro</span>}
            </div>
            <div className="flex items-center gap-1 mb-2">
              <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              <span className="text-sm font-semibold">{offer.rating}</span>
              <span className="text-xs text-slate-400">({offer.reviewCount})</span>
            </div>
            <div className="text-xs text-slate-500 space-y-1 mb-3">
              <p className="flex items-center gap-1"><Clock className="h-3 w-3" />{offer.duration} · {offer.responseTime} response</p>
              <p className="flex items-center gap-1"><MapPin className="h-3 w-3" />{offer.location}</p>
              <p className="flex items-center gap-1 text-blue-600 font-medium"><Zap className="h-3 w-3" />Next: {offer.nextAvailable}</p>
            </div>
            <div className="space-y-1 mb-3">
              {offer.deliverables.slice(0, 3).map(d => (
                <p key={d} className="flex items-center gap-1 text-xs text-slate-600">
                  <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />{d}
                </p>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-base font-bold text-slate-900">£{price} <span className="text-xs font-normal text-slate-500">fixed price</span></span>
              <span className="text-xs font-semibold text-blue-600 group-hover:text-blue-700">View details →</span>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link href={`/services/${offer.slug}`} className="group block">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
        <div className="relative h-32 overflow-hidden">
          <Image src={offer.heroImage} alt={offer.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 768px) 100vw, 25vw" />
          {offer.urgent && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">Urgent</span>
          )}
        </div>
        <div className="p-3">
          <h3 className="text-sm font-semibold text-slate-900 line-clamp-1 mb-1">{offer.title}</h3>
          <p className="text-xs text-slate-500 line-clamp-1 mb-2">{offer.providerName}</p>
          <div className="flex items-center gap-1 mb-2">
            <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
            <span className="text-xs font-semibold">{offer.rating}</span>
            <span className="text-xs text-slate-400">({offer.reviewCount})</span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 pt-2">
            <span className="text-sm font-bold text-slate-900">From £{price}</span>
            <span className="text-xs font-semibold text-blue-600 group-hover:text-blue-700">View →</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
