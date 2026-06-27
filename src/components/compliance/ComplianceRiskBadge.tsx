"use client"

interface ComplianceRiskBadgeProps {
  risk: string
}

interface BadgeConfig {
  label: string
  className: string
}

const RISK_MAP: Record<string, BadgeConfig> = {
  low:       { label: "Low",       className: "bg-emerald-100 text-emerald-700" },
  medium:    { label: "Medium",    className: "bg-amber-100 text-amber-700" },
  high:      { label: "High",      className: "bg-orange-100 text-orange-700" },
  critical:  { label: "Critical",  className: "bg-red-100 text-red-700" },
  excellent: { label: "Excellent", className: "bg-emerald-100 text-emerald-700" },
  good:      { label: "Good",      className: "bg-[var(--color-brand-100)] text-[var(--brand)]" },
  poor:      { label: "Poor",      className: "bg-red-100 text-red-700" },
  fair:      { label: "Fair",      className: "bg-amber-100 text-amber-700" },
}

const FALLBACK: BadgeConfig = { label: "", className: "bg-slate-100 text-slate-600" }

export function ComplianceRiskBadge({ risk }: ComplianceRiskBadgeProps) {
  const config = RISK_MAP[risk] ?? { ...FALLBACK, label: risk }
  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${config.className}`}
    >
      {config.label}
    </span>
  )
}
