import React from "react"
import Link from "next/link"
import { ChevronRight, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/* ──────────────────────────────────────────────────────────────────────────
   Platform Admin UI primitives — the shared design system for every /admin
   page. Light tokens only (no `dark:`). Presentational + server-renderable so
   admin pages (server components) can pass lucide icons + fetched data as props.
   Interactive primitives (menus, dialogs, live filters) live in ./ui.client and
   are re-exported here so `@/components/admin/ui` is the single import surface.
─────────────────────────────────────────────────────────────────────────── */

export {
  AdminTabs,
  AdminFilterBar,
  AdminActionMenu,
  AdminConfirmDialog,
  AdminSearchInput,
  type AdminTab,
  type AdminAction,
} from "./ui.client"

export type AdminTone = "blue" | "emerald" | "amber" | "red" | "violet" | "slate" | "sky"

export const ADMIN_TONE: Record<AdminTone, { chip: string; icon: string; dot: string }> = {
  blue:    { chip: "bg-[var(--brand-soft)] text-[var(--brand)] border-[var(--color-brand-100)]",       icon: "bg-[var(--brand-soft)] text-[var(--brand)]",     dot: "bg-[var(--brand)]" },
  emerald: { chip: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: "bg-emerald-50 text-emerald-600", dot: "bg-emerald-500" },
  amber:   { chip: "bg-amber-50 text-amber-700 border-amber-100",    icon: "bg-amber-50 text-amber-600",    dot: "bg-amber-500" },
  red:     { chip: "bg-red-50 text-red-700 border-red-100",          icon: "bg-red-50 text-red-600",        dot: "bg-red-500" },
  violet:  { chip: "bg-violet-50 text-violet-700 border-violet-100", icon: "bg-violet-50 text-violet-600",  dot: "bg-violet-500" },
  sky:     { chip: "bg-sky-50 text-sky-700 border-sky-100",          icon: "bg-sky-50 text-sky-600",        dot: "bg-sky-500" },
  slate:   { chip: "bg-slate-100 text-slate-600 border-slate-200",   icon: "bg-slate-100 text-slate-500",   dot: "bg-slate-400" },
}

/* ── Page header (title + breadcrumb + actions) ─────────────────────────────── */

export function AdminPageHeader({
  title,
  subtitle,
  breadcrumb,
  actions,
  icon: Icon,
}: {
  title: string
  subtitle?: string
  breadcrumb?: { label: string; href?: string }[]
  actions?: React.ReactNode
  icon?: LucideIcon
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-5">
      <div className="min-w-0">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="flex items-center gap-1 text-[12px] text-slate-400 mb-1.5">
            {breadcrumb.map((b, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="w-3 h-3" />}
                {b.href ? <Link href={b.href} className="hover:text-slate-600">{b.label}</Link> : <span>{b.label}</span>}
              </span>
            ))}
          </nav>
        )}
        <div className="flex items-center gap-2.5">
          {Icon && (
            <span className="w-9 h-9 rounded-xl bg-[#EFF4FF] text-[var(--brand)] flex items-center justify-center shrink-0">
              <Icon className="w-[18px] h-[18px]" />
            </span>
          )}
          <h1 className="text-[22px] font-bold tracking-tight text-[#0B1B3F] leading-tight">{title}</h1>
        </div>
        {subtitle && <p className="mt-1 text-[13.5px] text-slate-500 text-pretty">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0 flex-wrap sm:justify-end">{actions}</div>}
    </div>
  )
}

/* ── Card surfaces ──────────────────────────────────────────────────────────── */

export function AdminCard({ children, className, padded = true }: { children: React.ReactNode; className?: string; padded?: boolean }) {
  return (
    <div className={cn("bg-white border border-[#E2EAF6] rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.04)]", padded && "p-5", className)}>
      {children}
    </div>
  )
}

export function AdminSectionCard({
  title,
  icon: Icon,
  viewAllHref,
  viewAllLabel = "View all",
  actions,
  children,
  className,
}: {
  title: string
  icon?: LucideIcon
  viewAllHref?: string
  viewAllLabel?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <AdminCard className={className}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          {Icon && <Icon className="w-4 h-4 text-slate-400 shrink-0" />}
          <h2 className="text-[15px] font-semibold text-[#0B1B3F] truncate">{title}</h2>
        </div>
        {actions ?? (viewAllHref && (
          <Link href={viewAllHref} className="text-[12px] font-semibold text-[var(--brand)] hover:text-[var(--brand-strong)] flex items-center gap-0.5 shrink-0">
            {viewAllLabel} <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        ))}
      </div>
      {children}
    </AdminCard>
  )
}

/* ── KPI cards ──────────────────────────────────────────────────────────────── */

export interface AdminKpi {
  label: string
  value: React.ReactNode
  icon?: LucideIcon
  tone?: AdminTone
  delta?: string
  deltaTone?: "up" | "down" | "flat"
  sub?: string
  href?: string
}

export function AdminKpiCard({ kpi }: { kpi: AdminKpi }) {
  const tone = ADMIN_TONE[kpi.tone ?? "blue"]
  const Icon = kpi.icon
  const inner = (
    <>
      <div className="flex items-start justify-between">
        {Icon && <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", tone.icon)}><Icon className="w-[18px] h-[18px]" /></span>}
        {kpi.delta && (
          <span className={cn("text-[11px] font-bold px-1.5 py-0.5 rounded-md",
            kpi.deltaTone === "down" ? "bg-red-50 text-red-600" : kpi.deltaTone === "flat" ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-600")}>
            {kpi.delta}
          </span>
        )}
      </div>
      <p className="mt-3 text-[26px] font-bold text-[#0B1B3F] leading-none tracking-tight">{kpi.value}</p>
      <p className="mt-1.5 text-[12.5px] font-medium text-slate-500">{kpi.label}</p>
      {kpi.sub && <p className="mt-0.5 text-[11px] text-slate-400">{kpi.sub}</p>}
    </>
  )
  const base = "block bg-white border border-[#E2EAF6] rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-4"
  return kpi.href
    ? <Link href={kpi.href} className={cn(base, "transition-all hover:border-[#C8DBF5] hover:shadow-md")}>{inner}</Link>
    : <div className={base}>{inner}</div>
}

export function AdminKpiStrip({ kpis, cols = 4 }: { kpis: AdminKpi[]; cols?: 3 | 4 | 5 | 6 | 7 }) {
  const colClass: Record<number, string> = {
    3: "sm:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4", 5: "sm:grid-cols-3 lg:grid-cols-5",
    6: "sm:grid-cols-3 lg:grid-cols-6", 7: "sm:grid-cols-4 lg:grid-cols-7",
  }
  return <div className={cn("grid grid-cols-2 gap-3", colClass[cols])}>{kpis.map((k) => <AdminKpiCard key={k.label} kpi={k} />)}</div>
}

/* ── Status chip ────────────────────────────────────────────────────────────── */

export function AdminStatusChip({ children, tone = "slate", dot = false, className }: { children: React.ReactNode; tone?: AdminTone; dot?: boolean; className?: string }) {
  const t = ADMIN_TONE[tone]
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-semibold whitespace-nowrap", t.chip, className)}>
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full", t.dot)} />}
      {children}
    </span>
  )
}

/* ── Table ──────────────────────────────────────────────────────────────────── */

export function AdminTable({
  head,
  children,
  minWidth = 720,
  className,
}: {
  head: { label: React.ReactNode; align?: "left" | "right" | "center"; className?: string }[]
  children: React.ReactNode
  minWidth?: number
  className?: string
}) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-[13px]" style={{ minWidth }}>
        <thead>
          <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 border-b border-[#EEF3FB] bg-[#FAFCFF]">
            {head.map((h, i) => (
              <th key={i} className={cn("px-4 py-2.5 font-semibold", h.align === "right" && "text-right", h.align === "center" && "text-center", h.className)}>{h.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F1F5FB]">{children}</tbody>
      </table>
    </div>
  )
}

/* ── States: empty / loading / error ────────────────────────────────────────── */

export function AdminEmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-14">
      <div className="w-14 h-14 rounded-2xl bg-[#EFF4FF] flex items-center justify-center mb-4"><Icon className="w-7 h-7 text-[var(--brand)]" /></div>
      <h3 className="text-[15px] font-semibold text-[#0B1B3F]">{title}</h3>
      <p className="mt-1.5 text-[13px] text-slate-500 max-w-sm text-pretty">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function AdminNotConfigured({ title = "Requires integration", description, action }: { title?: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#CBD9EE] bg-[#F8FBFF] px-6 py-10 text-center">
      <div className="w-12 h-12 rounded-2xl bg-white border border-[#E2EAF6] flex items-center justify-center mx-auto mb-3 shadow-sm">
        <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
      </div>
      <h3 className="text-[15px] font-semibold text-[#0B1B3F]">{title}</h3>
      <p className="mt-1.5 text-[13px] text-slate-500 max-w-md mx-auto">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function AdminLoadingSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2.5" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, i) => <div key={i} className="h-14 rounded-xl bg-slate-50 animate-pulse motion-reduce:animate-none" />)}
    </div>
  )
}

export function AdminErrorState({ title = "Couldn't load this data", description = "An error occurred while loading. Try refreshing.", action }: { title?: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-12">
      <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-3">
        <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
      </div>
      <h3 className="text-[15px] font-semibold text-[#0B1B3F]">{title}</h3>
      <p className="mt-1.5 text-[13px] text-slate-500 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/* ── Right rail + banner ────────────────────────────────────────────────────── */

export function AdminRightRail({ children, className }: { children: React.ReactNode; className?: string }) {
  return <aside className={cn("space-y-4", className)}>{children}</aside>
}

export function AdminBanner({ tone = "amber", title, children, icon: Icon }: { tone?: AdminTone; title?: string; children: React.ReactNode; icon?: LucideIcon }) {
  const t = ADMIN_TONE[tone]
  return (
    <div className={cn("rounded-xl border px-4 py-3 flex items-start gap-2.5", t.chip)}>
      {Icon && <Icon className="w-4 h-4 mt-0.5 shrink-0" />}
      <div className="text-[12.5px] leading-relaxed">{title && <span className="font-semibold">{title} </span>}{children}</div>
    </div>
  )
}

/* ── Audit trail panel ──────────────────────────────────────────────────────── */

export interface AdminAuditEntry { actor: string; action: string; when: string; tone?: AdminTone }

export function AdminAuditTrailPanel({ entries, title = "Audit trail", viewAllHref }: { entries: AdminAuditEntry[]; title?: string; viewAllHref?: string }) {
  return (
    <AdminSectionCard title={title} viewAllHref={viewAllHref}>
      {entries.length === 0 ? (
        <p className="text-[13px] text-slate-400 py-2">No recorded events yet.</p>
      ) : (
        <ol className="space-y-3">
          {entries.map((e, i) => {
            const t = ADMIN_TONE[e.tone ?? "blue"]
            return (
              <li key={i} className="flex gap-3">
                <span className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", t.dot)} />
                <div className="min-w-0">
                  <p className="text-[13px] text-slate-700"><span className="font-semibold text-[#0B1B3F]">{e.actor}</span> {e.action}</p>
                  <p className="text-[11px] text-slate-400">{e.when}</p>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </AdminSectionCard>
  )
}

/* ── Queue review panel ─────────────────────────────────────────────────────── */

export function AdminQueuePanel({ title, icon, count, children, viewAllHref }: { title: string; icon?: LucideIcon; count?: number; children: React.ReactNode; viewAllHref?: string }) {
  return (
    <AdminSectionCard
      title={title}
      icon={icon}
      actions={count != null ? <AdminStatusChip tone={count > 0 ? "amber" : "emerald"}>{count} {count === 1 ? "item" : "items"}</AdminStatusChip> : undefined}
      viewAllHref={viewAllHref}
    >
      {children}
    </AdminSectionCard>
  )
}

/* ── Chart card (container — pass an SVG/canvas chart as children) ───────────── */

export function AdminChartCard({ title, icon, actions, children, className }: { title: string; icon?: LucideIcon; actions?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return <AdminSectionCard title={title} icon={icon} actions={actions} className={className}>{children}</AdminSectionCard>
}

/* Lightweight inline bar chart (no external dep) for simple admin visualisations. */
export function AdminBarChart({ data, height = 160, tone = "blue" }: { data: { label: string; value: number }[]; height?: number; tone?: AdminTone }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  const t = ADMIN_TONE[tone]
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
          <div className={cn("w-full rounded-t-md", t.dot)} style={{ height: `${Math.max(2, (d.value / max) * (height - 28))}px` }} title={`${d.label}: ${d.value}`} />
          <span className="text-[10px] text-slate-400 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Buttons (links) ────────────────────────────────────────────────────────── */

export function AdminButtonLink({ href, children, variant = "secondary", icon: Icon, className }: { href: string; children: React.ReactNode; variant?: "primary" | "secondary" | "ghost" | "danger"; icon?: LucideIcon; className?: string }) {
  const v: Record<string, string> = {
    primary: "bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)] border-transparent",
    secondary: "bg-white text-slate-700 border-[#E2EAF6] hover:bg-slate-50 hover:border-[#C8DBF5]",
    ghost: "bg-transparent text-slate-600 border-transparent hover:bg-slate-100",
    danger: "bg-red-600 text-white hover:bg-red-700 border-transparent",
  }
  return (
    <Link href={href} className={cn("inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-xl border text-[13px] font-semibold transition-colors", v[variant], className)}>
      {Icon && <Icon className="w-4 h-4" />}{children}
    </Link>
  )
}
