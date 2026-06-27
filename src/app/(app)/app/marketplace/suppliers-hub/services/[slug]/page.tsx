import type { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  Star,
  MapPin,
  CheckCircle,
  X,
  Clock,
  Zap,
  BadgeCheck,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import SuppliersHubNav from "@/components/marketplace/SuppliersHubNav"
import ShareSaveButtons from "@/components/checkout/ShareSaveButtons"
import ServiceBookingPanel from "@/components/checkout/ServiceBookingPanel"
import { getPublicServiceOfferBySlug } from "@/lib/public-marketplace/queries"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const offer = await getPublicServiceOfferBySlug(slug)
  if (!offer) return { title: "Service not found · Propvora" }
  return {
    title: `${offer.title} · Services · Propvora`,
    description: offer.subtitle,
  }
}

/** Star rating component */
function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const hasHalf = rating - full >= 0.5
  const empty = 5 - full - (hasHalf ? 1 : 0)
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f${i}`} className="h-4 w-4 text-amber-400 fill-amber-400" />
      ))}
      {hasHalf && <Star className="h-4 w-4 text-amber-300 fill-amber-200" />}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e${i}`} className="h-4 w-4 text-slate-300" />
      ))}
    </span>
  )
}

const REVIEW_BARS = [
  { stars: 5, pct: 74 },
  { stars: 4, pct: 16 },
  { stars: 3, pct: 6 },
  { stars: 2, pct: 2 },
  { stars: 1, pct: 2 },
]

const SAMPLE_REVIEWS = [
  {
    name: "James R.",
    date: "April 2025",
    rating: 5,
    text: "Booked the Standard package — absolutely superb. Professional, punctual and did everything they said they would. My landlord was very happy too.",
  },
  {
    name: "Fatima A.",
    date: "March 2025",
    rating: 5,
    text: "Second time using this service and still amazing. Everything was completed to a high standard and on time. Would highly recommend.",
  },
  {
    name: "Tom H.",
    date: "February 2025",
    rating: 4,
    text: "Really pleased overall. Minor point: a couple of small areas were initially missed but they came back same day to sort it. Great customer service.",
  },
]

const NOT_INCLUDED = [
  "External windows (unless add-on purchased)",
  "Garage or outbuilding areas",
  "Loft / attic spaces",
  "Garden or outdoor areas",
  "Pest removal or specialist treatments",
]

const PROCESS_STEPS = [
  { n: 1, title: "Book & confirm", desc: "Choose your package, add-ons and preferred date. Instant confirmation." },
  { n: 2, title: "We arrive on time", desc: "Our vetted team arrives with all professional equipment included." },
  { n: 3, title: "Work completed", desc: "Thorough work to the agreed standard. We follow a strict checklist." },
  { n: 4, title: "Quality sign-off", desc: "We inspect before leaving. Photo report available as an add-on." },
]

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const offer = await getPublicServiceOfferBySlug(slug)
  if (!offer) notFound()

  const packages = offer.packages ?? [
    {
      name: "Basic",
      price: offer.basePrice,
      description: "Essential service for smaller properties",
      includes: ["Core service included", "Labour included", "Waste removal"],
    },
    {
      name: "Standard",
      price: offer.standardPrice,
      description: "Most popular — best value for most properties",
      includes: [
        "Everything in Basic",
        "Extended coverage",
        "Priority scheduling",
        "Detailed report",
      ],
    },
    {
      name: "Premium",
      price: offer.premiumPrice,
      description: "Full-service deep treatment for larger properties",
      includes: [
        "Everything in Standard",
        "Full property coverage",
        "Premium materials",
        "Priority callback",
        "12-month guarantee",
      ],
    },
  ]

  const providerAvatarImg =
    offer.providerAvatar ||
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face"

  const heroImg =
    offer.heroImage ||
    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200"

  return (
    <div>
      <SuppliersHubNav />

      {/* ── Breadcrumb ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
        <Link href="/property-manager/marketplace/suppliers-hub" className="hover:text-[var(--brand)] transition-colors">
          Marketplace
        </Link>
        <span>›</span>
        <Link href="/property-manager/marketplace/suppliers-hub/services" className="hover:text-[var(--brand)] transition-colors">
          Services
        </Link>
        <span>›</span>
        <span className="text-slate-400">{offer.category}</span>
        <span>›</span>
        <span className="text-slate-900 font-medium">{offer.title}</span>
      </div>

      {/* ── Section A: Hero (full-width ~280px) ─────────────────── */}
      <div className="relative w-full overflow-hidden rounded-2xl mb-6" style={{ height: "280px" }}>
        <Image
          src={heroImg}
          alt={offer.title}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Category pill */}
        <div className="absolute top-4 left-6">
          <span className="bg-[var(--brand)] text-white text-xs font-bold px-3 py-1.5 rounded-full">
            {offer.category}
          </span>
        </div>

        {/* Hero content */}
        <div className="absolute bottom-6 left-6 right-24 text-white">
          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight mb-1 drop-shadow">
            {offer.title}
          </h1>
          <p className="text-slate-200 text-sm mb-2">{offer.subtitle}</p>
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              <div className="relative w-6 h-6 rounded-full overflow-hidden border border-white/50 shrink-0">
                <Image
                  src={providerAvatarImg}
                  alt={offer.providerName}
                  fill
                  className="object-cover"
                  sizes="24px"
                />
              </div>
              <span className="font-medium">{offer.providerName}</span>
              {offer.providerPro && (
                <span className="bg-[var(--brand)] text-white text-xs px-1.5 py-0.5 rounded font-bold">Pro</span>
              )}
            </div>
            <span className="flex items-center gap-1 opacity-90">
              <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              <span className="font-bold">{offer.rating}</span>
              <span className="opacity-80">({offer.reviewCount})</span>
            </span>
            {offer.verified && (
              <span className="flex items-center gap-1 text-emerald-300 font-medium">
                <BadgeCheck className="h-3.5 w-3.5" /> Verified
              </span>
            )}
          </div>
        </div>

        {/* Top right actions */}
        <ShareSaveButtons
          slug={slug}
          storageKey="propvora_saved_services"
          title={offer.title}
          variant="compact"
          className="absolute top-4 right-4"
        />
      </div>

      {/* ── Trust strip ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { icon: "💰", title: "Deposit-back guarantee", desc: "Get your deposit back or we return" },
          { icon: "✓",  title: "Vetted & trusted pros",  desc: "DBS-checked, reviewed professionals" },
          { icon: "🔒", title: "Secure payments",         desc: "Escrow-protected, safe checkout" },
          { icon: "⭐", title: "Satisfaction guaranteed", desc: "Not happy? We'll make it right" },
        ].map((item) => (
          <div
            key={item.title}
            className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100"
          >
            <span className="text-xl shrink-0">{item.icon}</span>
            <div>
              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
              <p className="text-xs text-slate-500">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Section B: Two-column ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* ── Main column ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-10">

          {/* Provider strip */}
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0">
              <Image
                src={providerAvatarImg}
                alt={offer.providerName}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900">{offer.providerName}</span>
                {offer.providerPro && (
                  <span className="text-xs bg-[var(--brand)] text-white px-1.5 py-0.5 rounded font-semibold">Pro</span>
                )}
              </div>
              <div className="text-sm text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                {offer.verified && (
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-emerald-500" /> Verified provider
                  </span>
                )}
                {offer.insured && (
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-emerald-500" /> Fully insured
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {offer.location}
                </span>
              </div>
            </div>
            <Link
              href={`/property-manager/marketplace/suppliers-hub/${offer.providerSlug}`}
              className="text-xs text-[var(--brand)] hover:underline font-medium shrink-0"
            >
              View profile →
            </Link>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">About this service</h2>
            <p className="text-slate-600 leading-relaxed">
              {offer.subtitle}. Professional service designed to the highest standard. Our trained team follow a strict process and cover every detail.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {offer.tags.map((tag) => (
                <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* What's included / not included */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-slate-900 mb-3">What&apos;s included</h3>
              <div className="space-y-2">
                {offer.deliverables.map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-3">What&apos;s not included</h3>
              <div className="space-y-2">
                {NOT_INCLUDED.map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm text-slate-500">
                    <X className="h-4 w-4 text-slate-300 shrink-0 mt-0.5" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3-tier pricing table */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Choose your package</h2>
            <div className="grid grid-cols-3 gap-3">
              {packages.map((pkg, i) => (
                <div
                  key={pkg.name}
                  className={`relative rounded-2xl border p-4 flex flex-col ${
                    i === 1
                      ? "border-[var(--brand)] ring-2 ring-[var(--brand)] bg-[var(--brand-soft)]"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  {i === 1 && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--brand)] text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                      Most Popular
                    </span>
                  )}
                  <p className="font-bold text-slate-900 text-sm mb-1">{pkg.name}</p>
                  <p className="text-xs text-slate-500 mb-3 leading-snug">{pkg.description}</p>
                  <p className="text-2xl font-extrabold text-slate-900 mb-3">
                    £{(pkg.price / 100).toFixed(0)}
                  </p>
                  <div className="space-y-1.5 mb-4 flex-1">
                    {pkg.includes.map((item) => (
                      <div key={item} className="flex items-start gap-1.5 text-xs text-slate-700">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        {item}
                      </div>
                    ))}
                  </div>
                  <Link
                    href={`/property-manager/marketplace/suppliers-hub/services/${slug}/book?package=${pkg.name.toLowerCase()}`}
                    className={`block w-full py-2.5 text-center text-sm font-bold rounded-xl transition-colors ${
                      i === 1
                        ? "bg-[var(--brand)] hover:bg-[var(--brand-strong)] text-white"
                        : "border border-[var(--brand)] text-[var(--brand)] hover:bg-[var(--brand-soft)]"
                    }`}
                  >
                    Choose {pkg.name}
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Add-ons */}
          {offer.addons && offer.addons.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Add-ons &amp; extras</h2>
              <div className="space-y-2">
                {offer.addons.map((addon) => (
                  <div
                    key={addon.name}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{addon.name}</p>
                      {addon.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{addon.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900 text-sm">+£{(addon.price / 100).toFixed(0)}</span>
                      <Link
                        href={`/property-manager/marketplace/suppliers-hub/services/${slug}/book?package=standard`}
                        className="text-xs px-3 py-1.5 border border-[var(--brand)] text-[var(--brand)] rounded-lg hover:bg-[var(--brand-soft)] font-semibold transition-colors"
                      >
                        Add
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Availability */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-[var(--brand-soft)] rounded-xl border border-[var(--color-brand-100)]">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-4 w-4 text-[var(--brand)]" />
                <span className="font-semibold text-slate-900 text-sm">Next available</span>
              </div>
              <p className="text-sm text-[var(--brand)] font-medium">{offer.nextAvailable}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-slate-400" />
                <span className="font-semibold text-slate-900 text-sm">Duration</span>
              </div>
              <p className="text-sm text-slate-700">{offer.duration}</p>
            </div>
          </div>

          {/* Process steps */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">How it works</h2>
            <div className="grid grid-cols-2 gap-4">
              {PROCESS_STEPS.map((step) => (
                <div
                  key={step.n}
                  className="flex gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200"
                >
                  <div className="w-8 h-8 bg-[var(--brand)] text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                    {step.n}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{step.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Reviews ({offer.reviewCount})
            </h2>
            {/* Star breakdown */}
            <div className="space-y-2 mb-6">
              {REVIEW_BARS.map(({ stars, pct }) => (
                <div key={stars} className="flex items-center gap-3 text-sm">
                  <span className="w-6 text-right text-slate-600 font-medium">{stars}</span>
                  <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 shrink-0" />
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-2 bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-slate-500 text-xs">{pct}%</span>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {SAMPLE_REVIEWS.map((review) => (
                <div key={review.name} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{review.name}</p>
                      <p className="text-xs text-slate-500">{review.date}</p>
                    </div>
                    <StarRating rating={review.rating} />
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{review.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right sidebar (reactive tier selection) ──────────────── */}
        <div>
          <ServiceBookingPanel offer={offer} slug={slug} />
        </div>
      </div>
    </div>
  )
}
