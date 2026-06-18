"use client"

/* Shared primitives local to the supplier Schedule + Services feature folders:
   a tiny self-contained toast, a segmented view toggle, and small chips. These
   are NEW primitives (we don't edit the shared ui.tsx). */

import React, { createContext, useCallback, useContext, useState } from "react"
import { cn } from "@/lib/utils"
import { CheckCircle2, Info, X } from "lucide-react"

// ── Toast ───────────────────────────────────────────────────────────────────────
interface ToastItem { id: number; msg: string; tone: "ok" | "info" }
interface ToastCtx { push: (msg: string, tone?: "ok" | "info") => void }

const ToastContext = createContext<ToastCtx>({ push: () => {} })

export function ScheduleToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const push = useCallback((msg: string, tone: "ok" | "info" = "ok") => {
    const id = Date.now() + Math.random()
    setItems((xs) => [...xs, { id, msg, tone }])
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 2600)
  }, [])
  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 max-w-sm">
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              "flex items-start gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg",
              t.tone === "ok"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-blue-50 border-blue-200 text-blue-800"
            )}
          >
            {t.tone === "ok" ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <Info className="w-4 h-4 mt-0.5 shrink-0" />}
            <span className="flex-1">{t.msg}</span>
            <button
              aria-label="Dismiss"
              onClick={() => setItems((xs) => xs.filter((x) => x.id !== t.id))}
              className="shrink-0 text-current/60 hover:text-current"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useScheduleToast(): ToastCtx {
  return useContext(ToastContext)
}

// ── Segmented view toggle ─────────────────────────────────────────────────────
export interface ViewOption { key: string; label: string; icon?: React.ElementType }

export function ViewToggle({
  options,
  value,
  onChange,
  className,
}: {
  options: ViewOption[]
  value: string
  onChange: (key: string) => void
  className?: string
}) {
  return (
    <div className={cn("inline-flex items-center gap-0.5 rounded-lg bg-slate-100 p-0.5", className)}>
      {options.map((o) => {
        const active = o.key === value
        const Icon = o.icon
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
              active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

// ── Small dot/legend chip ─────────────────────────────────────────────────────
export function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
      <span className={cn("w-2.5 h-2.5 rounded-full", color)} />
      {label}
    </span>
  )
}

// ── Static map placeholder ─────────────────────────────────────────────────────
export function MapPlaceholder({ label, className }: { label?: string; className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100",
        className
      )}
    >
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(0deg, rgba(148,163,184,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.18) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <path d="M 18 70 Q 70 30 130 60 T 240 50" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeDasharray="5 4" />
      </svg>
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600 w-3 h-3 ring-4 ring-blue-200" />
      {label && (
        <span className="absolute bottom-2 left-2 rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-200">
          {label}
        </span>
      )}
    </div>
  )
}
