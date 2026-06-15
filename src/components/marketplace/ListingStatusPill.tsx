"use client"

import React from "react"
import { cn } from "@/lib/utils"
import type { OwnListingStatus } from "./types"

/* Status pill for OWNED listings (draft/published/paused/archived). */

const STATUS: Record<OwnListingStatus, { label: string; dot: string; cls: string }> = {
  published: { label: "Published", dot: "bg-emerald-500", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  draft: { label: "Draft", dot: "bg-slate-400", cls: "bg-slate-100 text-slate-600 border border-slate-200" },
  paused: { label: "Paused", dot: "bg-amber-500", cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  archived: { label: "Archived", dot: "bg-slate-400", cls: "bg-slate-50 text-slate-500 border border-slate-200" },
}

export function ListingStatusPill({
  status,
  className,
}: {
  status: OwnListingStatus
  className?: string
}) {
  const s = STATUS[status] ?? STATUS.draft
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap",
        s.cls,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  )
}

export default ListingStatusPill
