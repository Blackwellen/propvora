import Link from "next/link"
import { ArrowLeft, ChevronRight, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/* ──────────────────────────────────────────────────────────────────────────
   Shared Tenant/Landlord portal UI primitives — one consistent visual system
   across every portal page (matches the redesign images). Server-component
   safe (no "use client"); pure presentational. Tokens: navy ink #071B4D,
   blue #2563EB, slate borders #E2EAF6, rounded-2xl cards, soft shadow.
─────────────────────────────────────────────────────────────────────────── */

export type PortalTone = "blue" | "emerald" | "amber" | "red" | "violet" | "slate"

const TONE_TEXT: Record<PortalTone, string> = {
  blue: "text-[#2563EB]", emerald: "text-emerald-600", amber: "text-amber-600",
  red: "text-red-600", violet: "text-violet-600", slate: "text-slate-900",
}
const TONE_SOFT: Record<PortalTone, string> = {
  blue: "bg-[#EFF6FF] text-[#2563EB]", emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600", red: "bg-red-50 text-red-600",
  violet: "bg-violet-50 text-violet-600", slate: "bg-slate-100 text-slate-500",
}
const CHIP: Record<PortalTone, string> = {
  blue: "bg-[#EFF6FF] text-[#2563EB] border-[#DBE8FF]",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  red: "bg-red-50 text-red-700 border-red-200",
  violet: "bg-violet-50 text-violet-700 border-violet-200",
  slate: "bg-slate-100 text-slate-600 border-slate-200",
}

/* ── Page header (title + subtitle + back link + actions) ───────────────────── */
export function PortalPageHeader({
  title, subtitle, backHref, backLabel = "Back to dashboard", actions,
}: {
  title: string; subtitle?: string; backHref?: string; backLabel?: string; actions?: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      {backHref && (
        <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-[#2563EB] transition-colors">
          <ArrowLeft className="w-4 h-4" /> {backLabel}
        </Link>
      )}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-[#071B4D]">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>}
      </div>
    </div>
  )
}

/* ── Card ───────────────────────────────────────────────────────────────────── */
export function PortalCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white border border-[#E7EEF8] rounded-2xl shadow-[0_8px_28px_rgba(15,23,42,0.04)]", className)}>
      {children}
    </div>
  )
}

/* ── Titled section card with optional "view all" link ──────────────────────── */
export function PortalSectionCard({
  title, icon: Icon, action, viewAllHref, viewAllLabel = "View all", children, className, bodyClassName,
}: {
  title: string; icon?: LucideIcon; action?: React.ReactNode
  viewAllHref?: string; viewAllLabel?: string
  children: React.ReactNode; className?: string; bodyClassName?: string
}) {
  return (
    <PortalCard className={className}>
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-[#EEF3FB]">
        <div className="flex items-center gap-2 min-w-0">
          {Icon && <Icon className="w-4 h-4 text-[#2563EB] shrink-0" />}
          <h2 className="text-sm font-semibold text-[#071B4D] truncate">{title}</h2>
        </div>
        {action ?? (viewAllHref && (
          <Link href={viewAllHref} className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8] shrink-0">
            {viewAllLabel} <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        ))}
      </div>
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </PortalCard>
  )
}

/* ── KPI card + strip ───────────────────────────────────────────────────────── */
export interface PortalKpi {
  label: string; value: string; sub?: string; icon?: LucideIcon; tone?: PortalTone; href?: string
}
export function PortalKpiCard({ kpi }: { kpi: PortalKpi }) {
  const inner = (
    <PortalCard className={cn("p-4 h-full", kpi.href && "hover:shadow-[0_10px_30px_rgba(37,99,235,0.10)] hover:border-[#CFE0FB] transition-all")}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide leading-tight">{kpi.label}</span>
        {kpi.icon && <span className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", TONE_SOFT[kpi.tone ?? "blue"])}><kpi.icon className="w-3.5 h-3.5" /></span>}
      </div>
      <p className={cn("text-xl font-bold mt-2", TONE_TEXT[kpi.tone ?? "slate"])}>{kpi.value}</p>
      {kpi.sub && <p className="text-[11px] text-slate-400 mt-0.5 truncate">{kpi.sub}</p>}
    </PortalCard>
  )
  return kpi.href ? <Link href={kpi.href} className="block h-full">{inner}</Link> : inner
}
export function PortalKpiStrip({ kpis, cols = 5 }: { kpis: PortalKpi[]; cols?: 4 | 5 | 6 }) {
  const colCls = cols === 6 ? "xl:grid-cols-6" : cols === 4 ? "xl:grid-cols-4" : "xl:grid-cols-5"
  return <div className={cn("grid grid-cols-2 md:grid-cols-3 gap-3", colCls)}>{kpis.map((k) => <PortalKpiCard key={k.label} kpi={k} />)}</div>
}

/* ── Status chip ────────────────────────────────────────────────────────────── */
export function StatusChip({ tone = "slate", children, dot, className }: { tone?: PortalTone; children: React.ReactNode; dot?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border", CHIP[tone], className)}>
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full", TONE_TEXT[tone].replace("text-", "bg-"))} />}
      {children}
    </span>
  )
}

/* ── Alert banner ───────────────────────────────────────────────────────────── */
export function PortalAlertBanner({
  tone = "amber", icon: Icon, title, children, action,
}: { tone?: PortalTone; icon?: LucideIcon; title?: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className={cn("flex items-start gap-3 rounded-2xl border px-4 py-3.5", CHIP[tone])}>
      {Icon && <Icon className="w-5 h-5 shrink-0 mt-0.5" />}
      <div className="flex-1 min-w-0">
        {title && <p className="text-sm font-semibold">{title}</p>}
        {children && <div className="text-xs mt-0.5 opacity-90">{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/* ── Empty / loading / error states ─────────────────────────────────────────── */
export function PortalEmptyState({ icon: Icon, title, description, action }: { icon?: LucideIcon; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {Icon && <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3"><Icon className="w-6 h-6 text-slate-400" /></div>}
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      {description && <p className="text-xs text-slate-400 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
export function PortalSkeleton({ rows = 4 }: { rows?: number }) {
  return <div className="space-y-3 animate-pulse">{Array.from({ length: rows }).map((_, i) => <div key={i} className="h-14 bg-slate-100 rounded-xl" />)}</div>
}

/* ── Buttons (link + action) ────────────────────────────────────────────────── */
const BTN_BASE = "inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-xl text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 disabled:opacity-50"
export function PortalButtonLink({ href, variant = "outline", icon: Icon, children, className }: { href: string; variant?: "primary" | "outline" | "ghost"; icon?: LucideIcon; children: React.ReactNode; className?: string }) {
  const v = variant === "primary" ? "bg-[#2563EB] text-white hover:bg-[#1d4ed8] shadow-sm" : variant === "ghost" ? "text-slate-600 hover:bg-slate-100" : "bg-white border border-[#E2EAF6] text-[#071B4D] hover:border-[#2563EB]/40 hover:text-[#2563EB] shadow-sm"
  return <Link href={href} className={cn(BTN_BASE, v, className)}>{Icon && <Icon className="w-4 h-4" />}{children}</Link>
}

/* ── Definition row (label/value) ───────────────────────────────────────────── */
export function PortalFact({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: LucideIcon }) {
  return (
    <div className="flex items-start gap-2">
      {Icon && <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />}
      <div className="min-w-0">
        <p className="text-[11px] text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-[#071B4D] mt-0.5">{value}</p>
      </div>
    </div>
  )
}
