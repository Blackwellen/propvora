"use client"

/**
 * FxRollup — a multi-currency total converted into the reporting currency,
 * with the per-currency breakdown shown beneath. For mixed-portfolio KPI/roll-up
 * surfaces (Home, Portfolio, Money, Planning analytics).
 */

import { formatMoneyMajor } from "@/lib/i18n"
import { rollup, type FxRateMap } from "@/lib/i18n/fx"

export function FxRollup({
  items,
  reportingCurrency,
  rates,
  locale,
  /** Show the per-currency breakdown line. */
  showBreakdown = true,
  className = "",
}: {
  items: { amount: number; currency: string }[]
  reportingCurrency: string
  rates: FxRateMap
  locale?: string
  showBreakdown?: boolean
  className?: string
}) {
  const r = rollup(items, reportingCurrency, rates)

  return (
    <span className={`inline-flex flex-col ${className}`}>
      <span className="font-semibold text-slate-900">
        {formatMoneyMajor(r.total, r.reportingCurrency, locale)}
        {r.hasMissingRate && (
          <span className="ml-1 text-[10px] font-medium text-amber-600" title="Some amounts had no FX rate and are excluded.">
            rate missing
          </span>
        )}
      </span>
      {showBreakdown && r.byCurrency.length > 1 && (
        <span className="text-[11px] text-slate-400">
          {r.byCurrency
            .map((c) => formatMoneyMajor(c.amount, c.currency, locale))
            .join(" · ")}
        </span>
      )}
    </span>
  )
}

export default FxRollup
