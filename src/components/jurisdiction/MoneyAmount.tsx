"use client"

/**
 * MoneyAmount — a money value in its OWN currency, with an optional
 * reporting-currency equivalent shown alongside.
 *
 * In a mixed portfolio a property's rent is shown in the property's currency
 * (record-true), and — where a reporting currency + FX rates are supplied — the
 * converted figure is shown quietly next to it (never instead of it).
 */

import { formatMoneyMajor } from "@/lib/i18n"
import { fxConvert, type FxRateMap } from "@/lib/i18n/fx"

export function MoneyAmount({
  /** Major-unit amount (e.g. 1250.00). */
  amount,
  /** The amount's own currency (the property's). */
  currency,
  locale,
  /** Optional reporting currency to show the equivalent in. */
  reportingCurrency,
  /** FX rate map (from useFxRates). Required for the reporting equivalent. */
  rates,
  className = "",
}: {
  amount: number | null | undefined
  currency: string
  locale?: string
  reportingCurrency?: string | null
  rates?: FxRateMap
  className?: string
}) {
  if (amount == null) return <span className={className}>—</span>

  const primary = formatMoneyMajor(amount, currency, locale)

  let secondary: string | null = null
  if (
    reportingCurrency &&
    rates &&
    currency.toUpperCase() !== reportingCurrency.toUpperCase()
  ) {
    const converted = fxConvert(amount, currency, reportingCurrency, rates)
    if (converted != null) secondary = formatMoneyMajor(converted, reportingCurrency, locale)
  }

  return (
    <span className={className}>
      <span className="font-medium text-slate-900">{primary}</span>
      {secondary && <span className="ml-1 text-slate-400">≈ {secondary}</span>}
    </span>
  )
}

export default MoneyAmount
