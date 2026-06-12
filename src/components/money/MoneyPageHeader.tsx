"use client"

import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface MoneyPageHeaderProps {
  breadcrumb?: string
  title: string
  subtitle?: string
  actions: React.ReactNode
  className?: string
}

export default function MoneyPageHeader({
  breadcrumb,
  title,
  subtitle,
  actions,
  className,
}: MoneyPageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", className)}>
      {/* Left: breadcrumb + title + subtitle */}
      <div className="flex flex-col gap-1 min-w-0">
        {breadcrumb && (
          <div className="flex items-center gap-1 text-sm text-slate-400">
            <span>Money</span>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <span>{breadcrumb}</span>
          </div>
        )}
        <h1 className="text-2xl font-bold text-slate-900 leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-slate-400">{subtitle}</p>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        {actions}
      </div>
    </div>
  )
}
