import Image from 'next/image'
import Link from 'next/link'
import {
  Heart,
  Star,
  CheckCircle,
  MapPin,
  BedDouble,
  Bath,
  Users,
  PawPrint,
  Car,
  TreePine,
  Zap,
} from 'lucide-react'
import { formatPence } from '@/lib/marketplace/money'
import type { PublicLongTermRental } from '@/lib/public-marketplace/types'

interface LongTermRentalCardProps {
  rental: PublicLongTermRental
  basePath?: string
}

export default function LongTermRentalCard({
  rental,
  basePath = '/stays/long-term',
}: LongTermRentalCardProps) {
  const isVerified = rental.licenceVerified || rental.landlordVerified || rental.agentVerified

  const availableDate = new Date(rental.availableFrom).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <Link href={`${basePath}/${rental.slug}`} className="group block">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={rental.heroImage}
            alt={rental.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          {/* Verified badge */}
          {isVerified && (
            <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/90 text-emerald-700 text-xs font-semibold px-2 py-1 rounded-full backdrop-blur-sm border border-emerald-200">
              <CheckCircle className="h-3 w-3" />
              Verified
            </div>
          )}
          {/* Save button */}
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            className="absolute top-3 right-3 w-8 h-8 bg-white/80 hover:bg-white backdrop-blur-sm rounded-full flex items-center justify-center transition-colors"
            aria-label="Save property"
          >
            <Heart className="h-4 w-4 text-slate-600" />
          </button>
          {/* Property type + furnishing */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
            <span className="text-xs font-medium bg-white/90 text-slate-700 px-2 py-0.5 rounded-full backdrop-blur-sm">
              {rental.propertyType}
            </span>
            <span className="text-xs font-medium bg-white/90 text-slate-500 px-2 py-0.5 rounded-full backdrop-blur-sm">
              {rental.furnishingStatus}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title + rating */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-sm font-semibold text-slate-900 leading-tight line-clamp-2">
              {rental.title}
            </h3>
            <div className="flex items-center gap-1 shrink-0">
              <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              <span className="text-sm font-semibold text-slate-900">{rental.rating}</span>
            </div>
          </div>

          {/* Location */}
          <p className="flex items-center gap-1 text-xs text-slate-500 mb-2">
            <MapPin className="h-3 w-3 shrink-0" />
            {rental.location}
          </p>

          {/* Beds / baths chips */}
          <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
            <span className="flex items-center gap-1">
              <BedDouble className="h-3 w-3" />
              {rental.beds} bed{rental.beds !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1">
              <Bath className="h-3 w-3" />
              {rental.bathrooms} bath
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              Max {rental.maxOccupants}
            </span>
          </div>

          {/* Feature badges row */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {rental.billsIncluded && (
              <span className="inline-flex items-center gap-1 text-xs bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full font-medium">
                <Zap className="h-3 w-3" />
                Bills included
              </span>
            )}
            {rental.petsAllowed && (
              <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                <PawPrint className="h-3 w-3" />
                Pets OK
              </span>
            )}
            {rental.parkingAvailable && (
              <span className="inline-flex items-center gap-1 text-xs bg-slate-50 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                <Car className="h-3 w-3" />
                Parking
              </span>
            )}
            {rental.gardenAvailable && (
              <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                <TreePine className="h-3 w-3" />
                Garden
              </span>
            )}
          </div>

          {/* Price */}
          <div className="border-t border-slate-100 pt-3">
            <div className="flex items-end justify-between">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-slate-900">
                    {formatPence(rental.monthlyRentPence)}
                  </span>
                  <span className="text-xs text-slate-500">/mo</span>
                </div>
                <p className="text-xs text-slate-400">
                  Deposit: {formatPence(rental.depositPence)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">From {availableDate}</p>
                <p className="text-xs text-slate-400">Min {rental.minTenancyMonths} months</p>
              </div>
            </div>

            <div className="mt-2 text-right">
              <span className="text-xs font-semibold text-blue-600 group-hover:text-blue-700">
                View details →
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
