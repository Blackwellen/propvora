import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle, Star, MapPin, ChevronRight, Phone, Shield, Clock } from 'lucide-react'
import PublicPageShell from '@/components/public-marketplace/PublicPageShell'
import EmergencyServiceCard from '@/components/public-marketplace/cards/EmergencyServiceCard'
import EmergencyCTAPanel from '@/components/public-marketplace/profiles/EmergencyCTAPanel'
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

export default async function EmergencyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [service, allServices] = await Promise.all([
    getPublicEmergencyServiceBySlug(slug),
    getPublicEmergencyServices(),
  ])
  if (!service) notFound()

  const relatedServices = allServices.filter(s => s.slug !== slug).slice(0, 4)

  return (
    <PublicPageShell>
      {/* Urgent safety banner */}
      <div className="bg-red-600 text-white text-center py-2.5 px-4 text-sm font-medium">
        If you smell gas or are in danger, call <strong>999</strong> or National Gas Emergency{' '}
        <a href="tel:08001119999" className="underline font-bold">0800 111 999</a> immediately
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-slate-500 mb-5">
          <Link href="/emergency" className="hover:text-slate-900">Emergency</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span>{service.category}</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-slate-900 truncate max-w-xs">{service.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left col */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero image */}
            <div className="relative h-72 rounded-2xl overflow-hidden">
              <Image src={service.heroImage} alt={service.title} fill className="object-cover" sizes="100vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>

            {/* Badges + title */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full font-bold uppercase tracking-wide">
                  URGENT RESPONSE
                </span>
                <span className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-full font-semibold">
                  Emergency Service
                </span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1">{service.title}</h1>
              <p className="text-lg text-slate-500">{service.subtitle}</p>
            </div>

            {/* Rating + coverage row */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                <span className="font-bold text-slate-900">{service.rating}</span>
                <span className="text-slate-500">({service.reviewCount} reviews)</span>
              </div>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1 text-slate-600">
                <MapPin className="h-3.5 w-3.5" />{service.location}
              </span>
              <span className="text-slate-300">|</span>
              <div className="flex flex-wrap gap-1">
                {service.coveragePostcodes.slice(0, 4).map(pc => (
                  <span key={pc} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{pc}</span>
                ))}
                {service.coveragePostcodes.length > 4 && (
                  <span className="text-xs text-slate-400">+{service.coveragePostcodes.length - 4} more</span>
                )}
              </div>
            </div>

            {/* Trust features row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {service.policeVetted && (
                <div className="flex flex-col items-center gap-1.5 p-3 bg-blue-50 rounded-xl text-center">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-800">Police vetted</span>
                </div>
              )}
              {service.insured && (
                <div className="flex flex-col items-center gap-1.5 p-3 bg-emerald-50 rounded-xl text-center">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-800">Insured {service.insuranceAmount}</span>
                </div>
              )}
              {service.available24h && (
                <div className="flex flex-col items-center gap-1.5 p-3 bg-red-50 rounded-xl text-center">
                  <Phone className="h-5 w-5 text-red-600" />
                  <span className="text-xs font-semibold text-red-800">24/7 available</span>
                </div>
              )}
              {service.noCalloutFee && (
                <div className="flex flex-col items-center gap-1.5 p-3 bg-violet-50 rounded-xl text-center">
                  <Clock className="h-5 w-5 text-violet-600" />
                  <span className="text-xs font-semibold text-violet-800">No call-out fee</span>
                </div>
              )}
            </div>

            {/* Lead provider strip */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0">
                <Image src={service.providerAvatar} alt={service.leadTechnicianName} fill className="object-cover" sizes="48px" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{service.leadTechnicianName}</span>
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs text-emerald-600 font-medium">Online now</span>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">{service.leadTechnicianRole} · {service.providerName}</p>
              </div>
              <Link
                href={`/providers/${service.providerSlug}`}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 shrink-0"
              >
                View profile →
              </Link>
            </div>

            {/* Tabs row (visual) */}
            <div className="flex gap-1 border-b border-slate-200">
              {['Overview', 'Pricing', 'Coverage', 'Vetting', 'Reviews'].map((tab, i) => (
                <div
                  key={tab}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    i === 0 ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500'
                  }`}
                >
                  {tab}
                </div>
              ))}
            </div>

            {/* Overview / description */}
            {service.description && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-3">Overview</h2>
                <p className="text-slate-600 leading-relaxed">{service.description}</p>
              </div>
            )}

            {/* What we can help with */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">What we can help with</h2>
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
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pricing table */}
            {service.priceItems && service.priceItems.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Transparent pricing</h2>
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-5 py-3 font-semibold text-slate-700">Service</th>
                        <th className="text-right px-5 py-3 font-semibold text-slate-700">From</th>
                        <th className="text-right px-5 py-3 font-semibold text-slate-700">Up to</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {service.priceItems.map(item => (
                        <tr key={item.service} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3.5 text-slate-800">{item.service}</td>
                          <td className="px-5 py-3.5 text-right font-semibold text-slate-900">{formatPence(item.from)}</td>
                          <td className="px-5 py-3.5 text-right text-slate-500">
                            {item.to ? formatPence(item.to) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-slate-400 mt-2 ml-1">Prices are indicative. Final price confirmed on-site by engineer.</p>
              </div>
            )}

            {/* Insurance & vetting */}
            <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl">
              <h3 className="font-bold text-blue-900 mb-3">Insurance & vetting</h3>
              <div className="space-y-2 text-sm text-blue-800">
                {service.insured && (
                  <p className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-blue-600 shrink-0" />Fully insured up to {service.insuranceAmount}</p>
                )}
                {service.policeVetted && (
                  <p className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-blue-600 shrink-0" />Police vetted — DBS checked</p>
                )}
                <p className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-blue-600 shrink-0" />ID-verified by Propvora compliance team</p>
                <p className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-blue-600 shrink-0" />Customer reviews verified as genuine</p>
              </div>
            </div>

            {/* Coverage postcodes */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">Coverage areas</h2>
              <div className="flex flex-wrap gap-2">
                {service.coveragePostcodes.map(pc => (
                  <span key={pc} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-sm font-medium border border-red-100">
                    <MapPin className="h-3 w-3" />
                    {pc}
                  </span>
                ))}
              </div>
            </div>

            {/* Related emergency services */}
            {relatedServices.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Other emergency services</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {relatedServices.map(s => (
                    <EmergencyServiceCard key={s.id} service={s} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right col — CTA panel */}
          <div className="lg:col-span-1">
            <EmergencyCTAPanel service={service} />
          </div>
        </div>
      </div>
    </PublicPageShell>
  )
}
