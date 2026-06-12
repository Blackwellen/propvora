"use client"
import React from "react"
import { cn } from "@/lib/utils"

interface DonutSegment {
  label: string
  value: number
  color: string
  count?: number
}

interface AccountingDonutCardProps {
  title: string
  subtitle?: string
  segments: DonutSegment[]
  centerLabel?: string
  centerValue?: string
  size?: number
  className?: string
}

export function AccountingDonutCard({
  title,
  subtitle,
  segments,
  centerLabel,
  centerValue,
  size = 120,
  className,
}: AccountingDonutCardProps) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  const r = 40
  const cx = 60
  const cy = 60
  const circumference = 2 * Math.PI * r

  let offset = 0
  const arcs = segments.map((seg) => {
    const pct = total > 0 ? seg.value / total : 0
    const strokeDasharray = `${pct * circumference} ${circumference}`
    const arc = { ...seg, pct, strokeDasharray, strokeDashoffset: -offset * circumference }
    offset += pct
    return arc
  })

  return (
    <div className={cn("bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5", className)}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-5">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox="0 0 120 120">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F1F5F9" strokeWidth="18" />
            {arcs.map((arc) => (
              <circle
                key={arc.label}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={arc.color}
                strokeWidth="18"
                strokeDasharray={arc.strokeDasharray}
                strokeDashoffset={arc.strokeDashoffset}
                style={{ transform: "rotate(-90deg)", transformOrigin: "60px 60px" }}
              />
            ))}
            {centerValue && (
              <>
                <text x={cx} y={cy - 4} textAnchor="middle" fontSize="14" fontWeight="700" fill="#0F172A">{centerValue}</text>
                {centerLabel && <text x={cx} y={cy + 14} textAnchor="middle" fontSize="9" fill="#94A3B8">{centerLabel}</text>}
              </>
            )}
          </svg>
        </div>
        <div className="flex flex-col gap-2 flex-1">
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                <span className="text-xs text-slate-600 truncate">{seg.label}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {seg.count !== undefined && <span className="text-[11px] text-slate-400">({seg.count})</span>}
                <span className="text-xs font-semibold text-slate-700">
                  {total > 0 ? ((seg.value / total) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
