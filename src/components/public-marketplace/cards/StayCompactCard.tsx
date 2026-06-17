import Image from 'next/image'
import Link from 'next/link'
import { Star, Zap } from 'lucide-react'
import type { PublicStay } from '@/lib/public-marketplace/types'

export default function StayCompactCard({ stay, featured, basePath = '/stays' }: { stay: PublicStay; featured?: boolean; basePath?: string }) {
  const price = (stay.pricePerNight / 100).toFixed(0)

  if (featured) {
    return (
      <Link href={`${basePath}/${stay.slug}`} className="group block">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
          <div className="relative h-48 overflow-hidden">
            <Image src={stay.heroImage} alt={stay.title} fill className="object-cover" sizes="400px" />
            {stay.verified && (
              <div className="absolute top-2 left-2 bg-white/90 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                Verified stay
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-slate-900 text-sm mb-1">{stay.title}</h3>
            <p className="text-xs text-slate-500 mb-2">{stay.location}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                <span className="text-sm font-semibold">{stay.rating}</span>
                <span className="text-xs text-slate-400">({stay.reviewCount})</span>
              </div>
              <div>
                <span className="font-bold text-slate-900">£{price}</span>
                <span className="text-xs text-slate-500"> / night</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link href={`${basePath}/${stay.slug}`} className="group block">
      <div className="flex gap-3 bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-sm transition-all p-2">
        <div className="relative w-24 h-20 rounded-lg overflow-hidden shrink-0">
          <Image src={stay.heroImage} alt={stay.title} fill className="object-cover" sizes="96px" />
        </div>
        <div className="flex-1 min-w-0 py-0.5">
          <h3 className="text-xs font-semibold text-slate-900 line-clamp-1">{stay.title}</h3>
          <p className="text-xs text-slate-500">{stay.location}</p>
          <div className="flex items-center gap-1 mt-1">
            <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
            <span className="text-xs font-semibold">{stay.rating}</span>
            {stay.instantBook && <Zap className="h-3 w-3 text-blue-600 ml-1" />}
          </div>
          <p className="text-sm font-bold text-slate-900 mt-0.5">£{price}<span className="text-xs font-normal text-slate-500"> /night</span></p>
        </div>
      </div>
    </Link>
  )
}
