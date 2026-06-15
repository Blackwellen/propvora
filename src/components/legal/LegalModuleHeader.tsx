"use client"
import React from "react"

interface LegalModuleHeaderProps {
  icon: React.ElementType
  iconColor: string
  title: string
  subtitle: string
  actions?: React.ReactNode
}

export function LegalModuleHeader({
  icon: Icon,
  iconColor,
  title,
  subtitle,
  actions,
}: LegalModuleHeaderProps) {
  return (
    <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconColor}`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        <div className="min-w-0">
          <h1 className="text-[15px] font-semibold text-slate-900">{title}</h1>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0 flex-wrap">{actions}</div>
      )}
    </div>
  )
}
