"use client"

import React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface WorkEmptyStateProps {
  icon: React.ElementType
  title: string
  description: string
  ctaLabel?: string
  ctaHref?: string
  className?: string
}

export function WorkEmptyState({
  icon: Icon,
  title,
  description,
  ctaLabel,
  ctaHref,
  className,
}: WorkEmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center", className)}>
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-xs mb-5">{description}</p>
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  )
}
