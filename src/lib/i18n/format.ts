/**
 * ============================================================================
 * Propvora i18n — FORMATTERS
 * ============================================================================
 *
 * Locale-aware, native-`Intl` formatters for money, dates, numbers, percent
 * and relative time. Pure and unit-testable — no React, no I/O, no globals.
 *
 * WHY NATIVE Intl (no library): the V8 ICU runtime already ships with Node and
 * every modern browser, so currency/date/number rules for every locale are
 * available with zero bundle cost and zero new dependency. The app's existing
 * formatters (src/components/customer/format.ts, src/components/booking/format.ts)
 * already use `Intl.NumberFormat("en-GB", …)`; these helpers generalise that
 * exact pattern over the active locale while keeping en-GB byte-identical.
 *
 * MONEY IS INTEGER MINOR UNITS. `formatMoney` takes integer pence/cents plus an
 * ISO-4217 currency and divides by the currency's minor-unit exponent before
 * formatting. For GBP/en-GB it produces "£1,234.56" / "£1,200" exactly like the
 * current `moneyPence` helper (proven in the i18n unit test).
 * ============================================================================
 */

import { DEFAULT_LOCALE, type Locale } from "./config"

/** A locale-ish input; anything unsupported falls back to en-GB at format time. */
type LocaleInput = Locale | string | null | undefined

function asLocale(locale: LocaleInput): string {
  return locale && typeof locale === "string" ? locale : DEFAULT_LOCALE
}

/**
 * Minor-unit exponent for an ISO-4217 currency. Most currencies are 2 (pence,
 * cents). A few are 0 (JPY, KRW) or 3 (BHD, KWD). We special-case the common
 * exceptions; everything else assumes 2 — matching how the data layer stores
 * "integer pence". `Intl` itself applies the correct *display* fraction digits.
 */
const ZERO_DECIMAL = new Set([
  "JPY", "KRW", "VND", "CLP", "ISK", "HUF", "UGX", "XOF", "XAF", "XPF", "RWF",
  "GNF", "KMF", "DJF", "BIF", "PYG",
])
const THREE_DECIMAL = new Set(["BHD", "KWD", "OMR", "TND", "JOD", "IQD", "LYD"])

export function minorUnitExponent(currency: string): number {
  const c = (currency || "GBP").toUpperCase()
  if (ZERO_DECIMAL.has(c)) return 0
  if (THREE_DECIMAL.has(c)) return 3
  return 2
}

/**
 * Format an integer amount of minor units (pence/cents) in the given currency.
 *
 * @param minorUnits integer minor units (e.g. 123456 → £1,234.56). null/NaN → "—".
 * @param currency   ISO-4217 code (default GBP).
 * @param locale     BCP-47 locale (default en-GB).
 *
 * Fraction-digit rule matches the legacy `moneyPence`: whole amounts show no
 * decimals (£1,200), fractional amounts show 2 (£1,234.56).
 */
export function formatMoney(
  minorUnits: number | null | undefined,
  currency = "GBP",
  locale?: LocaleInput
): string {
  if (minorUnits == null || Number.isNaN(minorUnits)) return "—"
  const code = (currency || "GBP").toUpperCase()
  const exp = minorUnitExponent(code)
  const amount = minorUnits / 10 ** exp
  const isWhole = amount % 1 === 0
  try {
    return new Intl.NumberFormat(asLocale(locale), {
      style: "currency",
      currency: code,
      minimumFractionDigits: isWhole ? 0 : exp,
      maximumFractionDigits: exp,
    }).format(amount)
  } catch {
    // Unknown currency / locale: degrade to a plain number, never throw.
    return `${amount.toLocaleString(asLocale(locale))} ${code}`
  }
}

/**
 * Format a *major-unit* numeric amount (e.g. a marketplace listing price stored
 * as a decimal) — same display rules as `formatMoney` but without the
 * minor-unit division. Use `formatMoney` for the integer-pence data layer.
 */
export function formatMoneyMajor(
  amount: number | null | undefined,
  currency = "GBP",
  locale?: LocaleInput
): string {
  if (amount == null || Number.isNaN(amount)) return "—"
  const code = (currency || "GBP").toUpperCase()
  const exp = minorUnitExponent(code)
  const isWhole = amount % 1 === 0
  try {
    return new Intl.NumberFormat(asLocale(locale), {
      style: "currency",
      currency: code,
      minimumFractionDigits: isWhole ? 0 : exp,
      maximumFractionDigits: exp,
    }).format(amount)
  } catch {
    return `${amount.toLocaleString(asLocale(locale))} ${code}`
  }
}

/**
 * Format a date/ISO string. Accepts a Date, an ISO string, or a yyyy-mm-dd.
 * For en-GB this yields DD/MM/YYYY-style output (e.g. "15 Jun 2026" at medium).
 */
export function formatDate(
  value: Date | string | number | null | undefined,
  opts?: Intl.DateTimeFormatOptions,
  locale?: LocaleInput
): string {
  const d = toDate(value)
  if (!d) return "—"
  try {
    return new Intl.DateTimeFormat(asLocale(locale), {
      dateStyle: "medium",
      ...opts,
    }).format(d)
  } catch {
    return d.toLocaleDateString(asLocale(locale))
  }
}

/** Format date + time together. */
export function formatDateTime(
  value: Date | string | number | null | undefined,
  opts?: Intl.DateTimeFormatOptions,
  locale?: LocaleInput
): string {
  const d = toDate(value)
  if (!d) return "—"
  try {
    return new Intl.DateTimeFormat(asLocale(locale), {
      dateStyle: "medium",
      timeStyle: "short",
      ...opts,
    }).format(d)
  } catch {
    return d.toLocaleString(asLocale(locale))
  }
}

/** Format a plain number with locale grouping/decimals. null/NaN → "—". */
export function formatNumber(
  value: number | null | undefined,
  opts?: Intl.NumberFormatOptions,
  locale?: LocaleInput
): string {
  if (value == null || Number.isNaN(value)) return "—"
  try {
    return new Intl.NumberFormat(asLocale(locale), opts).format(value)
  } catch {
    return String(value)
  }
}

/**
 * Format a ratio as a percent. Pass the *ratio* (0.125 → "12.5%"), not 12.5.
 * Use `{ alreadyPercent: true }` if you hold a whole-number percentage already.
 */
export function formatPercent(
  ratio: number | null | undefined,
  opts?: Intl.NumberFormatOptions & { alreadyPercent?: boolean },
  locale?: LocaleInput
): string {
  if (ratio == null || Number.isNaN(ratio)) return "—"
  const { alreadyPercent, ...numOpts } = opts ?? {}
  const value = alreadyPercent ? ratio / 100 : ratio
  try {
    return new Intl.NumberFormat(asLocale(locale), {
      style: "percent",
      maximumFractionDigits: 1,
      ...numOpts,
    }).format(value)
  } catch {
    return `${(value * 100).toFixed(1)}%`
  }
}

const RELATIVE_DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: "second" },
  { amount: 60, unit: "minute" },
  { amount: 24, unit: "hour" },
  { amount: 7, unit: "day" },
  { amount: 4.34524, unit: "week" },
  { amount: 12, unit: "month" },
  { amount: Number.POSITIVE_INFINITY, unit: "year" },
]

/**
 * Locale-aware relative time, e.g. "3 hours ago" / "in 2 days". Accepts a Date,
 * ISO string, or epoch ms; `now` defaults to the current time (injectable for
 * tests). Returns "" for invalid input.
 */
export function formatRelativeTime(
  value: Date | string | number | null | undefined,
  locale?: LocaleInput,
  now: Date = new Date()
): string {
  const d = toDate(value)
  if (!d) return ""
  let duration = (d.getTime() - now.getTime()) / 1000
  try {
    const rtf = new Intl.RelativeTimeFormat(asLocale(locale), { numeric: "auto" })
    for (const division of RELATIVE_DIVISIONS) {
      if (Math.abs(duration) < division.amount) {
        return rtf.format(Math.round(duration), division.unit)
      }
      duration /= division.amount
    }
    return rtf.format(Math.round(duration), "year")
  } catch {
    return ""
  }
}

// ── internals ───────────────────────────────────────────────────────────────

function toDate(value: Date | string | number | null | undefined): Date | null {
  if (value == null || value === "") return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  // Treat bare yyyy-mm-dd as a UTC date to avoid TZ-shifted day boundaries.
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const d = new Date(`${value}T00:00:00.000Z`)
    return Number.isNaN(d.getTime()) ? null : d
  }
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}
