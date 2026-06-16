"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { humaniseStatus as _humaniseStatus } from "./format"
import { X } from "lucide-react"

// ─── Re-exports ───────────────────────────────────────────────────────────────

export { humaniseStatus } from "./format"

// ─── Status helpers ───────────────────────────────────────────────────────────

export type StatusTone = "emerald" | "amber" | "sky" | "slate" | "red"

export function toneForStatus(status: string): StatusTone {
  switch (status) {
    case "published":
      return "emerald"
    case "pending_review":
      return "amber"
    case "paused":
      return "sky"
    case "draft":
      return "slate"
    case "archived":
      return "slate"
    default:
      return "slate"
  }
}

// ─── Input classes ────────────────────────────────────────────────────────────

export const supplierInputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"

export const supplierTextareaClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"

// ─── Page Header ─────────────────────────────────────────────────────────────

interface Tab {
  label: string
  value: string
}

interface SupplierPageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  tabs?: {
    items: Tab[]
    active: string
    onChange: (v: string) => void
  }
}

export function SupplierPageHeader({ title, subtitle, actions, tabs }: SupplierPageHeaderProps) {
  return (
    <div className="hidden md:flex flex-col gap-4 mb-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      {tabs && (
        <div className="flex gap-1 border-b border-slate-200">
          {tabs.items.map((t) => (
            <button
              key={t.value}
              onClick={() => tabs.onChange(t.value)}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                tabs.active === t.value
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

interface SupplierCardProps {
  children: React.ReactNode
  className?: string
}

export function SupplierCard({ children, className }: SupplierCardProps) {
  return (
    <div className={cn("bg-white border border-slate-200 rounded-2xl shadow-sm", className)}>
      {children}
    </div>
  )
}

// ─── Card Header ─────────────────────────────────────────────────────────────

interface SupplierCardHeaderProps {
  title: string
  action?: React.ReactNode
  badge?: React.ReactNode
}

export function SupplierCardHeader({ title, action, badge }: SupplierCardHeaderProps) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {badge}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// ─── KPI ─────────────────────────────────────────────────────────────────────

export interface SupplierKpi {
  label: string
  value: string | number
  sub?: string
  icon?: React.ReactNode
}

export function SupplierKpiCard({ kpi }: { kpi: SupplierKpi }) {
  return (
    <SupplierCard className="p-5 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{kpi.label}</span>
        {kpi.icon && <span className="text-slate-400">{kpi.icon}</span>}
      </div>
      <span className="text-2xl font-bold text-slate-900">{kpi.value}</span>
      {kpi.sub && <span className="text-xs text-slate-400">{kpi.sub}</span>}
    </SupplierCard>
  )
}

export function SupplierKpiStrip({ kpis }: { kpis: SupplierKpi[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {kpis.map((kpi) => (
        <SupplierKpiCard key={kpi.label} kpi={kpi} />
      ))}
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

interface SupplierEmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function SupplierEmptyState({ icon, title, description, action }: SupplierEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && <div className="mb-4 text-slate-300">{icon}</div>}
      <h3 className="text-base font-semibold text-slate-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-400 max-w-sm mb-4">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  )
}

// ─── Loading State ────────────────────────────────────────────────────────────

export function SupplierLoadingState({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 bg-slate-100 rounded-xl" />
      ))}
    </div>
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const toneClasses: Record<StatusTone, string> = {
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  amber:   "bg-amber-50 text-amber-700 border-amber-200",
  sky:     "bg-sky-50 text-sky-700 border-sky-200",
  slate:   "bg-slate-100 text-slate-600 border-slate-200",
  red:     "bg-red-50 text-red-700 border-red-200",
}

export function SupplierStatusBadge({ status }: { status: string }) {
  const tone = toneForStatus(status)
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
        toneClasses[tone]
      )}
    >
      {_humaniseStatus(status)}
    </span>
  )
}

// ─── Button ───────────────────────────────────────────────────────────────────

interface SupplierButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: "primary" | "outline"
  size?: "sm" | "md"
  disabled?: boolean
  loading?: boolean
  type?: "button" | "submit" | "reset"
  className?: string
}

export function SupplierButton({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled,
  loading,
  type = "button",
  className,
}: SupplierButtonProps) {
  const base = "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
  const sizes = { sm: "px-3 py-1.5 text-sm gap-1.5", md: "px-4 py-2 text-sm gap-2" }
  const variants = {
    primary: "bg-[#2563EB] text-white hover:bg-[#1d4ed8]",
    outline: "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50",
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(base, sizes[size], variants[variant], className)}
    >
      {loading && (
        <svg className="animate-spin w-4 h-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  )
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

interface SupplierDrawerProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function SupplierDrawer({ open, onClose, title, children }: SupplierDrawerProps) {
  if (!open) return null
  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 shrink-0">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
      </aside>
    </>
  )
}

// ─── Form Field ───────────────────────────────────────────────────────────────

interface SupplierFieldProps {
  label: string
  children: React.ReactNode
  error?: string
}

export function SupplierField({ label, children, error }: SupplierFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

// ─── Banner ───────────────────────────────────────────────────────────────────

interface SupplierBannerProps {
  tone: "emerald" | "red"
  msg: string
}

const bannerClasses: Record<"emerald" | "red", string> = {
  emerald: "bg-emerald-50 border border-emerald-200 text-emerald-800",
  red:     "bg-red-50 border border-red-200 text-red-800",
}

export function SupplierBanner({ tone, msg }: SupplierBannerProps) {
  return (
    <div className={cn("px-4 py-3 rounded-xl text-sm font-medium", bannerClasses[tone])}>
      {msg}
    </div>
  )
}
