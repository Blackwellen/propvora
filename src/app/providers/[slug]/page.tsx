import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle, Star, MapPin, ChevronRight, Clock, Shield, Briefcase, Users } from 'lucide-react'
import PublicPageShell from '@/components/public-marketplace/PublicPageShell'
import ProviderCard from '@/components/public-marketplace/cards/ProviderCard'
import { getPublicProviderBySlug, getPublicProviders } from '@/lib/public-marketplace/queries'
import { SEED_PROVIDERS } from '@/lib/public-marketplace/seed-fallback'

export async function generateStaticParams() {
  return SEED_PROVIDERS.map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const provider = await getPublicProviderBySlug(slug)
  if (!provider) return {}
  return {
    title: `${provider.companyName} | Propvora Providers`,
    description: provider.description ?? `${provider.companyName} — ${provider.trade} in ${provider.city}`,
  }
}

export default async function ProviderDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [provider, allProviders] = await Promise.all([
    getPublicProviderBySlug(slug),
    getPublicProviders(),
  ])
  if (!provider) notFound()

  const relatedProviders = allProviders.filter(p => p.slug !== slug).slice(0, 3)

  return (
    <PublicPageShell>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-slate-500 mb-5">
          <Link href="/providers" className="hover:text-slate-900">Providers</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span>{provider.trade}</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-slate-900 truncate max-w-xs">{provider.companyName}</span>
        </nav>

        {/* Hero banner */}
        <div className="relative h-64 rounded-2xl overflow-hidden mb-0">
          <Image src={provider.heroImage} alt={provider.companyName} fill className="object-cover" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        {/* Logo / avatar overlapping */}
        <div className="flex items-end gap-4 -mt-8 px-4 mb-4">
          <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-md shrink-0 bg-white">
            <Image src={provider.logo} alt={provider.companyName} fill className="object-cover" sizes="80px" />
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{provider.companyName}</h1>
              {provider.proBadge && <span className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded font-semibold">Pro</span>}
              {provider.vetted && (
                <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-semibold border border-emerald-100">
                  <CheckCircle className="h-3 w-3" />Vetted
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-0.5">{provider.trade} · {provider.location}</p>
          </div>
        </div>

        {/* Rating + quick info */}
        <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
            <span className="font-bold text-slate-900">{provider.rating}</span>
            <span className="text-slate-500">({provider.reviewCount} reviews)</span>
          </div>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600 flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{provider.location}</span>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {[
            { label: 'Jobs done', value: provider.jobsDone.toLocaleString() + '+' },
            { label: 'Rating', value: provider.rating + '★' },
            { label: 'Avg response', value: provider.responseTime },
            { label: 'Years active', value: provider.yearsActive + ' yrs' },
            { label: 'Team size', value: provider.teamSize + ' staff' },
            { label: 'Coverage', value: provider.coverageRadius + ' mi radius' },
          ].map(stat => (
            <div key={stat.label} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
              <p className="text-base font-bold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-sm">
            Request a quote
          </button>
          <button className="flex items-center gap-2 px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-colors text-sm">
            Contact provider
          </button>
          <button className="flex items-center gap-2 px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-colors text-sm">
            Save provider
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            {provider.description && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-3">About</h2>
                <p className="text-slate-600 leading-relaxed">{provider.description}</p>
              </div>
            )}

            {/* Services */}
            {provider.services && provider.services.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Services offered</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {provider.services.map(service => (
                    <span key={service} className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-100">
                      <Briefcase className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {provider.certifications.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Certifications & accreditations</h2>
                <div className="flex flex-wrap gap-2">
                  {provider.certifications.map(cert => (
                    <span key={cert} className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 shadow-sm">
                      <Shield className="h-4 w-4 text-blue-500 shrink-0" />
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Team members */}
            {provider.teamMembers && provider.teamMembers.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">The team</h2>
                <div className="flex flex-wrap gap-4">
                  {provider.teamMembers.map(member => (
                    <div key={member.name} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0">
                        <Image src={member.avatar} alt={member.name} fill className="object-cover" sizes="40px" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{member.name}</p>
                        <p className="text-xs text-slate-500">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Coverage areas */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">Coverage areas</h2>
              <p className="text-sm text-slate-500 mb-3">Within {provider.coverageRadius} miles</p>
              <div className="flex flex-wrap gap-2">
                {provider.coverageCities.map(city => (
                  <span key={city} className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-100">
                    <MapPin className="h-3 w-3" />
                    {city}
                  </span>
                ))}
              </div>
            </div>

            {/* FAQs */}
            {provider.faqs && provider.faqs.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Frequently asked questions</h2>
                <div className="space-y-3">
                  {provider.faqs.map(faq => (
                    <details key={faq.q} className="group border border-slate-200 rounded-xl overflow-hidden">
                      <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none hover:bg-slate-50 transition-colors">
                        <span className="font-medium text-slate-900 text-sm">{faq.q}</span>
                        <span className="text-slate-400 text-lg font-light ml-4 shrink-0 group-open:rotate-45 transition-transform">+</span>
                      </summary>
                      <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed">
                        {faq.a}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )}

            {/* Recent work */}
            {provider.recentWork && provider.recentWork.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Recent work</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {provider.recentWork.map((imgUrl, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                      <Image src={imgUrl} alt={`Recent work ${i + 1}`} fill className="object-cover hover:scale-105 transition-transform duration-300" sizes="25vw" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related providers */}
            {relatedProviders.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Other providers you might like</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {relatedProviders.map(p => (
                    <ProviderCard key={p.id} provider={p} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right col — sticky contact panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sticky top-20">
              <h3 className="text-base font-bold text-slate-900 mb-1">{provider.companyName}</h3>
              <div className="flex items-center gap-1.5 mb-4">
                <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                <span className="font-semibold text-slate-900">{provider.rating}</span>
                <span className="text-sm text-slate-500">({provider.reviewCount} reviews)</span>
              </div>

              <div className="space-y-2.5 text-sm mb-5">
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock className="h-4 w-4 text-emerald-500 shrink-0" />
                  Responds in {provider.responseTime}
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Users className="h-4 w-4 text-blue-500 shrink-0" />
                  {provider.teamSize} member team
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Shield className="h-4 w-4 text-violet-500 shrink-0" />
                  Insured up to {provider.insuranceAmount}
                </div>
              </div>

              <button className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors mb-2 text-sm">
                Request a quote
              </button>
              <button className="w-full py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-colors text-sm">
                Send a message
              </button>

              {provider.emergency24h && (
                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 text-center font-medium">
                  Available 24/7 for emergencies
                </div>
              )}

              <p className="text-center text-xs text-slate-400 mt-4">
                From <span className="font-semibold text-slate-600">£{(provider.fromPrice / 100).toFixed(0)}</span>/visit
              </p>
            </div>
          </div>
        </div>
      </div>
    </PublicPageShell>
  )
}
