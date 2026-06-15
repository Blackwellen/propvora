import React from "react"
import type { RiskBand } from "@/lib/risk/types"
import { BAND_STYLE } from "./helpers"

/**
 * Semicircular risk score gauge (0–100). The arc colour follows the band.
 * Purely presentational — the number is an advisory signal, not a verdict.
 */
export function ScoreGauge({
  score,
  band,
  size = 168,
}: {
  score: number
  band: RiskBand
  size?: number
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)))
  const stroke = 12
  const r = (size - stroke) / 2
  const cx = size / 2
  const cy = size / 2
  // Semicircle: 180° sweep from left (180°) to right (0°).
  const circumference = Math.PI * r
  const dash = (clamped / 100) * circumference
  const hex = (BAND_STYLE[band] ?? BAND_STYLE.low).hex

  // Path for a top semicircle.
  const startX = cx - r
  const startY = cy
  const endX = cx + r
  const endY = cy
  const arc = `M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <svg width={size} height={size / 2 + 8} viewBox={`0 0 ${size} ${size / 2 + 8}`}>
        {/* Track */}
        <path d={arc} fill="none" stroke="#E2E8F0" strokeWidth={stroke} strokeLinecap="round" />
        {/* Value */}
        <path
          d={arc}
          fill="none"
          stroke={hex}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
        />
      </svg>
      <div className="-mt-9 flex flex-col items-center">
        <span className="text-3xl font-bold tabular-nums" style={{ color: hex }}>
          {clamped}
        </span>
        <span className="text-[11px] text-slate-400">/ 100</span>
      </div>
    </div>
  )
}
