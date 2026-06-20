"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  MapPin, Star, ShieldCheck, BadgeCheck, Zap, ChevronLeft, CalendarCheck,
  CheckCircle2, Info, BedDouble, Bath, Ruler, Lock, Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PriceTag, formatPence } from "@/components/marketplace/PriceTag"
import { TrustBadge } from "@/components/marketplace/TrustBadge"
import type { PublicListingDetail as Listing } from "./data"
import { intentForTransactionType } from "./intent"
import { trustFromListing } from "./trust"
import QuoteRequestForm from "./QuoteRequestForm"

/* ──────────────────────────────────────────────────────────────────────────
   PublicListingDetail — the public listing surface with a REAL primary CTA.

   - "checkout" intents (stays/services): a Reserve CTA that links to the real
     checkout draft route (/marketplace/checkout/[listingId]) which drives the
     escrow checkout API + Stripe Elements. NO no-op setState.
   - "quote" intents (suppliers/emergency): an inline QuoteRequestForm that
     POSTs a real `marketplace_enquiries` row.

   Price breakdown uses the 2.5% platform fee surfaced from fees.ts semantics
   (informational, server is authoritative). Money is integer pence.
─────────────────────────────────────────────────────────────────────────── */

const GRADIENT: Record<string, string> = {
  stays: "linear-gradient(135deg, #0369A1 0%, #0EA5E9 100%)",
  suppliers: "linear-gradient(135deg, #EA580C 0%, #F97316 100%)",
  emergency: "linear-gradient(135deg, #B91C1C 0%, #EF4444 100%)",
  services: "linear-gradient(135deg, #6D28D9 0%, #8B5CF6 100%)",
  all: "linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)",
}

interface Props {
  listing: Listing
  /** Session info passed from the server page (anon → null). */
  session?: {
    signedIn: boolean
    email?: string | null
    name?: string | null
    buyerWorkspaceId?: string | null
  }
}

export default function PublicListingDetail({ listing, session }: Props) {
  const intent = intentForTransactionType(listing.transactionType)
  const Icon = intent.icon
  const gallery = listing.images.length > 0 ? listing.images : []
  const [active, setActive] = useState(0)
  const trust = trustFromListing(listing)
  const isStay = intent.key === "stays"
  const isCheckout = intent.cta === "checkout"

  const backHref = isStay ? "/marketplace/stays" : intent.key === "services" ? "/marketplace/services" : intent.key === "emergency" ? "/marketplace/emergency" : "/marketplace/suppliers"

  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-6 sm:py-8">
      <Link href={backHref} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-700 transition-colors mb-4">
        <ChevronLeft className="w-4 h-4" /> Back to {intent.label.toLowerCase()}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Gallery */}
          <div>
            <div
              className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm"
              style={gallery.length === 0 ? { background: GRADIENT[intent.key] } : undefined}
            >
              {gallery.length > 0 ? (
                <Image key={gallery[active]} src={gallery[active]} alt={listing.title} fill className="object-cover" sizes="(max-width:1024px) 100vw, 820px" priority />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-85">
                  <Icon className="w-14 h-14 text-white/90" />
                  <span className="text-white/80 text-[13px] font-medium">No photos provided</span>
                </div>
              )}
              {listing.instantBook && (
                <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-[#2563EB] shadow-sm">
                  <Zap className="w-3 h-3" /> Instant book
                </span>
              )}
            </div>
            {gallery.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                {gallery.map((src, i) => (
                  <button
                    key={src}
                    onClick={() => setActive(i)}
                    className={cn("relative w-20 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all", i === active ? "border-[#2563EB]" : "border-transparent opacity-70 hover:opacity-100")}
                    aria-label={`View image ${i + 1}`}
                  >
                    <Image src={src} alt="" fill className="object-cover" sizes="80px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title block */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold", intent.accentBg, intent.accent)}>
                <Icon className="w-3 h-3" /> {intent.label}
              </span>
              {trust.includes("verified") && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                  <BadgeCheck className="w-3 h-3" /> Verified
                </span>
              )}
            </div>
            <h1 className="text-[22px] sm:text-[26px] font-bold tracking-tight text-[#0B1B3F] leading-tight">{listing.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-slate-500">
              {(listing.city || listing.location) && (
                <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {listing.city ?? listing.location}</span>
              )}
              {listing.rating != null && listing.rating > 0 && (
                <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {listing.rating.toFixed(1)}
                  {listing.reviewCount != null && <span className="font-normal text-slate-400"> · {listing.reviewCount} reviews</span>}
                </span>
              )}
            </div>
          </div>

          {/* Stay facts */}
          {isStay && (listing.bedrooms != null || listing.bathrooms != null || listing.floorAreaSqm != null) && (
            <div className="flex flex-wrap gap-5 rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
              {listing.bedrooms != null && <Fact icon={<BedDouble className="w-4 h-4" />} label="Bedrooms" value={String(listing.bedrooms)} />}
              {listing.bathrooms != null && <Fact icon={<Bath className="w-4 h-4" />} label="Bathrooms" value={String(listing.bathrooms)} />}
              {listing.floorAreaSqm != null && <Fact icon={<Ruler className="w-4 h-4" />} label="Floor area" value={`${listing.floorAreaSqm} m²`} />}
            </div>
          )}

          {/* Description */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-[15px] font-bold text-slate-900 mb-2">About this {isStay ? "stay" : "listing"}</h2>
            {listing.description ? (
              <p className="text-[13.5px] leading-relaxed text-slate-600 whitespace-pre-line">{listing.description}</p>
            ) : (
              <p className="text-[13px] text-slate-400 italic">The seller hasn&apos;t added a description yet.</p>
            )}
            {listing.features.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {listing.features.map((f) => (
                  <span key={f} className="inline-flex items-center gap-1 rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1 text-[12px] font-medium text-slate-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> {f}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Policies / trust */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-[15px] font-bold text-slate-900 mb-3">Booking protection</h2>
            <ul className="space-y-2.5 text-[13px] text-slate-600">
              <li className="flex items-start gap-2.5"><ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> Payments are held securely in escrow and only released once the {isStay ? "stay" : "job"} is completed.</li>
              <li className="flex items-start gap-2.5"><Lock className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> Card details are processed by Stripe — Propvora never stores your card.</li>
              <li className="flex items-start gap-2.5"><Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" /> A {listing.currency ?? "GBP"} 2.5% platform fee supports dispute resolution and buyer protection.</li>
            </ul>
          </div>
        </div>

        {/* RIGHT — price + CTA */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-[72px]">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_4px_24px_rgba(15,23,42,0.06)] p-5">
            <div className="flex items-baseline justify-between">
              <PriceTag pence={listing.basePricePence} currency={listing.currency} pricingModel={listing.pricingModel} size="lg" />
              {listing.instantBook && (
                <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#2563EB]"><Zap className="w-3.5 h-3.5" /> Instant</span>
              )}
            </div>

            {/* Price breakdown for checkout intents */}
            {isCheckout && listing.basePricePence != null && listing.basePricePence > 0 && (
              <PriceBreakdown pence={listing.basePricePence} currency={listing.currency ?? "GBP"} />
            )}

            <div className="mt-4">
              {isCheckout ? (
                <Link
                  href={`/marketplace/checkout/${listing.id}`}
                  className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-[#2563EB] text-white text-[14.5px] font-semibold shadow-[0_2px_12px_rgba(37,99,235,0.32)] hover:bg-[#1d4ed8] transition-colors"
                >
                  <CalendarCheck className="w-4.5 h-4.5" />
                  {isStay ? "Reserve this stay" : "Book this service"}
                </Link>
              ) : (
                <div>
                  <div className="flex items-center gap-1.5 mb-3 text-[12px] font-semibold text-slate-500">
                    {intent.key === "emergency" ? <Clock className="w-3.5 h-3.5 text-red-500" /> : <Star className="w-3.5 h-3.5 text-amber-400" />}
                    {intent.key === "emergency" ? "Responds now — request a call-out" : "Request a quote from this supplier"}
                  </div>
                  <QuoteRequestForm
                    listingId={listing.id}
                    defaultEmail={session?.email ?? null}
                    defaultName={session?.name ?? null}
                    buyerWorkspaceId={session?.buyerWorkspaceId ?? null}
                    urgent={intent.key === "emergency"}
                  />
                </div>
              )}
            </div>

            {isCheckout && (
              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
                <Info className="w-3.5 h-3.5 shrink-0" />
                {session?.signedIn ? "You'll confirm payment securely on the next step." : "You'll sign in to confirm payment securely."}
              </p>
            )}
          </div>

          {trust.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h2 className="text-[13.5px] font-bold text-slate-900 mb-3">Why you can trust this listing</h2>
              <div className="flex flex-wrap gap-1.5">
                {trust.map((t) => <TrustBadge key={t} kind={t} size="md" />)}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 text-slate-500">{icon}</span>
      <div>
        <span className="block text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
        <span className="block text-[14px] font-bold text-slate-800">{value}</span>
      </div>
    </div>
  )
}

/** Informational price breakdown (2.5% platform fee). Server is authoritative. */
function PriceBreakdown({ pence, currency }: { pence: number; currency: string }) {
  const fee = Math.round(pence * 0.025)
  const total = pence + fee
  return (
    <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-[12.5px]">
      <Row label="Listing price" value={formatPence(pence, currency)} />
      <Row label="Platform fee (2.5%)" value={formatPence(fee, currency)} muted />
      <div className="pt-1.5 mt-1 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[13px] font-bold text-slate-800">Estimated total</span>
        <span className="text-[14px] font-bold text-slate-900 tabular-nums">{formatPence(total, currency)}</span>
      </div>
    </div>
  )
}
function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn("text-slate-500", muted && "text-slate-400")}>{label}</span>
      <span className="font-medium text-slate-700 tabular-nums">{value}</span>
    </div>
  )
}
