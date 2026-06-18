import type { Metadata } from 'next'
import { Search, MapPin, Calendar, CheckCircle, Lock, HeadphonesIcon, Star } from 'lucide-react'
import PublicPageShell from '@/components/public-marketplace/PublicPageShell'
import { getPublicServiceOffers, getFeaturedServiceOffers } from '@/lib/public-marketplace/queries'
import ServicesFilterClient from './ServicesFilterClient'

export const metadata: Metadata = {
  title: 'Services | Propvora — Find trusted property services',
  description: 'Find and book verified property services across 60+ trade categories — plumbers, electricians, gas engineers, cleaners and more.',
  openGraph: {
    title: 'Services | Propvora',
    description: 'Find verified property services across 60+ trade categories.',
    type: 'website',
  },
}

const TRUST_ITEMS = [
  { icon: CheckCircle, title: 'Vetted & trusted', desc: 'Every service provider is background-checked and vetted.' },
  { icon: Lock, title: 'Secure payments', desc: 'Escrow-protected, with full dispute resolution.' },
  { icon: Star, title: 'Satisfaction guarantee', desc: '100% satisfaction or we make it right.' },
  { icon: HeadphonesIcon, title: 'Managed bookings', desc: 'Our team handles disputes and complaints 24/7.' },
]

import { redirect as _gateRedirect } from "next/navigation"
import { getGlobalFlag as _gateFlag } from "@/lib/flags/public"

export default async function ServicesPage() {
  if (!(await _gateFlag("marketplaceEnabled"))) _gateRedirect("/")
  const [allOffers, featuredOffers] = await Promise.all([
    getPublicServiceOffers(),
    getFeaturedServiceOffers(),
  ])

  return (
    <PublicPageShell hideFooter>
      {/* TOP SECTION — two-column */}
      <section className="bg-white pb-6 pt-6 border-b border-slate-100">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            {/* LEFT */}
            <div className="lg:col-span-1">
              <h1 className="text-3xl font-bold text-slate-900 leading-tight">
                Find trusted services for your home or property
              </h1>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                Vetted professionals. Transparent pricing. Quality work, every time.
              </p>
            </div>

            {/* RIGHT: 3-segment search */}
            <div className="lg:col-span-2">
              <div className="flex items-stretch bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3.5 flex-1 border-r border-slate-200 min-w-0">
                  <Search className="h-4 w-4 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">What do you need?</div>
                    <input
                      type="text"
                      placeholder="e.g. Plumbing, Cleaning, Electrical"
                      className="w-full text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent mt-0.5"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-3.5 border-r border-slate-200 min-w-0">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Location</div>
                    <input
                      type="text"
                      placeholder="City, area or postcode"
                      className="w-32 text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent mt-0.5"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-3.5 border-r border-slate-200 min-w-0">
                  <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">When</div>
                    <input
                      type="text"
                      placeholder="Anytime"
                      className="w-24 text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent mt-0.5"
                    />
                  </div>
                </div>
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 transition-colors shrink-0 font-semibold text-sm">
                  <Search className="h-4 w-4" />
                  Search services
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ServicesFilterClient allOffers={allOffers} featuredOffers={featuredOffers} />

      {/* TRUST STRIP */}
      <section className="bg-slate-50 border-t border-slate-100 py-10">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {TRUST_ITEMS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-start gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Icon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicPageShell>
  )
}
