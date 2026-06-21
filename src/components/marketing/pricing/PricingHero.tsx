import { Zap } from "lucide-react"
import PricingToggle, { type BillingCycle } from "./PricingToggle"

interface Props {
  billing: BillingCycle
  onChange: (cycle: BillingCycle) => void
}

export default function PricingHero({ billing, onChange }: Props) {
  return (
    <section className="pt-32 pb-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4 border border-blue-200">
          <Zap className="h-3.5 w-3.5" />
          7-day free trial · No credit card required
        </div>
        <h1 className="text-[34px] sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-xl text-slate-600 max-w-xl mx-auto mb-10">
          One price. Everything included for your plan. No hidden fees, no per-property charges.
        </p>

        <PricingToggle billing={billing} onChange={onChange} />
      </div>
    </section>
  )
}
