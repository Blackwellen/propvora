"use client"

import type { ReactNode } from "react"
import { Workflow } from "lucide-react"
import type { LucideIcon } from "lucide-react"

/**
 * Module header: purple gradient icon tile + title + subtitle on the left,
 * action buttons (passed as a prop) on the right.
 */
export default function AutomationsHeader({
  title,
  subtitle,
  icon: Icon = Workflow,
  iconTone = "violet",
  actions,
}: {
  title: string
  subtitle: string
  icon?: LucideIcon
  iconTone?: "violet" | "red"
  actions?: ReactNode
}) {
  const tile =
    iconTone === "red"
      ? "bg-gradient-to-br from-rose-500 to-red-600 shadow-[0_6px_20px_rgba(239,68,68,0.30)]"
      : "bg-gradient-to-br from-violet-500 to-indigo-600 shadow-[0_6px_20px_rgba(124,58,237,0.30)]"
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-center gap-3.5">
        <div className={`grid h-12 w-12 place-items-center rounded-2xl text-white ${tile}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-0.5 max-w-2xl text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
