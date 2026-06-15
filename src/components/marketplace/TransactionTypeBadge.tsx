"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { transactionTypeMeta } from "./taxonomy"

/* Small pill describing a listing's transaction type (service/booking/…). */
export function TransactionTypeBadge({
  type,
  className,
}: {
  type: string | null | undefined
  className?: string
}) {
  const meta = transactionTypeMeta(type)
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold whitespace-nowrap",
        meta.chip,
        className
      )}
    >
      {meta.label}
    </span>
  )
}

export default TransactionTypeBadge
