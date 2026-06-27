"use client"

import React, { useCallback, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { UploadCloud, MapPin } from "lucide-react"
import LocationMap, { type MapMarker } from "@/components/maps/LocationMap"

/* ──────────────────────────────────────────────────────────────────────────
   Feature-local primitives for the Supplier Jobs surface. These live in the
   feature folder (NOT in the shared supplier ui.tsx, which is read-only) and
   match the house style: rounded cards, blue/emerald/amber/red/violet tones.
─────────────────────────────────────────────────────────────────────────── */

// ── Progress / score ring ─────────────────────────────────────────────────────

export function ProgressRing({
  value,
  size = 36,
  stroke = 4,
  tone = "blue",
  label,
}: {
  value: number
  size?: number
  stroke?: number
  tone?: "blue" | "emerald" | "amber" | "red" | "violet" | "slate"
  label?: string
}) {
  const pct = Math.max(0, Math.min(100, value))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (pct / 100) * c
  const toneColor: Record<string, string> = {
    blue: "#2563EB",
    emerald: "#059669",
    amber: "#D97706",
    red: "#DC2626",
    violet: "#7C3AED",
    slate: "#64748B",
  }
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={toneColor[tone]}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <span className="absolute text-[10px] font-bold text-slate-700">
        {label ?? `${pct}%`}
      </span>
    </span>
  )
}

// ── Mini metric pill (used in tables) ─────────────────────────────────────────

export function CountPill({
  done,
  total,
  tone = "slate",
}: {
  done: number
  total: number
  tone?: "blue" | "emerald" | "amber" | "red" | "slate"
}) {
  const complete = total > 0 && done >= total
  const toneClass: Record<string, string> = {
    blue: "bg-[var(--brand-soft)] text-[var(--brand)] border-[var(--color-brand-100)]",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    slate: "bg-slate-100 text-slate-600 border-slate-200",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border tabular-nums",
        complete ? toneClass.emerald : toneClass[tone]
      )}
    >
      {done}/{total}
    </span>
  )
}

// ── Stat / definition row ─────────────────────────────────────────────────────

export function StatRow({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-800 text-right">
        {value}
        {sub && <span className="block text-[11px] font-normal text-slate-400">{sub}</span>}
      </span>
    </div>
  )
}

// ── Checklist item ────────────────────────────────────────────────────────────

export function ChecklistItem({
  label,
  done,
  hint,
}: {
  label: string
  done: boolean
  hint?: string
}) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <span
        className={cn(
          "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 text-[11px] font-bold",
          done ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-slate-300 text-transparent"
        )}
      >
        ✓
      </span>
      <div className="min-w-0">
        <p className={cn("text-sm", done ? "text-slate-700" : "text-slate-500")}>{label}</p>
        {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
      </div>
      <span
        className={cn(
          "ml-auto text-[11px] font-semibold shrink-0",
          done ? "text-emerald-600" : "text-amber-600"
        )}
      >
        {done ? "Received" : "Missing"}
      </span>
    </div>
  )
}

// ── Upload-only dropzone (thumb-friendly, mobile-first) ────────────────────────

export function EvidenceDropzone({
  onFiles,
  accept = "image/*,application/pdf",
  hint = "Photos & PDF up to 20MB each",
}: {
  onFiles: (files: File[]) => void
  accept?: string
  hint?: string
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const handle = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return
      onFiles(Array.from(files))
    },
    [onFiles]
  )

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); handle(e.dataTransfer.files) }}
      className={cn(
        "rounded-2xl border-2 border-dashed p-5 text-center transition-colors",
        dragOver ? "border-[var(--color-brand-400)] bg-[var(--brand-soft)]/60" : "border-slate-300 bg-slate-50/60"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        capture="environment"
        className="hidden"
        onChange={(e) => handle(e.target.files)}
      />
      <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-[var(--brand)]">
        <UploadCloud className="w-6 h-6" />
      </div>
      <p className="text-sm font-semibold text-slate-700">Drag photos here or tap to upload</p>
      <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-3 inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-[var(--brand)] text-white text-sm font-semibold hover:bg-[var(--brand-strong)] active:scale-[0.98] transition-all w-full sm:w-auto"
      >
        <UploadCloud className="w-4 h-4" /> Choose files
      </button>
    </div>
  )
}

// ── Static map placeholder ─────────────────────────────────────────────────────

export function StaticMap({
  label,
  markers,
  pins,
  className,
}: {
  label?: string
  /** Real geographic markers — when provided, renders a live map. */
  markers?: MapMarker[]
  pins?: { id: string; n: number; tone?: "blue" | "emerald" | "amber" }[]
  className?: string
}) {
  // Live map when we have real markers (address or coords).
  if (markers && markers.length > 0) {
    return (
      <div className={cn("relative rounded-2xl border border-slate-200 overflow-hidden", className)}>
        <LocationMap markers={markers} height="100%" title={label} zoom={13} />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative rounded-2xl border border-slate-200 overflow-hidden bg-[linear-gradient(135deg,#EEF2FF_0%,#F8FAFC_55%,#ECFDF5_100%)]",
        className
      )}
    >
      {/* faux street grid */}
      <svg className="absolute inset-0 w-full h-full opacity-60" aria-hidden="true">
        <defs>
          <pattern id="jobs-map-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M32 0H0V32" fill="none" stroke="#CBD5E1" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#jobs-map-grid)" />
      </svg>
      {(pins ?? []).map((p, i) => {
        const toneClass =
          p.tone === "emerald" ? "bg-emerald-500" : p.tone === "amber" ? "bg-amber-500" : "bg-[var(--brand)]"
        const left = 14 + ((i * 23) % 70)
        const top = 18 + ((i * 31) % 60)
        return (
          <span
            key={p.id}
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full text-white text-[11px] font-bold flex items-center justify-center shadow-md ring-2 ring-white",
              toneClass
            )}
            style={{ left: `${left}%`, top: `${top}%` }}
          >
            {p.n}
          </span>
        )
      })}
      <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-white/80 backdrop-blur text-[11px] font-medium text-slate-500">
        <MapPin className="w-3 h-3" /> {label ?? "Map preview"}
      </div>
    </div>
  )
}

// ── Donut breakdown (recharts-free, dependency-light) ──────────────────────────

export function MiniDonut({
  segments,
  size = 120,
}: {
  segments: { label: string; value: number; color: string }[]
  size?: number
}) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1
  const stroke = 16
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  let acc = 0
  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} className="-rotate-90 shrink-0">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F1F5F9" strokeWidth={stroke} />
        {segments.map((s) => {
          const frac = s.value / total
          const dash = frac * c
          const el = (
            <circle
              key={s.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-acc * c}
            />
          )
          acc += frac
          return el
        })}
      </svg>
      <div className="space-y-1.5">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
            <span className="text-slate-600">{s.label}</span>
            <span className="ml-auto font-semibold text-slate-800 tabular-nums">
              {Math.round((s.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Horizontal bar breakdown ───────────────────────────────────────────────────

export function BarBreakdown({
  bars,
}: {
  bars: { label: string; value: number; total: number; color: string }[]
}) {
  return (
    <div className="space-y-3">
      {bars.map((b) => {
        const pct = b.total > 0 ? Math.round((b.value / b.total) * 100) : 0
        return (
          <div key={b.label}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-600">{b.label}</span>
              <span className="font-semibold text-slate-800 tabular-nums">{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: b.color }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Lightweight toast ──────────────────────────────────────────────────────────

export interface ToastState {
  id: number
  tone: "emerald" | "red" | "blue" | "amber"
  msg: string
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastState[]>([])
  const push = useCallback((tone: ToastState["tone"], msg: string) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, tone, msg }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])
  return { toasts, push }
}

export function ToastHost({ toasts }: { toasts: ToastState[] }) {
  const toneClass: Record<ToastState["tone"], string> = {
    emerald: "bg-emerald-600",
    red: "bg-red-600",
    blue: "bg-[var(--brand)]",
    amber: "bg-amber-600",
  }
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2 px-4 w-full max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto w-full rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg",
            toneClass[t.tone]
          )}
        >
          {t.msg}
        </div>
      ))}
    </div>
  )
}

// ── Section helpers ────────────────────────────────────────────────────────────

export function PanelSection({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{title}</p>
        {action}
      </div>
      {children}
    </div>
  )
}

/** Marks a button whose backend is not wired yet — keeps a single TODO origin. */
export function todoAction(): void {
  /* no-op marker; callers raise a toast. Backend wiring tracked separately. */
}
