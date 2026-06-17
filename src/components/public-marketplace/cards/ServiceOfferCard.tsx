'use client'

import Image from 'next/image'
import Link from 'next/link'
import { CalendarClock, Check, Heart, Leaf, MapPin, Shield, Star } from 'lucide-react'
import { formatPence } from '@/lib/marketplace/money'
import type { PublicServiceOffer } from '@/lib/public-marketplace/types'

const OFFER_FEATURES = [
  { icon: Leaf, label: 'Eco-friendly', sub: 'Products used' },
  { icon: CalendarClock, label: 'Flexible scheduling', sub: '7 days a week' },
  { icon: Heart, label: 'Satisfaction', sub: '100% guarantee' },
  { icon: Shield, label: 'Fully insured', sub: 'Up to GBP2M cover' },
]

function FeaturedServiceOfferCard({ offer, basePath }: { offer: PublicServiceOffer; basePath: string }) {
  return (
    <div className="relative aspect-[701/432] w-full min-w-[520px] [container-type:inline-size] transition-transform duration-200 ease-out hover:-translate-y-1 hover:scale-[1.01] active:translate-y-0 active:scale-[0.995] max-sm:min-w-[calc(100vw-48px)]">
    <article className="absolute left-0 top-0 flex h-[432px] w-[701px] origin-top-left overflow-hidden rounded-[22px] border-2 border-blue-600 bg-white font-sans shadow-[0_18px_45px_rgba(15,23,42,0.12)] transition-shadow duration-200 hover:shadow-[0_24px_58px_rgba(15,23,42,0.18)]" style={{ transform: 'scale(calc(100cqw / 701px))' }}>
      <ServiceCardBody offer={offer} basePath={basePath} />
    </article>
    </div>
  )
}

function CompactServiceOfferCard({ offer, basePath }: { offer: PublicServiceOffer; basePath: string }) {
  return (
    <div className="relative aspect-[701/432] w-full [container-type:inline-size] transition-transform duration-200 ease-out hover:-translate-y-1 hover:scale-[1.01] active:translate-y-0 active:scale-[0.995]">
    <article className="absolute left-0 top-0 flex h-[432px] w-[701px] origin-top-left overflow-hidden rounded-[22px] border-2 border-blue-600 bg-white font-sans shadow-[0_18px_45px_rgba(15,23,42,0.12)] transition-shadow duration-200 hover:shadow-[0_24px_58px_rgba(15,23,42,0.18)]" style={{ transform: 'scale(calc(100cqw / 701px))' }}>
      <ServiceCardBody offer={offer} basePath={basePath} />
    </article>
    </div>
  )
}

function ServiceCardBody({ offer, basePath }: { offer: PublicServiceOffer; basePath: string }) {
  const description = offer.subtitle || offer.deliverables.slice(0, 2).join('. ')

  return (
    <div className="flex h-full w-full flex-col">
      <div className="relative flex h-[58%] min-h-[250px] gap-[22px] px-[14px] pt-[16px]">
        <div className="relative h-[232px] w-[48.5%] overflow-hidden rounded-xl">
          <Image
            src={offer.heroImage}
            alt={offer.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 340px"
          />
          <span className="absolute left-0 top-0 inline-flex h-10 min-w-[170px] items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 text-[14px] font-[700] leading-5 text-blue-700 shadow-sm">
            <Check className="h-4 w-4" />
            Trusted service
          </span>
        </div>

        <div className="relative min-w-0 flex-1 pr-[48px] pt-[7px]">
          <button
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
            }}
            aria-label="Save offer"
            className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-[0_8px_20px_rgba(15,23,42,0.10)] transition-colors hover:bg-slate-50"
          >
            <Heart className="h-5 w-5" />
          </button>
          <h3 className="truncate text-[20px] font-[760] leading-7 text-slate-950">{offer.title}</h3>
          <p className="mt-[10px] truncate text-[14.5px] font-[500] leading-[21px] text-slate-500">{offer.category} & Commercial Cleaning</p>
          <p className="mt-[7px] flex items-center gap-2 truncate text-[14.5px] font-[500] leading-[21px] text-slate-500">
            <MapPin className="h-4 w-4 text-slate-500" />
            {offer.location}
          </p>
          <div className="mt-[12px] flex items-center gap-5 text-[14px] leading-5">
            <span className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-[800] text-slate-950">{offer.rating}</span>
              <span className="font-[500] text-slate-500">({offer.reviewCount})</span>
            </span>
            {offer.verified && (
              <span className="flex items-center gap-1.5 font-[700] text-emerald-700">
                <Shield className="h-4 w-4" />
                Vetted
              </span>
            )}
          </div>
          <p className="mt-[11px] line-clamp-3 text-[15px] font-[500] leading-[23px] text-slate-600">{description}</p>
        </div>
      </div>

      <div className="mx-[18px] grid h-[20%] min-h-[86px] grid-cols-4 border-y border-slate-200 py-[19px]">
        {OFFER_FEATURES.map(({ icon: Icon, label, sub }, index) => (
          <div key={label} className={`flex items-start gap-3 px-4 ${index > 0 ? 'border-l border-slate-200' : ''}`}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[12.5px] font-[750] leading-4 text-slate-950">{label}</span>
              <span className="mt-1 block truncate text-[12px] font-[500] leading-4 text-slate-500">{sub}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="flex h-[18%] min-h-[78px] items-center justify-between px-[21px] py-[18px]">
        <div>
          <p className="text-[12px] font-[700] uppercase leading-4 text-slate-500">Services from</p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-[25px] font-[800] leading-8 text-slate-950">{formatPence(offer.basePrice)}</span>
            <span className="text-[14px] font-[500] leading-5 text-slate-500">/ visit</span>
          </div>
        </div>
        <Link
          href={`${basePath}/${offer.slug}`}
          className="inline-flex h-[42px] min-w-[165px] items-center justify-center gap-3 rounded-lg bg-blue-600 px-5 text-[14.5px] font-[750] leading-[18px] text-white transition-colors hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          View services
          <span aria-hidden>{'->'}</span>
        </Link>
      </div>
    </div>
  )
}

export default function ServiceOfferCard({
  offer,
  featured,
  basePath = '/services',
}: {
  offer: PublicServiceOffer
  featured?: boolean
  basePath?: string
}) {
  if (featured) return <FeaturedServiceOfferCard offer={offer} basePath={basePath} />
  return <CompactServiceOfferCard offer={offer} basePath={basePath} />
}
