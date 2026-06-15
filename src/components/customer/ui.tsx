"use client"

import React from "react"
import Link from "next/link"
import { ChevronRight, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { type StatusTone } from "./format"

/* ──────────────────────────────────────────────────────────────────────────
   Customer-workspace UI primitives — premium consumer building blocks shared
   across every customer page. Light tokens only (no `dark:` classes), matched
   to the supplier-workspace / Work section design language.
─────────────────────────────────────────────────────────────────────────── */

/* ── PageHeader (desktop) ───────────────────────────────────────────────── */

export function CustomerPageHeader({
  title,
  subtitle,
  actions,
  tabs,
}: {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  tabs?: React.ReactNode
}) {
  return (
    <div className="hidden md:flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500 text-pretty">{subtitle}</p>}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:justify-end">{actions}</div>
        )}
      </div>
      {tabs}
    </div>
  )
}

/* ── Card surface ───────────────────────────────────────────────────────── */

export function CustomerCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("bg-white border border-slate-200 rounded-2xl shadow-sm", className)}>
      {children}
    </div>
  )
}

/* ── KPI card ───────────────────────────────────────────────────────────── */

export interface CustomerKpi {
  icon: LucideIcon
  iconBg: string
  iconColor: string
  value: React.ReactNode
  label: string
  sub?: string
  subColor?: string
  href?: string
}

export function CustomerKpiCard({ kpi }: { kpi: CustomerKpi }) {
  const Icon = kpi.icon
  const inner = (
    <>
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", kpi.iconBg)}>
        <Icon className={cn("w-5 h-5", kpi.iconColor)} />
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-slate-900 leading-none">{kpi.value}</p>
        <p className="mt-1.5 text-[13px] font-medium text-slate-600">{kpi.label}</p>
        {kpi.sub && <p className={cn("mt-0.5 text-[11.5px] font-semibold", kpi.subColor ?? "text-slate-400")}>{kpi.sub}</p>}
      </div>
    </>
  )
  const base = "block bg-white border border-slate-200 rounded-2xl shadow-sm p-4 transition-all"
  if (kpi.href) {
    return (
      <Link href={kpi.href} className={cn(base, "hover:border-slate-300 hover:shadow-md")}>
        {inner}
      </Link>
    )
  }
  return <div className={base}>{inner}</div>
}

export function CustomerKpiStrip({ kpis }: { kpis: CustomerKpi[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {kpis.map((k) => (
        <CustomerKpiCard key={k.label} kpi={k} />
      ))}
    </div>
  )
}

/* ── State: empty / loading ─────────────────────────────────────────────── */

export function CustomerEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-14">
      <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-[#2563EB]" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1.5 text-sm text-slate-500 max-w-sm text-pretty">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function CustomerLoadingState({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2.5 p-1" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 rounded-xl bg-slate-50 animate-pulse motion-reduce:animate-none" />
      ))}
    </div>
  )
}

/* ── "View all" link ────────────────────────────────────────────────────── */

export function CustomerViewLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8] flex items-center gap-0.5"
    >
      {label} <ChevronRight className="w-3 h-3" />
    </Link>
  )
}

/* ── Status badge ───────────────────────────────────────────────────────── */

const TONE_CLASSES: Record<StatusTone, string> = {
  blue: "bg-blue-50 text-blue-700",
  amber: "bg-amber-50 text-amber-700",
  emerald: "bg-emerald-50 text-emerald-700",
  red: "bg-red-50 text-red-700",
  slate: "bg-slate-100 text-slate-600",
  violet: "bg-violet-50 text-violet-700",
}

export function CustomerStatusBadge({
  children,
  tone = "slate",
  className,
}: {
  children: React.ReactNode
  tone?: StatusTone
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap",
        TONE_CLASSES[tone],
        className
      )}
    >
      {children}
    </span>
  )
}
