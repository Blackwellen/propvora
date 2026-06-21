import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Star, MapPin, CheckCircle, Clock } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import SuppliersHubNav from "@/components/marketplace/SuppliersHubNav"
import EmergencyCTAPanel from "@/components/public-marketplace/profiles/EmergencyCTAPanel"
import EmergencyCoverageMap from "@/components/public-marketplace/maps/EmergencyCoverageMap"
import EmergencyServiceCard from "@/components/public-marketplace/cards/EmergencyServiceCard"
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

const EMERGENCY_TABS = [
  "Overview",
  "Services",
  "Coverage",
  "Pricing",
  "Reviews",
  "FAQ",
  "Provider details",
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

  const others = allServices.filter((s) => s.id !== service.id).slice(0, 5)

  return (
    <div>
      <SuppliersHubNav />

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
        <Link href="/property-manager/marketplace/suppliers-hub/emergency" className="hover:text-blue-600">
          Emergency
        </Link>
        <span>›</span>
        <span className="text-slate-900 font-medium">{service.title}</span>
      </div>

      {/* Hero */}
      <div className="relative h-72 w-full bg-slate-800 overflow-hidden rounded-2xl mb-8">
        <Image
          src={service.heroImage}
          alt={service.title}
          fill
          className="object-cover opacity-70"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent rounded-2xl" />
        <div className="absolute top-4 left-6">
          <div className="inline-flex items-center gap-2 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
            🚨 URGENT RESPONSE — We&apos;re on call and ready to go
          </div>
        </div>
        <div className="absolute bottom-6 left-6 text-white">
          <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">
            EMERGENCY SERVICE
          </p>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold">{service.title}</h1>
            <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded font-semibold">Pro</span>
          </div>
          <p className="text-slate-300 text-sm">{service.subtitle}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Meta */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                <span className="font-semibold">{service.rating}</span>
                <span className="text-slate-500">({service.reviewCount})</span>
              </span>
              {service.policeVetted && (
                <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium border border-emerald-200">
                  <CheckCircle className="h-3 w-3" /> Verified &amp; Vetted
                </span>
              )}
            </div>
            <p className="flex items-center gap-1 text-sm text-slate-500">
              <MapPin className="h-3.5 w-3.5" />
              {service.location} — Covering {service.coveragePostcodes.join(", ")} &amp; surrounding areas
            </p>
          </div>
        </div>

        {/* Trust row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { icon: "🔍", title: "Police vetted DBS",                                         desc: "Background checked" },
            { icon: "🛡️", title: `Fully insured ${service.insuranceAmount}`,                  desc: "Public liability" },
            { icon: "🕐", title: "24/7 availability 365",                                     desc: "Never closed" },
            { icon: "⚡", title: `Fast response ${service.responseTimeMin}-${service.responseTimeMax} mins`, desc: "Based on location" },
          ].map((item) => (
            <div
              key={item.title}
              className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200"
            >
              <span className="text-xl shrink-0">{item.icon}</span>
              <div>
                <p className="text-xs font-semibold text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Lead tech */}
        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 mb-6">
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow">
            <Image
              src={service.providerAvatar}
              alt={service.leadTechnicianName}
              fill
              className="object-cover"
              sizes="48px"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            <span className="font-semibold text-slate-900">{service.leadTechnicianName}</span>
            <span className="text-sm text-slate-500">— {service.leadTechnicianRole}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Tabs */}
            <div className="flex gap-1 overflow-x-auto pb-1 border-b border-slate-200">
              {EMERGENCY_TABS.map((tab, i) => (
                <button
                  key={tab}
                  className={`shrink-0 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    i === 0
                      ? "border-red-500 text-red-600"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Service overview */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">Service overview</h2>
              <p className="text-slate-600 leading-relaxed">
                {service.description ??
                  `${service.title} — available 24 hours a day, 7 days a week. We provide a fast and professional response to all emergency call-outs in ${service.location}.`}
              </p>
              <div className="mt-4 space-y-2">
                {[
                  "Fast professional response",
                  "Upfront pricing — no surprises",
                  "All work guaranteed",
                  "Available 24/7/365",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Response info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Response time",    value: `${service.responseTimeMin}-${service.responseTimeMax} mins` },
                { label: "On arrival",       value: "Immediate assessment" },
                { label: "Typical work time",value: "30-90 mins" },
                { label: "Availability",     value: "24/7/365" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center"
                >
                  <p className="text-base font-bold text-slate-900">{item.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>

            {/* Coverage map */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Coverage zones</h2>
              <div className="rounded-2xl overflow-hidden border border-slate-200 h-64">
                <EmergencyCoverageMap
                  lat={service.coverageLat}
                  lng={service.coverageLng}
                  radiusMiles={15}
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {service.coveragePostcodes.map((pc) => (
                  <span
                    key={pc}
                    className="text-sm bg-slate-100 text-slate-600 px-2 py-0.5 rounded"
                  >
                    {pc}
                  </span>
                ))}
              </div>
            </div>

            {/* Pricing table */}
            {service.priceItems && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Transparent pricing</h2>
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left p-3 font-semibold text-slate-900">Service</th>
                        <th className="text-right p-3 font-semibold text-slate-900">From</th>
                        <th className="text-right p-3 font-semibold text-slate-900">To</th>
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
                  All prices include VAT. Final price depends on work required — always quoted before starting.
                </p>
              </div>
            )}

            {/* Other emergency services */}
            {others.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">
                  Other emergency services you might need
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {others.map((s) => (
                    <EmergencyServiceCard key={s.id} service={s} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Emergency CTA */}
          <div>
            <EmergencyCTAPanel service={service} />
          </div>
        </div>
      </div>
    </div>
  )
}
