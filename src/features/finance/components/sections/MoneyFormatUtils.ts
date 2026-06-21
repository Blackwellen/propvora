// Shared GBP formatting utilities for the finance feature area.
// Import these instead of re-declaring Intl formatters in every page.

const _gbp0 = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
})

const _gbp2 = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function fmtGBP(n: number): string {
  return _gbp0.format(Number.isFinite(n) ? n : 0)
}

export function fmtGBP2(n: number): string {
  return _gbp2.format(Number.isFinite(n) ? n : 0)
}

/** Download an array of plain objects as a CSV file. */
export function downloadCSV(data: Record<string, unknown>[], filename: string): void {
  if (!data.length) return
  const headers = Object.keys(data[0])
  const rows = data.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(","))
  const csv = [headers.join(","), ...rows].join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
