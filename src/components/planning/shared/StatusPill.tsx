"use client"

import { cn } from "@/lib/utils"

interface StatusPillProps {
  status: string
  size?: "sm" | "md"
}

interface StatusConfig {
  label: string
  pill: string
  dot: string
}

const STATUS_MAP: Record<string, StatusConfig> = {
  draft: {
    label: "Draft",
    pill: "bg-slate-100 text-slate-600 border border-slate-200",
    dot: "bg-slate-400",
  },
  active: {
    label: "Active",
    pill: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    dot: "bg-emerald-500",
  },
  offer_sent: {
    label: "Offer Sent",
    pill: "bg-[var(--brand-soft)] text-[var(--brand)] border border-[var(--color-brand-100)]",
    dot: "bg-[var(--brand)]",
  },
  offer_drafted: {
    label: "Offer Drafted",
    pill: "bg-sky-50 text-sky-600 border border-sky-200",
    dot: "bg-sky-400",
  },
  offer_accepted: {
    label: "Offer Accepted",
    pill: "bg-emerald-100 text-emerald-800 border border-emerald-300",
    dot: "bg-emerald-600",
  },
  negotiating: {
    label: "Negotiating",
    pill: "bg-amber-50 text-amber-700 border border-amber-200",
    dot: "bg-amber-500",
  },
  forecast_ready: {
    label: "Forecast Ready",
    pill: "bg-violet-50 text-violet-700 border border-violet-200",
    dot: "bg-violet-500",
  },
  conversion_ready: {
    label: "Conversion Ready",
    pill: "bg-teal-50 text-teal-700 border border-teal-200",
    dot: "bg-teal-500",
  },
  converted: {
    label: "Converted",
    pill: "bg-emerald-100 text-emerald-900 border border-emerald-400",
    dot: "bg-emerald-700",
  },
  needs_data: {
    label: "Needs Data",
    pill: "bg-orange-50 text-orange-700 border border-orange-200",
    dot: "bg-orange-400",
  },
  review_needed: {
    label: "Review Needed",
    pill: "bg-red-50 text-red-600 border border-red-200",
    dot: "bg-red-400",
  },
  at_risk: {
    label: "At Risk",
    pill: "bg-red-50 text-red-700 border border-red-300",
    dot: "bg-red-500",
  },
  blocked: {
    label: "Blocked",
    pill: "bg-red-100 text-red-900 border border-red-400",
    dot: "bg-red-700",
  },
}

const DEFAULT_CONFIG: StatusConfig = {
  label: "Unknown",
  pill: "bg-slate-100 text-slate-500 border border-slate-200",
  dot: "bg-slate-400",
}

export default function StatusPill({ status, size = "md" }: StatusPillProps) {
  const config = STATUS_MAP[status] ?? {
    ...DEFAULT_CONFIG,
    label: status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()),
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold",
        size === "sm" ? "text-[10.5px] px-2 py-0.5" : "text-[11.5px] px-2.5 py-1",
        config.pill
      )}
    >
      <span
        className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dot)}
        aria-hidden="true"
      />
      {config.label}
    </span>
  )
}
