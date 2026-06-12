"use client"

import type { ReactNode } from "react"

interface ContactsPageHeaderProps {
  title: string
  subtitle: string
  actions: ReactNode
  className?: string
}

export default function ContactsPageHeader({
  title,
  subtitle,
  actions,
  className = "",
}: ContactsPageHeaderProps) {
  return (
    <div
      className={[
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      ].join(" ")}
    >
      {/* Left: title + subtitle */}
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-slate-900 leading-tight truncate">{title}</h1>
        <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        {actions}
      </div>
    </div>
  )
}
