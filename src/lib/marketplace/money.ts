/**
 * Format a pence/minor-unit integer as a currency string.
 *
 * @param pence    Integer minor units (e.g. 123456 → £1,234.56). null/undefined → "—".
 * @param currency ISO-4217 currency code (default GBP).
 * @param locale   BCP-47 locale (default en-GB). Pass the workspace locale for
 *                 non-GB workspaces so the symbol and formatting match.
 *
 * NOTE: For client components use the `useFormatCurrency` hook which reads the
 * workspace locale/currency automatically. This function is for server/utility
 * contexts where locale must be passed explicitly.
 */
export function formatPence(
  pence: number | null | undefined,
  currency: string | null | undefined = "GBP",
  locale = "en-GB"
): string {
  if (pence === null || pence === undefined || !Number.isFinite(Number(pence))) return "—"
  const code = (currency ?? "GBP").toUpperCase()
  const safeLocale = locale || "en-GB"
  const major = Number(pence) / 100
  const hasFraction = Math.round(Number(pence)) % 100 !== 0

  try {
    return new Intl.NumberFormat(safeLocale, {
      style: "currency",
      currency: code,
      minimumFractionDigits: hasFraction ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(major)
  } catch {
    return `${code} ${major.toLocaleString(safeLocale, { minimumFractionDigits: hasFraction ? 2 : 0 })}`
  }
}

/**
 * Locale-aware currency formatter. Accepts integer minor units (pence/cents)
 * and renders using the supplied locale and ISO-4217 currency code.
 *
 * This is a locale-aware companion to `formatPence` for international workspaces.
 * For GB/en-GB it produces identical output to `formatPence`.
 *
 * @param amountMinorUnits  Integer pence/cents (e.g. 189900 = £1,899.00)
 * @param currency          ISO-4217 currency code (default "GBP")
 * @param locale            BCP-47 locale (default "en-GB")
 * @param minorUnitsPerMajor  Divisor (default 100 for most currencies)
 */
export function formatCurrency(
  amountMinorUnits: number | null | undefined,
  currency = "GBP",
  locale = "en-GB",
  minorUnitsPerMajor = 100
): string {
  if (amountMinorUnits == null || !Number.isFinite(Number(amountMinorUnits))) return "—"
  const code = (currency ?? "GBP").toUpperCase()
  const major = Number(amountMinorUnits) / minorUnitsPerMajor
  const hasFraction = Math.round(Number(amountMinorUnits)) % minorUnitsPerMajor !== 0
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      minimumFractionDigits: hasFraction ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(major)
  } catch {
    return `${code} ${major.toLocaleString(locale, {
      minimumFractionDigits: hasFraction ? 2 : 0,
    })}`
  }
}
