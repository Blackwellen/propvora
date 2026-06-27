"use client"

import { createContext, useCallback, useContext, useState } from "react"
import type { ReactNode } from "react"
import { AlertTriangle, Loader2, X } from "lucide-react"
import type { LucideIcon } from "lucide-react"

/* ───────────────────────── Buttons ───────────────────────── */
type BtnVariant = "primary" | "violet" | "emerald" | "outline" | "danger" | "ghost"
const BTN_CLS: Record<BtnVariant, string> = {
  primary: "bg-[var(--brand)] text-white shadow-sm hover:bg-[var(--brand-strong)]",
  violet: "border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100",
  emerald: "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700",
  outline: "border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50",
  danger: "bg-red-600 text-white shadow-sm hover:bg-red-700",
  ghost: "text-slate-600 hover:bg-slate-100",
}
export function Btn({
  children,
  variant = "outline",
  icon: Icon,
  className = "",
  ...props
}: {
  children: ReactNode
  variant?: BtnVariant
  icon?: LucideIcon
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:opacity-60 ${BTN_CLS[variant]} ${className}`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  )
}

/* ───────────────────────── Card ───────────────────────── */
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>
}
export function CardHeader({ title, action }: { title: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {action}
    </div>
  )
}

/* ───────────────────────── Toggle ───────────────────────── */
export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label ?? "Toggle"}
      onClick={(e) => {
        e.stopPropagation()
        onChange(!on)
      }}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${on ? "bg-emerald-500" : "bg-slate-300"}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${on ? "translate-x-4" : "translate-x-0.5"}`} />
    </button>
  )
}

/* ───────────────────────── States ───────────────────────── */
export function SectionLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-slate-200 bg-white py-16 text-sm text-slate-400">
      <Loader2 className="mb-2 h-5 w-5 animate-spin text-slate-300" />
      {label}
    </div>
  )
}
export function SectionError({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-red-200 bg-red-50/40 py-16 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-red-500 shadow-sm">
        <AlertTriangle className="h-5 w-5" />
      </span>
      <h3 className="mt-3 text-sm font-semibold text-slate-800">Couldn&apos;t load this view</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{message ?? "Showing a fallback. Try again shortly."}</p>
      {onRetry && (
        <Btn variant="outline" className="mt-4" onClick={onRetry}>
          Retry
        </Btn>
      )}
    </div>
  )
}
export function EmptyState({
  icon: Icon,
  title,
  body,
  cta,
}: {
  icon: LucideIcon
  title: string
  body: string
  cta?: ReactNode
}) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-white text-slate-400 shadow-sm">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-3 text-sm font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{body}</p>
      {cta && <div className="mt-4">{cta}</div>}
    </div>
  )
}

/* ───────────────────────── Modal ───────────────────────── */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4 text-sm text-slate-600">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3.5">{footer}</div>}
      </div>
    </div>
  )
}

/* ───────────────────────── Drawer (right sheet) ───────────────────────── */
export function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40" onClick={onClose}>
      <div
        className="h-full w-full max-w-md overflow-y-auto border-l border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-3.5">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

/* ───────────────────────── Toast ───────────────────────── */
const ToastCtx = createContext<(msg: string) => void>(() => {})
export function useToast() {
  return useContext(ToastCtx)
}
export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null)
  const flash = useCallback((m: string) => {
    setMsg(m)
    setTimeout(() => setMsg(null), 3200)
  }, [])
  return (
    <ToastCtx.Provider value={flash}>
      {children}
      {msg && (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-xl">
          {msg}
        </div>
      )}
    </ToastCtx.Provider>
  )
}
