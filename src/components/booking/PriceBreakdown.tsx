"use client"

import { Loader2 } from "lucide-react"
import type { QuoteBreakdown } from "./types"
import { formatMoney } from "./format"

interface PriceBreakdownProps {
  quote: QuoteBreakdown | null
  loading?: boolean
  /** When no dates are chosen yet. */
  placeholder?: string
}

/**
 * Transparent fee breakdown for the checkout. Renders each line item and an
 * emphasised total. Shows the per-night detail so the guest can verify the
 * maths — the displayed total is the server-recomputed value, never trusted
 * from any client input.
 */
export default function PriceBreakdown({
  quote,
  loading,
  placeholder = "Select dates to see the total price.",
}: PriceBreakdownProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3 text-[13px] text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin text-[var(--brand-strong)]" />
        Updating price…
      </div>
    )
  }

  if (!quote) {
    return <p className="text-[13px] text-slate-500 py-2">{placeholder}</p>
  }

  if (!quote.ready || quote.lineItems.length === 0) {
    return (
      <p className="text-[13px] text-slate-500 py-2">
        Pricing for these dates is being confirmed by the property manager.
      </p>
    )
  }

  return (
    <div>
      <ul className="space-y-2.5">
        {quote.lineItems.map((li, i) => (
          <li key={i} className="flex items-start justify-between gap-4 text-[13.5px]">
            <span className="text-slate-600">
              {li.label}
              {li.detail && (
                <span className="block text-[12px] text-slate-400 mt-0.5">
                  {li.detail}
                </span>
              )}
            </span>
            <span className="font-medium text-[#0B1B3F] tabular-nums whitespace-nowrap">
              {formatMoney(li.amountPence, quote.currency)}
            </span>
          </li>
        ))}
      </ul>

      <div className="border-t border-[#E2EAF6] mt-3.5 pt-3.5 flex items-center justify-between">
        <span className="text-[14px] font-bold text-[#0B1B3F]">Total</span>
        <span className="text-[16px] font-bold text-[#0B1B3F] tabular-nums">
          {formatMoney(quote.totalPence, quote.currency)}
        </span>
      </div>
      <p className="text-[11.5px] text-slate-400 mt-2 leading-relaxed">
        You won&apos;t be charged yet. We&apos;ll hold these dates and the property
        manager will confirm your booking.
      </p>
    </div>
  )
}
