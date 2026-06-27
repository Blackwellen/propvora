'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Bath, BedDouble, Check, Heart, MapPin, Shield, Star, Users, Zap } from 'lucide-react'
import { formatPence } from '@/lib/marketplace/money'
import { guardSave } from '@/lib/public-marketplace/save-guard'
import type { PublicStay } from '@/lib/public-marketplace/types'

interface StayCardProps {
  stay: PublicStay
  basePath?: string
}

const STORAGE_KEY = 'propvora_saved_stays'
function getSaved(): string[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}
function toggleSaved(id: string): boolean {
  const list = getSaved(); const idx = list.indexOf(id)
  if (idx === -1) { list.push(id) } else { list.splice(idx, 1) }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); return idx === -1
}

export default function StayCard({ stay, basePath = '/stays' }: StayCardProps) {
  const [saved, setSaved] = useState(false)

  useEffect(() => { setSaved(getSaved().includes(stay.slug)) }, [stay.slug])

  return (
    <Link href={`${basePath}/${stay.slug}`} className="group block">
      <article className="font-sans">
        {/* Image container — Airbnb-style 3:2 full-bleed */}
        <div className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl bg-slate-100">
          <Image
            src={stay.heroImage}
            alt={stay.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {/* Heart / save button — top right on image */}
          <button
            type="button"
            onClick={async (e) => {
              e.preventDefault()
              e.stopPropagation()
              if (!(await guardSave())) return
              setSaved(toggleSaved(stay.slug))
            }}
            aria-label={saved ? 'Remove from saved' : 'Save stay'}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-slate-800 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
          >
            <Heart className={`h-5 w-5 transition-colors ${saved ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
          {/* Status chips */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
            {stay.instantBook && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-800 backdrop-blur-sm shadow-sm">
                <Zap className="h-3 w-3 text-[var(--brand)]" />
                Instant
              </span>
            )}
            {stay.freeCancellation && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-800 backdrop-blur-sm shadow-sm">
                <Check className="h-3 w-3 text-emerald-600" />
                Free cancel
              </span>
            )}
          </div>
          {/* Superhost / Verified badge */}
          {stay.verified && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-slate-800 backdrop-blur-sm shadow-sm">
              <Shield className="h-3 w-3 text-emerald-600" />
              Verified
            </span>
          )}
        </div>

        {/* Card body — no border, clean list-item style */}
        <div className="mt-3 space-y-1">
          {/* Rating row */}
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-[14px] font-semibold text-slate-900">{stay.location}</p>
            <span className="flex shrink-0 items-center gap-1 text-[13px] text-slate-800">
              <Star className="h-3.5 w-3.5 fill-slate-900 text-slate-900" />
              <span className="font-semibold">{stay.rating}</span>
              <span className="text-slate-500">({stay.reviewCount})</span>
            </span>
          </div>
          {/* Property title */}
          <p className="truncate text-[13px] text-slate-500">{stay.title}</p>
          {/* Room details */}
          <p className="flex items-center gap-3 text-[13px] text-slate-500">
            <span className="flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5" />
              {stay.bedrooms} bed
            </span>
            <span className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5" />
              {stay.bathrooms} bath
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {stay.guests} guests
            </span>
          </p>
          {/* Price row */}
          <p className="pt-1 text-[14px] text-slate-900">
            <span className="font-semibold">{formatPence(stay.pricePerNight)}</span>
            <span className="text-slate-500"> /night</span>
          </p>
        </div>
      </article>
    </Link>
  )
}
