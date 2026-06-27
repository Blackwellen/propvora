"use client"

import React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { humaniseStatus as _humaniseStatus } from "./format"
import { X, ArrowRight, Lock, Sparkles } from "lucide-react"

// ─── Re-exports ───────────────────────────────────────────────────────────────

export { humaniseStatus } from "./format"

// ─── Status helpers ───────────────────────────────────────────────────────────

export type StatusTone = "emerald" | "amber" | "sky" | "slate" | "red" | "blue" | "violet"

// Renders an icon prop that may be either a Lucide component (passed as
// `icon={MapPin}`) or an already-instantiated element (`icon={<MapPin />}`).
function renderIcon(icon: React.ReactNode | React.ElementType, className?: string): React.ReactNode {
  if (!icon) return null
  if (typeof icon === "function" || (typeof icon === "object" && icon !== null && "render" in (icon as object))) {
    const Icon = icon as React.ElementType
    return <Icon className={className ?? "w-6 h-6"} />
  }
  return icon as React.ReactNode
}

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
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition-all"

export const supplierTextareaClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition-all resize-none"

// ─── Page Header ─────────────────────────────────────────────────────────────

interface Tab {
  label: string
  value: string
}

interface SupplierPageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  /** A rendered tab strip (e.g. <SupplierTabs />). */
  tabs?: React.ReactNode
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
      {tabs}
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
  icon?: React.ElementType
  iconBg?: string
  iconColor?: string
  subColor?: string
  href?: string
}

export function SupplierKpiCard({ kpi }: { kpi: SupplierKpi }) {
  return (
    <SupplierCard className="p-5 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{kpi.label}</span>
        {kpi.icon && <span className="text-slate-400">{renderIcon(kpi.icon, "w-4 h-4")}</span>}
      </div>
      <span className="text-2xl font-bold text-slate-900">{kpi.value}</span>
      {kpi.sub && <span className="text-xs text-slate-400">{kpi.sub}</span>}
    </SupplierCard>
  )
}

const KPI_COLS: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-2 md:grid-cols-4",
  5: "grid-cols-3 md:grid-cols-5",
  6: "grid-cols-3 md:grid-cols-6",
}

export function SupplierKpiStrip({ kpis }: { kpis: SupplierKpi[] }) {
  const cols = KPI_COLS[kpis.length] ?? "grid-cols-2 md:grid-cols-4"
  return (
    <div className={`grid ${cols} gap-4 mb-6`}>
      {kpis.map((kpi) => (
        <SupplierKpiCard key={kpi.label} kpi={kpi} />
      ))}
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

interface SupplierEmptyStateProps {
  icon?: React.ReactNode | React.ElementType
  title: string
  description?: string
  action?: React.ReactNode
}

export function SupplierEmptyState({ icon, title, description, action }: SupplierEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && <div className="mb-4 text-slate-300">{renderIcon(icon, "w-10 h-10")}</div>}
      <h3 className="text-base font-semibold text-slate-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-400 max-w-sm mb-4">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  )
}

// "Not ready" / coming-soon state — a softer variant of the empty state used
// for features that are gated until a dependency (e.g. payments) is connected.
interface SupplierNotReadyProps {
  icon?: React.ReactNode | React.ElementType
  title: string
  description?: string
  action?: React.ReactNode
}

export function SupplierNotReady({ icon, title, description, action }: SupplierNotReadyProps) {
  return (
    <SupplierCard className="p-10 flex flex-col items-center justify-center text-center">
      {icon && (
        <div className="mb-4 w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
          {renderIcon(icon, "w-6 h-6")}
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-400 max-w-sm mb-4">{description}</p>}
      {action && <div>{action}</div>}
    </SupplierCard>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

export interface SupplierTabItem {
  key: string
  label: string
  count?: number
  icon?: React.ElementType
}

/** Alias kept for pages that type their tab arrays as `SupplierTab[]`. */
export type SupplierTab = SupplierTabItem

interface SupplierTabsProps {
  active: string
  onChange: (key: string) => void
  tabs: SupplierTabItem[]
  className?: string
}

export function SupplierTabs({ active, onChange, tabs, className }: SupplierTabsProps) {
  return (
    <div className={cn("flex items-center gap-1 border-b border-slate-200 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]", className)}>
      {tabs.map((t) => {
        const isActive = t.key === active
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={cn(
              "relative inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium transition-colors -mb-px border-b-2 whitespace-nowrap shrink-0",
              isActive
                ? "text-[var(--brand)] border-[var(--brand)]"
                : "text-slate-500 border-transparent hover:text-slate-700"
            )}
          >
            {t.label}
            {typeof t.count === "number" && (
              <span
                className={cn(
                  "ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
                  isActive ? "bg-[var(--brand-soft)] text-[var(--brand)]" : "bg-slate-100 text-slate-500"
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        )
      })}
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
  blue:    "bg-[var(--brand-soft)] text-[var(--brand)] border-[var(--color-brand-100)]",
  violet:  "bg-violet-50 text-violet-700 border-violet-200",
}

interface SupplierStatusBadgeProps {
  /** Pass a raw status string to auto-derive tone + humanised label. */
  status?: string
  /** Or pass an explicit tone with custom children. */
  tone?: StatusTone
  children?: React.ReactNode
}

export function SupplierStatusBadge({ status, tone, children }: SupplierStatusBadgeProps) {
  const resolvedTone: StatusTone = tone ?? (status ? toneForStatus(status) : "slate")
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
        toneClasses[resolvedTone]
      )}
    >
      {children ?? (status ? _humaniseStatus(status) : null)}
    </span>
  )
}

// ─── Button ───────────────────────────────────────────────────────────────────

interface SupplierButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: "primary" | "outline" | "secondary" | "ghost"
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
  const base = "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] disabled:opacity-50 disabled:cursor-not-allowed"
  const sizes = { sm: "px-3 py-1.5 text-sm gap-1.5", md: "px-4 py-2 text-sm gap-2" }
  const variants = {
    primary:   "bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)]",
    outline:   "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    ghost:     "bg-transparent text-slate-600 hover:bg-slate-100",
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
  footer?: React.ReactNode
}

export function SupplierDrawer({ open, onClose, title, children, footer }: SupplierDrawerProps) {
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
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-200 shrink-0">
            {footer}
          </div>
        )}
      </aside>
    </>
  )
}

// ─── Form Field ───────────────────────────────────────────────────────────────

interface SupplierFieldProps {
  label: string
  children: React.ReactNode
  error?: string
  hint?: string
  required?: boolean
}

export function SupplierField({ label, children, error, hint, required }: SupplierFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

// ─── Banner ───────────────────────────────────────────────────────────────────

interface SupplierBannerProps {
  tone: StatusTone
  /** Either pass `msg` or render `children`. */
  msg?: string
  children?: React.ReactNode
  onDismiss?: () => void
}

const bannerClasses: Record<StatusTone, string> = {
  emerald: "bg-emerald-50 border border-emerald-200 text-emerald-800",
  red:     "bg-red-50 border border-red-200 text-red-800",
  amber:   "bg-amber-50 border border-amber-200 text-amber-800",
  sky:     "bg-sky-50 border border-sky-200 text-sky-800",
  blue:    "bg-[var(--brand-soft)] border border-[var(--color-brand-100)] text-[var(--brand-strong)]",
  violet:  "bg-violet-50 border border-violet-200 text-violet-800",
  slate:   "bg-slate-50 border border-slate-200 text-slate-700",
}

export function SupplierBanner({ tone, msg, children, onDismiss }: SupplierBannerProps) {
  return (
    <div className={cn("flex items-start justify-between gap-3 px-4 py-3 rounded-xl text-sm font-medium", bannerClasses[tone])}>
      <div className="flex-1">{children ?? msg}</div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 p-0.5 rounded-md text-current/60 hover:text-current hover:bg-black/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

// ─── Plan gate / upgrade lock ──────────────────────────────────────────────────

interface SupplierUpgradeCardProps {
  title: string
  description?: string
  /** Bullet list of what the Team plan unlocks here. */
  features?: string[]
  /** Where the upgrade CTA points (defaults to billing/account). */
  href?: string
  ctaLabel?: string
}

/**
 * Premium "Upgrade to Team" lock card shown in place of a Team-only surface for
 * Solo suppliers — never a blank or broken route.
 */
export function SupplierUpgradeCard({
  title,
  description,
  features,
  href = "/supplier/account",
  ctaLabel = "Upgrade to Team",
}: SupplierUpgradeCardProps) {
  return (
    <SupplierCard className="p-8 flex flex-col items-center text-center max-w-xl mx-auto">
      <div className="mb-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-[var(--brand)] flex items-center justify-center text-white shadow-sm">
        <Sparkles className="w-6 h-6" />
      </div>
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-[11px] font-semibold border border-violet-200 mb-3">
        <Lock className="w-3 h-3" /> Team plan
      </span>
      <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 max-w-md mb-4">{description}</p>}
      {features && features.length > 0 && (
        <ul className="text-left space-y-1.5 mb-5 max-w-sm">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
              <Sparkles className="w-3.5 h-3.5 text-violet-500 mt-0.5 shrink-0" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}
      <Link
        href={href}
        className="inline-flex items-center gap-2 bg-gradient-to-br from-violet-600 to-[var(--brand)] hover:opacity-90 text-white rounded-lg px-5 py-2.5 text-sm font-semibold transition-opacity"
      >
        <Sparkles className="w-4 h-4" /> {ctaLabel}
      </Link>
    </SupplierCard>
  )
}

// ─── Permission denied state ────────────────────────────────────────────────────

export function SupplierPermissionDenied({
  title = "You don't have access",
  description = "Your role in this workspace doesn't include this area. Ask an owner or admin to grant access.",
}: {
  title?: string
  description?: string
}) {
  return (
    <SupplierCard className="p-10 flex flex-col items-center text-center">
      <div className="mb-4 w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
        <Lock className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-700 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm">{description}</p>
    </SupplierCard>
  )
}

// ─── Error state with retry ──────────────────────────────────────────────────────

export function SupplierErrorState({
  title = "Something went wrong",
  description = "We couldn't load this data. Please try again.",
  onRetry,
}: {
  title?: string
  description?: string
  onRetry?: () => void
}) {
  return (
    <SupplierCard className="p-10 flex flex-col items-center text-center">
      <div className="mb-4 w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-500">
        <X className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-700 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm mb-4">{description}</p>
      {onRetry && (
        <SupplierButton variant="outline" onClick={onRetry}>
          Try again
        </SupplierButton>
      )}
    </SupplierCard>
  )
}

// ─── Action bar (detail pages) ───────────────────────────────────────────────────

interface SupplierActionBarProps {
  children: React.ReactNode
  className?: string
}

/** Sticky bottom action bar for route-backed detail pages. */
export function SupplierActionBar({ children, className }: SupplierActionBarProps) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-20 -mx-4 md:-mx-6 lg:-mx-8 mt-6 px-4 md:px-6 lg:px-8 py-3 bg-white/90 backdrop-blur border-t border-slate-200 flex items-center justify-end gap-2",
        className
      )}
    >
      {children}
    </div>
  )
}

// ─── View link ────────────────────────────────────────────────────────────────

interface SupplierViewLinkProps {
  href: string
  label: string
  className?: string
}

export function SupplierViewLink({ href, label, className }: SupplierViewLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1 text-[12px] font-medium text-[var(--brand)] hover:text-[var(--brand)] transition-colors",
        className
      )}
    >
      {label}
      <ArrowRight className="w-3 h-3" />
    </Link>
  )
}
