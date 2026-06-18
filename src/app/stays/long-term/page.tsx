import type { Metadata } from 'next'
import PublicPageShell from '@/components/public-marketplace/PublicPageShell'
import StayTypeTabs from '@/components/marketplace/stays/StayTypeTabs'
import LongTermRentalInfoPanel from '@/components/marketplace/stays/LongTermRentalInfoPanel'
import LongTermRentalsFilterClient from './LongTermRentalsFilterClient'
import { getPublicLongTermRentals } from '@/lib/public-marketplace/queries'
import { Home, Building2, Wallet, Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Long-term Rentals | Propvora — Verified 6+ month lettings across the UK',
  description:
    'Find verified long-term rentals — houses, flats, studios and rooms across the UK. Transparent costs, trusted landlords, flexible move-in.',
  openGraph: {
    title: 'Long-term Rentals | Propvora',
    description: 'Verified 6+ month lettings — houses, flats and studios across the UK.',
    type: 'website',
  },
}

const TRUST_POINTS = [
  { icon: Home, label: 'Verified homes', desc: 'Every listing is checked before going live.' },
  { icon: Building2, label: 'Licensed landlords', desc: 'We verify HMO licences and landlord registration.' },
  { icon: Wallet, label: 'Protected deposits', desc: 'All deposits held under a government-approved scheme.' },
  { icon: Zap, label: 'Transparent costs', desc: 'No hidden fees. What you see is what you pay.' },
]

export default async function LongTermRentalsPage() {
  const rentals = await getPublicLongTermRentals()

  return (
    <PublicPageShell hideFooter>
      {/* Hero */}
      <section className="pt-12 pb-10 px-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-6xl mx-auto">
          {/* Sub-nav tabs */}
          <div className="mb-8">
            <StayTypeTabs basePath="/stays" />
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-2xl">
              <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight mb-4">
                Find verified long-term rentals
              </h1>
              <p className="text-lg text-slate-500 max-w-xl">
                Flats, houses, studios and rooms — all 6+ month lets from verified landlords.
                Transparent costs, no hidden fees.
              </p>
            </div>
            <div className="text-sm text-slate-500 shrink-0">
              <span className="font-semibold text-slate-900">{rentals.length}</span> properties found
            </div>
          </div>
        </div>
      </section>

      <LongTermRentalsFilterClient rentals={rentals} />

      {/* Trust strip */}
      <section className="py-12 px-4 bg-slate-50 border-t border-slate-100">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-slate-900 mb-8 text-center">
            Why rent through Propvora?
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {TRUST_POINTS.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                  <Icon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1 text-sm">{label}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicPageShell>
  )
}
