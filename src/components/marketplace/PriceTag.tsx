"use client"

import React from "react"
import { cn } from "@/lib/utils"

/* ──────────────────────────────────────────────────────────────────────────
   PriceTag — formats integer PENCE → a localised currency string.

   Money is integer pence end-to-end across the marketplace; this primitive is
   the ONLY place value is humanised. It never mutates the underlying integer.
   `pricingModel` (e.g. "per_night", "fixed", "hourly") is rendered as a small
   suffix so a price reads "£120 / night".
─────────────────────────────────────────────────────────────────────────── */

const PRICING_SUFFIX: Record<string, string> = {
  per_night: "/ night",
  per_day: "/ day",
  per_hour: "/ hour",
  hourly: "/ hour",
  per_week: "/ week",
  per_month: "/ month",
  monthly: "/ month",
  per_unit: "/ unit",
  per_job: "/ job",
}

export function formatPence(
  pence: number | null | undefined,
  currency: string | null | undefined = "GBP"
): string {
  if (pence === null || pence === undefined || !Number.isFinite(Number(pence))) return "—"
  const code = (currency ?? "GBP").toUpperCase()
  const major = Number(pence) / 100
  // No fractional part for whole amounts; otherwise up to 2 dp.
  const hasFraction = Math.round(Number(pence)) % 100 !== 0
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: code,
      minimumFractionDigits: hasFraction ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(major)
  } catch {
    // Unknown currency code → plain prefix fallback.
    return `${code} ${major.toLocaleString("en-GB", { minimumFractionDigits: hasFraction ? 2 : 0 })}`
  }
}

interface PriceTagProps {
  pence: number | null | undefined
  currency?: string | null
  pricingModel?: string | null
  /** Visual size of the amount. */
  size?: "sm" | "md" | "lg"
  /** Label shown when there is no price. */
  emptyLabel?: string
  className?: string
}

const SIZE: Record<NonNullable<PriceTagProps["size"]>, string> = {
  sm: "text-[14px]",
  md: "text-[17px]",
  lg: "text-[24px]",
}

export function PriceTag({
  pence,
  currency = "GBP",
  pricingModel,
  size = "md",
  emptyLabel = "Price on request",
  className,
}: PriceTagProps) {
  const hasPrice = pence !== null && pence !== undefined && Number.isFinite(Number(pence))
  const suffix = pricingModel ? PRICING_SUFFIX[pricingModel] ?? null : null

  if (!hasPrice) {
    return (
      <span className={cn("font-semibold text-slate-400", SIZE[size], className)}>
        {emptyLabel}
      </span>
    )
  }

  return (
    <span className={cn("inline-flex items-baseline gap-1 font-black tabular-nums text-slate-900", SIZE[size], className)}>
      {formatPence(pence, currency)}
      {suffix && (
        <span className="text-[11px] font-medium text-slate-500 tracking-tight">{suffix}</span>
      )}
    </span>
  )
}

export default PriceTag
