import type { Metadata } from 'next'
import { Phone, Zap, Clock, Shield, AlertTriangle } from 'lucide-react'
import PublicPageShell from '@/components/public-marketplace/PublicPageShell'
import EmergencyServiceCard from '@/components/public-marketplace/cards/EmergencyServiceCard'
import MarketplaceTrustStrip from '@/components/public-marketplace/MarketplaceTrustStrip'
import { getPublicEmergencyServices } from '@/lib/public-marketplace/queries'

export const metadata: Metadata = {
  title: 'Emergency Services | Propvora — 24/7 emergency property contractors',
  description:
    'Find emergency property contractors available 24/7. Plumbers, electricians, locksmiths and gas engineers dispatched fast.',
  openGraph: {
    title: 'Emergency Services | Propvora',
    description: '24/7 emergency property contractors — dispatched fast when it matters most.',
    type: 'website',
  },
}

export default async function EmergencyPage() {
  const services = await getPublicEmergencyServices()

  return (
    <PublicPageShell hideFooter>
      {/* Urgent safety banner */}
      <div className="bg-red-600 text-white text-center py-3 px-4 text-sm font-semibold">
        <AlertTriangle className="inline h-4 w-4 mr-1.5 mb-0.5" />
        If you smell gas or are in danger, call 999 or National Gas Emergency{' '}
        <a href="tel:08001119999" className="underline font-bold">0800 111 999</a>{' '}
        immediately
      </div>

      {/* Hero */}
      <section className="pt-8 pb-10 px-4 bg-gradient-to-b from-red-50 to-white">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 text-sm font-semibold rounded-full mb-6">
            <Phone className="h-4 w-4" />
            Emergency dispatch available 24/7
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight mb-4">
            Emergency property services — fast
          </h1>
          <p className="text-lg text-slate-500 mb-8 max-w-xl mx-auto">
            Verified emergency contractors dispatched when you need them most. Available round the clock, 365 days a year.
          </p>
          <button className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors shadow-sm text-lg">
            <Zap className="h-5 w-5" />
            Dispatch emergency now
          </button>
        </div>
      </section>

      {/* Stats row */}
      <section className="py-8 px-4 border-b border-slate-100">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: Clock, label: '20–45 mins', desc: 'Average response time to your door' },
              { icon: Phone, label: '24 / 7 / 365', desc: 'Emergency network active around the clock' },
              { icon: Shield, label: 'Fully verified', desc: 'ID, insurance & licence checked before listing' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="text-center p-5 rounded-2xl border border-slate-200 bg-white">
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Icon className="h-6 w-6 text-red-600" />
                </div>
                <p className="text-2xl font-extrabold text-slate-900 mb-1">{label}</p>
                <p className="text-sm text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency services grid */}
      <section className="py-12 px-6 lg:px-10">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Emergency services available now</h2>
            <span className="text-sm text-red-600 font-medium">{services.length} services</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 items-stretch">
            {services.map(service => (
              <EmergencyServiceCard key={service.id} service={service} />
            ))}
          </div>
          {services.length === 0 && (
            <div className="text-center py-16">
              <p className="text-slate-500">No emergency services found.</p>
            </div>
          )}
        </div>
      </section>

      <MarketplaceTrustStrip />
    </PublicPageShell>
  )
}
