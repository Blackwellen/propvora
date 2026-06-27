import React from "react"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/* DashboardContainer                                                   */
/* Full content width — matches the shell content box and the quick     */
/* action bar at every viewport (no centred max-width cap, so dashboards */
/* never become narrower than the toolbar on wide screens). Page types   */
/* (main / sub-tab / detail / wizard) must all share this same width.    */
/* ------------------------------------------------------------------ */
export function DashboardContainer({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("w-full", className)}>
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* SettingsContainer                                                    */
/* Narrow centred layout for settings pages                            */
/* ------------------------------------------------------------------ */
export function SettingsContainer({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("w-full max-w-[960px] mx-auto", className)}>
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* DetailContainer                                                      */
/* Full-width with optional right rail                                 */
/* ------------------------------------------------------------------ */
export function DetailContainer({
  children,
  rightRail,
  className,
}: {
  children: React.ReactNode
  rightRail?: React.ReactNode
  className?: string
}) {
  if (!rightRail) {
    return <div className={cn("w-full", className)}>{children}</div>
  }
  return (
    <div className={cn("flex gap-6 items-start w-full", className)}>
      <div className="flex-1 min-w-0">{children}</div>
      <aside className="w-80 shrink-0 sticky top-6">{rightRail}</aside>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* FormContainer                                                        */
/* Narrow centred layout for wizards / create forms                    */
/* ------------------------------------------------------------------ */
export function FormContainer({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("w-full max-w-[640px] mx-auto", className)}>
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* PageHeader                                                           */
/* Reusable page title + subtitle + actions row                        */
/* ------------------------------------------------------------------ */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 mb-6", className)}>
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-slate-500 text-pretty">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:justify-end">{actions}</div>
      )}
    </div>
  )
}
