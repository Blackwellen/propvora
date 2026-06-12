import React from "react"

interface VoidHeatmapRowProps {
  propertyName: string
  months: string[]
  values: number[]
  maxValue?: number
}

function cellColor(val: number): string {
  if (val === 0)  return "#E2E8F0" // no voids — light grey
  if (val >= 10)  return "#EF4444" // red — high
  if (val >= 5)   return "#F59E0B" // amber — medium
  return "#3B82F6"                  // blue — low
}

function cellOpacity(val: number): number {
  if (val === 0) return 0.3
  return 0.75
}

export function VoidHeatmapRow({ propertyName, months, values, maxValue = 20 }: VoidHeatmapRowProps) {
  const totalDays = values.reduce((a, b) => a + b, 0)

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-slate-500 w-32 shrink-0 truncate" title={propertyName}>
        {propertyName}
      </span>
      <div className="flex items-end gap-1 flex-1 h-8">
        {values.map((val, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm transition-all"
            style={{
              height: `${Math.max(4, (val / maxValue) * 32)}px`,
              backgroundColor: cellColor(val),
              opacity: cellOpacity(val),
            }}
            title={`${months[i]}: ${val} void days`}
          />
        ))}
      </div>
      <span className="text-[11px] text-slate-400 w-8 text-right shrink-0">
        {totalDays}d
      </span>
    </div>
  )
}
