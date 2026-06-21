"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const faqs = [
  {
    q: "Can I change plans at any time?",
    a: "Yes. You can upgrade or downgrade your plan at any point from your account settings. Upgrades take effect immediately, and you'll be charged a prorated amount for the remainder of the billing period. Downgrades take effect at the next renewal date.",
  },
  {
    q: "What's the difference between monthly and annual billing?",
    a: "Annual billing is charged once per year and works out roughly two months cheaper than paying monthly. Monthly billing is charged every month and can be cancelled at any time. You can switch between them from your account settings.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit and debit cards (Visa, Mastercard, Amex) via Stripe. All payments are processed securely and your card details are never stored on our servers.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes. Every plan comes with a 7-day free trial, and no credit card is required to start. You'll have full access to all features on your chosen plan during the trial period.",
  },
  {
    q: "Do you charge per property or per user?",
    a: "No per-property charges. Each plan includes a generous property and team-seat allowance shown in the comparison table above. If you need more, you can add extra properties or seats as add-ons rather than moving to a different pricing model.",
  },
  {
    q: "What happens when I cancel?",
    a: "You can cancel your subscription at any time from your account settings. You'll retain full access to your workspace until the end of your current billing period. After that, your workspace moves to read-only mode for 30 days, giving you time to export your data.",
  },
  {
    q: "Do you offer refunds?",
    a: "Yes. If you're not satisfied within the first 7 days of a paid subscription, contact us and we'll issue a full refund. After 7 days, we don't offer refunds for the current billing period, but you can cancel to prevent future charges. Annual plans may be refunded on a pro-rata basis as set out in our Terms.",
  },
  {
    q: "Is my property data secure?",
    a: "Absolutely. All data is encrypted in transit and at rest. We use Supabase with row-level security, and each workspace is fully isolated from others. We are GDPR compliant and registered with the ICO.",
  },
  {
    q: "Do suppliers pay to join?",
    a: "No. Suppliers join Propvora free. Optional supplier add-ons — such as a Pro Profile, team tools or emergency availability — are managed inside the supplier workspace.",
  },
  {
    q: "Can I export my data?",
    a: "Yes. You can export your portfolio data, contacts, financial records and more from your workspace at any time.",
  },
]

export default function PricingFAQ() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="py-20 bg-slate-50 border-t border-slate-200">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
            Frequently asked questions
          </h2>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = open === i
            return (
              <div
                key={faq.q}
                className="border border-slate-200 rounded-xl bg-white overflow-hidden"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex items-center justify-between w-full text-left p-5 gap-4"
                  aria-expanded={isOpen}
                >
                  <span className="font-semibold text-slate-900 text-[15px]">{faq.q}</span>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 text-slate-400 flex-shrink-0 transition-transform",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 -mt-1">
                    <p className="text-slate-600 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
