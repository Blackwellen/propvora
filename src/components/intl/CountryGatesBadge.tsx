"use client"

import React from "react"
import { cn } from "@/lib/utils"

/**
 * Small status pill used in the country-pack tables. Maps a PackStatus / boolean
 * gate to a colour-coded chip with an honest label.
 */
const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  enabled: { label: "Enabled", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  reviewed: { label: "Reviewed", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  beta: { label: "Beta", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  research_only: { label: "Research only", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  generic_only: { label: "Generic only", cls: "bg-slate-50 text-slate-600 border-slate-200" },
  disabled: { label: "Disabled", cls: "bg-slate-100 text-slate-500 border-slate-200" },
}

export function PackStatusBadge({ status, className }: { status: string; className?: string }) {
  const s = STATUS_STYLE[status] ?? { label: status, cls: "bg-slate-50 text-slate-600 border-slate-200" }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        s.cls,
        className
      )}
    >
      {s.label}
    </span>
  )
}

export function GateBadge({ ok, label, className }: { ok: boolean; label: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        ok
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-slate-100 text-slate-400 border-slate-200",
        className
      )}
    >
      {label}
    </span>
  )
}

export function OfferStatusBadge({ status, className }: { status: string; className?: string }) {
  const map: Record<string, string> = {
    offer: "bg-emerald-50 text-emerald-700 border-emerald-200",
    restricted: "bg-orange-50 text-orange-700 border-orange-200",
    banned: "bg-red-50 text-red-700 border-red-200",
    unknown: "bg-slate-50 text-slate-500 border-slate-200",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize",
        map[status] ?? map.unknown,
        className
      )}
    >
      {status}
    </span>
  )
}
