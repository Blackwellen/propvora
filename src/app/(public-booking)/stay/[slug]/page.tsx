import type { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  MapPin,
  Users,
  ShieldCheck,
  CalendarCheck,
  Sparkles,
  Info,
} from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import ListingGallery from "@/components/booking/ListingGallery"
import BookingCheckout from "@/components/booking/BookingCheckout"
import type { PublicListingView } from "@/components/booking/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const NOT_PROVISIONED = new Set(["42P01", "PGRST205", "PGRST204"])

/**
 * Load a PUBLISHED stay-booking listing for public display. Reads with the
 * request's anon-keyed client — RLS permits published reads. The `[slug]` is
 * treated as the listing id (no slug column exists in the live schema yet); if
 * a `public_slug`/`slug` column is added later, this resolves by either.
 * Returns null for not-found / not-published / not-provisioned.
 */
async function loadListing(slug: string): Promise<PublicListingView | null> {
  const supabase = await createClient()

  // Resolve by id first (the documented fallback), then by slug if present.
  async function fetchRow(): Promise<Record<string, unknown> | null> {
    // Try id match.
    const byId = await supabase
      .from("marketplace_listings")
      .select("*")
      .eq("id", slug)
      .maybeSingle()
    if (byId.error) {
      if (NOT_PROVISIONED.has(byId.error.code ?? "")) return null
      // a malformed-uuid error means slug isn't an id — fall through to slug.
    } else if (byId.data) {
      return byId.data as Record<string, unknown>
    }

    // Try a slug column if one exists (tolerant — column may be absent).
    try {
      const bySlug = await supabase
        .from("marketplace_listings")
        .select("*")
        .eq("public_slug", slug)
        .maybeSingle()
      if (!bySlug.error && bySlug.data) return bySlug.data as Record<string, unknown>
    } catch {
      /* column absent — ignore */
    }
    return null
  }

  let row: Record<string, unknown> | null = null
  try {
    row = await fetchRow()
  } catch {
    return null
  }
  if (!row) return null
  if (row.status !== "published" || row.transaction_type !== "stay_booking") {
    return null
  }

  // Price: prefer base_price_pence (commerce schema), else legacy numeric price.
  let basePence: number | null =
    row.base_price_pence != null ? Math.trunc(Number(row.base_price_pence)) : null
  if (basePence == null && row.price != null) {
    const major = Number(row.price)
    basePence = Number.isFinite(major) ? Math.round(major * 100) : null
  }

  const images = Array.isArray(row.images)
    ? (row.images as unknown[]).filter((x): x is string => typeof x === "string")
    : []

  return {
    id: String(row.id),
    title: (row.title as string | null)?.trim() || "Your stay",
    description: (row.description as string | null) ?? null,
    currency: (row.currency as string | null) ?? "GBP",
    basePricePence: basePence,
    location:
      (row.location as string | null) ??
      (row.location_city as string | null) ??
      null,
    images,
    maxGuests: row.max_guests != null ? Number(row.max_guests) : null,
    countryCode: (row.country_code as string | null) ?? null,
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const listing = await loadListing(slug)
  if (!listing) return { title: "Stay not found · Propvora" }
  return {
    title: `${listing.title} · Book direct · Propvora`,
    description:
      listing.description?.slice(0, 155) ??
      "Reserve this stay directly with the property manager.",
  }
}

const HIGHLIGHTS = [
  { icon: CalendarCheck, label: "Instant date hold" },
  { icon: ShieldCheck, label: "Secure checkout" },
  { icon: Sparkles, label: "Professionally managed" },
]

export default async function StayListingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const listing = await loadListing(slug)
  if (!listing) notFound()

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 pb-28 lg:pb-8">
      {/* Title row */}
      <div className="mb-4">
        <h1 className="text-[22px] sm:text-[28px] font-bold tracking-tight text-[#0B1B3F]">
          {listing.title}
        </h1>
        {listing.location && (
          <p className="mt-1 flex items-center gap-1.5 text-[13.5px] text-slate-500">
            <MapPin className="w-4 h-4 text-slate-400" />
            {listing.location}
          </p>
        )}
      </div>

      {/* Gallery */}
      <ListingGallery images={listing.images} title={listing.title} />

      {/* Body: details + booking card */}
      <div className="mt-7 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: description + facts */}
        <div className="lg:col-span-7 space-y-7">
          {/* Highlights */}
          <div className="flex flex-wrap gap-2.5">
            {HIGHLIGHTS.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#E2EAF6] px-3 py-1.5 text-[12.5px] font-medium text-slate-600"
              >
                <Icon className="w-3.5 h-3.5 text-[#1D4ED8]" />
                {label}
              </span>
            ))}
          </div>

          {/* Facts */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13.5px] text-slate-600 border-y border-[#EEF3FB] py-4">
            {listing.maxGuests != null && (
              <span className="inline-flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" />
                Sleeps {listing.maxGuests}
              </span>
            )}
            {listing.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                {listing.location}
              </span>
            )}
          </div>

          {/* Description */}
          {listing.description ? (
            <section>
              <h2 className="text-[16px] font-semibold text-[#0B1B3F] mb-2.5">
                About this stay
              </h2>
              <p className="text-[14px] leading-relaxed text-slate-600 whitespace-pre-line">
                {listing.description}
              </p>
            </section>
          ) : (
            <section>
              <h2 className="text-[16px] font-semibold text-[#0B1B3F] mb-2.5">
                About this stay
              </h2>
              <p className="text-[14px] leading-relaxed text-slate-500">
                The property manager hasn&apos;t added a full description yet. Choose
                your dates to request a booking and they&apos;ll be in touch with the
                details.
              </p>
            </section>
          )}

          {/* Compliance / role note */}
          <div className="rounded-xl bg-[#F7F9FC] border border-[#EEF3FB] px-4 py-3.5 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-[12px] leading-relaxed text-slate-500">
              This stay is offered directly by the property manager. Local taxes,
              registration or short-let rules may apply. Propvora provides the
              booking software and is not legal or tax advice.
            </p>
          </div>
        </div>

        {/* Right: booking card (sticky on desktop) */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-20">
            <BookingCheckout listing={listing} slug={slug} />
          </div>
        </div>
      </div>
    </div>
  )
}
