import React from "react"
import type { RiskBand, RiskSeverity } from "@/lib/risk/types"
import { BAND_STYLE, SEVERITY_STYLE } from "./helpers"

export function BandBadge({ band }: { band: RiskBand }) {
  const s = BAND_STYLE[band] ?? BAND_STYLE.low
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        s.text,
        s.bg,
        s.border,
      ].join(" ")}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.hex }} />
      {s.label}
    </span>
  )
}

export function SeverityBadge({ severity }: { severity: RiskSeverity }) {
  const s = SEVERITY_STYLE[severity] ?? SEVERITY_STYLE.low
  return (
    <span
      className={[
        "inline-flex items-center rounded px-1.5 py-0.5 text-[10.5px] font-medium",
        s.text,
        s.bg,
      ].join(" ")}
    >
      {s.label}
    </span>
  )
}
