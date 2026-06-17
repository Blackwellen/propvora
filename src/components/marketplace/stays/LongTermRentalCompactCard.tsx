import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle, MapPin, BedDouble, Bath } from 'lucide-react'
import { formatPence } from '@/lib/marketplace/money'
import type { PublicLongTermRental } from '@/lib/public-marketplace/types'

interface LongTermRentalCompactCardProps {
  rental: PublicLongTermRental
  basePath?: string
  featured?: boolean
}

export default function LongTermRentalCompactCard({
  rental,
  basePath = '/stays/long-term',
  featured = false,
}: LongTermRentalCompactCardProps) {
  const isVerified = rental.licenceVerified || rental.landlordVerified || rental.agentVerified
  const availableDate = new Date(rental.availableFrom).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })

  return (
    <Link href={`${basePath}/${rental.slug}`} className="group block">
      <div
        className={`bg-white rounded-xl border overflow-hidden transition-all duration-150 hover:shadow-md ${featured ? 'border-blue-200 shadow-sm' : 'border-slate-200'}`}
      >
        <div className="flex gap-3 p-3">
          {/* Thumbnail */}
          <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0">
            <Image
              src={rental.heroImage}
              alt={rental.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="80px"
            />
            {featured && (
              <div className="absolute inset-0 ring-2 ring-blue-500 rounded-lg pointer-events-none" />
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1 mb-0.5">
              <h3 className="text-sm font-semibold text-slate-900 line-clamp-1 leading-tight">
                {rental.title}
              </h3>
              {isVerified && (
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
              )}
            </div>

            <p className="flex items-center gap-1 text-xs text-slate-500 mb-1">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{rental.location}</span>
            </p>

            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
              <span className="flex items-center gap-0.5">
                <BedDouble className="h-3 w-3" />
                {rental.beds}bd
              </span>
              <span className="flex items-center gap-0.5">
                <Bath className="h-3 w-3" />
                {rental.bathrooms}ba
              </span>
              <span>{rental.propertyType}</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-slate-900">
                  {formatPence(rental.monthlyRentPence)}
                </span>
                <span className="text-xs text-slate-400">/mo</span>
              </div>
              <span className="text-xs text-slate-400">From {availableDate}</span>
            </div>

            <p className="text-xs text-slate-400 mt-0.5">
              Deposit: {formatPence(rental.depositPence)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
}
