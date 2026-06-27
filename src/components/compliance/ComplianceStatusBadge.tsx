"use client"

interface ComplianceStatusBadgeProps {
  status: string
}

interface BadgeConfig {
  label: string
  className: string
}

const STATUS_MAP: Record<string, BadgeConfig> = {
  valid:          { label: "Valid",          className: "bg-emerald-100 text-emerald-700" },
  expiring_soon:  { label: "Expiring Soon",  className: "bg-amber-100 text-amber-700" },
  expired:        { label: "Expired",        className: "bg-red-100 text-red-700" },
  missing:        { label: "Missing",        className: "bg-slate-100 text-red-600" },
  pending_review: { label: "Pending Review", className: "bg-yellow-100 text-yellow-700" },
  verified:       { label: "Verified",       className: "bg-emerald-100 text-emerald-700" },
  failed:         { label: "Failed",         className: "bg-red-100 text-red-700" },
  upcoming:       { label: "Upcoming",       className: "bg-[var(--color-brand-100)] text-[var(--brand)]" },
  completed:      { label: "Completed",      className: "bg-emerald-100 text-emerald-700" },
  overdue:        { label: "Overdue",        className: "bg-red-100 text-red-700" },
  cancelled:      { label: "Cancelled",      className: "bg-slate-100 text-slate-600" },
  blocked:        { label: "Blocked",        className: "bg-red-100 text-red-700" },
  active:         { label: "Active",         className: "bg-[var(--color-brand-100)] text-[var(--brand)]" },
  at_risk:        { label: "At Risk",        className: "bg-orange-100 text-orange-700" },
}

const FALLBACK: BadgeConfig = { label: "", className: "bg-slate-100 text-slate-600" }

export function ComplianceStatusBadge({ status }: ComplianceStatusBadgeProps) {
  const config = STATUS_MAP[status] ?? { ...FALLBACK, label: status }
  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${config.className}`}
    >
      {config.label}
    </span>
  )
}
