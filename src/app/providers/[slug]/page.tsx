import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle, Star, MapPin, ChevronRight, Clock, Shield, Briefcase, Users, Heart, MessageCircle } from 'lucide-react'
import PublicPageShell from '@/components/public-marketplace/PublicPageShell'
import LocationMap from '@/components/maps/LocationMap'
import { getPublicProviderBySlug, getSimilarProviders } from '@/lib/public-marketplace/queries'
import { formatPence } from '@/lib/marketplace/money'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const provider = await getPublicProviderBySlug(slug)
  if (!provider) return {}
  return {
    title: `${provider.companyName} | Propvora Providers`,
    description: provider.description ?? `${provider.companyName} — ${provider.trade} in ${provider.city}`,
  }
}

const TABS = ['Overview', 'Services', 'Reviews', 'Portfolio', 'Certifications', 'Team', 'Coverage', 'FAQs']

export default async function ProviderDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [provider, relatedProviders] = await Promise.all([
    getPublicProviderBySlug(slug),
    getSimilarProviders(slug, 3),
  ])
  if (!provider) notFound()

  return (
    <PublicPageShell marketplaceNav hideFooter>
      {/* HERO BANNER */}
      <div className="relative h-[188px] overflow-visible border-b border-slate-200">
        <Image src={provider.heroImage} alt={provider.companyName} fill className="object-cover" sizes="100vw" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/50 to-slate-950/25" />

        {/* Breadcrumb */}
        <nav className="absolute left-[max(40px,calc((100vw-1400px)/2+40px))] top-4 flex items-center gap-1.5 text-[12px] font-[600] text-white/80">
          <Link href="/providers" className="hover:text-white">Providers</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span>{provider.trade}</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-white truncate max-w-xs">{provider.companyName}</span>
        </nav>

        {/* Logo card */}
        <div className="absolute bottom-[-22px] left-[max(40px,calc((100vw-1400px)/2+40px))]">
          <div className="relative h-[156px] w-[156px] overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.20)]">
            <Image src={provider.logo} alt={provider.companyName} fill className="object-cover" sizes="128px" />
            {provider.vetted && (
              <div className="absolute bottom-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-tl-lg">Top Rated</div>
            )}
          </div>
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-7 left-[max(220px,calc((100vw-1400px)/2+220px))] right-[380px]">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-[34px] font-[800] leading-tight text-white">{provider.companyName}</h1>
            {provider.proBadge && <span className="bg-blue-600 text-white text-xs px-2.5 py-1 rounded font-semibold">Pro</span>}
          </div>
          <p className="text-white/80 text-sm mb-2">{provider.trade}</p>
          <div className="flex items-center gap-3">
            {provider.vetted && (
              <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                <CheckCircle className="h-3.5 w-3.5" />Verified
              </span>
            )}
            {provider.vetted && (
              <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                <CheckCircle className="h-3.5 w-3.5" />Vetted
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(i => <Star key={i} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />)}
            </div>
            <span className="text-white font-bold text-sm">{provider.rating}</span>
            <span className="text-white/70 text-xs">({provider.reviewCount} reviews)</span>
            <span className="text-white/70 text-xs flex items-center gap-1 ml-2">
              <MapPin className="h-3 w-3" />{provider.location}
            </span>
          </div>
        </div>

        {/* Floating CTA card */}
        <div className="absolute right-[max(40px,calc((100vw-1400px)/2+40px))] top-8 w-[252px] rounded-[14px] bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.18)]">
          <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm mb-2 transition-colors">
            Request quote →
          </button>
          <button className="w-full flex items-center justify-center gap-2 py-2.5 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors mb-2">
            <MessageCircle className="h-4 w-4" />Contact provider
          </button>
          <button className="w-full flex items-center justify-center gap-2 py-2.5 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors mb-2">
            <Briefcase className="h-4 w-4" />View services
          </button>
          <button className="w-full flex items-center justify-center gap-2 py-2.5 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors">
            <Heart className="h-4 w-4" />Save provider
          </button>
        </div>
      </div>

      {/* TRUST ROW */}
      <div className="bg-white py-3">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="ml-[176px] grid grid-cols-3 gap-4 md:grid-cols-5">
            {[
              { icon: Clock, label: 'Fast response', sub: provider.responseTime },
              { icon: Shield, label: 'Fully insured', sub: provider.insuranceAmount ?? '£5M' },
              { icon: CheckCircle, label: 'Gas Safe', sub: provider.gasSafe ? 'No. 556789' : 'Registered' },
              { icon: Clock, label: '24/7 emergency', sub: provider.emergency24h ? 'Available' : 'On request' },
              { icon: CheckCircle, label: 'DBS checked', sub: 'Verified' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-blue-600 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-700 text-sm">{label}</p>
                  <p className="text-slate-400 text-xs">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* STATS STRIP */}
      <div className="bg-white py-5">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-3 gap-0 overflow-hidden rounded-[12px] border border-slate-200 bg-white text-center md:grid-cols-6">
            {[
              { value: provider.jobsDone.toLocaleString() + '+', label: 'Jobs' },
              { value: '98%', label: 'Repeat' },
              { value: provider.responseTime, label: 'Response' },
              { value: provider.yearsActive + '+', label: 'Years' },
              { value: provider.coverageRadius + ' mi', label: 'Coverage' },
              { value: provider.emergency24h ? '24/7' : 'On request', label: 'Emergency' },
            ].map(({ value, label }) => (
              <div key={label} className="border-r border-slate-200 px-4 py-4 last:border-r-0">
                <p className="text-[23px] font-[800] leading-none text-slate-950">{value}</p>
                <p className="mt-1 text-[12px] font-[500] text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="sticky top-16 z-30 border-b border-slate-200 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="flex gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            {TABS.map((tab, i) => (
              <div
                key={tab}
                className={`shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  i === 0 ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}{tab === 'Reviews' ? ` ${provider.reviewCount}` : ''}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-6 py-4 lg:px-10">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_540px]">
          {/* LEFT + MIDDLE (2/3) */}
          <div className="space-y-4">
            {/* About */}
            {provider.description && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-3">About</h2>
                <p className="text-slate-600 leading-relaxed">{provider.description}</p>
              </div>
            )}

            {/* Why customers choose us */}
            {provider.certifications && provider.certifications.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Why customers choose us</h2>
                <div className="grid grid-cols-2 gap-3">
                  {['Transparent pricing', 'Qualified engineers', 'DBS checked', 'Rapid response', 'Satisfaction guarantee', 'Genuine reviews'].map(h => (
                    <div key={h} className="flex items-center gap-2.5 text-sm text-slate-700">
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                      {h}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Services */}
            {provider.services && provider.services.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Services offered</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {provider.services.map(service => (
                    <span key={service} className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-100">
                      <Briefcase className="h-3.5 w-3.5 text-blue-500 shrink-0" />{service}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {provider.certifications.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Certifications & compliance</h2>
                <div className="flex flex-wrap gap-2">
                  {provider.certifications.map(cert => (
                    <span key={cert} className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 shadow-sm">
                      <Shield className="h-4 w-4 text-blue-500 shrink-0" />{cert}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Team */}
            {provider.teamMembers && provider.teamMembers.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Our team</h2>
                <div className="flex flex-wrap gap-3">
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

            {/* FAQs */}
            {provider.faqs && provider.faqs.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">FAQs</h2>
                <div className="space-y-3">
                  {provider.faqs.map(faq => (
                    <details key={faq.q} className="group border border-slate-200 rounded-xl overflow-hidden">
                      <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none hover:bg-slate-50 transition-colors">
                        <span className="font-medium text-slate-900 text-sm">{faq.q}</span>
                        <span className="text-slate-400 text-lg font-light ml-4 shrink-0 group-open:rotate-45 transition-transform">+</span>
                      </summary>
                      <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed">{faq.a}</div>
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
                <h2 className="text-xl font-bold text-slate-900 mb-4">You might also like</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {relatedProviders.map(p => (
                    <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-3">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
                          <Image src={p.logo} alt={p.companyName} fill className="object-cover" sizes="40px" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate">{p.companyName}</p>
                          <p className="text-[10px] text-slate-500">{p.trade}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                          <span className="text-xs font-semibold">{p.rating}</span>
                        </div>
                        <Link href={`/providers/${p.slug}`} className="text-xs font-semibold text-blue-600">View →</Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT (1/3) */}
          <div className="space-y-4">
            {/* Coverage map */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <LocationMap
                markers={[{ id: provider.slug, lat: provider.lat, lng: provider.lng, label: provider.companyName, sublabel: provider.trade }]}
                height={192}
                zoom={11}
                title={provider.location}
                caption={`Within ${provider.coverageRadius} miles`}
              />
              <div className="h-px" />
              <div className="p-4">
                <p className="text-sm font-semibold text-slate-900 mb-2">Coverage areas</p>
                <div className="flex flex-wrap gap-1.5">
                  {provider.coverageCities.map(city => (
                    <span key={city} className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100">
                      <MapPin className="h-2.5 w-2.5" />{city}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Review card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                <span className="text-2xl font-bold text-slate-900">{provider.rating}</span>
                <span className="text-sm text-slate-500">({provider.reviewCount} reviews)</span>
              </div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Top rated by homeowners</p>
              <div className="space-y-2">
                {['Reliability', 'Quality', 'Communication', 'Value'].map(cat => (
                  <div key={cat} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">{cat}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${cat === 'Value' ? 91 : cat === 'Communication' ? 95 : cat === 'Quality' ? 97 : 96}%` }} />
                      </div>
                      <span className="font-semibold text-slate-900 w-6">{cat === 'Value' ? '4.7' : '4.9'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sticky contact panel */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sticky top-20">
              <h3 className="text-base font-bold text-slate-900 mb-1">{provider.companyName}</h3>
              <div className="flex items-center gap-1.5 mb-4">
                <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                <span className="font-semibold text-slate-900">{provider.rating}</span>
                <span className="text-sm text-slate-500">({provider.reviewCount})</span>
              </div>

              <div className="space-y-2.5 text-sm mb-5">
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock className="h-4 w-4 text-emerald-500 shrink-0" />Responds in {provider.responseTime}
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Users className="h-4 w-4 text-blue-500 shrink-0" />{provider.teamSize} member team
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Shield className="h-4 w-4 text-blue-500 shrink-0" />Insured up to {provider.insuranceAmount}
                </div>
              </div>

              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Services from</p>
              <p className="text-2xl font-bold text-slate-900 mb-4">
                {formatPence(provider.fromPrice)}<span className="text-sm font-normal text-slate-500"> / visit</span>
              </p>

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
            </div>
          </div>
        </div>
      </div>
    </PublicPageShell>
  )
}
