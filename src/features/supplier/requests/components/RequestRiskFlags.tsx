"use client"

import { AlertTriangle } from "lucide-react"

export interface RiskFlag {
  tone: "red" | "amber"
  label: string
}

export interface RequestRiskFlagsProps {
  flags: RiskFlag[]
}

export function RequestRiskFlags({ flags }: RequestRiskFlagsProps) {
  if (flags.length === 0) return null
  return (
    <div className="space-y-2">
      {flags.map((f, i) => (
        <div
          key={i}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${
            f.tone === "red"
              ? "bg-red-50 text-red-700 border border-red-100"
              : "bg-amber-50 text-amber-700 border border-amber-100"
          }`}
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {f.label}
        </div>
      ))}
    </div>
  )
}
