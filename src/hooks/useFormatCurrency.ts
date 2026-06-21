'use client'

/**
 * useFormatCurrency — workspace-aware currency formatter hook.
 *
 * Returns a function that formats a pence/minor-unit integer using the
 * workspace's configured currency and locale. Falls back to GBP / en-GB so
 * UK behaviour is byte-identical when no settings are configured.
 *
 * FIX-291: Created as part of i18n 100/100 gap-fill.
 *
 * Usage:
 *   const fmt = useFormatCurrency()
 *   fmt(123456)          // → "£1,234.56" (GBP default)
 *   fmt(123456, 'EUR')   // → "€1,234.56" (override currency)
 */

import { useWorkspaceJurisdiction } from './useWorkspaceJurisdiction'
import { formatMoney } from '@/lib/i18n/format'

export function useFormatCurrency() {
  const { currency, locale } = useWorkspaceJurisdiction()
  return (minorUnits: number | null | undefined, overrideCurrency?: string) =>
    formatMoney(minorUnits, overrideCurrency ?? currency, locale)
}

/**
 * useFormatMajorCurrency — same as useFormatCurrency but takes a major-unit
 * decimal amount (e.g. marketplace listing prices stored as decimals).
 *
 * Usage:
 *   const fmt = useFormatMajorCurrency()
 *   fmt(1234.56)   // → "£1,234.56"
 */
import { formatMoneyMajor } from '@/lib/i18n/format'

export function useFormatMajorCurrency() {
  const { currency, locale } = useWorkspaceJurisdiction()
  return (amount: number | null | undefined, overrideCurrency?: string) =>
    formatMoneyMajor(amount, overrideCurrency ?? currency, locale)
}
