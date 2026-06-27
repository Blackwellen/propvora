"use client"

// Small, dependency-light building blocks shared across wizard steps.
// House style: white surfaces, rounded-2xl cards, dense forms, blue/emerald/
// amber/violet accents. NEVER uses dark: classes.

import React from "react"
import { cn } from "@/lib/utils"
import { Check, Plus, X } from "lucide-react"

export function Card({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  )
}

export function SectionTitle({
  title,
  hint,
  action,
}: {
  title: string
  hint?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-[14px] font-bold text-slate-900">{title}</h3>
        {hint && <p className="mt-0.5 text-[12px] text-slate-500">{hint}</p>}
      </div>
      {action}
    </div>
  )
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-[12px] font-semibold text-slate-700">
      {children}
    </label>
  )
}

export function TextInput({
  value,
  onChange,
  placeholder,
  maxLength,
  type = "text",
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  maxLength?: number
  type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      maxLength={maxLength}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus-visible:border-[var(--color-brand-400)] focus-visible:ring-2 focus-visible:ring-[var(--color-brand-100)]"
    />
  )
}

export function TextArea({
  value,
  onChange,
  placeholder,
  maxLength,
  rows = 3,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  maxLength?: number
  rows?: number
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      maxLength={maxLength}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus-visible:border-[var(--color-brand-400)] focus-visible:ring-2 focus-visible:ring-[var(--color-brand-100)]"
    />
  )
}

export function CharCounter({ value, max }: { value: string; max: number }) {
  const over = value.length > max
  return (
    <span
      className={cn(
        "text-[11px] tabular-nums",
        over ? "text-red-500" : "text-slate-400",
      )}
    >
      {value.length}/{max}
    </span>
  )
}

export function Select({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-900 outline-none focus-visible:border-[var(--color-brand-400)] focus-visible:ring-2 focus-visible:ring-[var(--color-brand-100)]"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  )
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 99,
  label,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  label?: string
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
      {label && <span className="text-[12px] font-medium text-slate-600">{label}</span>}
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Decrease"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          −
        </button>
        <span className="w-7 text-center text-[14px] font-bold tabular-nums text-slate-900">
          {value}
        </span>
        <button
          type="button"
          aria-label="Increase"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          +
        </button>
      </div>
    </div>
  )
}

export function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean
  onChange: (v: boolean) => void
  label?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex items-center gap-2"
    >
      <span
        className={cn(
          "relative h-5 w-9 rounded-full transition-colors",
          on ? "bg-emerald-500" : "bg-slate-200",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all",
            on ? "left-[18px]" : "left-0.5",
          )}
        />
      </span>
      {label && <span className="text-[12px] font-medium text-slate-700">{label}</span>}
    </button>
  )
}

export function ToggleChip({
  on,
  onClick,
  children,
}: {
  on: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors",
        on
          ? "border-[var(--color-brand-100)] bg-[var(--brand-soft)] text-[var(--brand)]"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
      )}
    >
      {on && <Check className="h-3 w-3" />}
      {children}
    </button>
  )
}

export function RemovableChip({
  label,
  onRemove,
}: {
  label: string
  onRemove: () => void
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-[12px] font-semibold text-violet-700">
      {label}
      <button type="button" aria-label={`Remove ${label}`} onClick={onRemove}>
        <X className="h-3 w-3 text-violet-400 hover:text-violet-700" />
      </button>
    </span>
  )
}

export function AddChipInput({
  placeholder,
  onAdd,
}: {
  placeholder: string
  onAdd: (v: string) => void
}) {
  const [v, setV] = React.useState("")
  const submit = () => {
    const t = v.trim()
    if (t) {
      onAdd(t)
      setV("")
    }
  }
  return (
    <div className="flex items-center gap-2">
      <input
        value={v}
        placeholder={placeholder}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            submit()
          }
        }}
        className="h-9 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-900 outline-none placeholder:text-slate-400 focus-visible:border-[var(--color-brand-400)] focus-visible:ring-2 focus-visible:ring-[var(--color-brand-100)]"
      />
      <button
        type="button"
        onClick={submit}
        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-900 px-3 text-[12px] font-semibold text-white hover:bg-slate-800"
      >
        <Plus className="h-3.5 w-3.5" /> Add
      </button>
    </div>
  )
}

export function ScoreRing({
  value,
  size = 72,
  label,
  colour = "#2563EB",
}: {
  value: number
  size?: number
  label?: string
  colour?: string
}) {
  const r = (size - 8) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, value))
  const offset = c - (pct / 100) * c
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={6} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={colour}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <span
        className="text-[15px] font-bold text-slate-900"
        style={{ marginTop: -size / 2 - 10, marginBottom: size / 2 - 10 }}
      >
        {Math.round(pct)}
      </span>
      {label && <span className="mt-1 text-[11px] font-medium text-slate-500">{label}</span>}
    </div>
  )
}

export function Pill({
  tone = "slate",
  children,
}: {
  tone?: "slate" | "emerald" | "amber" | "blue" | "violet" | "red"
  children: React.ReactNode
}) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-600",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-[var(--brand-soft)] text-[var(--brand)]",
    violet: "bg-violet-50 text-violet-700",
    red: "bg-red-50 text-red-700",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        tones[tone],
      )}
    >
      {children}
    </span>
  )
}
