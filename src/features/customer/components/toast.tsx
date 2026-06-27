"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { CheckCircle2, Info, AlertTriangle, X } from "lucide-react"
import { cn } from "@/lib/utils"

type ToastKind = "success" | "info" | "warning" | "error"
interface Toast {
  id: number
  message: string
  kind: ToastKind
}

const ToastCtx = createContext<{ toast: (message: string, kind?: ToastKind) => void } | null>(null)

/** Customer-workspace toast. Wraps the whole workspace in the shell so any
 *  client component under /customer can call useCustomerToast(). */
export function CustomerToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, kind: ToastKind = "success") => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, message, kind }])
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600)
  }, [])

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[340px] max-w-[calc(100vw-2rem)]">
        {toasts.map((t) => (
          <ToastRow key={t.id} t={t} onClose={() => setToasts((x) => x.filter((y) => y.id !== t.id))} />
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

const ICON: Record<ToastKind, typeof Info> = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: AlertTriangle,
}
const ACCENT: Record<ToastKind, string> = {
  success: "text-emerald-600 bg-emerald-50",
  info: "text-[var(--brand)] bg-[var(--brand-soft)]",
  warning: "text-amber-600 bg-amber-50",
  error: "text-red-600 bg-red-50",
}

function ToastRow({ t, onClose }: { t: Toast; onClose: () => void }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const r = requestAnimationFrame(() => setShow(true))
    return () => cancelAnimationFrame(r)
  }, [])
  const Icon = ICON[t.kind]
  return (
    <div
      className={cn(
        "flex items-start gap-3 bg-white rounded-xl border border-slate-200 shadow-[0_10px_30px_rgba(15,23,42,0.12)] p-3 transition-all",
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      )}
    >
      <span className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", ACCENT[t.kind])}>
        <Icon className="w-4 h-4" />
      </span>
      <p className="flex-1 text-[13px] text-slate-700 leading-snug pt-1">{t.message}</p>
      <button onClick={onClose} aria-label="Dismiss" className="text-slate-400 hover:text-slate-600 shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function useCustomerToast() {
  const ctx = useContext(ToastCtx)
  if (!ctx) return { toast: () => {} }
  return ctx
}
