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
  | "en-AU"
  | "en-NZ"
  | "en-IE"
  | "en-CA"
  | "fr-CA"
  | "fr-FR"
  | "de-DE"
  | "es-ES"
  | "it-IT"
  | "nl-NL"
  | "sv-SE"
  | "fi-FI"
  | "da-DK"
  | "cs-CZ"
  | "hr-HR"
  | "hu-HU"
  | "pt-BR"
  | "ja-JP"
  | "th-TH"
  | "tr-TR"

/** The default locale. GB-first, always. */
export const DEFAULT_LOCALE: Locale = "en-GB"

/** Ordered list of supported locales (en-GB first). */
export const SUPPORTED_LOCALES: readonly Locale[] = [
  "en-GB",
  "en-US",
  "en-AU",
  "en-NZ",
  "en-IE",
  "en-CA",
  "fr-FR",
  "fr-CA",
  "de-DE",
  "es-ES",
  "it-IT",
  "nl-NL",
  "sv-SE",
  "fi-FI",
  "da-DK",
  "cs-CZ",
  "hr-HR",
  "hu-HU",
  "pt-BR",
  "ja-JP",
  "th-TH",
  "tr-TR",
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
  "en-AU": {
    locale: "en-AU",
    label: "English (Australia)",
    englishLabel: "English (Australia)",
    currencyHint: "AUD",
    measurement: "metric",
    dateStyle: "medium",
    dir: "ltr",
  },
  "en-NZ": {
    locale: "en-NZ",
    label: "English (New Zealand)",
    englishLabel: "English (New Zealand)",
    currencyHint: "NZD",
    measurement: "metric",
    dateStyle: "medium",
    dir: "ltr",
  },
  "en-IE": {
    locale: "en-IE",
    label: "English (Ireland)",
    englishLabel: "English (Ireland)",
    currencyHint: "EUR",
    measurement: "metric",
    dateStyle: "medium",
    dir: "ltr",
  },
  "en-CA": {
    locale: "en-CA",
    label: "English (Canada)",
    englishLabel: "English (Canada)",
    currencyHint: "CAD",
    measurement: "metric",
    dateStyle: "medium",
    dir: "ltr",
  },
  "fr-CA": {
    locale: "fr-CA",
    label: "Francais (Canada)",
    englishLabel: "French (Canada)",
    currencyHint: "CAD",
    measurement: "metric",
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
  "it-IT": {
    locale: "it-IT",
    label: "Italiano",
    englishLabel: "Italian",
    currencyHint: "EUR",
    measurement: "metric",
    dateStyle: "medium",
    dir: "ltr",
  },
  "nl-NL": {
    locale: "nl-NL",
    label: "Nederlands",
    englishLabel: "Dutch",
    currencyHint: "EUR",
    measurement: "metric",
    dateStyle: "medium",
    dir: "ltr",
  },
  "sv-SE": {
    locale: "sv-SE",
    label: "Svenska",
    englishLabel: "Swedish",
    currencyHint: "SEK",
    measurement: "metric",
    dateStyle: "medium",
    dir: "ltr",
  },
  "fi-FI": {
    locale: "fi-FI",
    label: "Suomi",
    englishLabel: "Finnish",
    currencyHint: "EUR",
    measurement: "metric",
    dateStyle: "medium",
    dir: "ltr",
  },
  "da-DK": {
    locale: "da-DK",
    label: "Dansk",
    englishLabel: "Danish",
    currencyHint: "DKK",
    measurement: "metric",
    dateStyle: "medium",
    dir: "ltr",
  },
  "cs-CZ": {
    locale: "cs-CZ",
    label: "Cestina",
    englishLabel: "Czech",
    currencyHint: "CZK",
    measurement: "metric",
    dateStyle: "medium",
    dir: "ltr",
  },
  "hr-HR": {
    locale: "hr-HR",
    label: "Hrvatski",
    englishLabel: "Croatian",
    currencyHint: "EUR",
    measurement: "metric",
    dateStyle: "medium",
    dir: "ltr",
  },
  "hu-HU": {
    locale: "hu-HU",
    label: "Magyar",
    englishLabel: "Hungarian",
    currencyHint: "HUF",
    measurement: "metric",
    dateStyle: "medium",
    dir: "ltr",
  },
  "pt-BR": {
    locale: "pt-BR",
    label: "Portugues (Brasil)",
    englishLabel: "Portuguese (Brazil)",
    currencyHint: "BRL",
    measurement: "metric",
    dateStyle: "medium",
    dir: "ltr",
  },
  "ja-JP": {
    locale: "ja-JP",
    label: "Japanese",
    englishLabel: "Japanese",
    currencyHint: "JPY",
    measurement: "metric",
    dateStyle: "medium",
    dir: "ltr",
  },
  "th-TH": {
    locale: "th-TH",
    label: "Thai",
    englishLabel: "Thai",
    currencyHint: "THB",
    measurement: "metric",
    dateStyle: "medium",
    dir: "ltr",
  },
  "tr-TR": {
    locale: "tr-TR",
    label: "Turkce",
    englishLabel: "Turkish",
    currencyHint: "TRY",
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

export interface LocalePathInfo {
  locale: Locale | null
  pathname: string
  hasLocalePrefix: boolean
}

/** Split an optional leading locale segment from a URL pathname. */
export function splitLocalePathname(pathname: string): LocalePathInfo {
  const safe = pathname.startsWith("/") ? pathname : `/${pathname}`
  const [, first, ...rest] = safe.split("/")
  if (!isSupportedLocale(first)) {
    return { locale: null, pathname: safe, hasLocalePrefix: false }
  }

  const stripped = `/${rest.join("/")}`.replace(/\/+$/, "") || "/"
  return { locale: first, pathname: stripped, hasLocalePrefix: true }
}

/** Prefix a path with a locale, preserving root as /{locale}. */
export function withLocalePrefix(pathname: string, locale: Locale | null): string {
  const safe = pathname.startsWith("/") ? pathname : `/${pathname}`
  return locale ? `/${locale}${safe === "/" ? "" : safe}` : safe
}
