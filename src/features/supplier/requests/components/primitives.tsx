"use client"

import React, { createContext, useCallback, useContext, useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { CheckCircle2, XCircle, Info, AlertTriangle } from "lucide-react"
import type { Urgency, LossReason } from "../data/types"

/* ──────────────────────────────────────────────────────────────────────────
   Feature-local primitives for the supplier Requests pipeline. New primitives
   live HERE (not in shared ui.tsx, which is read-only for this work).
─────────────────────────────────────────────────────────────────────────── */

// ── Toast system ──────────────────────────────────────────────────────────────

type ToastTone = "success" | "error" | "info" | "warning"
interface ToastItem { id: number; tone: ToastTone; message: string }
interface ToastApi { push: (tone: ToastTone, message: string) => void }

const ToastCtx = createContext<ToastApi>({ push: () => {} })

export function useToast() {
  return useContext(ToastCtx)
}

export function RequestsToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const push = useCallback((tone: ToastTone, message: string) => {
    const id = Date.now() + Math.random()
    setItems((prev) => [...prev, { id, tone, message }])
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3200)
  }, [])
  const api = useMemo(() => ({ push }), [push])

  const toneClass: Record<ToastTone, string> = {
    success: "bg-emerald-600 text-white",
    error: "bg-red-600 text-white",
    info: "bg-slate-900 text-white",
    warning: "bg-amber-500 text-white",
  }
  const Icon: Record<ToastTone, React.ElementType> = {
    success: CheckCircle2, error: XCircle, info: Info, warning: AlertTriangle,
  }

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 max-w-sm" aria-live="polite">
        {items.map((t) => {
          const I = Icon[t.tone]
          return (
            <div
              key={t.id}
              className={cn(
                "flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg animate-in slide-in-from-bottom-2",
                toneClass[t.tone]
              )}
            >
              <I className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{t.message}</span>
            </div>
          )
        })}
      </div>
    </ToastCtx.Provider>
  )
}

/** Helper hook: a button handler that toasts an action and logs a backend TODO. */
export function useStubAction() {
  const { push } = useToast()
  return useCallback(
    (label: string, tone: ToastTone = "info") => {
      // TODO(backend): wire to a server action once the supplier requests
      // mutation API is available. For now this surfaces optimistic feedback.
      push(tone, label)
    },
    [push]
  )
}

// ── Win-score ring ────────────────────────────────────────────────────────────

export function WinScoreRing({ score, size = 40 }: { score: number; size?: number }) {
  const pct = Math.max(0, Math.min(100, score))
  const r = (size - 6) / 2
  const c = 2 * Math.PI * r
  const offset = c - (pct / 100) * c
  const colour = pct >= 70 ? "#059669" : pct >= 45 ? "#d97706" : "#dc2626"
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }} title={`Win score ${pct}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={3} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={colour} strokeWidth={3}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[10px] font-bold" style={{ color: colour }}>{pct}</span>
    </span>
  )
}

// ── Win-chance bar ────────────────────────────────────────────────────────────

export function WinChanceBar({ pct }: { pct: number | null }) {
  const v = pct == null ? 0 : Math.max(0, Math.min(100, pct))
  const colour = v >= 65 ? "bg-emerald-500" : v >= 40 ? "bg-amber-500" : "bg-red-500"
  return (
    <div className="flex items-center gap-2 min-w-[88px]">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className={cn("h-full rounded-full", colour)} style={{ width: `${v}%` }} />
      </div>
      <span className="text-[11px] font-semibold text-slate-500 tabular-nums">{pct == null ? "—" : `${v}%`}</span>
    </div>
  )
}

// ── Urgency badge ─────────────────────────────────────────────────────────────

const URGENCY_LABEL: Record<Urgency, string> = {
  low: "Low", standard: "Standard", high: "High", emergency: "Emergency",
}
const URGENCY_CLASS: Record<Urgency, string> = {
  low: "bg-slate-100 text-slate-600 border-slate-200",
  standard: "bg-sky-50 text-sky-700 border-sky-200",
  high: "bg-amber-50 text-amber-700 border-amber-200",
  emergency: "bg-red-50 text-red-700 border-red-200",
}

export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border", URGENCY_CLASS[urgency])}>
      {URGENCY_LABEL[urgency]}
    </span>
  )
}

// ── Loss-reason label ─────────────────────────────────────────────────────────

export const LOSS_REASON_LABEL: Record<LossReason, string> = {
  price_too_high: "Price too high",
  competitor_chosen: "Competitor chosen",
  no_response: "No response",
  no_coverage: "No coverage",
  other: "Other",
}

// ── Pager: "Showing X to Y of N" ──────────────────────────────────────────────

export function RequestsPager({
  page, pageSize, total, onPrev, onNext,
}: {
  page: number; pageSize: number; total: number; onPrev: () => void; onNext: () => void
}) {
  if (total === 0) return null
  const from = page * pageSize + 1
  const to = Math.min(total, (page + 1) * pageSize)
  const canPrev = page > 0
  const canNext = to < total
  return (
    <div className="flex items-center justify-between px-1 pt-3 text-xs text-slate-500">
      <span>Showing <span className="font-semibold text-slate-700">{from}</span> to <span className="font-semibold text-slate-700">{to}</span> of <span className="font-semibold text-slate-700">{total}</span></span>
      <div className="flex items-center gap-1.5">
        <button
          onClick={onPrev} disabled={!canPrev}
          className="px-2.5 py-1 rounded-lg border border-slate-200 font-medium disabled:opacity-40 hover:bg-slate-50 disabled:hover:bg-white"
        >Previous</button>
        <button
          onClick={onNext} disabled={!canNext}
          className="px-2.5 py-1 rounded-lg border border-slate-200 font-medium disabled:opacity-40 hover:bg-slate-50 disabled:hover:bg-white"
        >Next</button>
      </div>
    </div>
  )
}

// ── Fit-check row ─────────────────────────────────────────────────────────────

export function FitCheck({ label, ok }: { label: string; ok: boolean }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      {ok
        ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
        : <XCircle className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />}
      <span className={ok ? "text-slate-700" : "text-slate-400"}>{label}</span>
    </li>
  )
}

// ── Simple table cells (feature-local, mirrors house style) ───────────────────

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn("px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400 text-left", className)}>{children}</th>
}
export function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 align-top", className)}>{children}</td>
}

// ── Donut (loss reasons / outcomes) ───────────────────────────────────────────

export interface DonutSlice { label: string; value: number; colour: string }

export function MiniDonut({ slices, centerLabel, centerSub }: { slices: DonutSlice[]; centerLabel: string; centerSub?: string }) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1
  const size = 132
  const r = 52
  const c = 2 * Math.PI * r
  let acc = 0
  return (
    <div className="flex items-center gap-4">
      <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={14} />
          {slices.map((s, i) => {
            const frac = s.value / total
            const dash = frac * c
            const seg = (
              <circle
                key={i} cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={s.colour} strokeWidth={14}
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={-acc * c}
              />
            )
            acc += frac
            return seg
          })}
        </svg>
        <span className="absolute flex flex-col items-center">
          <span className="text-sm font-bold text-slate-900">{centerLabel}</span>
          {centerSub && <span className="text-[10px] text-slate-400">{centerSub}</span>}
        </span>
      </span>
      <ul className="space-y-1.5">
        {slices.map((s, i) => (
          <li key={i} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.colour }} />
            <span className="text-slate-600">{s.label}</span>
            <span className="ml-auto font-semibold text-slate-800 tabular-nums">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
