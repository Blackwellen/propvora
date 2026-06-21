import React from "react"

interface TaskProgressRingProps {
  pct: number
  size?: number
  stroke?: number
}

export function TaskProgressRing({ pct, size = 44, stroke = 5 }: TaskProgressRingProps) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const color = pct >= 100 ? "#10B981" : "#2563EB"
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * circ} ${circ}`}
          className="transition-all duration-500 motion-reduce:transition-none"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-bold text-slate-700 tabular-nums">{pct}%</span>
      </div>
    </div>
  )
}
