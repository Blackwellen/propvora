"use client"

import React from "react"
import { PlanningTabNav } from "./PlanningTabNav"

interface PlanningPageShellProps {
  title: string
  subtitle?: string
  badge?: { label: string; colour: string }
  actions?: React.ReactNode
  children: React.ReactNode
}

export function PlanningPageShell({
  title,
  subtitle,
  badge,
  actions,
  children,
}: PlanningPageShellProps) {
  return (
    <div className="min-h-full">
      {/* Canonical order: page header (title + actions) first … */}
      <div className="flex items-start justify-between px-8 pt-6 pb-4 bg-white">
        <div className="flex items-center gap-3">
          {badge && (
            <div
              style={{ background: badge.colour + "22", color: badge.colour }}
              className="flex items-center justify-center w-10 h-10 rounded-2xl text-[15px] font-bold shrink-0 select-none"
            >
              {badge.label}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">{title}</h1>
            {subtitle && (
              <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0 ml-4 flex-wrap justify-end">{actions}</div>
        )}
      </div>

      {/* … then the persistent tab rail … */}
      <PlanningTabNav />

      {/* … then page content */}
      <div className="px-8 py-6">{children}</div>
    </div>
  )
}
