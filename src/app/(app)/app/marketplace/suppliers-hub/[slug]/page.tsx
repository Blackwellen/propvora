import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Star, MapPin, Clock, CheckCircle, MessageCircle, Heart, LayoutGrid } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import SuppliersHubNav from "@/components/marketplace/SuppliersHubNav"
import RelatedProviderCard from "@/components/public-marketplace/cards/RelatedProviderCard"
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
    title: `${provider.companyName} · Suppliers · Propvora`,
    description: `${provider.trade} · ${provider.location}`,
  }
}

const TABS = ["Overview", "Services", "Reviews", "Portfolio", "Certifications", "Team", "Coverage", "FAQs"]

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
  const fromPrice = (provider.fromPrice / 100).toFixed(0)

  return (
    <div>
      <SuppliersHubNav />

      {/* Hero banner */}
      <div className="relative h-64 w-full bg-slate-200 overflow-hidden rounded-2xl mb-6">
        <Image
          src={provider.heroImage}
          alt={provider.companyName}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-2xl" />
        <div className="absolute bottom-4 left-6 flex items-end gap-4">
          <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-white">
            <Image
              src={provider.logo}
              alt={provider.companyName}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
          <div className="text-white pb-1">
            {provider.rating >= 4.8 && (
              <span className="inline-block bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full mb-1">
                ★ Top Rated
              </span>
            )}
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{provider.companyName}</h1>
              {provider.proBadge && (
                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded font-semibold">Pro</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <Link href="/app/marketplace/suppliers-hub" className="hover:text-blue-600">
              Suppliers
            </Link>
            <span>›</span>
            <span className="text-slate-900 font-medium">{provider.companyName}</span>
          </div>

          {/* Meta row */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1 text-sm text-slate-500">
                <span>{provider.trade}</span>
                {provider.vetted && (
                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                    <CheckCircle className="h-3.5 w-3.5" />Verified
                  </span>
                )}
                {provider.insured && (
                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                    <CheckCircle className="h-3.5 w-3.5" />Vetted
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                  <span className="font-semibold">{provider.rating}</span>
                  <span className="text-slate-500">({provider.reviewCount})</span>
                </span>
                <span className="flex items-center gap-1 text-slate-500">
                  <MapPin className="h-3.5 w-3.5" />{provider.location}
                </span>
              </div>
            </div>
          </div>

          {/* Trust feature row */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            <div className="flex flex-col items-center p-3 bg-slate-50 rounded-xl text-center">
              <Clock className="h-5 w-5 text-blue-600 mb-1" />
              <span className="text-xs font-semibold text-slate-900">{provider.responseTime}</span>
              <span className="text-xs text-slate-500">Fast response</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-slate-50 rounded-xl text-center">
              <CheckCircle className="h-5 w-5 text-emerald-600 mb-1" />
              <span className="text-xs font-semibold text-slate-900">{provider.insuranceAmount}</span>
              <span className="text-xs text-slate-500">Fully insured</span>
            </div>
            {provider.gasSafe && (
              <div className="flex flex-col items-center p-3 bg-slate-50 rounded-xl text-center">
                <span className="text-lg mb-1">🔥</span>
                <span className="text-xs font-semibold text-slate-900">Gas Safe</span>
                <span className="text-xs text-slate-500">No. {provider.gasSafe}</span>
              </div>
            )}
            {provider.emergency24h && (
              <div className="flex flex-col items-center p-3 bg-red-50 rounded-xl text-center">
                <span className="text-lg mb-1">🚨</span>
                <span className="text-xs font-semibold text-slate-900">24/7</span>
                <span className="text-xs text-slate-500">Emergency</span>
              </div>
            )}
            <div className="flex flex-col items-center p-3 bg-slate-50 rounded-xl text-center">
              <CheckCircle className="h-5 w-5 text-blue-600 mb-1" />
              <span className="text-xs font-semibold text-slate-900">DBS Verified</span>
              <span className="text-xs text-slate-500">Background check</span>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
            {[
              { value: `${provider.jobsDone.toLocaleString()}+`, label: "Jobs done" },
              { value: "98%",                                    label: "Repeat clients" },
              { value: provider.responseTime,                    label: "Response" },
              { value: `${provider.yearsActive}+yrs`,            label: "Experience" },
              { value: `${provider.coverageRadius}mi`,           label: "Coverage" },
              { value: provider.emergency24h ? "24/7" : "Mon-Sat", label: "Availability" },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-3 bg-blue-50 rounded-xl">
                <p className="text-base font-bold text-blue-700">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Tab row */}
          <div className="flex gap-1 overflow-x-auto pb-1 border-b border-slate-200 mb-6">
            {TABS.map((tab, i) => (
              <button
                key={tab}
                className={`shrink-0 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  i === 0
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab}
                {tab === "Reviews" ? ` ${provider.reviewCount}` : ""}
              </button>
            ))}
          </div>

          {/* About */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-3">About {provider.companyName}</h2>
            <p className="text-slate-600 leading-relaxed">
              {provider.description ??
                `${provider.companyName} is a leading ${provider.trade.toLowerCase()} provider serving ${provider.location}. With ${provider.yearsActive}+ years of experience and ${provider.jobsDone.toLocaleString()}+ jobs completed, we are trusted by property managers and homeowners alike.`}
            </p>
          </div>

          {/* Services offered */}
          {provider.services && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-slate-900 mb-3">Services offered</h2>
              <div className="flex flex-wrap gap-2">
                {provider.services.map((svc) => (
                  <span
                    key={svc}
                    className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-sm font-medium hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-colors"
                  >
                    {svc}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Certifications &amp; compliance</h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {provider.certifications.map((cert) => (
                <div
                  key={cert}
                  className="flex flex-col items-center p-3 bg-slate-50 rounded-xl text-center border border-slate-200"
                >
                  <CheckCircle className="h-6 w-6 text-emerald-500 mb-1.5" />
                  <span className="text-xs font-semibold text-slate-700 text-center">{cert}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Team */}
          {provider.teamMembers && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Our team</h2>
              <div className="flex gap-4 flex-wrap">
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

          {/* Recent work */}
          {provider.recentWork && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Recent work</h2>
              <div className="grid grid-cols-4 gap-2">
                {provider.recentWork.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                    <Image
                      src={img}
                      alt={`Recent work ${i + 1}`}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                      sizes="25vw"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQs */}
          {provider.faqs && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">FAQs</h2>
              <div className="space-y-3">
                {provider.faqs.map((faq, i) => (
                  <details
                    key={i}
                    className="group p-4 bg-slate-50 rounded-xl border border-slate-200"
                  >
                    <summary className="font-semibold text-slate-900 text-sm cursor-pointer">
                      {faq.q}
                    </summary>
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">{faq.a}</p>
                  </details>
                ))}
              </div>
            </div>
          )}

          {/* Coverage */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Coverage areas</h2>
            <div className="flex flex-wrap gap-2">
              {provider.coverageCities.map((city) => (
                <span
                  key={city}
                  className="flex items-center gap-1 text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full"
                >
                  <MapPin className="h-3 w-3" />
                  {city}
                </span>
              ))}
            </div>
            <p className="text-sm text-slate-500 mt-2">
              Coverage radius: {provider.coverageRadius} miles
            </p>
          </div>

          {/* Related suppliers */}
          {related.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">You might also like</h2>
              <div className="space-y-3">
                {related.map((p) => (
                  <RelatedProviderCard key={p.id} provider={p} basePath="/app/marketplace/suppliers-hub" />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: CTA card */}
        <div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sticky top-20 space-y-3">
            <button className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
              Request quote →
            </button>
            <button className="w-full py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
              <MessageCircle className="h-4 w-4" /> Contact supplier
            </button>
            <button className="w-full py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
              <LayoutGrid className="h-4 w-4" /> View services
            </button>
            <button className="w-full py-3 border border-slate-200 hover:bg-slate-50 text-slate-500 font-medium rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
              <Heart className="h-4 w-4" /> Save supplier
            </button>
            <div className="pt-2 text-xs text-slate-500 text-center">
              From <span className="font-bold text-slate-900 text-sm">£{fromPrice}</span> per visit
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
