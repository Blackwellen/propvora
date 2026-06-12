"use client"
import React from "react"

type StatusVariant =
  | "notice_served"
  | "gathering_evidence"
  | "court_applied"
  | "possession_granted"
  | "resolved"
  | "drafting_notice"
  | "active"
  | "expiring"
  | "expired"
  | "pending"

const VARIANT_STYLES: Record<StatusVariant, { label: string; cls: string }> = {
  notice_served:       { label: "Notice Served",       cls: "bg-amber-100 text-amber-700 border border-amber-200" },
  gathering_evidence:  { label: "Gathering Evidence",  cls: "bg-blue-100 text-blue-700 border border-blue-200" },
  court_applied:       { label: "Court Applied",       cls: "bg-red-100 text-red-700 border border-red-200" },
  possession_granted:  { label: "Possession Granted",  cls: "bg-purple-100 text-purple-700 border border-purple-200" },
  resolved:            { label: "Resolved",            cls: "bg-emerald-100 text-emerald-700 border border-emerald-200" },
  drafting_notice:     { label: "Drafting Notice",     cls: "bg-slate-100 text-slate-700 border border-slate-200" },
  active:              { label: "Active",              cls: "bg-green-100 text-green-700 border border-green-200" },
  expiring:            { label: "Expiring Soon",       cls: "bg-amber-100 text-amber-700 border border-amber-200" },
  expired:             { label: "Expired",             cls: "bg-red-100 text-red-700 border border-red-200" },
  pending:             { label: "Pending",             cls: "bg-blue-100 text-blue-700 border border-blue-200" },
}

interface LegalStatusBadgeProps {
  variant: StatusVariant
  label?: string
  size?: "sm" | "md"
}

export function LegalStatusBadge({ variant, label, size = "sm" }: LegalStatusBadgeProps) {
  const cfg = VARIANT_STYLES[variant]
  const text = label ?? cfg.label
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-[12px]"
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${cfg.cls}`}>
      {text}
    </span>
  )
}
