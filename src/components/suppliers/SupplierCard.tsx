"use client"

import React, { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  MapPin, Star, BadgeCheck, ShieldCheck, Zap, Clock, Wrench, Hammer,
  Sparkles, Building2, Layers, Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PriceTag } from "@/components/marketplace/PriceTag"
import type { SupplierCard as SupplierCardData } from "@/lib/marketplace/suppliers"

/* ──────────────────────────────────────────────────────────────────────────
   SupplierCard — the premium operator-procurement supplier card.

   Reads ONLY real, data-layer-supplied signals (rating, verification, response
   time, coverage radius, price band, services, trades). Nothing is fabricated:
   a missing signal is simply not rendered.

   Variants:
     - "grid" (default): tall cover card for the results grid.
     - "list":           wide horizontal row for the list view.
   `selectable` adds a compare checkbox overlay.
─────────────────────────────────────────────────────────────────────────── */

const TRADE_ICON: Record<string, typeof Wrench> = {
  cleaning: Sparkles,
  maintenance: Wrench,
  electrical: Zap,
  plumbing: Wrench,
  gas: Wrench,
  building: Hammer,
}

function tradeIcon(trades: string[]): typeof Wrench {
  for (const t of trades) {
    const key = t.toLowerCase()
    for (const [k, Icon] of Object.entries(TRADE_ICON)) if (key.includes(k)) return Icon
  }
  return Building2
}

/** Stable wrapper so the resolved trade icon isn't "created during render". */
function TradeIcon({ trades, className }: { trades: string[]; className?: string }) {
  const Icon = tradeIcon(trades)
  return <Icon className={className} />
}

const BAND_LABEL: Record<string, { label: string; cls: string }> = {
  budget: { label: "££ Budget", cls: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  mid: { label: "£££ Mid", cls: "bg-amber-50 text-amber-700 border-amber-100" },
  premium: { label: "££££ Premium", cls: "bg-violet-50 text-[#7C3AED] border-violet-100" },
  quote: { label: "Price on request", cls: "bg-slate-50 text-slate-500 border-slate-200" },
}

function responseLabel(hours: number | null): string | null {
  if (hours == null) return null
  if (hours <= 1) return "Responds within 1h"
  if (hours <= 4) return `Responds in ~${hours}h`
  if (hours <= 24) return "Responds within a day"
  return "Responds in a few days"
}

export interface SupplierCardProps {
  supplier: SupplierCardData
  variant?: "grid" | "list"
  /** Compare-mode checkbox. */
  selectable?: boolean
  selected?: boolean
  onToggleSelect?: (id: string) => void
  className?: string
}

const HREF = (id: string) => `/property-manager/marketplace/suppliers/${id}`

export function SupplierCard({
  supplier: s,
  variant = "grid",
  selectable = false,
  selected = false,
  onToggleSelect,
  className,
}: SupplierCardProps) {
  const [imgError, setImgError] = useState(false)
  const showImage = !!s.thumbnailUrl && !imgError
  const band = BAND_LABEL[s.priceBand.band] ?? BAND_LABEL.quote
  const respond = responseLabel(s.responseTimeHours)

  const CompareToggle = selectable ? (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onToggleSelect?.(s.id)
      }}
      aria-pressed={selected}
      aria-label={selected ? "Remove from comparison" : "Add to comparison"}
      className={cn(
        "absolute top-2.5 right-2.5 z-10 inline-flex items-center justify-center w-7 h-7 rounded-lg border transition-all shadow-sm",
        selected
          ? "bg-[#2563EB] border-[#2563EB] text-white"
          : "bg-white/95 border-slate-200 text-slate-400 hover:text-slate-600"
      )}
    >
      <Check className="w-4 h-4" />
    </button>
  ) : null

  if (variant === "list") {
    return (
      <div className={cn("relative", className)}>
        {CompareToggle}
        <Link href={HREF(s.id)} className="block group">
          <article className="flex gap-4 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.09)] hover:-translate-y-0.5 transition-all duration-200">
            <div className="relative w-28 h-28 shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-[#1D4ED8] to-[#2563EB]">
              {showImage ? (
                <Image src={s.thumbnailUrl!} alt={s.title} fill className="object-cover" sizes="112px" onError={() => setImgError(true)} />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                  <TradeIcon trades={s.trades} className="w-10 h-10 text-white" />
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-start gap-2">
                <h3 className="text-[15px] font-bold text-slate-900 leading-snug line-clamp-1 group-hover:text-[#2563EB] transition-colors">{s.title}</h3>
                {(s.verificationStatus === "verified" || s.verificationStatus === "approved") && (
                  <BadgeCheck className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" aria-label="Verified" />
                )}
              </div>
              <SupplierMetaRow s={s} respond={respond} />
              {s.trades.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {s.trades.slice(0, 4).map((t) => (
                    <span key={t} className="inline-flex rounded-md bg-slate-50 border border-slate-200 px-1.5 py-0.5 text-[10.5px] font-medium text-slate-600 capitalize">{t}</span>
                  ))}
                </div>
              )}
              <div className="mt-auto pt-2 flex items-center justify-between gap-2">
                <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold", band.cls)}>{band.label}</span>
                <PriceTag pence={s.basePricePence} currency={s.currency} pricingModel={s.pricingModel} size="md" emptyLabel="Quote" />
              </div>
            </div>
          </article>
        </Link>
      </div>
    )
  }

  return (
    <div className={cn("relative", className)}>
      {CompareToggle}
      <Link href={HREF(s.id)} className="block group h-full">
        <article className="relative bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.10)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col h-full">
          <div className="relative h-36 overflow-hidden bg-gradient-to-br from-[#1D4ED8] to-[#2563EB]">
            {showImage ? (
              <Image src={s.thumbnailUrl!} alt={s.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width:768px) 100vw, 360px" onError={() => setImgError(true)} />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center opacity-25">
                <TradeIcon trades={s.trades} className="w-12 h-12 text-white" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
              {(s.verificationStatus === "verified" || s.verificationStatus === "approved") && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10.5px] font-bold text-[#2563EB] shadow-sm"><BadgeCheck className="w-3 h-3" /> Verified</span>
              )}
              {s.acceptsEmergency && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-600/95 px-2 py-0.5 text-[10.5px] font-bold text-white shadow-sm"><Zap className="w-3 h-3" /> Emergency</span>
              )}
            </div>
            {s.insuranceVerified && (
              <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-emerald-600/95 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm"><ShieldCheck className="w-3 h-3" /> Insured</span>
            )}
          </div>

          <div className="px-3.5 pt-2.5 pb-3 flex flex-col flex-1">
            <h3 className="text-[14px] font-bold text-slate-900 leading-snug line-clamp-1 group-hover:text-[#2563EB] transition-colors">{s.title}</h3>
            <SupplierMetaRow s={s} respond={respond} />

            {s.trades.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {s.trades.slice(0, 3).map((t) => (
                  <span key={t} className="inline-flex rounded-md bg-slate-50 border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 capitalize">{t}</span>
                ))}
                {s.trades.length > 3 && <span className="text-[10px] text-slate-400 self-center">+{s.trades.length - 3}</span>}
              </div>
            )}

            <div className="mt-auto pt-2.5 flex items-end justify-between gap-2 border-t border-slate-100">
              <div className="flex flex-col gap-1">
                <span className={cn("inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold", band.cls)}>{band.label}</span>
                <PriceTag pence={s.basePricePence} currency={s.currency} pricingModel={s.pricingModel} size="md" emptyLabel="Quote" />
              </div>
              {s.serviceCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400"><Layers className="w-3 h-3" /> {s.serviceCount} {s.serviceCount === 1 ? "service" : "services"}</span>
              )}
            </div>
          </div>
        </article>
      </Link>
    </div>
  )
}

/** Shared meta row: location · rating · response · coverage. */
function SupplierMetaRow({ s, respond }: { s: SupplierCardData; respond: string | null }) {
  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
      {(s.location || s.baseLocation) && (
        <span className="inline-flex items-center gap-1 truncate max-w-[55%]">
          <MapPin className="w-3 h-3 shrink-0 text-slate-400" /> <span className="truncate">{s.location ?? s.baseLocation}</span>
        </span>
      )}
      {s.rating != null && s.rating > 0 && (
        <span className="inline-flex items-center gap-0.5 font-semibold text-slate-700">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {s.rating.toFixed(1)}
          {s.reviewCount != null && s.reviewCount > 0 && <span className="font-normal text-slate-400"> ({s.reviewCount})</span>}
        </span>
      )}
      {respond && (
        <span className="inline-flex items-center gap-1 text-slate-500"><Clock className="w-3 h-3 text-slate-400" /> {respond}</span>
      )}
      {s.serviceRadiusKm != null && (
        <span className="inline-flex items-center gap-1 text-slate-500">{s.serviceRadiusKm}km radius</span>
      )}
    </div>
  )
}

export default SupplierCard
