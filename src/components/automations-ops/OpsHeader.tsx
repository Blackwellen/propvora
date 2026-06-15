"use client"

import React from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

// Shared premium page header for the Automation v2 ops sub-routes. Mirrors the
// AutomationsClient header language (gradient icon chip + title/subtitle) and
// adds a back-link to the main automations hub + optional right-side actions.
export default function OpsHeader({
  icon: Icon,
  title,
  subtitle,
  backHref = "/app/automations",
  backLabel = "Automations",
  actions,
}: {
  icon: React.ElementType
  title: string
  subtitle: string
  backHref?: string
  backLabel?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="space-y-4">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> {backLabel}
      </Link>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 text-white shadow-[0_4px_16px_rgba(99,102,241,0.30)]">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
