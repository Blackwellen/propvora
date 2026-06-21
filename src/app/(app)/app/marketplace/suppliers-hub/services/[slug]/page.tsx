import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Star, MapPin, CheckCircle, X, Clock, Zap, Share2, Heart } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import SuppliersHubNav from "@/components/marketplace/SuppliersHubNav"
import MarketplaceTrustStrip from "@/components/public-marketplace/MarketplaceTrustStrip"
import ServicePackageSelector from "@/components/public-marketplace/profiles/ServicePackageSelector"
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
  return { title: `${offer.title} · Services · Propvora`, description: offer.subtitle }
}

const NOT_INCLUDED = [
  "External windows (unless add-on purchased)",
  "Garage or outbuilding areas",
  "Loft/attic spaces",
  "Garden or outdoor areas",
  "Pest removal or specialist treatments",
]

const PROCESS_STEPS = [
  { n: 1, title: "Book & confirm",      desc: "Choose your package, add-ons and preferred date. Instant confirmation." },
  { n: 2, title: "We arrive on time",   desc: "Our vetted team arrives with all professional equipment included." },
  { n: 3, title: "Work completed",      desc: "Thorough work to the agreed standard. We follow a strict checklist." },
  { n: 4, title: "Quality sign-off",    desc: "We inspect before leaving. Photo report available as an add-on." },
]

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const offer = await getPublicServiceOfferBySlug(slug)
  if (!offer) notFound()

  return (
    <div>
      <SuppliersHubNav />

      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
          <Link href="/property-manager/marketplace/suppliers-hub/services" className="hover:text-blue-600">
            Services
          </Link>
          <span>›</span>
          <Link href="/property-manager/marketplace/suppliers-hub/services" className="hover:text-blue-600">
            {offer.category}
          </Link>
          <span>›</span>
          <span className="text-slate-900 font-medium">{offer.title}</span>
        </div>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            {offer.verified && (
              <span className="inline-flex items-center gap-1 text-sm text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                <CheckCircle className="h-3.5 w-3.5" /> Trusted service
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">{offer.title}</h1>
          <p className="text-lg text-slate-500 mb-3">{offer.subtitle}</p>
          <div className="flex items-center flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
              <span className="font-semibold text-slate-900">{offer.rating}</span>
              <span className="text-slate-500">({offer.reviewCount} reviews)</span>
            </div>
            <span className="text-slate-500">{offer.jobsDone}+ jobs completed</span>
            <span className="flex items-center gap-1 text-slate-500">
              <MapPin className="h-3.5 w-3.5" />{offer.location}
            </span>
          </div>
        </div>

        {/* Provider strip */}
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-6">
          <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0">
            <Image
              src={offer.providerAvatar}
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
                <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded font-semibold">Pro</span>
              )}
              <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                Top rated provider
              </span>
            </div>
            <div className="text-sm text-slate-500 flex items-center gap-2 mt-0.5">
              {offer.verified && (
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-emerald-500" />Verified provider
                </span>
              )}
              {offer.insured && (
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-emerald-500" />Fully insured
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900">
              <Heart className="h-4 w-4" /> Save
            </button>
            <button className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900">
              <Share2 className="h-4 w-4" /> Share
            </button>
          </div>
        </div>

        {/* Gallery */}
        <div className="grid grid-cols-3 gap-2 h-72 rounded-2xl overflow-hidden mb-8">
          <div className="col-span-2 relative">
            <Image
              src={offer.heroImage}
              alt={offer.title}
              fill
              className="object-cover"
              sizes="66vw"
            />
          </div>
          <div className="grid grid-rows-2 gap-2">
            {offer.gallery.slice(1, 3).map((img, i) => (
              <div key={i} className="relative overflow-hidden">
                <Image
                  src={img}
                  alt={`${offer.title} ${i + 2}`}
                  fill
                  className="object-cover"
                  sizes="33vw"
                />
                {i === 1 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">+18 View all photos</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Trust strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { icon: "💰", title: "Deposit-back guarantee", desc: "Get your deposit back or we return" },
            { icon: "✓",  title: "Vetted & trusted pros",  desc: "DBS-checked, reviewed professionals" },
            { icon: "🔒", title: "Secure payments",        desc: "Escrow-protected, safe checkout" },
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">About this service</h2>
              <p className="text-slate-600 leading-relaxed">
                Professional service designed to the highest standard. Our trained team follow a strict
                process and cover every detail.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {offer.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Included / Not included */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-slate-900 mb-3">What&apos;s included</h3>
                <div className="space-y-2">
                  {offer.deliverables.map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-slate-700">
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-3">What&apos;s not included</h3>
                <div className="space-y-2">
                  {NOT_INCLUDED.map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-slate-500">
                      <X className="h-4 w-4 text-slate-300 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Process */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Service process</h2>
              <div className="grid grid-cols-2 gap-4">
                {PROCESS_STEPS.map((step) => (
                  <div
                    key={step.n}
                    className="flex gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200"
                  >
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
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

            {/* Availability */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold text-slate-900 text-sm">Next available</span>
                </div>
                <p className="text-sm text-blue-700 font-medium">{offer.nextAvailable}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span className="font-semibold text-slate-900 text-sm">Turnaround time</span>
                </div>
                <p className="text-sm text-slate-700">{offer.duration}</p>
              </div>
            </div>
          </div>

          {/* Package selector */}
          <div>
            <ServicePackageSelector offer={offer} />
          </div>
        </div>

        <div className="mt-8">
          <MarketplaceTrustStrip />
        </div>
      </div>
    </div>
  )
}
