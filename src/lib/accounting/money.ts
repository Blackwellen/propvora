// Pence <-> pounds helpers and formatting for the ledger.

/** Convert a pounds NUMERIC (string|number) to integer pence. */
export function toPence(pounds: number | string | null | undefined): number {
  if (pounds == null) return 0
  const n = typeof pounds === "string" ? parseFloat(pounds) : pounds
  if (!isFinite(n)) return 0
  return Math.round(n * 100)
}

/** Convert integer pence to a pounds number. */
export function fromPence(pence: number | null | undefined): number {
  return (pence ?? 0) / 100
}

/** Format integer pence as GBP currency. */
export function formatPence(
  pence: number | null | undefined,
  opts: { minimumFractionDigits?: number } = {}
): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: opts.minimumFractionDigits ?? 2,
    maximumFractionDigits: 2,
  }).format(fromPence(pence))
}

/** Parse a user-typed pounds string (e.g. "1,200.50") into pence. */
export function parsePoundsToPence(input: string): number {
  const cleaned = input.replace(/[£,\s]/g, "")
  if (!cleaned) return 0
  const n = parseFloat(cleaned)
  if (!isFinite(n)) return 0
  return Math.round(n * 100)
}
