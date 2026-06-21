"use client"

import Link from "next/link"
import { Heart, MapPin, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"

export interface PropertyCardData {
  id: string
  title: string
  location: string
  image: string
  pricePence: number
  pricePer?: "night" | "month"
  rating?: number
  reviews?: number
  saved?: boolean
  badge?: string
  href?: string
}

function gbp(pence: number) {
  return formatPence(pence)
}

/**
 * Customer property card. Visually aligned with the marketplace StayCard
 * (`src/components/public-marketplace/cards/StayCard.tsx`) that the
 * `/customer/stays` grid uses: rounded-[22px] bordered card with soft shadow,
 * verified/badge pill top-left, circular heart top-right, an overlaid rating
 * chip, location/price footer and a clear "View details" affordance.
 *
 * Props/signature are unchanged so existing callers (Home, Favourites,
 * Completed, Lets recommended) keep working — this card stays lean (no full
 * PublicStay payload), it just matches StayCard's visual language.
 */
export function CustomerPropertyCard({
  p,
  onToggleSave,
  className,
}: {
  p: PropertyCardData
  onToggleSave?: (id: string) => void
  className?: string
}) {
  const href = p.href ?? `/customer/stays/${p.id}`
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_24px_58px_rgba(15,23,42,0.16)]",
        className,
      )}
    >
      <Link href={href} className="block">
        <div className="relative aspect-[702/486] overflow-hidden bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.image}
            alt={p.title}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
          />
          {p.badge && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-emerald-700 shadow-sm">
              {p.badge}
            </span>
          )}
          {p.rating != null && (
            <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 shadow-[0_10px_28px_rgba(15,23,42,0.13)]">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-[14px] font-bold leading-4 text-slate-900">{p.rating.toFixed(1)}</span>
              {p.reviews != null && (
                <span className="text-[12px] font-medium leading-4 text-slate-500">({p.reviews})</span>
              )}
            </span>
          )}
        </div>
      </Link>

      <button
        type="button"
        aria-label={p.saved ? "Remove from favourites" : "Save to favourites"}
        onClick={() => onToggleSave?.(p.id)}
        className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-[0_8px_20px_rgba(15,23,42,0.12)] transition-transform hover:scale-105 active:scale-95"
      >
        <Heart className={cn("h-5 w-5", p.saved ? "fill-rose-500 text-rose-500" : "text-slate-600")} />
      </button>

      <div className="flex flex-1 flex-col px-[18px] py-4">
        <Link href={href} className="block">
          <h3 className="truncate text-[17px] font-bold leading-6 text-slate-950">{p.title}</h3>
          <p className="mt-1.5 flex items-center gap-1.5 truncate text-[13px] font-medium text-slate-500">
            <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
            {p.location}
          </p>
        </Link>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div className="flex items-baseline gap-1">
            <span className="text-[22px] font-extrabold leading-7 text-slate-950">{gbp(p.pricePence)}</span>
            <span className="text-[13px] font-medium text-slate-500">/ {p.pricePer ?? "night"}</span>
          </div>
          <Link
            href={href}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 text-[13.5px] font-bold text-white transition-colors hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            View details
            <span aria-hidden>{"->"}</span>
          </Link>
        </div>
      </div>
    </article>
  )
}
