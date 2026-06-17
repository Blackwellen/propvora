import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle, Star, MapPin, ChevronRight, Phone, Shield, Clock, AlertCircle, AlertTriangle, MessageCircle } from 'lucide-react'
import PublicPageShell from '@/components/public-marketplace/PublicPageShell'
import EmergencyServiceCard from '@/components/public-marketplace/cards/EmergencyServiceCard'
import { getPublicEmergencyServiceBySlug, getPublicEmergencyServices } from '@/lib/public-marketplace/queries'
import { SEED_EMERGENCY_SERVICES } from '@/lib/public-marketplace/seed-fallback'
import { formatPence } from '@/lib/marketplace/money'

export async function generateStaticParams() {
  return SEED_EMERGENCY_SERVICES.map(s => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const service = await getPublicEmergencyServiceBySlug(slug)
  if (!service) return {}
  return {
    title: `${service.title} | Propvora Emergency Services`,
    description: service.subtitle,
  }
}

const TABS = ['Overview', 'Services', 'Coverage', 'Pricing', 'Reviews', 'FAQ', 'Provider details']

export default async function EmergencyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [service, allServices] = await Promise.all([
    getPublicEmergencyServiceBySlug(slug),
    getPublicEmergencyServices(),
  ])
  if (!service) notFound()

  const relatedServices = allServices.filter(s => s.slug !== slug).slice(0, 5)

  return (
    <PublicPageShell>
      {/* Safety banner */}
      <div className="bg-red-600 text-white text-center py-2.5 px-4 text-sm font-medium">
        If you smell gas or are in danger, call <strong>999</strong> or National Gas Emergency{' '}
        <a href="tel:08001119999" className="underline font-bold">0800 111 999</a> immediately
      </div>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-2">
        <nav className="flex items-center gap-1.5 text-sm text-slate-500">
          <Link href="/emergency" className="hover:text-slate-900">Emergency</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span>{service.category}</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-slate-900 truncate max-w-xs">{service.title}</span>
        </nav>
      </div>

      {/* THREE-COLUMN LAYOUT */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT (30%) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Hero image */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
              <Image src={service.heroImage} alt={service.title} fill className="object-cover" sizes="33vw" priority />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

              {/* URGENT RESPONSE badge */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 text-white rounded-full px-3 py-1 text-xs font-bold">
                <AlertCircle className="h-3.5 w-3.5" />
                URGENT RESPONSE
              </div>
              <p className="absolute bottom-3 left-3 text-white/80 text-xs">We&apos;re on call and ready to go</p>

              {/* Image caption */}
              <div className="absolute bottom-3 right-3 bg-white/20 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-lg">
                Image from recent call-out
              </div>
            </div>

            {/* Trust features */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Police vetted DBS', sub: 'DBS checked', color: 'bg-blue-50', iconColor: 'text-blue-600' },
                { label: 'Fully insured', sub: service.insuranceAmount ?? '£5M', color: 'bg-emerald-50', iconColor: 'text-emerald-600' },
                { label: '24/7 availability', sub: '365 days', color: 'bg-red-50', iconColor: 'text-red-600' },
                { label: 'Fast response', sub: service.responseTimeMin + '-' + service.responseTimeMax + ' mins', color: 'bg-violet-50', iconColor: 'text-violet-600' },
              ].map(({ label, sub, color, iconColor }) => (
                <div key={label} className={`p-3 ${color} rounded-xl text-center`}>
                  <Shield className={`h-5 w-5 mx-auto mb-1 ${iconColor}`} />
                  <p className="text-xs font-semibold text-slate-900">{label}</p>
                  <p className="text-[10px] text-slate-500">{sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CENTER (40%) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Category + title */}
            <div>
              <p className="text-red-600 text-xs font-bold uppercase tracking-widest mb-2">EMERGENCY SERVICE</p>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-3xl font-bold text-slate-900 leading-tight">{service.title}</h1>
                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded font-semibold">Pro</span>
              </div>
              <p className="text-slate-500 text-base">{service.subtitle}</p>
            </div>

            {/* Provider strip */}
            <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="relative w-16 h-16 rounded-full border-4 border-white shadow overflow-hidden shrink-0">
                <Image src={service.providerAvatar} alt={service.leadTechnicianName} fill className="object-cover" sizes="64px" />
                {/* Online indicator */}
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{service.leadTechnicianName}</span>
                  <span className="text-xs text-emerald-600 font-medium">Online now</span>
                </div>
                <p className="text-sm text-slate-500">{service.leadTechnicianRole}</p>
              </div>
            </div>

            {/* Rating + verified */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />)}
                </div>
                <span className="font-bold text-slate-900">{service.rating}</span>
                <span className="text-slate-500">({service.reviewCount} reviews)</span>
              </div>
              <span className="flex items-center gap-1 text-emerald-700 font-semibold text-xs">
                <CheckCircle className="h-3.5 w-3.5" />Verified &amp; Vetted
              </span>
            </div>

            {/* Location + postcodes */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 text-slate-600 text-sm">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />{service.location}
              </span>
              {service.coveragePostcodes.slice(0, 5).map(pc => (
                <span key={pc} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{pc}</span>
              ))}
            </div>

            {/* TABS */}
            <div className="flex gap-1 border-b border-slate-200 overflow-x-auto scrollbar-hide">
              {TABS.map((tab, i) => (
                <div
                  key={tab}
                  className={`shrink-0 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    i === 0 ? 'border-red-600 text-red-600 font-semibold' : 'border-transparent text-slate-500'
                  }`}
                >
                  {tab}
                </div>
              ))}
            </div>

            {/* Overview content */}
            {service.description && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-3">Service overview</h2>
                <p className="text-slate-600 leading-relaxed">{service.description}</p>
              </div>
            )}

            {/* What we can help with */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">What we can help with</h2>
              <ul className="space-y-2">
                {[
                  'Immediate on-site assessment',
                  'Emergency repair and containment',
                  'Full replacement if required',
                  'Safety inspection and clearance',
                  'Written report for insurance claims',
                  'Follow-up appointment if needed',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-slate-700">
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />{item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pricing table */}
            {service.priceItems && service.priceItems.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4">Transparent pricing</h2>
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-slate-700">Service</th>
                        <th className="text-right px-4 py-3 font-semibold text-slate-700">From</th>
                        <th className="text-right px-4 py-3 font-semibold text-slate-700">Up to</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {service.priceItems.map(item => (
                        <tr key={item.service} className="hover:bg-slate-50">
                          <td className="px-4 py-3.5 text-slate-800">{item.service}</td>
                          <td className="px-4 py-3.5 text-right font-semibold text-slate-900">{formatPence(item.from)}</td>
                          <td className="px-4 py-3.5 text-right text-slate-500">{item.to ? formatPence(item.to) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-slate-400 mt-2 ml-1">Prices are indicative. Final price confirmed on-site.</p>
              </div>
            )}

            {/* Other emergency services */}
            {relatedServices.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4">Other emergency services you might need</h2>
                <div className="space-y-3">
                  {relatedServices.slice(0, 3).map(s => (
                    <EmergencyServiceCard key={s.id} service={s} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT (30%) — sticky emergency CTA */}
          <div className="lg:col-span-3">
            <div className="bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden sticky top-20">
              {/* Header text */}
              <div className="px-4 pt-4 pb-2">
                <p className="text-red-600 text-xs font-bold uppercase tracking-widest">NEED IMMEDIATE HELP?</p>
                <p className="text-lg font-bold text-slate-900 mt-1">We&apos;re ready to respond</p>
                <p className="text-slate-500 text-sm mt-0.5 leading-relaxed">
                  Call, chat or request now. We&apos;ll be with you as quickly as possible.
                </p>
              </div>

              {/* Call button — full width flush */}
              <a
                href={`tel:${service.phone}`}
                className="flex flex-col items-center justify-center py-4 bg-red-600 hover:bg-red-700 text-white transition-colors mt-3"
              >
                <div className="flex items-center gap-2 font-bold text-base">
                  <Phone className="h-5 w-5" />
                  Call now: {service.phone}
                </div>
                <span className="text-white/80 text-xs mt-0.5">Available 24/7</span>
              </a>

              {/* Other actions */}
              <div className="p-4 space-y-2.5">
                <button className="w-full flex items-center justify-center gap-2 py-3 border border-slate-300 rounded-xl text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors">
                  <Clock className="h-4 w-4" />
                  Request a call back
                </button>
                <div>
                  <button className="w-full flex items-center justify-center gap-2 py-3 border border-slate-300 rounded-xl text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors">
                    <MessageCircle className="h-4 w-4" />
                    Start live chat
                  </button>
                  <p className="text-center text-slate-400 text-xs mt-1">No wait — we&apos;re online</p>
                </div>

                <hr className="border-slate-100" />

                {/* ETA */}
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">🚐</span>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">ESTIMATED ARRIVAL</p>
                      <p className="text-2xl font-bold text-slate-900">{service.responseTimeMin}–{service.responseTimeMax} mins</p>
                    </div>
                  </div>
                  <p className="text-slate-400 text-xs">Based on your location</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                    <MapPin className="h-3 w-3 text-slate-400" />
                    <span className="text-xs text-slate-600">M2 4BG</span>
                    <button className="text-blue-600 text-xs underline ml-1">Change</button>
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* Trust grid */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />24/7 Emergency</div>
                  {service.noCalloutFee && <div className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />No call-out fee</div>}
                  <div className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />Upfront pricing</div>
                  <div className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />Satisfaction</div>
                </div>

                <hr className="border-slate-100" />

                {/* Danger card */}
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-800 font-semibold text-sm">In danger or unsafe?</p>
                    <p className="text-red-600 text-sm mt-0.5">If this is an emergency, call <strong>999</strong></p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </PublicPageShell>
  )
}
