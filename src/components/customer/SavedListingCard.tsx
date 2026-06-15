"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import Image from "next/image"
import { Heart, MapPin, Building2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { moneyPence, moneyMajor, humanise } from "./format"
import type { SavedListing } from "@/lib/customer/types"

/* A single saved (favourited) marketplace listing card with an optimistic
   un-save. The unsave runs a server action passed from the page; the card
   removes itself on success. */

export default function SavedListingCard({
  saved,
  onUnsave,
}: {
  saved: SavedListing
  onUnsave: (listingId: string) => Promise<void>
}) {
  const [removed, setRemoved] = useState(false)
  const [pending, startTransition] = useTransition()
  const l = saved.listing

  if (removed) return null

  const priceLabel = l
    ? l.base_price_pence != null
      ? moneyPence(l.base_price_pence, l.currency)
      : l.price != null
        ? moneyMajor(l.price, l.currency)
        : null
    : null

  const cover = l?.images && l.images.length > 0 ? l.images[0] : null
  const location = l?.location ?? l?.location_city ?? null
  const title = l?.title ?? l?.company_name ?? "Listing"

  function handleUnsave() {
    setRemoved(true)
    startTransition(async () => {
      try {
        await onUnsave(saved.listing_id)
      } catch {
        setRemoved(false)
      }
    })
  }

  return (
    <div className="group relative bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-md hover:border-slate-300 transition-all">
      <Link href={l ? `/app/marketplace/${l.id}` : "/app/marketplace"} className="block">
        <div className="relative aspect-[16/10] bg-slate-100">
          {cover ? (
            <Image src={cover} alt={title} fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-slate-300" />
            </div>
          )}
        </div>
        <div className="p-4">
          <p className="text-sm font-semibold text-slate-900 truncate">{title}</p>
          <p className="mt-0.5 text-xs text-slate-500 truncate flex items-center gap-1">
            {location ? (
              <>
                <MapPin className="w-3 h-3 shrink-0" /> {location}
              </>
            ) : l?.category ? (
              humanise(l.category)
            ) : (
              "Marketplace listing"
            )}
          </p>
          {priceLabel && (
            <p className="mt-2 text-sm font-bold text-slate-900">
              {priceLabel}
              {l?.price_unit ? <span className="text-xs font-medium text-slate-400"> / {l.price_unit}</span> : null}
            </p>
          )}
        </div>
      </Link>

      <button
        onClick={handleUnsave}
        disabled={pending}
        aria-label={`Remove ${title} from saved`}
        className={cn(
          "absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center bg-white/95 backdrop-blur shadow-sm",
          "text-rose-500 hover:bg-white hover:text-rose-600 transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 disabled:opacity-60"
        )}
      >
        {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4 fill-current" />}
      </button>
    </div>
  )
}
