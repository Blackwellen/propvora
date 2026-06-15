"use client"

import { cn } from "@/lib/utils"

/**
 * Lightweight placeholder shown while a Recharts-backed chart chunk loads.
 * Dependency-free (no Recharts) so it ships in the initial bundle and prevents
 * layout shift. Sized by the parent via className/height.
 */
export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "w-full h-full rounded-md bg-slate-100/70 animate-pulse",
        className
      )}
    />
  )
}

export default ChartSkeleton
