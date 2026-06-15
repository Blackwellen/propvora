"use client"

import React from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

/* ──────────────────────────────────────────────────────────────────────────
   ReviewStars — display-only rating (0–5 with halves), plus optional count.

   No interaction in P2 (reviews are a later phase). When `rating` is null the
   component renders a neutral "No reviews yet" affordance rather than a fake
   score — we never invent ratings.
─────────────────────────────────────────────────────────────────────────── */

interface ReviewStarsProps {
  /** 0–5; supports halves. Null → "no reviews yet". */
  rating: number | null | undefined
  /** Number of reviews behind the score. */
  count?: number | null
  size?: "sm" | "md"
  /** Show the numeric score after the stars. */
  showValue?: boolean
  className?: string
}

export function ReviewStars({
  rating,
  count,
  size = "sm",
  showValue = true,
  className,
}: ReviewStarsProps) {
  const px = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"

  if (rating === null || rating === undefined || !Number.isFinite(Number(rating))) {
    return (
      <span className={cn("inline-flex items-center gap-1 text-slate-400", className)}>
        <Star className={cn(px, "text-slate-300")} />
        <span className={cn(size === "sm" ? "text-[11px]" : "text-[12.5px]", "font-medium")}>
          No reviews yet
        </span>
      </span>
    )
  }

  const value = Math.max(0, Math.min(5, Number(rating)))

  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      aria-label={`Rated ${value.toFixed(1)} out of 5${count ? ` from ${count} reviews` : ""}`}
    >
      <span className="inline-flex items-center" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => {
          const fill = Math.max(0, Math.min(1, value - i))
          return (
            <span key={i} className="relative inline-block">
              <Star className={cn(px, "text-slate-200")} />
              {fill > 0 && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fill * 100}%` }}
                >
                  <Star className={cn(px, "text-amber-400 fill-amber-400")} />
                </span>
              )}
            </span>
          )
        })}
      </span>
      {showValue && (
        <span className={cn(size === "sm" ? "text-[11.5px]" : "text-[13px]", "font-semibold text-slate-700 tabular-nums")}>
          {value.toFixed(1)}
        </span>
      )}
      {count != null && count > 0 && (
        <span className={cn(size === "sm" ? "text-[11px]" : "text-[12px]", "text-slate-400")}>
          ({count})
        </span>
      )}
    </span>
  )
}

export default ReviewStars
