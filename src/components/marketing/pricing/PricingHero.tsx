"use client"

import { Zap } from "lucide-react"
import PricingToggle, { type BillingCycle } from "./PricingToggle"
import { useT } from "@/components/i18n/LocaleProvider"

interface Props {
  billing: BillingCycle
  onChange: (cycle: BillingCycle) => void
}

export default function PricingHero({ billing, onChange }: Props) {
  const tFn = useT()
  const tr = (k: string) => tFn(`marketing.${k}`)
  return (
    <section className="pt-32 pb-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4 border border-blue-200">
          <Zap className="h-3.5 w-3.5" />
          {tr("pricingBadge")}
        </div>
        <h1 className="text-[34px] sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-4">
          {tr("pricingHeroTitle")}
        </h1>
        {/* Wrapped in a div because globals.css resets margin:0 on <p> outside a
            cascade layer, which kills mx-auto on the paragraph itself. mx-auto on
            a <div> is honoured, so the constrained block centres correctly. */}
        <div className="max-w-xl mx-auto mb-10">
          <p className="text-xl text-slate-600">
            {tr("pricingHeroSubtitle")}
          </p>
        </div>

        <PricingToggle
          billing={billing}
          onChange={onChange}
          labelMonthly={tr("pricingMonthly")}
          labelAnnual={tr("pricingAnnual")}
          labelSave={tr("pricingAnnualSave")}
        />
      </div>
    </section>
  )
}
