import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle, Star, MapPin, ChevronRight, Clock, Zap, Shield } from 'lucide-react'
import PublicPageShell from '@/components/public-marketplace/PublicPageShell'
import ServicePackageSelector from '@/components/public-marketplace/profiles/ServicePackageSelector'
import { getPublicServiceOfferBySlug } from '@/lib/public-marketplace/queries'
import { SEED_SERVICE_OFFERS } from '@/lib/public-marketplace/seed-fallback'

export async function generateStaticParams() {
  return SEED_SERVICE_OFFERS.map(s => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const offer = await getPublicServiceOfferBySlug(slug)
  if (!offer) return {}
  return {
    title: `${offer.title} | Propvora Services`,
    description: offer.subtitle,
  }
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const offer = await getPublicServiceOfferBySlug(slug)
  if (!offer) notFound()

  const allImages = [offer.heroImage, ...offer.gallery].filter(Boolean)

  return (
    <PublicPageShell>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-slate-500 mb-5">
          <Link href="/services" className="hover:text-slate-900">Services</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span>{offer.category}</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-slate-900 truncate max-w-xs">{offer.title}</span>
        </nav>

        {/* Title row */}
        <div className="mb-5">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {offer.verified && (
              <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-semibold border border-emerald-100">
                <CheckCircle className="h-3 w-3" />
                Verified
              </span>
            )}
            <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium border border-blue-100">
              Trusted service
            </span>
            {offer.urgent && (
              <span className="text-xs bg-red-50 text-red-700 px-2.5 py-1 rounded-full font-semibold border border-red-100">
                Urgent available
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">{offer.title}</h1>
          <p className="text-lg text-slate-500">{offer.subtitle}</p>
        </div>

        {/* Rating + stats row */}
        <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
            <span className="font-bold text-slate-900">{offer.rating}</span>
            <span className="text-slate-500">({offer.reviewCount} reviews)</span>
          </div>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600">{offer.jobsDone}+ jobs done</span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1 text-slate-600">
            <MapPin className="h-3.5 w-3.5" />{offer.location}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left col */}
          <div className="lg:col-span-2 space-y-8">
            {/* Provider mini-row */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0">
                <Image src={offer.providerAvatar} alt={offer.providerName} fill className="object-cover" sizes="48px" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-900">{offer.providerName}</span>
                  {offer.providerPro && (
                    <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded font-semibold">Pro</span>
                  )}
                  {offer.verified && (
                    <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                      <CheckCircle className="h-3 w-3" />Verified
                    </span>
                  )}
                  {offer.insured && (
                    <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      <Shield className="h-3 w-3" />Insured
                    </span>
                  )}
                </div>
              </div>
              <Link
                href={`/providers/${offer.providerSlug}`}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 shrink-0"
              >
                View profile →
              </Link>
            </div>

            {/* Gallery */}
            {allImages.length > 0 && (
              <div>
                <div className="relative h-72 rounded-2xl overflow-hidden mb-2">
                  <Image src={allImages[0]} alt={offer.title} fill className="object-cover" sizes="100vw" />
                </div>
                {allImages.length > 1 && (
                  <div className="grid grid-cols-3 gap-2">
                    {allImages.slice(1, 4).map((img, i) => (
                      <div key={i} className="relative h-24 rounded-xl overflow-hidden">
                        <Image src={img} alt={`${offer.title} photo ${i+2}`} fill className="object-cover" sizes="33vw" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Trust strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {offer.verified && (
                <div className="flex flex-col items-center gap-1.5 p-3 bg-emerald-50 rounded-xl text-center">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-800">Verified</span>
                </div>
              )}
              {offer.insured && (
                <div className="flex flex-col items-center gap-1.5 p-3 bg-blue-50 rounded-xl text-center">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-800">Insured</span>
                </div>
              )}
              <div className="flex flex-col items-center gap-1.5 p-3 bg-amber-50 rounded-xl text-center">
                <Clock className="h-5 w-5 text-amber-600" />
                <span className="text-xs font-semibold text-amber-800">{offer.responseTime} response</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-3 bg-violet-50 rounded-xl text-center">
                <Zap className="h-5 w-5 text-violet-600" />
                <span className="text-xs font-semibold text-violet-800">Next: {offer.nextAvailable}</span>
              </div>
            </div>

            {/* Tabs row (visual only) */}
            <div className="flex gap-1 border-b border-slate-200">
              {['About', "What's included", 'Process', 'Add-ons'].map((tab, i) => (
                <div
                  key={tab}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    i === 0 ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
                  }`}
                >
                  {tab}
                </div>
              ))}
            </div>

            {/* About — tags & deliverables */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">About this service</h2>
              {offer.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {offer.tags.map(tag => (
                    <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full">{tag}</span>
                  ))}
                </div>
              )}
              {offer.deliverables.length > 0 && (
                <div className="space-y-2">
                  {offer.deliverables.map(d => (
                    <div key={d} className="flex items-center gap-2 text-sm text-slate-700">
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                      {d}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Process steps */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">How it works</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { step: 1, title: 'Book online', desc: 'Choose your package and confirm your slot.' },
                  { step: 2, title: 'Provider confirms', desc: 'Your provider confirms within the response window.' },
                  { step: 3, title: 'Service delivered', desc: 'Sit back while we handle it. Pay after completion.' },
                ].map(step => (
                  <div key={step.step} className="p-4 bg-white border border-slate-200 rounded-2xl">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold mb-3">
                      {step.step}
                    </div>
                    <p className="font-semibold text-slate-900 text-sm mb-1">{step.title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Cancellation */}
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-sm font-semibold text-amber-800 mb-1">Cancellation policy</p>
              <p className="text-sm text-amber-700">Free cancellation up to 24 hours before the scheduled service. After that, a 50% cancellation fee applies.</p>
            </div>
          </div>

          {/* Right col */}
          <div className="lg:col-span-1 space-y-4">
            <ServicePackageSelector offer={offer} />

            {/* Provider card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0">
                  <Image src={offer.providerAvatar} alt={offer.providerName} fill className="object-cover" sizes="40px" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{offer.providerName}</p>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-medium text-slate-700">{offer.rating}</span>
                    <span className="text-xs text-slate-400">({offer.reviewCount})</span>
                  </div>
                </div>
              </div>
              <Link
                href={`/providers/${offer.providerSlug}`}
                className="block w-full text-center py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                View provider profile →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PublicPageShell>
  )
}
