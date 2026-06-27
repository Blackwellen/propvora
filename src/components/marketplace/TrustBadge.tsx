"use client"

import React from "react"
import { BadgeCheck, ShieldCheck, Zap, Star, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/* ──────────────────────────────────────────────────────────────────────────
   TrustBadge — a compact trust/credential signal shown on listings + sellers.

   Display-only. These reflect verifiable workspace/seller credentials surfaced
   by the data layer; the UI never fabricates a badge — callers only pass a
   `kind` when the backing signal is genuinely present.
─────────────────────────────────────────────────────────────────────────── */

export type TrustKind = "verified" | "insured" | "responsive" | "top_rated"

interface TrustMeta {
  label: string
  icon: LucideIcon
  cls: string
}

const TRUST: Record<TrustKind, TrustMeta> = {
  verified: { label: "Verified", icon: BadgeCheck, cls: "bg-[var(--brand-soft)] text-[var(--brand)] border border-[var(--color-brand-100)]" },
  insured: { label: "Insured", icon: ShieldCheck, cls: "bg-emerald-50 text-emerald-700 border border-emerald-100" },
  responsive: { label: "Fast responder", icon: Zap, cls: "bg-amber-50 text-amber-700 border border-amber-100" },
  top_rated: { label: "Top rated", icon: Star, cls: "bg-violet-50 text-[#7C3AED] border border-violet-100" },
}

export function TrustBadge({
  kind,
  size = "sm",
  className,
}: {
  kind: TrustKind
  size?: "sm" | "md"
  className?: string
}) {
  const meta = TRUST[kind]
  const Icon = meta.icon
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-[10.5px]" : "px-2.5 py-1 text-[12px]",
        meta.cls,
        className
      )}
    >
      <Icon className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      {meta.label}
    </span>
  )
}

export default TrustBadge
