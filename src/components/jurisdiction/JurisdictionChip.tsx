"use client"

/**
 * JurisdictionChip — a small flag + country/region label.
 *
 * Used two ways:
 *   - locked="true"  → a RECORD-TRUE chip on a property/case/cert detail page
 *     (the asset's jurisdiction is an immutable fact; no switching).
 *   - locked="false" → the trigger surface for the section-LENS switcher
 *     (overviews), where the operator can change focus.
 *
 * The flag is derived from the ISO-3166-1 alpha-2 code via Unicode regional
 * indicator symbols (no asset/dependency needed).
 */

import { Lock } from "lucide-react"

/** Country code → flag emoji via regional indicator symbols. */
export function flagEmoji(countryCode: string): string {
  const cc = countryCode.toUpperCase().trim()
  if (cc.length !== 2 || !/^[A-Z]{2}$/.test(cc)) return "🏳️"
  const A = 0x1f1e6
  return String.fromCodePoint(A + (cc.charCodeAt(0) - 65), A + (cc.charCodeAt(1) - 65))
}

const REGION_LABEL: Record<string, string> = {
  EW: "England & Wales",
  SCT: "Scotland",
  NI: "Northern Ireland",
}

export function JurisdictionChip({
  countryCode,
  region,
  name,
  locked = false,
  onClick,
  className = "",
}: {
  countryCode: string
  region?: string | null
  /** Optional display name (e.g. pack.name); falls back to the code. */
  name?: string
  locked?: boolean
  onClick?: () => void
  className?: string
}) {
  const label =
    (region && REGION_LABEL[region.toUpperCase()]) || name || countryCode.toUpperCase()
  const base =
    "inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700"

  const content = (
    <>
      <span aria-hidden="true">{flagEmoji(countryCode)}</span>
      <span>{label}</span>
      {locked && <Lock className="h-3 w-3 text-slate-400" aria-hidden="true" />}
    </>
  )

  if (locked || !onClick) {
    return (
      <span
        className={`${base} ${className}`}
        role="note"
        aria-label={`Jurisdiction: ${label}${locked ? " (record-true, locked)" : ""}`}
      >
        {content}
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 ${className}`}
      aria-label={`Change jurisdiction lens (currently ${label})`}
    >
      {content}
      <span className="text-slate-400" aria-hidden="true">▾</span>
    </button>
  )
}

export default JurisdictionChip
