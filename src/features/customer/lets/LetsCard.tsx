'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Bath, BedDouble, Check, Heart, PawPrint, Shield, Sofa, Star } from 'lucide-react'
import { formatPence } from '@/lib/marketplace/money'
import { guardSave } from '@/lib/public-marketplace/save-guard'
import type { PublicLongTermRental } from '@/lib/public-marketplace/types'

/* ─────────────────────────────────────────────────────────────────────────
   LetsCard — long-term rental card, aligned 1:1 with the canonical StayCard
   (Airbnb-style: borderless, 3:2 full-bleed image, heart, status chips, clean
   text list below). Light tokens only — NEVER `dark:`.
───────────────────────────────────────────────────────────────────────── */

const STORAGE_KEY = 'propvora_saved_lets'
function getSaved(): string[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}
function toggleSaved(id: string): boolean {
  const list = getSaved(); const idx = list.indexOf(id)
  if (idx === -1) { list.push(id) } else { list.splice(idx, 1) }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); return idx === -1
}

function fmtAvail(iso: string): string {
  if (!iso) return 'now'
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  } catch { return iso }
}

export default function LetsCard({ rental, basePath = '/customer/stays/long-term' }: { rental: PublicLongTermRental; basePath?: string }) {
  const [saved, setSaved] = useState(false)
  const [imgErr, setImgErr] = useState(false)

  useEffect(() => { setSaved(getSaved().includes(rental.id)) }, [rental.id])

  const verified = rental.licenceVerified || rental.landlordVerified
  const showImg = !!rental.heroImage && !imgErr

  return (
    <Link href={`${basePath}/${rental.slug ?? rental.id}`} className="group block">
      <article className="font-sans">
        {/* Image — 3:2 full-bleed, rounded */}
        <div className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl bg-slate-100">
          {showImg ? (
            <Image
              src={rental.heroImage}
              alt={rental.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onError={() => setImgErr(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-300 to-slate-500">
              <span className="text-5xl font-bold text-white/25">{rental.propertyType?.[0] ?? 'P'}</span>
            </div>
          )}

          {/* Heart / save */}
          <button
            type="button"
            onClick={async (e) => {
              e.preventDefault(); e.stopPropagation()
              if (!(await guardSave())) return
              setSaved(toggleSaved(rental.id))
            }}
            aria-label={saved ? 'Remove from saved' : 'Save let'}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-slate-800 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
          >
            <Heart className={`h-5 w-5 transition-colors ${saved ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>

          {/* Status chips bottom-left */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
            {rental.billsIncluded && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-800 shadow-sm backdrop-blur-sm">
                <Check className="h-3 w-3 text-emerald-600" /> Bills inc.
              </span>
            )}
            {rental.petsAllowed && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-800 shadow-sm backdrop-blur-sm">
                <PawPrint className="h-3 w-3 text-blue-600" /> Pets
              </span>
            )}
          </div>

          {/* Verified badge top-left */}
          {verified && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-slate-800 shadow-sm backdrop-blur-sm">
              <Shield className="h-3 w-3 text-emerald-600" /> Verified
            </span>
          )}
        </div>

        {/* Body — borderless list-item style */}
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-[14px] font-semibold text-slate-900">{rental.location}</p>
            {rental.rating > 0 && (
              <span className="flex shrink-0 items-center gap-1 text-[13px] text-slate-800">
                <Star className="h-3.5 w-3.5 fill-slate-900 text-slate-900" />
                <span className="font-semibold">{rental.rating}</span>
                <span className="text-slate-500">({rental.reviewCount})</span>
              </span>
            )}
          </div>
          <p className="truncate text-[13px] text-slate-500">{rental.title}</p>
          <p className="flex items-center gap-3 text-[13px] text-slate-500">
            <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" />{rental.beds} bed</span>
            <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{rental.bathrooms} bath</span>
            <span className="flex items-center gap-1"><Sofa className="h-3.5 w-3.5" />{rental.furnishingStatus}</span>
          </p>
          <p className="flex items-center justify-between gap-2 pt-1 text-[14px] text-slate-900">
            <span>
              <span className="font-semibold">{formatPence(rental.monthlyRentPence)}</span>
              <span className="text-slate-500"> /mo</span>
            </span>
            <span className="text-[12px] text-slate-400">Avail. {fmtAvail(rental.availableFrom)}</span>
          </p>
        </div>
      </article>
    </Link>
  )
}
