"use client"

/**
 * ============================================================================
 * Propvora i18n — CLIENT PROVIDER + HOOKS
 * ============================================================================
 *
 * Carries the active locale to Client Components and exposes:
 *   - `useLocale()`  → the active `Locale` (default en-GB)
 *   - `useT()`       → a bound translator: `t("actions.save")`
 *   - `useFormat()`  → locale-bound money/date/number formatters
 *
 * The host (typically a Server Component layout) resolves the locale once via
 * `getServerLocale(...)` and passes it in, so SSR and client agree with no
 * flash. Outside a provider the hooks degrade to en-GB rather than throwing —
 * preserving the GB-default invariant even if a tree forgets the provider.
 * ============================================================================
 */

import { createContext, useContext, useMemo, type ReactNode } from "react"

import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config"
import { createTranslator, type Translator, type TParams } from "@/lib/i18n/messages"
import {
  formatMoney,
  formatMoneyMajor,
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercent,
  formatRelativeTime,
} from "@/lib/i18n/format"

interface LocaleContextValue {
  locale: Locale
  t: Translator
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export interface LocaleProviderProps {
  /** Active locale, resolved server-side. Defaults to en-GB. */
  locale?: Locale
  children: ReactNode
}

export function LocaleProvider({
  locale = DEFAULT_LOCALE,
  children,
}: LocaleProviderProps) {
  const value = useMemo<LocaleContextValue>(
    () => ({ locale, t: createTranslator(locale) }),
    [locale]
  )
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

/** The active locale. Falls back to en-GB outside a provider. */
export function useLocale(): Locale {
  return useContext(LocaleContext)?.locale ?? DEFAULT_LOCALE
}

/** A translator bound to the active locale. Falls back to en-GB outside a provider. */
export function useT(): Translator {
  const ctx = useContext(LocaleContext)
  return ctx?.t ?? ((key: string, params?: TParams) => createTranslator(DEFAULT_LOCALE)(key, params))
}

/** Locale-bound formatter set — no need to thread `locale` through every call. */
export function useFormat() {
  const locale = useLocale()
  return useMemo(
    () => ({
      money: (minorUnits: number | null | undefined, currency = "GBP") =>
        formatMoney(minorUnits, currency, locale),
      moneyMajor: (amount: number | null | undefined, currency = "GBP") =>
        formatMoneyMajor(amount, currency, locale),
      date: (value: Date | string | number | null | undefined, opts?: Intl.DateTimeFormatOptions) =>
        formatDate(value, opts, locale),
      dateTime: (value: Date | string | number | null | undefined, opts?: Intl.DateTimeFormatOptions) =>
        formatDateTime(value, opts, locale),
      number: (value: number | null | undefined, opts?: Intl.NumberFormatOptions) =>
        formatNumber(value, opts, locale),
      percent: (
        ratio: number | null | undefined,
        opts?: Intl.NumberFormatOptions & { alreadyPercent?: boolean }
      ) => formatPercent(ratio, opts, locale),
      relativeTime: (value: Date | string | number | null | undefined) =>
        formatRelativeTime(value, locale),
    }),
    [locale]
  )
}
