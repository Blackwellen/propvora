import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Shield, CheckCircle, Lock, Wrench } from "lucide-react"
import PublicPageShell from "@/components/public-marketplace/PublicPageShell"
import { getGlobalFlag } from "@/lib/flags/public"
import { getPublicProviders, getPublicServiceOffers, getPublicEmergencyServices } from "@/lib/public-marketplace/queries"
import ServicesHeroSearch from "./ServicesHeroSearch"
import ServicesFilterClient from "./ServicesFilterClient"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Services & Trades | Propvora",
  description:
    "Book vetted cleaning, gas, electrical, compliance and property maintenance services. Find suppliers, emergency call-outs and professional service packages.",
  robots: { index: true, follow: true },
}

const TRUST_ITEMS = [
  { icon: Shield, title: "Vetted suppliers", desc: "Every provider is insurance-verified before listing." },
  { icon: CheckCircle, title: "Compliant & insured", desc: "Fully insured, Gas Safe and NICEIC certified trades." },
  { icon: Lock, title: "Secure bookings", desc: "Escrow-protected payments with full dispute resolution." },
  { icon: Wrench, title: "Emergency cover", desc: "24/7 emergency call-out for urgent property issues." },
]

export default async function ServicesPage() {
  if (!(await getGlobalFlag("marketplaceEnabled"))) redirect("/")

  const [providers, offers, emergency] = await Promise.all([
    getPublicProviders(),
    getPublicServiceOffers(),
    getPublicEmergencyServices(),
  ])

  return (
    <PublicPageShell hideFooter>
      {/* TOP SECTION */}
      <section className="bg-white border-b border-slate-100 pb-8 pt-6">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-1">
              <h1 className="text-3xl font-bold text-slate-900 leading-tight">
                Find trusted services &amp; trades
              </h1>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                Vetted suppliers, emergency call-outs and professional service packages. All in one place.
              </p>
            </div>
            <div className="lg:col-span-2">
              <ServicesHeroSearch />
            </div>
          </div>
        </div>
      </section>

      {/* TABBED RESULTS */}
      <ServicesFilterClient providers={providers} allOffers={offers} emergency={emergency} />

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
