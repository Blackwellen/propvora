import type { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  Star,
  MapPin,
  Clock,
  CheckCircle,
  MessageCircle,
  Phone,
  Shield,
  Briefcase,
  Users,
  Award,
  BadgeCheck,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import SuppliersHubNav from "@/components/marketplace/SuppliersHubNav"
import ShareSaveButtons from "@/components/checkout/ShareSaveButtons"
import { getPublicProviderBySlug, getPublicProviders } from "@/lib/public-marketplace/queries"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const provider = await getPublicProviderBySlug(slug)
  if (!provider) return { title: "Supplier not found · Propvora" }
  return {
    title: `${provider.companyName} · ${provider.trade} · Propvora Suppliers`,
    description:
      provider.description ??
      `${provider.companyName} — ${provider.trade} in ${provider.location}. ${provider.jobsDone}+ jobs completed, rated ${provider.rating}/5.`,
  }
}

/** Render filled + half stars from a 0–5 rating */
function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const fullStars = Math.floor(rating)
  const hasHalf = rating - fullStars >= 0.5
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0)
  const cls = size === "md" ? "h-5 w-5" : "h-4 w-4"
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star key={`f${i}`} className={`${cls} text-amber-400 fill-amber-400`} />
      ))}
      {hasHalf && <Star className={`${cls} text-amber-300 fill-amber-200`} />}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star key={`e${i}`} className={`${cls} text-slate-300`} />
      ))}
    </span>
  )
}

/** Mocked review breakdown percentages (visual only) */
const REVIEW_BARS = [
  { stars: 5, pct: 72 },
  { stars: 4, pct: 18 },
  { stars: 3, pct: 6 },
  { stars: 2, pct: 2 },
  { stars: 1, pct: 2 },
]

/** Sample reviews used when real reviews are not yet available */
const SAMPLE_REVIEWS = [
  {
    name: "Sarah K.",
    date: "March 2025",
    rating: 5,
    text: "Exceptional service from start to finish. The team arrived on time, completed the work to an incredibly high standard and left everything spotless. Will definitely use again.",
  },
  {
    name: "Daniel M.",
    date: "February 2025",
    rating: 5,
    text: "Used them for an emergency call-out and they were there within the hour. Professional, polite and priced fairly. Highly recommend.",
  },
  {
    name: "Priya L.",
    date: "January 2025",
    rating: 4,
    text: "Really pleased with the quality of work. Clear communication throughout and the job was done exactly as agreed. One small follow-up needed but resolved quickly.",
  },
]

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [provider, allProviders] = await Promise.all([
    getPublicProviderBySlug(slug),
    getPublicProviders(),
  ])
  if (!provider) notFound()

  const related = allProviders
    .filter((p) => p.id !== provider.id && p.trade === provider.trade)
    .slice(0, 3)

  const fromPrice = Math.round(provider.fromPrice / 100)
  const heroImage =
    provider.heroImage ||
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200"
  const logoImage =
    provider.logo ||
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face"

  return (
    <div>
      <SuppliersHubNav />

      {/* ── Section A: Full-bleed hero ───────────────────────────────── */}
      <div className="relative w-full overflow-hidden rounded-2xl mb-0" style={{ height: "320px" }}>
        <Image
          src={heroImage}
          alt={provider.companyName}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Bottom overlay content */}
        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
          <div className="text-white">
            {/* Top-rated badge */}
            {provider.rating >= 4.8 && (
              <span className="inline-block bg-amber-400 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full mb-2">
                Top Rated
              </span>
            )}
            {/* Trade badge */}
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {provider.trade}
              </span>
              {provider.vetted && (
                <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  <BadgeCheck className="h-3.5 w-3.5" /> Verified &amp; Vetted
                </span>
              )}
            </div>

            {/* Company name */}
            <h1 className="text-3xl font-extrabold leading-tight drop-shadow mb-1">
              {provider.companyName}
            </h1>

            {/* Rating + location + response time */}
            <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
              <span className="flex items-center gap-1">
                <StarRating rating={provider.rating} />
                <span className="ml-1 font-bold">{provider.rating}</span>
                <span className="font-normal opacity-80">({provider.reviewCount} reviews)</span>
              </span>
              <span className="flex items-center gap-1 opacity-90">
                <MapPin className="h-3.5 w-3.5" />
                {provider.location}
              </span>
              <span className="flex items-center gap-1 opacity-90">
                <Clock className="h-3.5 w-3.5" />
                Responds in {provider.responseTime}
              </span>
            </div>
          </div>

          {/* Logo bubble */}
          <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-xl bg-white shrink-0">
            <Image
              src={logoImage}
              alt={provider.companyName}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
        </div>
      </div>

      {/* ── Section B: Sticky action bar ────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-slate-200 shrink-0">
              <Image
                src={logoImage}
                alt={provider.companyName}
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-900 text-sm truncate">{provider.companyName}</p>
              <p className="text-xs text-slate-500 truncate">{provider.trade}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ShareSaveButtons
              slug={slug}
              storageKey="propvora_saved_suppliers"
              title={provider.companyName}
            />
            <Link
              href={`/property-manager/messages?contact=${slug}`}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-50 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              Message
            </Link>
            <Link
              href={`/property-manager/marketplace/suppliers-hub/${slug}/book`}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--brand)] hover:bg-[var(--brand-strong)] text-white font-bold text-sm rounded-xl transition-colors"
            >
              Book Now
            </Link>
          </div>
        </div>
      </div>

      {/* ── Breadcrumb ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mt-6 mb-6">
        <Link href="/property-manager/marketplace/suppliers-hub" className="hover:text-[var(--brand)] transition-colors">
          Suppliers
        </Link>
        <span>›</span>
        <span className="text-slate-400">{provider.trade}</span>
        <span>›</span>
        <span className="text-slate-900 font-medium">{provider.companyName}</span>
      </div>

      {/* ── Section C: Two-column layout ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* ── Main column (2/3) ──────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-10">

          {/* Stats strip */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[
              { icon: Briefcase, value: `${provider.jobsDone.toLocaleString()}+`, label: "Jobs done" },
              { icon: Users,     value: `${provider.teamSize}`,                   label: "Team size" },
              { icon: Clock,     value: provider.responseTime,                    label: "Response" },
              { icon: Award,     value: `${provider.yearsActive} yrs`,            label: "Experience" },
              { icon: MapPin,    value: `${provider.coverageRadius}mi`,           label: "Coverage" },
              { icon: Shield,    value: provider.insuranceAmount,                 label: "Insured" },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex flex-col items-center text-center p-3 bg-[var(--brand-soft)] rounded-xl border border-[var(--color-brand-100)]">
                <Icon className="h-4 w-4 text-[var(--brand)] mb-1" />
                <p className="text-sm font-bold text-[var(--brand)] leading-tight">{value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* About */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">About {provider.companyName}</h2>
            <p className="text-slate-600 leading-relaxed">
              {provider.description ??
                `${provider.companyName} is a leading ${provider.trade.toLowerCase()} provider serving ${provider.location}. With ${provider.yearsActive}+ years of experience and ${provider.jobsDone.toLocaleString()}+ jobs completed, we are trusted by property managers and homeowners alike.`}
            </p>
          </div>

          {/* Services offered */}
          {provider.services && provider.services.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">Services offered</h2>
              <div className="flex flex-wrap gap-2">
                {provider.services.map((svc) => (
                  <span
                    key={svc}
                    className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-sm font-medium hover:bg-[var(--brand-soft)] hover:text-[var(--brand)] cursor-pointer transition-colors"
                  >
                    {svc}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio / Recent work */}
          {provider.recentWork && provider.recentWork.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Recent work</h2>
              <div className="grid grid-cols-3 gap-2">
                {provider.recentWork.slice(0, 4).map((img, i) => (
                  <div
                    key={i}
                    className={`relative rounded-xl overflow-hidden ${i === 0 ? "col-span-2 aspect-video" : "aspect-square"}`}
                  >
                    <Image
                      src={img}
                      alt={`${provider.companyName} — recent work ${i + 1}`}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                      sizes="33vw"
                    />
                    {i === provider.recentWork!.length - 1 && provider.recentWork!.length > 3 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                        <span className="text-white font-bold text-sm">+{provider.recentWork!.length - 3} more</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Reviews ({provider.reviewCount})
            </h2>
            {/* Star breakdown bar chart */}
            <div className="space-y-2 mb-6">
              {REVIEW_BARS.map(({ stars, pct }) => (
                <div key={stars} className="flex items-center gap-3 text-sm">
                  <span className="w-6 text-right text-slate-600 font-medium">{stars}</span>
                  <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 shrink-0" />
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-2 bg-amber-400 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-slate-500 text-xs">{pct}%</span>
                </div>
              ))}
            </div>

            {/* Sample reviews */}
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

          {/* Certifications & Compliance */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Certifications &amp; compliance</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {provider.certifications.map((cert) => (
                <div
                  key={cert}
                  className="flex flex-col items-center p-3 bg-slate-50 rounded-xl text-center border border-slate-200"
                >
                  <CheckCircle className="h-6 w-6 text-emerald-500 mb-1.5" />
                  <span className="text-xs font-semibold text-slate-700">{cert}</span>
                </div>
              ))}
              {provider.gasSafe && (
                <div className="flex flex-col items-center p-3 bg-amber-50 rounded-xl text-center border border-amber-200">
                  <span className="text-xl mb-1">🔥</span>
                  <span className="text-xs font-semibold text-amber-800">Gas Safe</span>
                  <span className="text-xs text-slate-500">No. {provider.gasSafe}</span>
                </div>
              )}
              {provider.niceic && (
                <div className="flex flex-col items-center p-3 bg-[var(--brand-soft)] rounded-xl text-center border border-[var(--color-brand-100)]">
                  <CheckCircle className="h-6 w-6 text-[var(--brand)] mb-1.5" />
                  <span className="text-xs font-semibold text-[var(--brand-strong)]">NICEIC</span>
                  <span className="text-xs text-slate-500">Approved</span>
                </div>
              )}
              {provider.insured && (
                <div className="flex flex-col items-center p-3 bg-emerald-50 rounded-xl text-center border border-emerald-200">
                  <Shield className="h-6 w-6 text-emerald-600 mb-1.5" />
                  <span className="text-xs font-semibold text-emerald-800">Insured</span>
                  <span className="text-xs text-slate-500">{provider.insuranceAmount}</span>
                </div>
              )}
              {provider.vetted && (
                <div className="flex flex-col items-center p-3 bg-violet-50 rounded-xl text-center border border-violet-200">
                  <BadgeCheck className="h-6 w-6 text-violet-600 mb-1.5" />
                  <span className="text-xs font-semibold text-violet-800">DBS Checked</span>
                  <span className="text-xs text-slate-500">Verified</span>
                </div>
              )}
              {provider.emergency24h && (
                <div className="flex flex-col items-center p-3 bg-red-50 rounded-xl text-center border border-red-200">
                  <Phone className="h-6 w-6 text-red-600 mb-1.5" />
                  <span className="text-xs font-semibold text-red-800">24/7</span>
                  <span className="text-xs text-slate-500">Emergency</span>
                </div>
              )}
            </div>
          </div>

          {/* Coverage area */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Coverage areas</h2>
            <div className="flex flex-wrap gap-2 mb-2">
              {provider.coverageCities.map((city) => (
                <span
                  key={city}
                  className="flex items-center gap-1.5 text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full"
                >
                  <MapPin className="h-3.5 w-3.5 text-[var(--brand)]" />
                  {city}
                </span>
              ))}
            </div>
            <p className="text-sm text-slate-500">
              Service radius: {provider.coverageRadius} miles from base
            </p>
          </div>

          {/* Team members */}
          {provider.teamMembers && provider.teamMembers.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Our team</h2>
              <div className="flex gap-5 flex-wrap">
                {provider.teamMembers.map((member) => (
                  <div key={member.name} className="flex flex-col items-center gap-2 w-20 text-center">
                    <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-slate-200">
                      <Image
                        src={member.avatar}
                        alt={member.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{member.name}</p>
                      <p className="text-xs text-slate-500">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQs */}
          {provider.faqs && provider.faqs.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Frequently asked questions</h2>
              <div className="space-y-3">
                {provider.faqs.map((faq, i) => (
                  <details key={i} className="group p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <summary className="font-semibold text-slate-900 text-sm cursor-pointer list-none flex items-center justify-between">
                      {faq.q}
                      <span className="text-slate-400 group-open:rotate-45 transition-transform">+</span>
                    </summary>
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">{faq.a}</p>
                  </details>
                ))}
              </div>
            </div>
          )}

          {/* Similar suppliers */}
          {related.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Similar suppliers</h2>
              <div className="space-y-3">
                {related.map((p) => (
                  <Link
                    key={p.id}
                    href={`/property-manager/marketplace/suppliers-hub/${p.slug}`}
                    className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-[var(--color-brand-100)] hover:bg-[var(--brand-soft)] transition-colors group"
                  >
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0">
                      <Image
                        src={p.logo || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face"}
                        alt={p.companyName}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate group-hover:text-[var(--brand)]">{p.companyName}</p>
                      <p className="text-xs text-slate-500 truncate">{p.trade} · {p.location}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-semibold text-slate-700">{p.rating}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right sidebar (1/3) ──────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Booking card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sticky top-24">
            {/* Price */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">Starting from</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900">
                  £{fromPrice > 0 ? fromPrice : "POA"}
                </span>
                {fromPrice > 0 && <span className="text-slate-500 text-sm font-medium">/ visit</span>}
              </div>
            </div>

            {/* Meta */}
            <div className="space-y-2 mb-5 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="h-4 w-4 text-[var(--brand)] shrink-0" />
                <span>Responds in <strong className="text-slate-900">{provider.responseTime}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Next available: <strong className="text-slate-900">Today / Tomorrow</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Shield className="h-4 w-4 text-violet-500 shrink-0" />
                <span>Insured up to <strong className="text-slate-900">{provider.insuranceAmount}</strong></span>
              </div>
            </div>

            {/* Primary CTA */}
            <Link
              href={`/property-manager/marketplace/suppliers-hub/${slug}/book`}
              className="block w-full py-3.5 text-center bg-[var(--brand)] hover:bg-[var(--brand-strong)] text-white font-bold rounded-xl transition-colors mb-3"
            >
              Book this supplier →
            </Link>

            {/* Secondary CTA */}
            <Link
              href={`/property-manager/messages?contact=${slug}`}
              className="flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors mb-4"
            >
              <MessageCircle className="h-4 w-4" /> Message supplier
            </Link>

            {/* Trust line */}
            <p className="text-xs text-center text-slate-500">
              Protected by Propvora escrow payments
            </p>
          </div>

          {/* Trust & Safety card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Trust &amp; safety</h3>
            <div className="space-y-2.5">
              {provider.vetted && (
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <BadgeCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                  Propvora verified supplier
                </div>
              )}
              {provider.insured && (
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Shield className="h-4 w-4 text-emerald-500 shrink-0" />
                  Fully insured — {provider.insuranceAmount}
                </div>
              )}
              {provider.vetted && (
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                  DBS background checked
                </div>
              )}
              {provider.gasSafe && (
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <CheckCircle className="h-4 w-4 text-amber-500 shrink-0" />
                  Gas Safe registered
                </div>
              )}
              {provider.emergency24h && (
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Phone className="h-4 w-4 text-red-500 shrink-0" />
                  24/7 emergency available
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <CheckCircle className="h-4 w-4 text-[var(--brand)] shrink-0" />
                Propvora escrow payment protection
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
