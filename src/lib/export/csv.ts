/**
 * Shared client-side CSV export.
 *   const cols = [{ key: "name", label: "Name" }, ...]
 *   downloadCsv("contacts", rows, cols)
 */

export interface CsvColumn<T> {
  key: keyof T | string
  label: string
  /** Optional value formatter. */
  format?: (row: T) => string | number | null | undefined
}

function escapeCell(v: unknown): string {
  if (v === null || v === undefined) return ""
  const s = String(v)
  // Quote if it contains comma, quote, or newline.
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function toCsv<T extends Record<string, unknown>>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeCell(c.label)).join(",")
  const lines = rows.map((row) =>
    columns
      .map((c) => {
        const raw = c.format ? c.format(row) : (row as Record<string, unknown>)[c.key as string]
        return escapeCell(raw)
      })
      .join(","),
  )
  // BOM so Excel opens UTF-8 correctly.
  return "﻿" + [header, ...lines].join("\r\n")
}

/**
 * Parse CSV text into an array of row objects keyed by header. Handles quoted
 * fields, escaped quotes (""), commas/newlines inside quotes, a leading BOM,
 * and \r\n or \n line endings. Headers are lower-cased and trimmed so callers
 * can match case-insensitively.
 */
export function parseCsv(text: string): Record<string, string>[] {
  const src = text.replace(/^﻿/, "") // strip BOM
  const rows: string[][] = []
  let field = ""
  let row: string[] = []
  let inQuotes = false
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else field += ch
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ",") {
      row.push(field); field = ""
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++
      row.push(field); field = ""
      if (row.some((c) => c.length > 0)) rows.push(row)
      row = []
    } else field += ch
  }
  if (field.length > 0 || row.length > 0) { row.push(field); if (row.some((c) => c.length > 0)) rows.push(row) }
  if (rows.length === 0) return []

  const headers = rows[0].map((h) => h.trim().toLowerCase())
  return rows.slice(1).map((cells) => {
    const obj: Record<string, string> = {}
    headers.forEach((h, idx) => { obj[h] = (cells[idx] ?? "").trim() })
    return obj
  })
}

export function downloadCsv<T extends Record<string, unknown>>(
  filename: string,
  rows: T[],
  columns: CsvColumn<T>[],
): void {
  const csv = toCsv(rows, columns)
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  const stamp = new Date().toISOString().slice(0, 10)
  a.download = `${filename}-${stamp}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
