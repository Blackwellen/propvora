"use client"
import React from "react"

type RiskLevel = "high" | "medium" | "low" | "expiring"

const RISK_STYLES: Record<RiskLevel, { label: string; cls: string }> = {
  high:     { label: "High Risk",      cls: "bg-red-100 text-red-700 border border-red-200" },
  medium:   { label: "Medium Risk",    cls: "bg-amber-100 text-amber-700 border border-amber-200" },
  low:      { label: "Low Risk",       cls: "bg-green-100 text-green-700 border border-green-200" },
  expiring: { label: "Expiring Soon",  cls: "bg-orange-100 text-orange-700 border border-orange-200" },
}

interface LegalRiskBadgeProps {
  level: RiskLevel
  label?: string
}

export function LegalRiskBadge({ level, label }: LegalRiskBadgeProps) {
  const cfg = RISK_STYLES[level]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${cfg.cls}`}>
      {label ?? cfg.label}
    </span>
  )
}
