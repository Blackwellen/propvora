/* Small formatting helpers shared across supplier-workspace pages. */

export function money(amount: number | null | undefined, currency = "GBP"): string {
  if (amount == null || Number.isNaN(amount)) return "—"
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `£${amount.toLocaleString("en-GB")}`
  }
}

export function shortDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

export function dayMonth(iso: string | null | undefined): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }).toUpperCase()
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return ""
  const diff = Date.now() - new Date(iso).getTime()
  if (Number.isNaN(diff)) return ""
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function ratingStars(rating: number | null | undefined): string {
  const r = Math.round(rating ?? 0)
  return "★★★★★".slice(0, r) + "☆☆☆☆☆".slice(0, 5 - r)
}

/** Format integer pence as currency (the supplier money convention). */
export function moneyPence(pence: number | null | undefined, currency = "GBP"): string {
  if (pence == null || Number.isNaN(pence)) return "—"
  return money(pence / 100, currency)
}

/**
 * Days until `iso` (negative if past). Null for missing/invalid dates.
 */
export function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return null
  return Math.ceil((t - Date.now()) / 86_400_000)
}

/** Short human label for a date's expiry state (e.g. "Expires in 12 days"). */
export function expiryLabel(iso: string | null | undefined): string {
  const d = daysUntil(iso)
  if (d == null) return "No expiry"
  if (d < 0) return `Expired ${shortDate(iso)}`
  if (d === 0) return "Expires today"
  if (d <= 30) return `Expires in ${d} day${d === 1 ? "" : "s"}`
  return `Valid until ${shortDate(iso)}`
}
