"use client"

import React, { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { MoreHorizontal, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

/* Interactive Platform Admin primitives ("use client"). Kept free of
   function/icon props from server parents so admin server pages can render them
   directly. Re-exported via ./ui. */

/* ── Segmented tabs (URL-driven via href, or in-page via onChange) ──────────── */

export interface AdminTab { key: string; label: string; href?: string; count?: number }

export function AdminTabs({
  tabs,
  activeKey,
  onChange,
  className,
}: {
  tabs: AdminTab[]
  activeKey: string
  onChange?: (key: string) => void
  className?: string
}) {
  return (
    <div role="tablist" aria-label="Sections" className={cn("flex gap-1 overflow-x-auto no-scrollbar -mx-1 px-1", className)}>
      {tabs.map((t) => {
        const active = t.key === activeKey
        const cls = cn(
          "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-[13px] font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40",
          active ? "bg-[#0D1B2A] text-white" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
        )
        const inner = (
          <>
            {t.label}
            {t.count != null && t.count > 0 && (
              <span className={cn("ml-0.5 px-1.5 py-px rounded-full text-[10px] font-bold", active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600")}>{t.count}</span>
            )}
          </>
        )
        return t.href
          ? <Link key={t.key} href={t.href} role="tab" aria-selected={active} className={cls}>{inner}</Link>
          : <button key={t.key} type="button" role="tab" aria-selected={active} onClick={() => onChange?.(t.key)} className={cls}>{inner}</button>
      })}
    </div>
  )
}

/* ── Search input (pushes ?q= into the URL, debounced) ──────────────────────── */

export function AdminSearchInput({ placeholder = "Search…", paramKey = "q", className }: { placeholder?: string; paramKey?: string; className?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get(paramKey) ?? "")

  useEffect(() => {
    const id = setTimeout(() => {
      const params = new URLSearchParams(Array.from(searchParams.entries()))
      if (value) params.set(paramKey, value); else params.delete(paramKey)
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    }, 350)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 pl-9 pr-8 rounded-xl border border-[#E2EAF6] bg-white text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)]"
      />
      {value && (
        <button onClick={() => setValue("")} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
      )}
    </div>
  )
}

/* ── Filter bar (layout wrapper: search + filter controls) ──────────────────── */

export function AdminFilterBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2 mb-4", className)}>{children}</div>
  )
}

/* ── Row action menu (text/href items; danger styling; no icon props) ───────── */

export interface AdminAction { label: string; href?: string; danger?: boolean; onSelect?: () => void }

export function AdminActionMenu({ actions, label = "Actions" }: { actions: AdminAction[]; label?: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("mousedown", onDown); document.addEventListener("keydown", onKey)
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey) }
  }, [open])
  return (
    <div ref={ref} className="relative inline-block text-left">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} aria-label={label}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-1 w-48 bg-white rounded-xl border border-[#E2EAF6] shadow-[0_12px_40px_rgba(15,23,42,0.14)] py-1 z-50">
          {actions.map((a, i) => {
            const cls = cn("w-full text-left flex items-center px-3.5 py-2 text-[13px] transition-colors", a.danger ? "text-red-600 hover:bg-red-50" : "text-slate-700 hover:bg-slate-50")
            return a.href
              ? <Link key={i} href={a.href} role="menuitem" className={cls} onClick={() => setOpen(false)}>{a.label}</Link>
              : <button key={i} type="button" role="menuitem" className={cls} onClick={() => { a.onSelect?.(); setOpen(false) }}>{a.label}</button>
          })}
        </div>
      )}
    </div>
  )
}

/* ── Confirm dialog for dangerous actions (client island) ───────────────────── */

export function AdminConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  danger = true,
  onConfirm,
  onCancel,
  busy = false,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
  busy?: boolean
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onCancel} />
      <div role="alertdialog" aria-modal="true" className="relative w-full max-w-md bg-white rounded-2xl border border-[#E2EAF6] shadow-2xl p-6">
        <h3 className="text-[16px] font-bold text-[#0B1B3F]">{title}</h3>
        <p className="mt-2 text-[13.5px] text-slate-500">{description}</p>
        <div className="mt-6 flex items-center justify-end gap-2">
          <button onClick={onCancel} disabled={busy} className="h-9 px-4 rounded-xl border border-[#E2EAF6] text-[13px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
          <button onClick={onConfirm} disabled={busy}
            className={cn("h-9 px-4 rounded-xl text-[13px] font-semibold text-white disabled:opacity-50", danger ? "bg-red-600 hover:bg-red-700" : "bg-[var(--brand)] hover:bg-[var(--brand-strong)]")}>
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
