import type { Metadata } from 'next'
import { Shield, CheckCircle, Lock, HeadphonesIcon } from 'lucide-react'
import PublicPageShell from '@/components/public-marketplace/PublicPageShell'
import { getPublicStays } from '@/lib/public-marketplace/queries'
import StaysFilterClient from './StaysFilterClient'
import StaysHeroSearch from './StaysHeroSearch'

export const metadata: Metadata = {
  title: 'Stays | Propvora — Book verified short-lets & serviced accommodation',
  description: 'Browse and book verified short-let properties, serviced apartments and holiday lets powered by Propvora.',
  openGraph: {
    title: 'Stays | Propvora',
    description: 'Browse and book verified short-let properties and serviced accommodation.',
    type: 'website',
  },
}

const TRUST_ITEMS = [
  { icon: Shield, title: 'Verified stays', desc: 'Every listing is operator-verified before going live.' },
  { icon: CheckCircle, title: 'Licensed & compliant', desc: 'All providers meet UK licensing requirements.' },
  { icon: Lock, title: 'Secure payments', desc: 'Escrow-protected, with full dispute resolution.' },
  { icon: HeadphonesIcon, title: 'Always-on guest support', desc: 'Our team is always reachable — email us any time.' },
]

import { redirect as _gateRedirect } from "next/navigation"
import { getGlobalFlag as _gateFlag } from "@/lib/flags/public"

export default async function StaysPage() {
  if (!(await _gateFlag("marketplaceEnabled"))) _gateRedirect("/")
  const stays = await getPublicStays()

  return (
    <PublicPageShell hideFooter>
      {/* TOP SECTION — two-column */}
      <section className="bg-white border-b border-slate-100 pb-8 pt-6">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            {/* LEFT: heading */}
            <div className="lg:col-span-1">
              <h1 className="text-3xl font-bold text-slate-900 leading-tight">
                Find trusted stays and lettings
              </h1>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                Quality homes. Verified hosts. Secure bookings. Across the UK, for every stay.
              </p>
            </div>

            {/* RIGHT: 4-segment search bar — wired */}
            <div className="lg:col-span-2">
              <StaysHeroSearch />
            </div>
          </div>
        </div>
      </section>

      <StaysFilterClient stays={stays} />

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
