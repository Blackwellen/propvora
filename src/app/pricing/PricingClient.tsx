"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import PublicNav from "@/components/marketing/PublicNav"
import PublicFooter from "@/components/marketing/PublicFooter"
import PricingHero from "@/components/marketing/pricing/PricingHero"
import PlanCards from "@/components/marketing/pricing/PlanCards"
import FeatureComparisonTable from "@/components/marketing/pricing/FeatureComparisonTable"
import PricingFAQ from "@/components/marketing/pricing/PricingFAQ"
import type { BillingCycle } from "@/components/marketing/pricing/PricingToggle"
import { gbp, type AddonDef } from "@/lib/billing/plans"
import { useT } from "@/components/i18n/LocaleProvider"

// Operator add-ons are resolved server-side (release-stage + feature-flag aware)
// and passed in, so roadmap add-ons stay hidden until their flag ships. Prices
// all come from the canonical catalog in src/lib/billing — none invented here.
export default function PricingClient({ addons }: { addons: AddonDef[] }) {
  const operatorAddons = addons
  const [billing, setBilling] = useState<BillingCycle>("monthly")
  const tFn = useT()
  const tr = (k: string) => tFn(`marketing.${k}`)

  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      <main id="main-content" tabIndex={-1} className="focus:outline-none">
        <PricingHero billing={billing} onChange={setBilling} />
        <PlanCards billing={billing} />
        <FeatureComparisonTable />

        {/* Add-ons */}
        <section className="py-20 bg-slate-50 border-y border-slate-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
                {tr("pricingAddonsTitle")}
              </h2>
              <p className="text-slate-600">
                {tr("pricingAddonsSubtitle")}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {operatorAddons.map((addon) => (
                <div
                  key={addon.key}
                  className="bg-white rounded-xl p-5 border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-slate-900 text-sm">{addon.name}</h3>
                    <span className="text-blue-600 font-bold text-sm ml-2 flex-shrink-0">
                      {gbp(addon.amount)}
                      {addon.interval ? "/mo" : ""}
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs leading-relaxed">{addon.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {addon.eligibility && <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">{addon.eligibility}</span>}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-slate-500 text-xs mt-6">
              Suppliers join Propvora free. Supplier add-ons (Pro Profile, Team, Emergency
              Availability and more) are managed inside the supplier workspace.
            </p>
          </div>
        </section>

        <PricingFAQ />

        {/* Enterprise CTA */}
        <section className="py-20 bg-slate-50 border-t border-slate-200">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-slate-200 text-slate-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
              Enterprise
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              {tr("pricingEnterpriseTitle")}
            </h2>
            <p className="text-slate-600 mb-8">
              {tr("pricingEnterpriseSubtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-base transition-colors"
              >
                {tr("pricingContactSales")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold rounded-xl text-base transition-colors"
              >
                {tr("pricingStartTrialInstead")}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
