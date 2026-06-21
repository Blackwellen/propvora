'use client'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, BedDouble, Bath, CalendarClock } from 'lucide-react'
import { formatPence } from '@/lib/marketplace/money'
import type { PublicLongTermRental } from '@/lib/public-marketplace/types'

export default function LetsCard({ rental }: { rental: PublicLongTermRental }) {
  const hasImage = !!rental.heroImage
  return (
    <article className="border border-slate-200 rounded-2xl overflow-hidden bg-white hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="relative aspect-[4/3] bg-slate-100">
        {hasImage ? (
          <Image src={rental.heroImage} alt={rental.title} fill className="object-cover" sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,400px" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center">
            <span className="text-white text-4xl font-bold opacity-20">{rental.propertyType[0]}</span>
          </div>
        )}
        {rental.licenceVerified && (
          <span className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Verified</span>
        )}
        <span className="absolute bottom-3 right-3 bg-white/90 text-slate-900 text-[13px] font-bold px-2.5 py-1 rounded-full shadow-sm">
          {formatPence(rental.monthlyRentPence)}/mo
        </span>
      </div>
      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-slate-900 text-[15px] line-clamp-1">{rental.title}</h3>
        <p className="flex items-center gap-1 text-slate-500 text-[13px] mt-0.5">
          <MapPin className="h-3.5 w-3.5 shrink-0" />{rental.location}
        </p>
        <div className="flex items-center gap-4 mt-2.5 text-[13px] text-slate-600">
          <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" />{rental.beds} beds</span>
          <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{rental.bathrooms} baths</span>
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="flex items-center gap-1 text-[12px] text-slate-400">
            <CalendarClock className="h-3.5 w-3.5" />Available {rental.availableFrom}
          </span>
          <Link href={`/customer/lets/${rental.id}`} className="text-[13px] text-blue-600 font-medium hover:underline">View →</Link>
        </div>
      </div>
    </article>
  )
}
