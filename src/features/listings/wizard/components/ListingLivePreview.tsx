"use client"

// Right-rail live preview: a stay-card preview that updates as the draft changes.
import React from "react"
import { Star, MapPin, Users, BedDouble, Bath } from "lucide-react"
import { formatPence } from "@/lib/marketplace/money"
import { useListingDraft } from "../data/useListingDraft"

export function ListingLivePreview() {
  const { draft } = useListingDraft()
  const cover = draft.photos.find((p) => p.isCover) ?? draft.photos[0]
  const amenityCount = draft.amenities.filter((a) => a.on).length

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
        Live preview
      </p>
      {/* Stay card */}
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <div className="relative flex h-32 items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
          {cover ? (
            <div className="text-center">
              <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-white/70 text-slate-400">
                ▦
              </div>
              <p className="px-2 text-[10px] text-slate-400">{cover.fileName}</p>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400">No cover image yet</p>
          )}
          <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
            {draft.listingType === "short-term" ? "Short stay" : "Long let"}
          </span>
        </div>
        <div className="p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-2 text-[13px] font-bold text-slate-900">
              {draft.title || "Untitled listing"}
            </p>
            <span className="flex shrink-0 items-center gap-0.5 text-[11px] font-semibold text-slate-700">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> New
            </span>
          </div>
          <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
            <MapPin className="h-3 w-3" />
            {[draft.city, draft.postcode].filter(Boolean).join(", ") || "Location pending"}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {draft.guestCapacity}
            </span>
            <span className="flex items-center gap-1">
              <BedDouble className="h-3 w-3" />
              {draft.bedrooms} bd
            </span>
            <span className="flex items-center gap-1">
              <Bath className="h-3 w-3" />
              {draft.bathrooms} ba
            </span>
            <span>{amenityCount} amenities</span>
          </div>
          <div className="mt-3 flex items-baseline gap-1 border-t border-slate-100 pt-2">
            <span className="text-[15px] font-bold text-slate-900">
              {formatPence(draft.baseRatePence, draft.currency)}
            </span>
            <span className="text-[11px] text-slate-500">
              / {draft.listingType === "short-term" ? "night" : "month"}
            </span>
          </div>
        </div>
      </div>

      {draft.highlights.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 px-1 text-[11px] font-semibold text-slate-500">Highlights</p>
          <div className="flex flex-wrap gap-1.5 px-1">
            {draft.highlights.slice(0, 4).map((h) => (
              <span
                key={h.id}
                className="rounded-full bg-[var(--brand-soft)] px-2 py-0.5 text-[10px] font-medium text-[var(--brand)]"
              >
                {h.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
