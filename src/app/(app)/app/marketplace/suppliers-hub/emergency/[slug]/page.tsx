import type { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  Star,
  MapPin,
  CheckCircle,
  Clock,
  Phone,
  Shield,
  BadgeCheck,
  AlertTriangle,
  Zap,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import SuppliersHubNav from "@/components/marketplace/SuppliersHubNav"
import { getPublicEmergencyServiceBySlug, getPublicEmergencyServices } from "@/lib/public-marketplace/queries"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const service = await getPublicEmergencyServiceBySlug(slug)
  if (!service) return { title: "Emergency service not found · Propvora" }
  return {
    title: `${service.title} · Emergency · Propvora`,
    description: service.subtitle,
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
  { stars: 5, pct: 76 },
  { stars: 4, pct: 15 },
  { stars: 3, pct: 5 },
  { stars: 2, pct: 2 },
  { stars: 1, pct: 2 },
]

const SAMPLE_REVIEWS = [
  {
    name: "Mark T.",
    date: "May 2025",
    rating: 5,
    text: "Burst pipe at 2am — called and they arrived in under 40 minutes. Fixed it quickly and professionally. Incredibly relieved. Cannot recommend highly enough.",
  },
  {
    name: "Helena B.",
    date: "April 2025",
    rating: 5,
    text: "Got locked out late at night. Called and they were there within 30 minutes. Really friendly and professional. Priced fairly for the hour.",
  },
  {
    name: "Raj S.",
    date: "March 2025",
    rating: 5,
    text: "Power cut emergency. Fast response, sorted the fuse issue quickly and explained everything clearly. Would 100% use again.",
  },
]

const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Call us or book online",
    desc: "Phone us directly or submit an emergency booking. We confirm immediately.",
  },
  {
    step: 2,
    title: "We dispatch within 30 min",
    desc: "Our nearest available engineer is dispatched immediately to your location.",
  },
  {
    step: 3,
    title: "Problem solved, you pay",
    desc: "We fix the issue. All work priced upfront — no surprises on the bill.",
  },
]

export default async function EmergencyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [service, allServices] = await Promise.all([
    getPublicEmergencyServiceBySlug(slug),
    getPublicEmergencyServices(),
  ])
  if (!service) notFound()

  const others = allServices.filter((s) => s.id !== service.id).slice(0, 3)
  const fromPrice = Math.round(service.baseCalloutPrice / 100)

  const providerAvatarImg =
    service.providerAvatar ||
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face"
  const heroImg =
    service.heroImage ||
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200"

  return (
    <div>
      <SuppliersHubNav />

      {/* ── Breadcrumb ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
        <Link href="/property-manager/marketplace/suppliers-hub" className="hover:text-blue-600 transition-colors">
          Marketplace
        </Link>
        <span>›</span>
        <Link href="/property-manager/marketplace/suppliers-hub/emergency" className="hover:text-blue-600 transition-colors">
          Emergency
        </Link>
        <span>›</span>
        <span className="text-slate-900 font-medium">{service.title}</span>
      </div>

      {/* ── Section A: Hero — RED gradient ──────────────────────── */}
      <div className="relative w-full overflow-hidden rounded-2xl mb-0" style={{ height: "300px" }}>
        <Image
          src={heroImg}
          alt={service.title}
          fill
          className="object-cover opacity-80"
          sizes="100vw"
          priority
        />
        {/* Red gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-red-900/80 via-red-800/30 to-transparent" />

        {/* Top-left badge */}
        <div className="absolute top-4 left-6">
          <span className="inline-flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
            <AlertTriangle className="h-3.5 w-3.5" />
            EMERGENCY SERVICE
          </span>
        </div>

        {/* 24/7 badge */}
        {service.available24h && (
          <div className="absolute top-4 right-6">
            <span className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 bg-white rounded-full" />
              24/7 Available
            </span>
          </div>
        )}

        {/* Bottom content */}
        <div className="absolute bottom-6 left-6 right-6 text-white">
          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight mb-1 drop-shadow">
            {service.title}
          </h1>
          <p className="text-slate-200 text-sm mb-2">{service.subtitle}</p>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {/* Provider */}
            <div className="flex items-center gap-2">
              <div className="relative w-6 h-6 rounded-full overflow-hidden border border-white/50 shrink-0">
                <Image
                  src={providerAvatarImg}
                  alt={service.leadTechnicianName}
                  fill
                  className="object-cover"
                  sizes="24px"
                />
              </div>
              <span className="font-medium">{service.leadTechnicianName}</span>
              <span className="opacity-75">— {service.leadTechnicianRole}</span>
            </div>
            {/* Response time — LARGE */}
            <span className="flex items-center gap-1.5 font-extrabold text-lg">
              <Zap className="h-5 w-5 text-amber-400" />
              {service.responseTimeMin}–{service.responseTimeMax} min response
            </span>
          </div>
        </div>
      </div>

      {/* ── Section B: Sticky urgent action bar ─────────────────── */}
      <div className="sticky top-0 z-20 bg-red-50 border-b border-red-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 gap-4">
          <div className="flex items-center gap-3">
            {service.available24h && (
              <span className="flex items-center gap-1.5 text-emerald-700 text-sm font-bold">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Available Now
              </span>
            )}
            <span className="flex items-center gap-1.5 text-red-700 text-sm font-semibold">
              <Clock className="h-4 w-4" />
              {service.responseTimeMin}–{service.responseTimeMax} min response
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`tel:${service.phone}`}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-colors"
            >
              <Phone className="h-4 w-4" />
              Call Now
            </a>
            <Link
              href={`/property-manager/work/jobs/new?type=emergency&supplier=${slug}&from=marketplace`}
              className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 font-semibold text-sm rounded-xl hover:bg-red-100 transition-colors"
            >
              Book Emergency
            </Link>
          </div>
        </div>
      </div>

      {/* ── Meta row ────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 flex-wrap py-4 mb-2 border-b border-slate-100">
        <div className="flex items-center gap-2 text-sm">
          <StarRating rating={service.rating} />
          <span className="font-bold text-slate-900">{service.rating}</span>
          <span className="text-slate-500">({service.reviewCount} reviews)</span>
        </div>
        {service.policeVetted && (
          <span className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-medium border border-emerald-200">
            <CheckCircle className="h-3 w-3" /> Verified &amp; Vetted
          </span>
        )}
        <span className="flex items-center gap-1 text-sm text-slate-500">
          <MapPin className="h-3.5 w-3.5" />
          {service.location} — Covering {service.coveragePostcodes.slice(0, 4).join(", ")}
          {service.coveragePostcodes.length > 4 && ` +${service.coveragePostcodes.length - 4} more`}
        </span>
      </div>

      {/* ── Trust row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { icon: "🔍", title: "Police vetted DBS", desc: "Background checked" },
          { icon: "🛡️", title: `Insured ${service.insuranceAmount}`, desc: "Public liability" },
          { icon: "🕐", title: "24/7 — 365 days", desc: "Never closed" },
          { icon: "⚡", title: `${service.responseTimeMin}–${service.responseTimeMax} min response`, desc: "Based on location" },
        ].map((item) => (
          <div key={item.title} className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xl shrink-0">{item.icon}</span>
            <div>
              <p className="text-xs font-semibold text-slate-900">{item.title}</p>
              <p className="text-xs text-slate-500">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Section C: Two-column ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* ── Main column ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-10">

          {/* Urgency strip */}
          <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <AlertTriangle className="h-6 w-6 text-red-600 shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-red-800 text-sm mb-0.5">Need immediate help?</p>
              <p className="text-sm text-red-700">
                Call us now:{" "}
                <a href={`tel:${service.phone}`} className="font-extrabold text-red-900 hover:underline text-lg">
                  {service.phone}
                </a>
              </p>
            </div>
            <a
              href={`tel:${service.phone}`}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-colors shrink-0"
            >
              <Phone className="h-4 w-4" />
              Call Now
            </a>
          </div>

          {/* Lead technician */}
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow shrink-0">
              <Image
                src={providerAvatarImg}
                alt={service.leadTechnicianName}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
            <div className="flex items-center gap-2 flex-1">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span className="font-semibold text-slate-900">{service.leadTechnicianName}</span>
              <span className="text-sm text-slate-500">— {service.leadTechnicianRole}</span>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded font-medium border border-emerald-200">
              On duty
            </span>
          </div>

          {/* Service description */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Service overview</h2>
            <p className="text-slate-600 leading-relaxed">
              {service.description ??
                `${service.title} — available 24 hours a day, 7 days a week. We provide a fast and professional response to all emergency call-outs in ${service.location}.`}
            </p>
            <div className="mt-4 space-y-2">
              {[
                "Fast professional response — typically " + service.responseTimeMin + "–" + service.responseTimeMax + " minutes",
                "Upfront pricing — no surprises",
                "All work fully guaranteed",
                "Available 24/7/365 — including bank holidays",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Price breakdown */}
          {service.priceItems && service.priceItems.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Transparent pricing</h2>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left p-3 font-semibold text-slate-900">Service</th>
                      <th className="text-right p-3 font-semibold text-slate-900">From</th>
                      <th className="text-right p-3 font-semibold text-slate-900">Up to</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {service.priceItems.map((item) => (
                      <tr key={item.service} className="hover:bg-slate-50">
                        <td className="p-3 text-slate-700">{item.service}</td>
                        <td className="p-3 text-right font-semibold text-slate-900">
                          £{(item.from / 100).toFixed(0)}
                        </td>
                        <td className="p-3 text-right text-slate-500">
                          {item.to ? `£${(item.to / 100).toFixed(0)}` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                All prices include VAT. Final price quoted upfront before work begins.
              </p>
              {service.noCalloutFee && (
                <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full font-semibold border border-emerald-200">
                  <CheckCircle className="h-3.5 w-3.5" /> No call-out fee
                </div>
              )}
            </div>
          )}

          {/* Coverage postcodes */}
          {service.coveragePostcodes.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Coverage areas</h2>
              <div className="flex flex-wrap gap-2">
                {service.coveragePostcodes.map((pc) => (
                  <span
                    key={pc}
                    className="flex items-center gap-1 text-sm bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full font-medium"
                  >
                    <MapPin className="h-3 w-3 text-blue-500" />
                    {pc}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Trust & Safety */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Trust &amp; safety</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {service.policeVetted && (
                <div className="flex flex-col items-center p-4 bg-blue-50 rounded-xl text-center border border-blue-200">
                  <BadgeCheck className="h-7 w-7 text-blue-600 mb-1.5" />
                  <span className="text-xs font-bold text-blue-900">Police Vetted</span>
                  <span className="text-xs text-slate-500 mt-0.5">DBS checked</span>
                </div>
              )}
              {service.insured && (
                <div className="flex flex-col items-center p-4 bg-emerald-50 rounded-xl text-center border border-emerald-200">
                  <Shield className="h-7 w-7 text-emerald-600 mb-1.5" />
                  <span className="text-xs font-bold text-emerald-900">Fully Insured</span>
                  <span className="text-xs text-slate-500 mt-0.5">{service.insuranceAmount}</span>
                </div>
              )}
              {service.available24h && (
                <div className="flex flex-col items-center p-4 bg-red-50 rounded-xl text-center border border-red-200">
                  <Clock className="h-7 w-7 text-red-600 mb-1.5" />
                  <span className="text-xs font-bold text-red-900">24/7 · 365</span>
                  <span className="text-xs text-slate-500 mt-0.5">Always on call</span>
                </div>
              )}
              <div className="flex flex-col items-center p-4 bg-violet-50 rounded-xl text-center border border-violet-200">
                <CheckCircle className="h-7 w-7 text-violet-600 mb-1.5" />
                <span className="text-xs font-bold text-violet-900">Work Guaranteed</span>
                <span className="text-xs text-slate-500 mt-0.5">All jobs covered</span>
              </div>
            </div>
          </div>

          {/* How it works (3-step timeline) */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">How it works</h2>
            <div className="space-y-4">
              {HOW_IT_WORKS.map((step, i) => (
                <div key={step.step} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                      {step.step}
                    </div>
                    {i < HOW_IT_WORKS.length - 1 && (
                      <div className="w-px flex-1 bg-red-200 my-1" />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className="font-semibold text-slate-900 text-sm mb-0.5">{step.title}</p>
                    <p className="text-sm text-slate-500">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Reviews ({service.reviewCount})
            </h2>
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

          {/* Other emergency services */}
          {others.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Other emergency services</h2>
              <div className="space-y-3">
                {others.map((s) => (
                  <Link
                    key={s.id}
                    href={`/property-manager/marketplace/suppliers-hub/emergency/${s.slug}`}
                    className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-red-200 hover:bg-red-50 transition-colors group"
                  >
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0">
                      <Image
                        src={s.heroImage || heroImg}
                        alt={s.title}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate group-hover:text-red-700">{s.title}</p>
                      <p className="text-xs text-slate-500">{s.responseTimeMin}–{s.responseTimeMax} min response · {s.location}</p>
                    </div>
                    <div className="shrink-0">
                      <span className="text-xs text-red-600 font-bold">
                        From £{Math.round(s.baseCalloutPrice / 100)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right sidebar (RED-tinted) ───────────────────────────── */}
        <div>
          <div className="bg-white rounded-2xl border-2 border-red-200 shadow-xl p-6 sticky top-24 space-y-4">

            {/* Header */}
            <div className="text-center">
              <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-1">
                Emergency booking
              </p>
              <p className="text-4xl font-extrabold text-red-600">
                {fromPrice > 0 ? `£${fromPrice}` : "POA"}
              </p>
              <p className="text-sm text-slate-500">from</p>
              {service.noCalloutFee && (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-bold border border-emerald-200 mt-1">
                  <CheckCircle className="h-3 w-3" /> No call-out fee
                </span>
              )}
            </div>

            {/* Response ETA */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs font-bold text-amber-800 uppercase mb-1">Estimated response</p>
              <p className="text-xl font-extrabold text-slate-900">
                🚐 {service.responseTimeMin}–{service.responseTimeMax} mins
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Based on your location</p>
            </div>

            {/* Primary CTA */}
            <Link
              href={`/property-manager/work/jobs/new?type=emergency&supplier=${slug}&from=marketplace`}
              className="block w-full py-4 text-center bg-red-600 hover:bg-red-700 text-white font-extrabold text-base rounded-xl transition-colors"
            >
              Book Emergency Now →
            </Link>

            {/* Call CTA */}
            <a
              href={`tel:${service.phone}`}
              className="flex items-center justify-center gap-2 w-full py-3 border-2 border-red-600 text-red-700 font-bold text-sm rounded-xl hover:bg-red-50 transition-colors"
            >
              <Phone className="h-4 w-4" />
              Call Now
            </a>

            <p className="text-center text-sm text-slate-600">
              Or call directly:{" "}
              <a href={`tel:${service.phone}`} className="font-bold text-slate-900 hover:underline">
                {service.phone}
              </a>
            </p>

            {/* Trust line */}
            <div className="border-t border-slate-100 pt-3">
              <p className="text-xs text-center text-slate-500 font-medium">
                Police vetted · Fully insured · 24/7
              </p>
            </div>

            {/* In danger? */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2 text-xs text-red-700">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">In danger or unsafe?</span>
                <br />
                If this is a life emergency, call <strong>999</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
