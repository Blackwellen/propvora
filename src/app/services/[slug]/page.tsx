import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle, Star, MapPin, ChevronRight, Clock, Shield, Heart, Share2 } from 'lucide-react'
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

const TABS = ['Overview', 'Packages & Pricing', 'Add-ons', 'Reviews', 'Provider', 'FAQs']

const TRUST_STRIP = [
  { icon: CheckCircle, title: 'Deposit-back guarantee', desc: 'If your deposit fails, we refund the service.', color: 'text-emerald-600' },
  { icon: Shield, title: 'Vetted & trusted pros', desc: 'All providers are background-checked.', color: 'text-blue-600' },
  { icon: Shield, title: 'Secure payments', desc: 'Escrow-protected, full dispute resolution.', color: 'text-blue-600' },
  { icon: Star, title: 'Satisfaction guaranteed', desc: '100% satisfaction or we make it right.', color: 'text-amber-500' },
]

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const offer = await getPublicServiceOfferBySlug(slug)
  if (!offer) notFound()

  const allImages = [offer.heroImage, ...offer.gallery].filter(Boolean)

  return (
    <PublicPageShell marketplaceNav hideFooter>
      <div className="relative mx-auto max-w-[1400px] px-6 py-5 lg:px-10">
        {/* Breadcrumb */}
        <nav className="mb-7 flex items-center gap-1.5 text-[13px] font-[500] text-slate-500">
          <Link href="/services" className="hover:text-slate-900">Services</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span>{offer.category}</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-slate-900 truncate max-w-xs">{offer.title}</span>
        </nav>

        <aside className="absolute right-10 top-11 hidden w-[464px] lg:block">
          <ServicePackageSelector offer={offer} />
        </aside>

        {/* Top badges + actions */}
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-semibold">
              Trusted service
            </span>
            {offer.verified && (
              <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-medium border border-emerald-100">
                <CheckCircle className="h-3 w-3" />Verified
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
              <Heart className="h-4 w-4" />Save
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
              <Share2 className="h-4 w-4" />Share
            </button>
          </div>
        </div>

        {/* Title */}
        <h1 className="mb-1 text-[42px] font-[800] leading-[1.05] text-slate-950 lg:max-w-[840px]">{offer.title}</h1>
        <p className="mb-4 text-[17px] font-[500] text-slate-500 lg:max-w-[840px]">{offer.subtitle}</p>

        {/* Rating + stats */}
        <div className="flex flex-wrap items-center gap-4 mb-5 text-sm">
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
            <span className="font-bold text-slate-900">{offer.rating}</span>
            <span className="text-slate-500">({offer.reviewCount} reviews)</span>
          </div>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600">{offer.jobsDone}+ jobs completed</span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1 text-slate-600"><MapPin className="h-3.5 w-3.5" />{offer.location}</span>
        </div>

        {/* Provider strip */}
        <div className="mb-6 flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 lg:max-w-[840px]">
          <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0">
            <Image src={offer.providerAvatar} alt={offer.providerName} fill className="object-cover" sizes="40px" />
          </div>
          <div className="flex-1 flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900">{offer.providerName}</span>
            {offer.providerPro && <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded font-semibold">Pro</span>}
            <span className="text-slate-500 text-sm">Top rated provider</span>
            {offer.verified && (
              <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                <CheckCircle className="h-3 w-3" />Verified provider
              </span>
            )}
            {offer.insured && (
              <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                <CheckCircle className="h-3 w-3" />Fully insured
              </span>
            )}
          </div>
          <Link href={`/providers/${offer.providerSlug}`} className="shrink-0 text-sm font-medium text-blue-600 hover:text-blue-700">
            View profile →
          </Link>
        </div>

        {/* GALLERY */}
        {allImages.length > 0 && (
          <div className="mb-6 grid h-[276px] grid-cols-5 gap-3 overflow-hidden rounded-[12px] lg:max-w-[840px]">
            <div className="col-span-3 relative">
              <Image src={allImages[0]} alt={offer.title} fill className="object-cover" sizes="55vw" priority />
            </div>
            <div className="col-span-2 grid grid-rows-2 gap-2">
              {[1, 2].map(i => (
                <div key={i} className="relative overflow-hidden rounded-sm">
                  <Image src={allImages[i] ?? allImages[0]} alt={`${offer.title} photo ${i + 1}`} fill className="object-cover" sizes="22vw" />
                  {i === 1 && allImages.length > 3 && (
                    <div className="absolute inset-0 bg-black/40 flex items-end p-3">
                      <span className="text-white text-sm font-semibold">View all photos +{allImages.length + 15}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TRUST STRIP */}
        <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4 lg:max-w-[840px]">
          {TRUST_STRIP.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${color}`} />
              <div>
                <p className="text-sm font-semibold text-slate-900">{title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div className="mb-5 flex gap-1 overflow-x-auto border-b border-slate-200 scrollbar-hide lg:max-w-[840px]">
          {TABS.map((tab, i) => (
            <div
              key={tab}
              className={`shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                i === 0 ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}{tab === 'Reviews' ? ` (${offer.reviewCount})` : ''}
            </div>
          ))}
        </div>

        {/* TWO-COLUMN */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_464px]">
          {/* LEFT */}
          <div className="space-y-5">
            {/* About */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">About this service</h2>
              <p className="text-slate-600 leading-relaxed">
                {offer.subtitle} Our team of professional cleaners are fully trained, DBS-checked, and equipped with industrial-grade eco products. We guarantee your deposit back or your money returned.
              </p>
            </div>

            {/* Tags */}
            {offer.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {offer.tags.map(tag => (
                  <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full">{tag}</span>
                ))}
              </div>
            )}

            {/* Three-column: included / not included / process */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="font-semibold text-slate-900 text-sm mb-3">What&apos;s included</h3>
                <ul className="space-y-2">
                  {offer.deliverables.map(d => (
                    <li key={d} className="flex items-center gap-2 text-sm text-slate-700">
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />{d}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm mb-3">What&apos;s not included</h3>
                <ul className="space-y-2">
                  {['External windows', 'Loft/attic spaces', 'Garages', 'Specialist stain removal'].map(item => (
                    <li key={item} className="flex items-center gap-2 text-sm text-slate-500">
                      <span className="w-4 h-4 rounded-full border-2 border-slate-300 flex items-center justify-center shrink-0">
                        <span className="w-1.5 h-0.5 bg-slate-400 block" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm mb-3">Service process</h3>
                <ol className="space-y-3">
                  {['Book and confirm slot', 'Team arrives on time', 'Professional clean delivered', 'Photo report sent'].map((step, i) => (
                    <li key={step} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Availability + turnaround */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Next available</p>
                <p className="text-lg font-bold text-slate-900">{offer.nextAvailable}</p>
                <p className="text-xs text-slate-500">Slots fill up quickly</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Duration</p>
                <p className="text-lg font-bold text-slate-900">{offer.duration}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1"><Clock className="h-3 w-3" />{offer.responseTime} response</p>
              </div>
            </div>
          </div>

          {/* RIGHT — sticky package selector */}
          <div className="lg:hidden">
            <div className="sticky top-20">
              <ServicePackageSelector offer={offer} />
            </div>
          </div>
        </div>
      </div>
    </PublicPageShell>
  )
}
