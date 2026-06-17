'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Bath, BedDouble, Check, Heart, MapPin, Shield, Star, Users, Zap } from 'lucide-react'
import { formatPence } from '@/lib/marketplace/money'
import type { PublicStay } from '@/lib/public-marketplace/types'

interface StayCardProps {
  stay: PublicStay
  basePath?: string
}

export default function StayCard({ stay, basePath = '/stays' }: StayCardProps) {
  return (
    <div className="relative aspect-[702/486] w-full [container-type:inline-size] transition-transform duration-200 ease-out hover:-translate-y-1 hover:scale-[1.01] active:translate-y-0 active:scale-[0.995]">
    <article className="absolute left-0 top-0 flex h-[486px] w-[702px] origin-top-left flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white font-sans shadow-[0_18px_45px_rgba(15,23,42,0.12)] transition-shadow duration-200 hover:shadow-[0_24px_58px_rgba(15,23,42,0.18)]" style={{ transform: 'scale(calc(100cqw / 702px))' }}>
      <div className="relative h-[59.3%] min-h-[250px] shrink-0">
        <Image
          src={stay.heroImage}
          alt={stay.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 702px"
        />
        {stay.verified && (
          <span className="absolute left-[22px] top-[20px] inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 text-[14px] font-[650] leading-4 text-emerald-700 shadow-sm">
            <Shield className="h-4 w-4" />
            Verified stay
          </span>
        )}
        <button
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
          }}
          aria-label="Save stay"
          className="absolute right-[19px] top-[17px] flex h-[50px] w-[50px] items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-[0_8px_20px_rgba(15,23,42,0.12)] transition-colors hover:bg-slate-50"
        >
          <Heart className="h-6 w-6" />
        </button>
        <span className="absolute bottom-[16px] right-[21px] flex h-[72px] min-w-[120px] flex-col items-center justify-center rounded-2xl bg-white px-5 shadow-[0_10px_28px_rgba(15,23,42,0.13)]">
          <span className="flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="text-[18px] font-[800] leading-6 text-slate-900">{stay.rating}</span>
          </span>
          <span className="text-[14px] font-[500] leading-5 text-slate-600">({stay.reviewCount} reviews)</span>
        </span>
      </div>

      <div className="flex flex-1 flex-col px-[22px] py-[19px]">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 truncate text-[20px] font-[750] leading-7 text-slate-950">{stay.title}</h3>
          <span className="mt-1 shrink-0 rounded-full bg-blue-50 px-3 py-1 text-[12px] font-[650] leading-4 text-blue-700">
            {stay.stayType}
          </span>
        </div>

        <div className="mt-[14px] flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px] font-[500] leading-5 text-slate-500">
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-500" />
            {stay.location}
          </span>
          <span className="flex items-center gap-2">
            <BedDouble className="h-4 w-4 text-slate-500" />
            {stay.bedrooms} bedrooms
          </span>
          <span className="flex items-center gap-2">
            <Bath className="h-4 w-4 text-slate-500" />
            {stay.bathrooms} bathrooms
          </span>
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-500" />
            {stay.guests} guests
          </span>
        </div>

        <div className="mt-[18px] flex flex-wrap items-center gap-2 text-[13px] font-[650] leading-4">
          {stay.instantBook && (
            <span className="inline-flex h-[30px] items-center gap-1.5 rounded-md border border-blue-100 bg-blue-50 px-3 text-blue-700">
              <Zap className="h-4 w-4" />
              Instant book
            </span>
          )}
          {stay.freeCancellation && (
            <span className="inline-flex h-[30px] items-center gap-1.5 rounded-md border border-emerald-100 bg-emerald-50 px-3 text-emerald-700">
              <Check className="h-4 w-4" />
              Free cancellation
            </span>
          )}
          {stay.verified && (
            <span className="inline-flex h-[30px] items-center gap-1.5 rounded-md border border-emerald-100 bg-emerald-50 px-3 text-emerald-700">
              <Shield className="h-4 w-4" />
              Licence verified
            </span>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-4 pt-[12px]">
          <div className="flex items-baseline gap-1">
            <span className="text-[26px] font-[800] leading-[34px] text-slate-950">{formatPence(stay.pricePerNight)}</span>
            <span className="text-[14px] font-[500] leading-5 text-slate-500">/ night</span>
          </div>
          <Link
            href={`${basePath}/${stay.slug}`}
            className="inline-flex h-10 min-w-[142px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-[14.5px] font-[700] leading-[18px] text-white transition-colors hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            View details
            <span aria-hidden>{'->'}</span>
          </Link>
        </div>
      </div>
    </article>
    </div>
  )
}
