import type { RiskBand, RiskSeverity } from "@/lib/risk/types"

/** Short, non-identifying display form of a UUID (first 8 chars). */
export function shortId(id: string | null | undefined): string {
  if (!id) return "—"
  return id.slice(0, 8)
}

export function fmtDate(d: string | null | undefined): string {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function fmtDateTime(d: string | null | undefined): string {
  if (!d) return "—"
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/** Tailwind colour tokens per band (text / bg / border / hex for gauge). */
export const BAND_STYLE: Record<
  RiskBand,
  { label: string; text: string; bg: string; border: string; hex: string }
> = {
  low: {
    label: "Low",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    hex: "#059669",
  },
  medium: {
    label: "Medium",
    text: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    hex: "#D97706",
  },
  high: {
    label: "High",
    text: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
    hex: "#EA580C",
  },
  critical: {
    label: "Critical",
    text: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    hex: "#E11D48",
  },
}

export const SEVERITY_STYLE: Record<RiskSeverity, { label: string; text: string; bg: string }> = {
  low: { label: "Low", text: "text-slate-600", bg: "bg-slate-100" },
  medium: { label: "Medium", text: "text-amber-700", bg: "bg-amber-50" },
  high: { label: "High", text: "text-orange-700", bg: "bg-orange-50" },
  critical: { label: "Critical", text: "text-rose-700", bg: "bg-rose-50" },
}

/** Human label for an event type. */
export function eventTypeLabel(t: string): string {
  switch (t) {
    case "sanctions_signal":
      return "Sanctions / PEP signal"
    case "kyc_failed":
      return "KYC / identity failed"
    case "dispute_opened":
      return "Dispute opened"
    case "chargeback":
      return "Chargeback / reversal"
    case "velocity":
      return "Velocity anomaly"
    case "marketplace_signal":
      return "Marketplace signal"
    case "manual_flag":
      return "Manual flag"
    case "manual_clear":
      return "Manual clear"
    default:
      return t.replace(/_/g, " ")
  }
}
