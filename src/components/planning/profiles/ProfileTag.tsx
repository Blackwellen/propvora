"use client"

import { cn } from "@/lib/utils"

interface ProfileTagProps {
  label: string
  className?: string
}

export default function ProfileTag({ label, className }: ProfileTagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-slate-100 text-slate-600",
        "px-3 py-0.5 text-xs font-medium leading-relaxed",
        "border border-slate-200/60 whitespace-nowrap",
        className
      )}
    >
      {label}
    </span>
  )
}
