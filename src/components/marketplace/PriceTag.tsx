"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { formatPence as formatMarketplacePence } from "@/lib/marketplace/money"

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
  return formatMarketplacePence(pence, currency)
}

interface PriceTagProps {
  pence: number | null | undefined
  currency?: string | null
  pricingModel?: string | null
  size?: "sm" | "md" | "lg"
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
