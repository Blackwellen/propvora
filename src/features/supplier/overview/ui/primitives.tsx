"use client"

import React, { createContext, useCallback, useContext, useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Check, ArrowRight } from "lucide-react"

/* ──────────────────────────────────────────────────────────────────────────
   Overview-local primitives. NEW file under the feature folder — we do NOT
   edit the shared supplier ui.tsx. These compose the premium house style:
   rounded cards, soft shadows, slate borders, blue/emerald/amber/red/violet
   accents, KPI rows, score rings and a tiny toast bus.
─────────────────────────────────────────────────────────────────────────── */

/* ── KPI card + row ──────────────────────────────────────────────────────── */

export type Accent = "blue" | "emerald" | "amber" | "red" | "violet" | "sky" | "slate"

const accentBg: Record<Accent, string> = {
  blue: "bg-blue-50", emerald: "bg-emerald-50", amber: "bg-amber-50",
  red: "bg-red-50", violet: "bg-violet-50", sky: "bg-sky-50", slate: "bg-slate-100",
}
const accentText: Record<Accent, string> = {
  blue: "text-blue-600", emerald: "text-emerald-600", amber: "text-amber-600",
  red: "text-red-600", violet: "text-violet-600", sky: "text-sky-600", slate: "text-slate-600",
}

export interface OverviewKpi {
  id: string
  label: string
  value: string | number
  sub?: string
  subAccent?: Accent
  icon: React.ElementType
  accent: Accent
  href?: string
  onClick?: () => void
}

export function KpiRow({ kpis }: { kpis: OverviewKpi[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {kpis.map((k) => {
        const Icon = k.icon
        const inner = (
          <>
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", accentBg[k.accent])}>
              <Icon className={cn("w-4 h-4", accentText[k.accent])} />
            </div>
            <div className="mt-2.5">
              <p className="text-xl font-bold text-slate-900 leading-none">{k.value}</p>
              <p className="mt-1 text-[12px] font-medium text-slate-600 leading-tight">{k.label}</p>
              {k.sub && (
                <p className={cn("mt-0.5 text-[11px] font-semibold", k.subAccent ? accentText[k.subAccent] : "text-slate-400")}>
                  {k.sub}
                </p>
              )}
            </div>
          </>
        )
        const base = "bg-white border border-slate-200 rounded-[18px] shadow-sm p-3.5 transition-all text-left w-full"
        if (k.href) {
          return (
            <Link key={k.id} href={k.href} className={cn(base, "hover:border-slate-300 hover:shadow-md block")}>
              {inner}
            </Link>
          )
        }
        if (k.onClick) {
          return (
            <button key={k.id} type="button" onClick={k.onClick} className={cn(base, "hover:border-slate-300 hover:shadow-md")}>
              {inner}
            </button>
          )
        }
        return <div key={k.id} className={base}>{inner}</div>
      })}
    </div>
  )
}

/* ── Section panel ───────────────────────────────────────────────────────── */

export function Panel({
  title, icon: Icon, action, children, className, pad = true,
}: {
  title?: string
  icon?: React.ElementType
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  pad?: boolean
}) {
  return (
    <section className={cn("bg-white border border-slate-200 rounded-[20px] shadow-sm", pad && "p-5", className)}>
      {title && (
        <div className={cn("flex items-center justify-between gap-3", pad ? "mb-4" : "px-5 pt-5 pb-4")}>
          <div className="flex items-center gap-2 min-w-0">
            {Icon && <Icon className="w-4 h-4 text-slate-500 shrink-0" />}
            <h2 className="text-sm font-semibold text-slate-900 truncate">{title}</h2>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

/* ── Score / trust ring ──────────────────────────────────────────────────── */

export function ScoreRing({
  pct, size = 120, stroke = 10, accent = "emerald", label, sub,
}: {
  pct: number
  size?: number
  stroke?: number
  accent?: Accent
  label?: string
  sub?: string
}) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(100, pct))
  const dash = (clamped / 100) * circ
  const colour: Record<Accent, string> = {
    blue: "#2563EB", emerald: "#059669", amber: "#D97706",
    red: "#DC2626", violet: "#7C3AED", sky: "#0284C7", slate: "#64748B",
  }
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F1F5F9" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={colour[accent]} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-900 leading-none">{label ?? `${Math.round(clamped)}%`}</span>
        {sub && <span className="text-[11px] font-medium text-slate-400 mt-1">{sub}</span>}
      </div>
    </div>
  )
}

/* ── Check list (trust breakdown / evidence) ─────────────────────────────── */

export function CheckRow({ label, value, done }: { label: string; value?: string; done?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={cn("w-4 h-4 rounded-full flex items-center justify-center shrink-0", done ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-300")}>
        <Check className="w-3 h-3" />
      </span>
      <span className="text-slate-600 truncate">{label}</span>
      {value && <span className="ml-auto font-semibold text-slate-800">{value}</span>}
    </div>
  )
}

/* ── View toggle (Cards / List / Map / Kanban …) ─────────────────────────── */

export interface ViewOption {
  key: string
  label: string
  icon: React.ElementType
}

export function ViewToggle({
  options, active, onChange,
}: {
  options: ViewOption[]
  active: string
  onChange: (key: string) => void
}) {
  return (
    <div className="inline-flex items-center gap-0.5 p-0.5 rounded-xl bg-slate-100 border border-slate-200">
      {options.map((o) => {
        const Icon = o.icon
        const on = o.key === active
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            title={o.label}
            aria-pressed={on}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors",
              on ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

/* ── Urgency / priority pill ─────────────────────────────────────────────── */

export function Pill({ accent, children }: { accent: Accent; children: React.ReactNode }) {
  const styles: Record<Accent, string> = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
    sky: "bg-sky-50 text-sky-700 border-sky-200",
    slate: "bg-slate-100 text-slate-600 border-slate-200",
  }
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border", styles[accent])}>
      {children}
    </span>
  )
}

/* ── Source pill (live vs seed) ──────────────────────────────────────────── */

export function SourcePill({ source }: { source: "live" | "seed" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border",
        source === "live" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"
      )}
      title={source === "live" ? "Showing your live workspace data" : "Sample data — your records will appear here"}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", source === "live" ? "bg-emerald-500" : "bg-slate-400")} />
      {source === "live" ? "Live" : "Sample"}
    </span>
  )
}

/* ── Inline link ─────────────────────────────────────────────────────────── */

export function OverviewLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-[12px] font-medium text-blue-600 hover:text-blue-700">
      {label}
      <ArrowRight className="w-3 h-3" />
    </Link>
  )
}

/* ── Toast bus ───────────────────────────────────────────────────────────── */

interface Toast {
  id: number
  tone: "info" | "success" | "warn"
  msg: string
}

interface ToastCtx {
  toast: (msg: string, tone?: Toast["tone"]) => void
}

const ToastContext = createContext<ToastCtx>({ toast: () => {} })

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([])
  const toast = useCallback((msg: string, tone: Toast["tone"] = "info") => {
    const id = Date.now() + Math.random()
    setItems((xs) => [...xs, { id, tone, msg }])
    setTimeout(() => setItems((xs) => xs.filter((t) => t.id !== id)), 3200)
  }, [])

  const toneStyles: Record<Toast["tone"], string> = {
    info: "bg-slate-900 text-white",
    success: "bg-emerald-600 text-white",
    warn: "bg-amber-600 text-white",
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 max-w-[calc(100vw-2rem)]">
        {items.map((t) => (
          <div key={t.id} className={cn("rounded-xl px-4 py-2.5 text-sm font-medium shadow-lg", toneStyles[t.tone])}>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}

/* ── States ──────────────────────────────────────────────────────────────── */

export function OverviewSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-[92px] bg-slate-100 rounded-[18px]" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <div className="space-y-4">
          <div className="h-64 bg-slate-100 rounded-[20px]" />
          <div className="h-48 bg-slate-100 rounded-[20px]" />
        </div>
        <div className="space-y-4">
          <div className="h-40 bg-slate-100 rounded-[20px]" />
          <div className="h-56 bg-slate-100 rounded-[20px]" />
        </div>
      </div>
    </div>
  )
}

export function OverviewError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm p-10 flex flex-col items-center text-center">
      <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-500 mb-4">
        <span className="text-xl font-bold">!</span>
      </div>
      <h3 className="text-base font-semibold text-slate-700 mb-1">We couldn&apos;t load this</h3>
      <p className="text-sm text-slate-400 max-w-sm mb-4">Something went wrong fetching your overview. Your data is safe — please try again.</p>
      <button onClick={onRetry} className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg px-4 py-2 text-sm font-medium">
        Try again
      </button>
    </div>
  )
}

export function OverviewEmpty({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
      <h3 className="text-base font-semibold text-slate-700 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm mb-4">{description}</p>
      {action}
    </div>
  )
}
