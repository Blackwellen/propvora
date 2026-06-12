import React from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

/* ------------------------------------------------------------------ */
/* Inline loading spinner                                              */
/* ------------------------------------------------------------------ */
export function Spinner({
  size = "md",
  className,
}: {
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  className?: string
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
      className={cn("animate-spin text-[#2563EB]", sizeClasses[size], className)}
    />
  )
}

/* ------------------------------------------------------------------ */
/* Page-level loading state                                            */
/* ------------------------------------------------------------------ */
export function LoadingPage({ message = "Loading…" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Spinner size="lg" />
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
      className={cn(
        "flex flex-col items-center justify-center py-12 gap-3",
        className
      )}
    >
      <Spinner size="md" />
      {message && <p className="text-sm text-slate-500">{message}</p>}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Inline loading row                                                  */
/* ------------------------------------------------------------------ */
export function LoadingRow({ text = "Loading…" }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 py-3 px-4 text-sm text-slate-500">
      <Spinner size="sm" />
      {text}
    </div>
  )
}
