"use client"

import React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

export interface FilterOption {
  /** Query value; empty string = "all" (param removed). */
  value: string
  label: string
}

/**
 * Client-side status filter chips that drive a server-rendered list via the URL
 * `?status=` (or a custom param) search param. No client data fetching — the
 * page re-renders server-side with the new filter. Accessible + keyboard-driven.
 */
export default function StatusFilter({
  options,
  param = "status",
  className,
}: {
  options: FilterOption[]
  param?: string
  className?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = searchParams.get(param) ?? ""

  const select = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (!value) params.delete(param)
    else params.set(param, value)
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)} role="group" aria-label="Filter">
      {options.map((opt) => {
        const active = current === opt.value
        return (
          <button
            key={opt.value || "all"}
            type="button"
            onClick={() => select(opt.value)}
            aria-pressed={active}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]",
              active
                ? "bg-[#2563EB] text-white shadow-sm"
                : "bg-white text-slate-600 border border-[#E2E8F0] hover:bg-slate-50 hover:text-slate-900",
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
