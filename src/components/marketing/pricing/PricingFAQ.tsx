"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useT } from "@/components/i18n/LocaleProvider"
import { pricingFaqs as faqs } from "./faq-data"

export default function PricingFAQ() {
  const tFn = useT()
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="py-20 bg-slate-50 border-t border-slate-200">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
            {tFn("marketing.pricingFAQTitle")}
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
