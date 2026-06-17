import type { Metadata } from "next"
import SuppliersHubNav from "@/components/marketplace/SuppliersHubNav"
import EmergencyServiceCard from "@/components/public-marketplace/cards/EmergencyServiceCard"
import { getPublicEmergencyServices } from "@/lib/public-marketplace/queries"
import { AlertTriangle, Clock, Shield, Phone } from "lucide-react"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Emergency Services · Marketplace · Propvora",
  description: "24/7 emergency callout services. Fast response, police vetted, fully insured.",
}

const TRUST_ITEMS = [
  { icon: Clock,         title: "30-90 min response",    desc: "Fast dispatch to your location" },
  { icon: Shield,        title: "Police vetted & insured", desc: "DBS checked, fully covered" },
  { icon: AlertTriangle, title: "24/7/365 availability",  desc: "Never closed, always ready" },
  { icon: Phone,         title: "Upfront pricing",        desc: "Quoted before work starts" },
]

export default async function EmergencyHubPage() {
  let services: Awaited<ReturnType<typeof getPublicEmergencyServices>> = []
  try {
    services = await getPublicEmergencyServices()
  } catch {
    // graceful empty state
  }

  return (
    <div>
      <SuppliersHubNav />

      {/* Hero */}
      <section className="bg-gradient-to-b from-red-50 to-white pt-8 pb-6 px-4 rounded-2xl mb-6 border border-red-100">
        <div className="inline-flex items-center gap-2 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full mb-3">
          🚨 EMERGENCY CALLOUT — We&apos;re on call and ready to go
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Emergency services</h1>
        <p className="text-base text-slate-500 mb-0">
          24/7 emergency response. Police vetted. Fully insured. Fast dispatch.
        </p>
      </section>

      {/* Trust strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 px-0">
        {TRUST_ITEMS.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm"
          >
            <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
              <Icon className="h-4.5 w-4.5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Services grid */}
      {services.length > 0 ? (
        <section className="pb-10">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Available emergency services</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {services.map((service) => (
              <EmergencyServiceCard key={service.id} service={service} basePath="/app/marketplace/suppliers-hub/emergency" />
            ))}
          </div>
        </section>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertTriangle className="h-12 w-12 text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">No emergency services found</p>
          <p className="text-sm text-slate-400 mt-1">Check back shortly or contact support.</p>
        </div>
      )}
    </div>
  )
}
