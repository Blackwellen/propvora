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
