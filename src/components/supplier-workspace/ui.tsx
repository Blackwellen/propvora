"use client"

import React from "react"
import Link from "next/link"
import { ChevronRight, X, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/* ──────────────────────────────────────────────────────────────────────────
   Supplier-workspace UI primitives — premium, enterprise-grade building blocks
   shared across every supplier page. Light tokens only (no `dark:` classes),
   matched to the existing Work section design language.
─────────────────────────────────────────────────────────────────────────── */

/* ── PageHeader (desktop) ───────────────────────────────────────────────── */

export function SupplierPageHeader({
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

export function SupplierCard({
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

export function SupplierCardHeader({
  title,
  action,
  badge,
}: {
  title: string
  action?: React.ReactNode
  badge?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {badge}
      {action}
    </div>
  )
}

/* ── KPI card ───────────────────────────────────────────────────────────── */

export interface SupplierKpi {
  icon: LucideIcon
  iconBg: string
  iconColor: string
  value: React.ReactNode
  label: string
  sub?: string
  subColor?: string
  href?: string
}

export function SupplierKpiCard({ kpi }: { kpi: SupplierKpi }) {
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
  const base =
    "block bg-white border border-slate-200 rounded-2xl shadow-sm p-4 transition-all"
  if (kpi.href) {
    return (
      <Link href={kpi.href} className={cn(base, "hover:border-slate-300 hover:shadow-md")}>
        {inner}
      </Link>
    )
  }
  return <div className={base}>{inner}</div>
}

export function SupplierKpiStrip({ kpis }: { kpis: SupplierKpi[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {kpis.map((k) => (
        <SupplierKpiCard key={k.label} kpi={k} />
      ))}
    </div>
  )
}

/* ── State: empty / loading / error ─────────────────────────────────────── */

export function SupplierEmptyState({
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

export function SupplierLoadingState({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2.5 p-1" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 rounded-xl bg-slate-50 animate-pulse motion-reduce:animate-none" />
      ))}
    </div>
  )
}

/**
 * "Not ready" surface — shown when a sibling API isn't wired yet. Deliberately
 * neutral (not an error): the feature is coming online, data will appear once
 * the service is connected.
 */
export function SupplierNotReady({
  icon: Icon,
  title = "Connecting service",
  description = "This area comes online as soon as the supplier service is connected to your workspace.",
}: {
  icon: LucideIcon
  title?: string
  description?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-14">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-700">{title}</h3>
      <p className="mt-1.5 text-sm text-slate-500 max-w-sm text-pretty">{description}</p>
    </div>
  )
}

/* ── "View all" link ────────────────────────────────────────────────────── */

export function SupplierViewLink({ href, label }: { href: string; label: string }) {
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

export type SupplierStatusTone = "blue" | "amber" | "emerald" | "red" | "slate" | "violet"

const TONE_CLASSES: Record<SupplierStatusTone, string> = {
  blue: "bg-blue-50 text-blue-700",
  amber: "bg-amber-50 text-amber-700",
  emerald: "bg-emerald-50 text-emerald-700",
  red: "bg-red-50 text-red-700",
  slate: "bg-slate-100 text-slate-600",
  violet: "bg-violet-50 text-violet-700",
}

export function SupplierStatusBadge({
  children,
  tone = "slate",
  className,
}: {
  children: React.ReactNode
  tone?: SupplierStatusTone
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

/* ── Status → tone mapping shared by quotes/jobs ────────────────────────── */

export function toneForStatus(status: string): SupplierStatusTone {
  const s = status.toLowerCase()
  if (/(complete|approved|paid|released|accepted|active)/.test(s)) return "emerald"
  if (/(pending|await|review|requested|received|scheduled|en_route|arrived|progress)/.test(s)) return "blue"
  if (/(risk|variation|blocked|parts|deposit)/.test(s)) return "amber"
  if (/(declined|cancelled|refunded|disputed|failed|expired)/.test(s)) return "red"
  return "slate"
}

export function humaniseStatus(status: string): string {
  return status
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/* ── Buttons ────────────────────────────────────────────────────────────── */

export function SupplierButton({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  disabled,
  loading,
  className,
}: {
  children: React.ReactNode
  onClick?: () => void
  type?: "button" | "submit"
  variant?: "primary" | "secondary" | "ghost" | "danger"
  size?: "sm" | "md"
  disabled?: boolean
  loading?: boolean
  className?: string
}) {
  const variants: Record<string, string> = {
    primary: "bg-[#2563EB] text-white hover:bg-[#1d4ed8] disabled:opacity-50",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50",
    ghost: "text-slate-600 hover:bg-slate-100 disabled:opacity-50",
    danger: "bg-red-600 text-white hover:bg-red-700 disabled:opacity-50",
  }
  const sizes: Record<string, string> = {
    sm: "h-8 px-3 text-[13px] rounded-lg gap-1.5",
    md: "h-10 px-4 text-sm rounded-xl gap-2",
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {loading && <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin motion-reduce:animate-none" />}
      {children}
    </button>
  )
}

/* ── Tabs (segmented) ───────────────────────────────────────────────────── */

export interface SupplierTab {
  key: string
  label: string
  icon?: LucideIcon
  count?: number
}

export function SupplierTabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: SupplierTab[]
  active: string
  onChange: (key: string) => void
  className?: string
}) {
  return (
    <div className={cn("flex gap-1 overflow-x-auto no-scrollbar -mx-1 px-1", className)} role="tablist">
      {tabs.map((t) => {
        const Icon = t.icon
        const isActive = t.key === active
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t.key)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold whitespace-nowrap transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40",
              isActive ? "bg-[#0D1B2A] text-white" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            )}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {t.label}
            {t.count != null && t.count > 0 && (
              <span className={cn("ml-0.5 px-1.5 py-px rounded-full text-[10px] font-bold", isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600")}>
                {t.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/* ── Labelled field (forms) ─────────────────────────────────────────────── */

export function SupplierField({
  label,
  children,
  hint,
  required,
}: {
  label: string
  children: React.ReactNode
  hint?: string
  required?: boolean
}) {
  return (
    <label className="block">
      <span className="block text-[13px] font-semibold text-slate-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
      {hint && <span className="block text-[11.5px] text-slate-400 mt-1">{hint}</span>}
    </label>
  )
}

export const supplierInputClass =
  "w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"

export const supplierTextareaClass =
  "w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] resize-y min-h-[88px]"

/* ── Slide-over drawer ──────────────────────────────────────────────────── */

export function SupplierDrawer({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 motion-reduce:animate-none">
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-100 shrink-0">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-slate-100 shrink-0 flex items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}

/* ── Inline error / info banner ─────────────────────────────────────────── */

export function SupplierBanner({
  tone = "amber",
  children,
  onDismiss,
}: {
  tone?: "amber" | "red" | "emerald" | "blue"
  children: React.ReactNode
  onDismiss?: () => void
}) {
  const tones: Record<string, string> = {
    amber: "border-amber-100 bg-amber-50 text-amber-800",
    red: "border-red-100 bg-red-50 text-red-800",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-800",
    blue: "border-blue-100 bg-blue-50 text-blue-800",
  }
  return (
    <div className={cn("flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5", tones[tone])}>
      <p className="text-[13px] font-medium">{children}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="text-[12px] font-semibold hover:underline shrink-0">Dismiss</button>
      )}
    </div>
  )
}
