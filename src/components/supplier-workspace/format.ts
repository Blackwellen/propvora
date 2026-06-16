/**
 * Formatting utilities for the Supplier Workspace.
 */

/**
 * Formats a pence (integer) value to a currency string.
 * e.g. 1250 → "£12.50"
 */
export function moneyPence(
  pence: number | null | undefined,
  currency = "GBP"
): string {
  if (pence === null || pence === undefined) return "—"
  const amount = pence / 100
  const locale = currency === "GBP" ? "en-GB" : "en-US"
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Formats an ISO date/datetime string to a human-readable string.
 * Returns "—" for null/undefined.
 */
export function fmtDate(
  iso: string | null | undefined,
  opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  }
): string {
  if (!iso) return "—"
  try {
    return new Intl.DateTimeFormat("en-GB", opts).format(new Date(iso))
  } catch {
    return "—"
  }
}

/**
 * Converts a snake_case / kebab-case status string to Title Case.
 * e.g. "pending_review" → "Pending Review"
 */
export function humaniseStatus(status: string): string {
  return status
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
