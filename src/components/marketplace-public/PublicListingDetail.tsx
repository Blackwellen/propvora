"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  MapPin, Star, ShieldCheck, BadgeCheck, Zap, ChevronLeft, CalendarCheck,
  CheckCircle2, Info, BedDouble, Bath, Ruler, Lock, Clock,
  Phone, ArrowRight, Award, Users, Wrench, Package,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PriceTag, formatPence } from "@/components/marketplace/PriceTag"
import { TrustBadge } from "@/components/marketplace/TrustBadge"
import type { PublicListingDetail as Listing } from "./data"
import { intentForTransactionType } from "./intent"
import { trustFromListing } from "./trust"
import QuoteRequestForm from "./QuoteRequestForm"
import BookingWidget from "./BookingWidget"

/* ──────────────────────────────────────────────────────────────────────────
   PublicListingDetail — enterprise-premium public listing surface.

   Three intent modes:
   - "checkout" (stays / services): hero banner → key-info strip → description
     → what's included → emergency callout (if applicable) → checkout CTA
   - "quote" (suppliers): cover photo → profile header → trust badges → stats
     → about → services grid → reviews → quote form
   - "emergency" (emergency): red-accent hero → response guarantee callout →
     urgent quote form
─────────────────────────────────────────────────────────────────────────── */

const GRADIENT: Record<string, string> = {
  stays: "linear-gradient(135deg, #0369A1 0%, #0EA5E9 100%)",
  suppliers: "linear-gradient(135deg, #EA580C 0%, #F97316 100%)",
  emergency: "linear-gradient(135deg, #B91C1C 0%, #EF4444 100%)",
  services: "linear-gradient(135deg, #6D28D9 0%, #8B5CF6 100%)",
  all: "linear-gradient(135deg, var(--brand-strong) 0%, var(--brand) 100%)",
}

interface Props {
  listing: Listing
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
  const isService = intent.key === "services"
  const isSupplier = intent.key === "suppliers"
  const isEmergency = intent.key === "emergency"
  const isCheckout = intent.cta === "checkout"

  const backHref = isStay
    ? "/marketplace/stays"
    : isService
    ? "/marketplace/services"
    : isEmergency
    ? "/marketplace/emergency"
    : "/marketplace/suppliers"

  // ── Supplier / Emergency premium layout ───────────────────────────────────
  if (isSupplier || isEmergency) {
    return <SupplierProfileLayout listing={listing} session={session} intent={intent} trust={trust} />
  }

  // ── Service / Stay premium layout ─────────────────────────────────────────
  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-6 sm:py-8">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-700 transition-colors mb-4"
      >
        <ChevronLeft className="w-4 h-4" /> Back to {intent.label.toLowerCase()}
      </Link>

      {/* ── Hero Banner ── */}
      <div
        className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-md mb-6"
        style={{ aspectRatio: "21/9" }}
      >
        {gallery.length > 0 ? (
          <>
            <Image
              key={gallery[active]}
              src={gallery[active]}
              alt={listing.title}
              fill
              className="object-cover"
              sizes="(max-width:1280px) 100vw, 1280px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          </>
        ) : (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2"
            style={{ background: GRADIENT[intent.key] }}
          >
            <Icon className="w-16 h-16 text-white/80" aria-hidden="true" />
          </div>
        )}

        {/* Overlay content */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-white/20 text-white backdrop-blur-sm"
              )}
            >
              <Icon className="w-3 h-3" aria-hidden="true" /> {intent.label}
            </span>
            {trust.includes("verified") && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                <BadgeCheck className="w-3 h-3" aria-hidden="true" /> Verified
              </span>
            )}
            {listing.instantBook && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--brand)]/90 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                <Zap className="w-3 h-3" aria-hidden="true" /> Instant book
              </span>
            )}
          </div>
          <h1 className="text-[22px] sm:text-[30px] font-bold text-white leading-tight drop-shadow-sm">
            {listing.title}
          </h1>
          {(listing.city || listing.location) && (
            <p className="mt-1 flex items-center gap-1.5 text-white/80 text-[13px]">
              <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              {listing.city ?? listing.location}
            </p>
          )}
        </div>
      </div>

      {/* Gallery thumbnails */}
      {gallery.length > 1 && (
        <div className="mb-5 flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {gallery.map((src, i) => (
            <button
              key={src}
              onClick={() => setActive(i)}
              className={cn(
                "relative w-20 h-14 shrink-0 rounded-xl overflow-hidden border-2 transition-all",
                i === active ? "border-[var(--brand)]" : "border-transparent opacity-70 hover:opacity-100"
              )}
              aria-label={`View image ${i + 1}`}
            >
              <Image src={src} alt="" fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Stay facts */}
          {isStay && (listing.bedrooms != null || listing.bathrooms != null || listing.floorAreaSqm != null) && (
            <div className="flex flex-wrap gap-5 rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
              {listing.bedrooms != null && (
                <Fact icon={<BedDouble className="w-4 h-4" aria-hidden="true" />} label="Bedrooms" value={String(listing.bedrooms)} />
              )}
              {listing.bathrooms != null && (
                <Fact icon={<Bath className="w-4 h-4" aria-hidden="true" />} label="Bathrooms" value={String(listing.bathrooms)} />
              )}
              {listing.floorAreaSqm != null && (
                <Fact icon={<Ruler className="w-4 h-4" aria-hidden="true" />} label="Floor area" value={`${listing.floorAreaSqm} m²`} />
              )}
            </div>
          )}

          {/* Key info strip (services) */}
          {isService && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {listing.basePricePence != null && listing.basePricePence > 0 && (
                <KeyInfoTile label="Price from" value={formatPence(listing.basePricePence, listing.currency ?? "GBP")} />
              )}
              {listing.serviceArea && (
                <KeyInfoTile label="Coverage area" value={listing.serviceArea} />
              )}
              {listing.availableFrom && (
                <KeyInfoTile label="Next available" value={new Date(listing.availableFrom).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} />
              )}
              {listing.instantBook && (
                <KeyInfoTile label="Response" value="Instant book" accent />
              )}
            </div>
          )}

          {/* Description */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-[15px] font-bold text-slate-900 mb-2">
              About this {isStay ? "stay" : isService ? "service" : "listing"}
            </h2>
            {listing.description ? (
              <p className="text-[13.5px] leading-relaxed text-slate-600 whitespace-pre-line">
                {listing.description}
              </p>
            ) : (
              <p className="text-[13px] text-slate-400 italic">
                No description has been added yet.
              </p>
            )}
          </div>

          {/* What's included (features) */}
          {listing.features.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h2 className="text-[15px] font-bold text-slate-900 mb-3">What&apos;s included</h2>
              <ul className="space-y-2">
                {listing.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[13.5px] text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Emergency callout (if service is emergency) */}
          {isService && listing.instantBook && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4.5 h-4.5 text-white" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-[14px] font-bold text-red-800">Emergency service available</h2>
                  <p className="text-[12px] text-red-600">Available 24/7 · Rapid response guaranteed</p>
                </div>
              </div>
              <p className="text-[13px] text-red-700 leading-relaxed mb-3">
                This provider offers an emergency call-out service. Contact them directly for the fastest response.
              </p>
              {listing.postcode && (
                <a
                  href={`tel:`}
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-red-600 text-white text-[13px] font-semibold hover:bg-red-700 transition-colors"
                >
                  <Phone className="w-4 h-4" aria-hidden="true" /> Call now
                </a>
              )}
            </div>
          )}

          {/* Booking protection */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-[15px] font-bold text-slate-900 mb-3">Booking protection</h2>
            <ul className="space-y-2.5 text-[13px] text-slate-600">
              <li className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
                Payments are held securely in escrow and only released once the{" "}
                {isStay ? "stay" : "job"} is completed.
              </li>
              <li className="flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
                Card details are processed by Stripe — Propvora never stores your card.
              </li>
              <li className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
                A {listing.currency ?? "GBP"} 2.5% platform fee supports dispute resolution and buyer
                protection.
              </li>
            </ul>
          </div>
        </div>

        {/* RIGHT — price + CTA */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-[72px]">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_4px_24px_rgba(15,23,42,0.06)] p-5">
            <div className="flex items-baseline justify-between">
              <PriceTag
                pence={listing.basePricePence}
                currency={listing.currency}
                pricingModel={listing.pricingModel}
                size="lg"
              />
              {listing.instantBook && (
                <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[var(--brand)]">
                  <Zap className="w-3.5 h-3.5" aria-hidden="true" /> Instant
                </span>
              )}
            </div>

            {/* Rating row */}
            {listing.rating != null && listing.rating > 0 && (
              <div className="mt-2 flex items-center gap-1.5 text-[12.5px] text-slate-600">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                <span className="font-semibold">{listing.rating.toFixed(1)}</span>
                {listing.reviewCount != null && (
                  <span className="text-slate-400">· {listing.reviewCount} reviews</span>
                )}
              </div>
            )}

            <div className="mt-4">
              {isCheckout ? (
                <BookingWidget
                  listingId={listing.id}
                  intent={intent.key as "stays" | "services"}
                  basePricePence={listing.basePricePence}
                  currency={listing.currency ?? "GBP"}
                  instantBook={listing.instantBook}
                  maxGuests={8}
                  signedIn={session?.signedIn ?? false}
                />
              ) : (
                <div>
                  <div className="flex items-center gap-1.5 mb-3 text-[12px] font-semibold text-slate-500">
                    <Star className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                    Request a quote from this supplier
                  </div>
                  <QuoteRequestForm
                    listingId={listing.id}
                    defaultEmail={session?.email ?? null}
                    defaultName={session?.name ?? null}
                    buyerWorkspaceId={session?.buyerWorkspaceId ?? null}
                    urgent={false}
                  />
                </div>
              )}
            </div>
          </div>

          {trust.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h2 className="text-[13.5px] font-bold text-slate-900 mb-3">Why you can trust this listing</h2>
              <div className="flex flex-wrap gap-1.5">
                {trust.map((t) => (
                  <TrustBadge key={t} kind={t} size="md" />
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Mobile sticky book bar — takes user to checkout; date selection happens on that page */}
      {isCheckout && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-xl items-center gap-3">
            <div className="min-w-0">
              {listing.basePricePence != null && listing.basePricePence > 0 && (
                <p className="text-[15px] font-bold tabular-nums text-[#0B1B3F]">
                  {formatPence(listing.basePricePence, listing.currency ?? "GBP")}
                </p>
              )}
              <p className="text-[11px] text-slate-400">
                {isStay ? "per night" : "per visit"}
              </p>
            </div>
            <Link
              href={`/marketplace/checkout/${listing.id}`}
              className="ml-auto inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--brand)] text-[14px] font-semibold text-white transition-colors hover:bg-[var(--brand-strong)]"
            >
              <CalendarCheck className="w-4 h-4" aria-hidden="true" />
              {isStay ? "Reserve" : "Book"}
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Supplier / Emergency premium layout ────────────────────────────────────────

interface SupplierLayoutProps {
  listing: Listing
  session: Props["session"]
  intent: ReturnType<typeof intentForTransactionType>
  trust: ReturnType<typeof trustFromListing>
}

function SupplierProfileLayout({ listing, session, intent, trust }: SupplierLayoutProps) {
  const Icon = intent.icon
  const isEmergency = intent.key === "emergency"
  const gallery = listing.images.length > 0 ? listing.images : []
  const coverImg = gallery[0] ?? null
  const avatarImg = gallery[1] ?? null

  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-6 sm:py-8">
      <Link
        href={isEmergency ? "/marketplace/emergency" : "/marketplace/suppliers"}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-700 transition-colors mb-4"
      >
        <ChevronLeft className="w-4 h-4" /> Back to {isEmergency ? "emergency" : "suppliers"}
      </Link>

      {/* ── Cover photo banner ── */}
      <div className="relative w-full rounded-2xl overflow-hidden mb-0 border border-slate-200 shadow-sm" style={{ height: "200px" }}>
        {coverImg ? (
          <Image
            src={coverImg}
            alt={`${listing.title} cover photo`}
            fill
            className="object-cover"
            sizes="(max-width:1280px) 100vw, 1280px"
            priority
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: GRADIENT[intent.key] }}
            aria-hidden="true"
          />
        )}
        {isEmergency && (
          <div className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1.5 text-[12px] font-bold text-white shadow">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" /> Available now
          </div>
        )}
      </div>

      {/* ── Profile header row (overlaps banner) ── */}
      <div className="relative -mt-10 ml-5 sm:ml-7 mb-4 flex items-end gap-4">
        {/* Avatar */}
        <div className="w-20 h-20 rounded-2xl border-4 border-white bg-white shadow-md overflow-hidden shrink-0">
          {avatarImg ? (
            <Image src={avatarImg} alt={listing.title} width={80} height={80} className="object-cover w-full h-full" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: GRADIENT[intent.key] }}
              aria-hidden="true"
            >
              <Icon className="w-8 h-8 text-white/90" aria-hidden="true" />
            </div>
          )}
        </div>
        {/* Name + badges */}
        <div className="pb-1 min-w-0">
          <h1 className="text-[20px] sm:text-[24px] font-bold text-[#0B1B3F] leading-tight truncate">
            {listing.title}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {listing.category && (
              <span className={cn("text-[11px] font-semibold rounded-full px-2 py-0.5", intent.accentBg, intent.accent)}>
                {listing.category}
              </span>
            )}
            {(listing.city || listing.location) && (
              <span className="inline-flex items-center gap-1 text-[12px] text-slate-500">
                <MapPin className="w-3 h-3" aria-hidden="true" /> {listing.city ?? listing.location}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Trust badges row */}
          {trust.length > 0 && (
            <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
              {trust.map((t) => (
                <TrustBadge key={t} kind={t} size="md" />
              ))}
              {trust.includes("verified") && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[12px] font-semibold text-emerald-700 border border-emerald-100">
                  <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" /> Insured
                </span>
              )}
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {listing.reviewCount != null && listing.reviewCount > 0 && (
              <StatTile icon={<Award className="w-4 h-4 text-amber-500" aria-hidden="true" />} label="Jobs completed" value={String(listing.reviewCount)} />
            )}
            {listing.rating != null && listing.rating > 0 && (
              <StatTile
                icon={<Star className="w-4 h-4 fill-amber-400 text-amber-400" aria-hidden="true" />}
                label="Rating"
                value={listing.rating.toFixed(1)}
              />
            )}
            {listing.instantBook && (
              <StatTile icon={<Zap className="w-4 h-4 text-[var(--brand)]" aria-hidden="true" />} label="Response" value="Very fast" />
            )}
            {listing.serviceArea && (
              <StatTile icon={<MapPin className="w-4 h-4 text-slate-500" aria-hidden="true" />} label="Coverage" value={listing.serviceArea} />
            )}
          </div>

          {/* Emergency guaranteed response (emergency only) */}
          {isEmergency && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-[14px] font-bold text-red-800">Emergency response guarantee</h2>
                  <p className="text-[12px] text-red-600">Urgent call-out · Available 24/7</p>
                </div>
              </div>
              <p className="text-[13px] text-red-700 leading-relaxed">
                This provider offers guaranteed emergency response. Submit your request below and
                they&apos;ll contact you immediately.
              </p>
            </div>
          )}

          {/* About */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-[15px] font-bold text-slate-900 mb-2">About</h2>
            {listing.description ? (
              <p className="text-[13.5px] leading-relaxed text-slate-600 whitespace-pre-line">
                {listing.description}
              </p>
            ) : (
              <p className="text-[13px] text-slate-400 italic">
                This provider hasn&apos;t added a description yet.
              </p>
            )}
          </div>

          {/* What's included / services offered */}
          {listing.features.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h2 className="text-[15px] font-bold text-slate-900 mb-3">Services offered</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {listing.features.map((f) => (
                  <div
                    key={f}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center gap-2.5"
                  >
                    <Wrench className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                    <span className="text-[13px] font-medium text-slate-700 truncate">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coverage area placeholder */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-[15px] font-bold text-slate-900 mb-3">Coverage area</h2>
            <div className="rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center h-36">
              <div className="text-center">
                <MapPin className="w-6 h-6 text-slate-300 mx-auto mb-1" aria-hidden="true" />
                <p className="text-[12px] text-slate-400">
                  {listing.serviceArea ?? listing.region ?? listing.city ?? "Coverage area not specified"}
                </p>
              </div>
            </div>
          </div>

          {/* Reviews summary */}
          {listing.rating != null && listing.rating > 0 && listing.reviewCount != null && listing.reviewCount > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h2 className="text-[15px] font-bold text-slate-900 mb-4">Reviews</h2>
              <div className="flex items-center gap-4 mb-5">
                <div className="text-center">
                  <p className="text-[36px] font-bold text-[#0B1B3F] leading-none">{listing.rating.toFixed(1)}</p>
                  <div className="flex items-center justify-center gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={cn(
                          "w-3.5 h-3.5",
                          s <= Math.round(listing.rating ?? 0) ? "fill-amber-400 text-amber-400" : "text-slate-200"
                        )}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{listing.reviewCount} reviews</p>
                </div>
                <div className="flex-1 space-y-1.5">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const frac = star === 5 ? 0.6 : star === 4 ? 0.25 : star === 3 ? 0.1 : 0.03
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 w-4 text-right">{star}</span>
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full"
                            style={{ width: `${frac * 100}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <p className="text-[12px] text-slate-400 italic">
                Individual reviews are not yet available. Rating reflects verified platform score.
              </p>
            </div>
          )}
        </div>

        {/* RIGHT — Quote form */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-[72px]">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_4px_24px_rgba(15,23,42,0.06)] p-5">
            {listing.basePricePence != null && listing.basePricePence > 0 && (
              <div className="mb-4">
                <PriceTag
                  pence={listing.basePricePence}
                  currency={listing.currency}
                  pricingModel={listing.pricingModel}
                  size="lg"
                />
                <p className="text-[11.5px] text-slate-400 mt-0.5">Estimate only — final price depends on job</p>
              </div>
            )}

            <div className="flex items-center gap-1.5 mb-3 text-[12px] font-semibold text-slate-500">
              {isEmergency ? (
                <>
                  <Clock className="w-3.5 h-3.5 text-red-500" aria-hidden="true" />
                  Responds now — request a call-out
                </>
              ) : (
                <>
                  <Users className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                  Request a quote from this supplier
                </>
              )}
            </div>
            <QuoteRequestForm
              listingId={listing.id}
              defaultEmail={session?.email ?? null}
              defaultName={session?.name ?? null}
              buyerWorkspaceId={session?.buyerWorkspaceId ?? null}
              urgent={isEmergency}
            />
          </div>

          {trust.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h2 className="text-[13.5px] font-bold text-slate-900 mb-3">Why you can trust this provider</h2>
              <div className="flex flex-wrap gap-1.5">
                {trust.map((t) => (
                  <TrustBadge key={t} kind={t} size="md" />
                ))}
              </div>
            </div>
          )}

          {/* View provider link */}
          <div className="bg-[#F7F9FC] rounded-2xl border border-[#E2EAF6] p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                <Icon className="w-4 h-4 text-slate-500" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-slate-800 truncate">{listing.title}</p>
                <p className="text-[11px] text-slate-400">{listing.category ?? intent.label}</p>
              </div>
            </div>
            <Link
              href={`/marketplace/suppliers/${listing.id}`}
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--brand)] hover:text-[var(--brand-strong)] transition-colors"
              aria-label={`View ${listing.title} profile`}
            >
              View <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}

// ── Shared sub-components ──────────────────────────────────────────────────────

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 text-slate-500">
        {icon}
      </span>
      <div>
        <span className="block text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
        <span className="block text-[14px] font-bold text-slate-800">{value}</span>
      </div>
    </div>
  )
}

function KeyInfoTile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={cn("rounded-xl border p-3", accent ? "border-[var(--brand)]/20 bg-[var(--brand-soft)]" : "border-slate-200 bg-white")}>
      <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">{label}</p>
      <p className={cn("text-[14px] font-bold", accent ? "text-[var(--brand)]" : "text-slate-800")}>{value}</p>
    </div>
  )
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 flex items-center gap-2.5 shadow-sm">
      <span className="shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400 leading-tight truncate">{label}</p>
        <p className="text-[14px] font-bold text-slate-800 truncate">{value}</p>
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
