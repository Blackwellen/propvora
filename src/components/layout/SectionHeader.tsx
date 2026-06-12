"use client"

import React from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/* SectionHeader — the ONE canonical header for every app section.     */
/*                                                                      */
/* Guarantees a single, consistent arrangement everywhere:             */
/*   [breadcrumb]                                                       */
/*   Title + subtitle .................................. [actions]      */
/*   ───────────────────── tab rail ─────────────────────              */
/*                                                                      */
/* Order is fixed (title above tabs, actions top-right) so no section  */
/* can drift. Pass the section's existing <XxxTabNav/> as `tabs` and    */
/* it renders flush beneath the title with uniform spacing.            */
/* ------------------------------------------------------------------ */

export interface Crumb {
  label: string
  href?: string
}

export interface SectionHeaderProps {
  /** Breadcrumb trail, e.g. [{label:"Money", href:"/app/money"}, {label:"Invoices"}]. */
  breadcrumb?: Crumb[]
  title: string
  subtitle?: string
  /** Right-aligned quick-action buttons. */
  actions?: React.ReactNode
  /** The section tab rail (e.g. <MoneyTabNav/>), rendered flush beneath the title. */
  tabs?: React.ReactNode
  className?: string
}

export function SectionHeader({
  breadcrumb,
  title,
  subtitle,
  actions,
  tabs,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-col", tabs ? "gap-4" : "gap-0", className)}>
      {/* Title row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {breadcrumb && breadcrumb.length > 0 && (
            <nav className="flex items-center gap-1 text-[12.5px] text-slate-400 mb-1.5">
              {breadcrumb.map((c, i) => {
                const last = i === breadcrumb.length - 1
                return (
                  <span key={`${c.label}-${i}`} className="flex items-center gap-1 min-w-0">
                    {c.href && !last ? (
                      <Link
                        href={c.href}
                        className="hover:text-slate-600 transition-colors truncate"
                      >
                        {c.label}
                      </Link>
                    ) : (
                      <span className={cn("truncate", last && "text-slate-500 font-medium")}>
                        {c.label}
                      </span>
                    )}
                    {!last && <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
                  </span>
                )
              })}
            </nav>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500 text-pretty">{subtitle}</p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:justify-end">
            {actions}
          </div>
        )}
      </div>

      {/* Tab rail — flush beneath the title, uniform across every section */}
      {tabs}
    </div>
  )
}

export default SectionHeader
