// Client-side formatting helpers for the public booking checkout. Pure, no deps.

/** Format integer pence into a localised currency string. */
export function formatMoney(pence: number, currency = "GBP"): string {
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency || "GBP",
      minimumFractionDigits: pence % 100 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(pence / 100)
  } catch {
    return `£${(pence / 100).toFixed(2)}`
  }
}

/** yyyy-mm-dd → "Mon, 14 Jul 2026". */
export function formatDateLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00.000Z`)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(d)
}

/** yyyy-mm-dd → "14 Jul". */
export function formatDateShort(iso: string): string {
  const d = new Date(`${iso}T00:00:00.000Z`)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(d)
}

/** Today as yyyy-mm-dd (UTC). */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Add n days to a yyyy-mm-dd string, returning yyyy-mm-dd. */
export function addDaysIso(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Whole nights between two yyyy-mm-dd dates (0 if invalid/reversed). */
export function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(`${checkIn}T00:00:00.000Z`).getTime()
  const b = new Date(`${checkOut}T00:00:00.000Z`).getTime()
  if (Number.isNaN(a) || Number.isNaN(b)) return 0
  const n = Math.round((b - a) / 86_400_000)
  return n > 0 ? n : 0
}
