/* Customer-workspace formatting helpers. Money is integer PENCE everywhere in
   the data layer; these convert to display at the edge. */

/** Format integer pence as a currency string. */
export function moneyPence(
  pence: number | null | undefined,
  currency = "GBP"
): string {
  if (pence == null || Number.isNaN(pence)) return "—"
  const amount = pence / 100
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

/** Format a major-unit numeric price (marketplace_listings.price). */
export function moneyMajor(
  amount: number | null | undefined,
  currency = "GBP"
): string {
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
  if (days < 30) return `${days}d ago`
  return shortDate(iso)
}

export function humanise(value: string | null | undefined): string {
  if (!value) return ""
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export type StatusTone = "blue" | "amber" | "emerald" | "red" | "slate" | "violet"

/** Honest status → tone. Never tints something "paid/confirmed" unless it is. */
export function toneForStatus(status: string | null | undefined): StatusTone {
  const s = (status ?? "").toLowerCase()
  if (/(confirmed|completed|paid|released|succeeded|active|checked_out)/.test(s)) return "emerald"
  if (/(pending|hold|processing|await|reserved|requested|checked_in)/.test(s)) return "amber"
  if (/(cancelled|canceled|declined|refunded|failed|expired|disputed)/.test(s)) return "red"
  if (/(draft|enquiry|enquiring)/.test(s)) return "slate"
  return "blue"
}

/** Whether a stay is upcoming (check-in in the future and not cancelled). */
export function isUpcoming(checkIn: string | null | undefined, status: string): boolean {
  if (!checkIn) return false
  const s = status.toLowerCase()
  if (/(cancelled|canceled|refunded|expired)/.test(s)) return false
  const d = new Date(checkIn)
  if (Number.isNaN(d.getTime())) return false
  return d.getTime() >= Date.now() - 24 * 60 * 60 * 1000
}
