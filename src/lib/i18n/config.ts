/**
 * ============================================================================
 * Propvora i18n — CONFIG
 * ============================================================================
 *
 * The supported-locale registry and per-locale metadata. This is the single
 * source of truth for "which locales exist" and "what defaults each implies".
 *
 * DESIGN INVARIANT — GB IS THE DEFAULT.
 * `DEFAULT_LOCALE` is `en-GB`. With no locale configured anywhere, every
 * formatter and message lookup resolves to en-GB / GBP / metric / DD/MM/YYYY,
 * which is byte-for-byte identical to the app's behaviour today. Nothing here
 * changes the UK experience.
 *
 * Native `Intl` only — no i18n library dependency. See `format.ts` for why.
 * ============================================================================
 */

/** BCP-47 locale tags Propvora ships formatting/message support for. */
export type Locale =
  | "en-GB"
  | "en-US"
  | "fr-FR"
  | "de-DE"
  | "es-ES"

/** The default locale. GB-first, always. */
export const DEFAULT_LOCALE: Locale = "en-GB"

/** Ordered list of supported locales (en-GB first). */
export const SUPPORTED_LOCALES: readonly Locale[] = [
  "en-GB",
  "en-US",
  "fr-FR",
  "de-DE",
  "es-ES",
] as const

export type MeasurementSystem = "metric" | "imperial"

/** Per-locale display metadata. The `currencyHint` is only a *default* used
 *  when no explicit currency is supplied to a money formatter — the workspace /
 *  property currency always wins when present (money is multi-currency). */
export interface LocaleMeta {
  /** The locale tag itself. */
  locale: Locale
  /** Human-readable label for a locale switcher. */
  label: string
  /** English name (stable, for admin/debug surfaces). */
  englishLabel: string
  /** ISO 4217 currency hint — a default, NOT a forced currency. */
  currencyHint: string
  /** Area / distance convention. */
  measurement: MeasurementSystem
  /** Default `Intl.DateTimeFormat` dateStyle for medium dates. */
  dateStyle: "short" | "medium" | "long"
  /** Text direction. All current locales are LTR; field present for RTL-readiness. */
  dir: "ltr" | "rtl"
}

export const LOCALE_META: Record<Locale, LocaleMeta> = {
  "en-GB": {
    locale: "en-GB",
    label: "English (UK)",
    englishLabel: "English (UK)",
    currencyHint: "GBP",
    measurement: "metric",
    dateStyle: "medium",
    dir: "ltr",
  },
  "en-US": {
    locale: "en-US",
    label: "English (US)",
    englishLabel: "English (US)",
    currencyHint: "USD",
    measurement: "imperial",
    dateStyle: "medium",
    dir: "ltr",
  },
  "fr-FR": {
    locale: "fr-FR",
    label: "Français",
    englishLabel: "French",
    currencyHint: "EUR",
    measurement: "metric",
    dateStyle: "medium",
    dir: "ltr",
  },
  "de-DE": {
    locale: "de-DE",
    label: "Deutsch",
    englishLabel: "German",
    currencyHint: "EUR",
    measurement: "metric",
    dateStyle: "medium",
    dir: "ltr",
  },
  "es-ES": {
    locale: "es-ES",
    label: "Español",
    englishLabel: "Spanish",
    currencyHint: "EUR",
    measurement: "metric",
    dateStyle: "medium",
    dir: "ltr",
  },
}

/** Type guard: is this string a locale we support? */
export function isSupportedLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" &&
    (SUPPORTED_LOCALES as readonly string[]).includes(value)
  )
}

/** Metadata for a locale, falling back to the default-locale metadata. */
export function localeMeta(locale: string | null | undefined): LocaleMeta {
  return isSupportedLocale(locale)
    ? LOCALE_META[locale]
    : LOCALE_META[DEFAULT_LOCALE]
}
