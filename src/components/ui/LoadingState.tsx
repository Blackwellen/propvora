import React from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

/* ------------------------------------------------------------------ */
/* Inline loading spinner                                              */
/* ------------------------------------------------------------------ */
export function Spinner({
  size = "md",
  className,
  decorative = false,
}: {
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  className?: string
  /** When the spinner sits inside its own live region, set this to avoid double announcements. */
  decorative?: boolean
}) {
  const sizeClasses = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  }
  return (
    <Loader2
      role={decorative ? undefined : "status"}
      aria-label={decorative ? undefined : "Loading"}
      aria-hidden={decorative || undefined}
      className={cn("animate-spin text-[#2563EB] motion-reduce:animate-none", sizeClasses[size], className)}
    />
  )
}

/* ------------------------------------------------------------------ */
/* Page-level loading state                                            */
/* ------------------------------------------------------------------ */
export function LoadingPage({ message = "Loading…" }: { message?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Spinner size="lg" decorative />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Section-level loading state                                         */
/* ------------------------------------------------------------------ */
export function LoadingSection({
  message,
  className,
}: {
  message?: string
  className?: string
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center py-12 gap-3",
        className
      )}
    >
      <Spinner size="md" decorative />
      {message && <p className="text-sm text-slate-500">{message}</p>}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Inline loading row                                                  */
/* ------------------------------------------------------------------ */
export function LoadingRow({ text = "Loading…" }: { text?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-2 py-3 px-4 text-sm text-slate-500">
      <Spinner size="sm" decorative />
      {text}
    </div>
  )
}
