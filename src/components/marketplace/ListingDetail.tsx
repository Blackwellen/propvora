"use client"

import React, { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  MapPin, ChevronLeft, CheckCircle2, MessageSquare, CalendarCheck,
  ShoppingBag, Info, Building2, Loader2, AlertCircle, Send,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import type { MarketListing } from "./types"
import { categoryMeta, transactionTypeMeta, prettify } from "./taxonomy"
import { PriceTag } from "./PriceTag"
import { TransactionTypeBadge } from "./TransactionTypeBadge"
import { ReviewStars } from "./ReviewStars"
import { TrustBadge, type TrustKind } from "./TrustBadge"

/* ──────────────────────────────────────────────────────────────────────────
   ListingDetail — full listing surface (desktop + mobile).

   Media gallery (or category fallback), price, description, seller trust block,
   and a REAL primary CTA driven by the listing's transaction_type:
     - stay_booking / service_package → "Reserve" links to the real escrow
       checkout draft (/marketplace/checkout/[id]) which drives the checkout API
       + Stripe Elements.
     - supplier_job / emergency_job → an inline enquiry that POSTs a real
       `marketplace_enquiries` row via /api/marketplace/enquiries.
   No `setRequested(true)` no-op — every CTA performs a real action.
─────────────────────────────────────────────────────────────────────────── */

/** True when the listing is bought through escrow checkout (vs a quote). */
function isCheckoutType(tt: string | null | undefined): boolean {
  return tt === "stay_booking" || tt === "service_package"
}

const CATEGORY_GRADIENT: Record<string, string> = {
  maintenance: "linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)",
  trades: "linear-gradient(135deg, #EA580C 0%, #F97316 100%)",
  cleaning: "linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)",
  compliance: "linear-gradient(135deg, #059669 0%, #10B981 100%)",
  professional: "linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)",
  property: "linear-gradient(135deg, #0369A1 0%, #0EA5E9 100%)",
  supplies: "linear-gradient(135deg, #B45309 0%, #F59E0B 100%)",
  facilities: "linear-gradient(135deg, #475569 0%, #64748B 100%)",
  marketing: "linear-gradient(135deg, #BE185D 0%, #EC4899 100%)",
  other: "linear-gradient(135deg, #374151 0%, #6B7280 100%)",
}

export interface ListingDetailProps {
  listing: MarketListing
  /** Additional gallery image URLs (beyond the thumbnail). */
  media?: string[]
  /** Display-only seller signals — supplied by the data layer only. */
  seller?: {
    name?: string | null
    rating?: number | null
    reviewCount?: number | null
    trust?: TrustKind[]
    memberSince?: string | null
  }
}

function ctaForType(type: string | null | undefined): { label: string; icon: typeof MessageSquare } {
  switch (type) {
    case "booking":
      return { label: "Request to book", icon: CalendarCheck }
    case "sale":
      return { label: "Enquire to buy", icon: ShoppingBag }
    case "rental":
      return { label: "Request availability", icon: CalendarCheck }
    case "service":
    case "lead":
    default:
      return { label: "Request this listing", icon: MessageSquare }
  }
}

export function ListingDetail({ listing, media = [], seller }: ListingDetailProps) {
  const cat = categoryMeta(listing.category)
  const CatIcon = cat.icon
  const tt = transactionTypeMeta(listing.transactionType)
  const gradient = CATEGORY_GRADIENT[cat.key] ?? CATEGORY_GRADIENT.other

  // Gallery = thumbnail (if any) + extra media, de-duplicated.
  const gallery = Array.from(
    new Set([listing.thumbnailUrl, ...media].filter(Boolean) as string[])
  )
  const [activeImg, setActiveImg] = useState(0)
  const cta = ctaForType(listing.transactionType)
  const CtaIcon = cta.icon
  const checkout = isCheckoutType(listing.transactionType)

  const sellerName = seller?.name?.trim() || "Verified seller"
  const sellerInitial = sellerName.charAt(0).toUpperCase()

  return (
    <div className="w-full">
      {/* Back link (desktop; mobile uses MobileTopBar at the page level) */}
      <div className="hidden md:block mb-4">
        <Link
          href="/app/marketplace"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to marketplace
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ── LEFT: gallery + description ── */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Gallery */}
          <div>
            <div
              className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm"
              style={gallery.length === 0 ? { background: gradient } : undefined}
            >
              {gallery.length > 0 ? (
                <Image
                  key={gallery[activeImg]}
                  src={gallery[activeImg]}
                  alt={listing.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 760px"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-80">
                  <CatIcon className="w-14 h-14 text-white/90" />
                  <span className="text-white/80 text-[13px] font-medium">No photos provided</span>
                </div>
              )}
              <span className="absolute top-3 left-3">
                <TransactionTypeBadge type={listing.transactionType} className="shadow-sm" />
              </span>
            </div>

            {/* Thumbnails */}
            {gallery.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-hide">
                {gallery.map((src, i) => (
                  <button
                    key={src}
                    onClick={() => setActiveImg(i)}
                    className={cn(
                      "relative w-20 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all",
                      i === activeImg ? "border-[#2563EB]" : "border-transparent opacity-70 hover:opacity-100"
                    )}
                    aria-label={`View image ${i + 1}`}
                  >
                    <Image src={src} alt="" fill className="object-cover" sizes="80px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-[15px] font-bold text-slate-900 mb-2">About this listing</h2>
            {listing.description ? (
              <p className="text-[13.5px] leading-relaxed text-slate-600 whitespace-pre-line">
                {listing.description}
              </p>
            ) : (
              <p className="text-[13px] text-slate-400 italic">
                The seller hasn&apos;t added a description for this listing yet.
              </p>
            )}

            {/* Attribute chips */}
            <div className="mt-4 flex flex-wrap gap-2">
              <DetailChip label="Category" value={cat.label} icon={<CatIcon className={cn("w-3.5 h-3.5", cat.color)} />} />
              <DetailChip label="Type" value={tt.label} />
              {listing.countryCode && <DetailChip label="Country" value={listing.countryCode} />}
              {listing.pricingModel && <DetailChip label="Pricing" value={prettify(listing.pricingModel)} />}
            </div>
          </div>
        </div>

        {/* ── RIGHT: price card + seller + CTA ── */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-4">
          {/* Price + CTA */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h1 className="text-[18px] font-bold text-slate-900 leading-snug">{listing.title}</h1>
            {listing.location && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {listing.location}
              </p>
            )}

            <div className="mt-4 pt-4 border-t border-slate-100">
              <PriceTag
                pence={listing.basePricePence}
                currency={listing.currency}
                pricingModel={listing.pricingModel}
                size="lg"
              />
              <p className="mt-1 text-[11.5px] text-slate-400">
                Final price is agreed with the seller before any commitment.
              </p>
            </div>

            {checkout ? (
              <>
                <Button variant="primary" size="lg" className="mt-4 w-full" asChild>
                  <Link href={`/marketplace/checkout/${listing.id}`}>
                    <CalendarCheck className="w-4 h-4" />
                    {cta.label}
                  </Link>
                </Button>
                <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  You&apos;ll confirm payment securely with escrow protection.
                </p>
              </>
            ) : (
              <InlineEnquiry listingId={listing.id} ctaLabel={cta.label} CtaIcon={CtaIcon} />
            )}
          </div>

          {/* Seller trust */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-[13.5px] font-bold text-slate-900 mb-3">Seller</h2>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] font-bold text-[16px] shrink-0">
                {sellerInitial || <Building2 className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <p className="text-[13.5px] font-bold text-slate-900 truncate">{sellerName}</p>
                <ReviewStars rating={seller?.rating ?? null} count={seller?.reviewCount ?? null} size="sm" />
              </div>
            </div>

            {seller?.trust && seller.trust.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {seller.trust.map((t) => (
                  <TrustBadge key={t} kind={t} size="md" />
                ))}
              </div>
            )}

            {seller?.memberSince && (
              <p className="mt-3 text-[11.5px] text-slate-400">On Propvora since {seller.memberSince}</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

/**
 * InlineEnquiry — the REAL quote/enquiry CTA for supplier/emergency listings.
 * POSTs a `marketplace_enquiries` row via /api/marketplace/enquiries (no no-op).
 * For a signed-in operator the session supplies buyer identity server-side, so
 * the form only needs the message.
 */
function InlineEnquiry({
  listingId,
  ctaLabel,
  CtaIcon,
}: {
  listingId: string
  ctaLabel: string
  CtaIcon: typeof MessageSquare
}) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [phase, setPhase] = useState<"idle" | "sending" | "done">("idle")
  const [error, setError] = useState<string | null>(null)

  async function send() {
    if (!message.trim()) {
      setError("Please describe what you need.")
      return
    }
    setPhase("sending")
    setError(null)
    try {
      const res = await fetch("/api/marketplace/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, message: message.trim(), gdprConsent: true }),
      })
      const data = (await res.json().catch(() => null)) as { error?: string } | null
      if (!res.ok) {
        setError(data?.error ?? "We couldn't send your enquiry. Please try again.")
        setPhase("idle")
        return
      }
      setPhase("done")
    } catch {
      setError("We couldn't send your enquiry. Please try again.")
      setPhase("idle")
    }
  }

  if (phase === "done") {
    return (
      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
        <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-[13px] font-semibold text-emerald-800">Enquiry sent</p>
          <p className="text-[12px] text-emerald-700 mt-0.5">
            The supplier has your request and will respond shortly. You can track replies in your marketplace messages.
          </p>
        </div>
      </div>
    )
  }

  if (!open) {
    return (
      <>
        <Button variant="primary" size="lg" className="mt-4 w-full" onClick={() => setOpen(true)}>
          <CtaIcon className="w-4 h-4" />
          {ctaLabel}
        </Button>
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
          <Info className="w-3.5 h-3.5 shrink-0" />
          No payment is taken — you agree pricing with the supplier first.
        </p>
      </>
    )
  }

  return (
    <div className="mt-4 space-y-2.5">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        placeholder="Describe the job, timing and location…"
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 resize-none"
      />
      {error && (
        <p className="text-[12px] text-red-600 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
        </p>
      )}
      <Button variant="primary" size="lg" className="w-full" onClick={send} disabled={phase === "sending"}>
        {phase === "sending" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {phase === "sending" ? "Sending…" : "Send enquiry"}
      </Button>
    </div>
  )
}

function DetailChip({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1">
      {icon}
      <span className="text-[10.5px] font-medium text-slate-400 uppercase tracking-wide">{label}</span>
      <span className="text-[12px] font-semibold text-slate-700">{value}</span>
    </span>
  )
}

export default ListingDetail
