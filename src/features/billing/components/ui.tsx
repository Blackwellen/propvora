"use client"

import React from "react"
import { cn } from "@/lib/utils"

/** White rounded-2xl card matching the workspace house style. */
export function BillingCard({
  title,
  description,
  icon: Icon,
  action,
  className,
  children,
}: {
  title?: string
  description?: string
  icon?: React.ElementType
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("bg-white rounded-2xl border border-slate-200 p-5 sm:p-6", className)}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            {Icon && (
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-blue-600/10 shrink-0">
                <Icon className="w-4 h-4 text-blue-600" />
              </div>
            )}
            <div className="min-w-0">
              {title && <h3 className="text-[14px] font-bold text-slate-900 truncate">{title}</h3>}
              {description && <p className="text-[12px] text-slate-400 mt-0.5">{description}</p>}
            </div>
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

export function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-slate-50 last:border-0">
      <span className="text-[12.5px] text-slate-500">{label}</span>
      <span className="text-[13px] font-medium text-slate-800 text-right">{value}</span>
    </div>
  )
}

type Tone = "blue" | "emerald" | "amber" | "red" | "slate"

const TONE: Record<Tone, string> = {
  blue: "bg-blue-50 text-blue-700 border-blue-100",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
  amber: "bg-amber-50 text-amber-700 border-amber-100",
  red: "bg-red-50 text-red-700 border-red-100",
  slate: "bg-slate-100 text-slate-600 border-slate-200",
}

export function StatusBadge({ tone = "slate", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold", TONE[tone])}>
      {children}
    </span>
  )
}

/** Accessible on/off switch. */
export function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        checked ? "bg-blue-600" : "bg-slate-300",
      )}
    >
      <span
        className={cn(
          "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-[18px]" : "translate-x-[3px]",
        )}
      />
    </button>
  )
}

/** Quantity stepper. */
export function QtyStepper({
  value,
  onChange,
  min = 0,
  max = 9999,
  step = 1,
  disabled,
  suffix,
}: {
  value: number
  onChange: (next: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  suffix?: string
}) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n))
  return (
    <div className="inline-flex items-center gap-1.5">
      <div className="inline-flex items-center rounded-xl border border-slate-200 overflow-hidden">
        <button
          type="button"
          disabled={disabled || value <= min}
          onClick={() => onChange(clamp(value - step))}
          aria-label="Decrease"
          className="px-2.5 py-1 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          −
        </button>
        <span className="px-3 text-[13px] font-semibold text-slate-800 tabular-nums min-w-[2.5rem] text-center">{value}</span>
        <button
          type="button"
          disabled={disabled || value >= max}
          onClick={() => onChange(clamp(value + step))}
          aria-label="Increase"
          className="px-2.5 py-1 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          +
        </button>
      </div>
      {suffix && <span className="text-[12px] text-slate-400">{suffix}</span>}
    </div>
  )
}

export function BillingButton({
  children,
  onClick,
  href,
  variant = "primary",
  disabled,
  type = "button",
  className,
  icon: Icon,
}: {
  children: React.ReactNode
  onClick?: () => void
  href?: string
  variant?: "primary" | "secondary" | "ghost" | "danger"
  disabled?: boolean
  type?: "button" | "submit"
  className?: string
  icon?: React.ElementType
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-[13px] font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
  const styles: Record<string, string> = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "border border-blue-600 text-blue-600 hover:bg-blue-50",
    ghost: "border border-slate-200 text-slate-600 hover:bg-slate-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
  }
  const cls = cn(base, styles[variant], className)
  const content = (
    <>
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </>
  )
  if (href && !disabled) {
    return (
      <a href={href} className={cls}>
        {content}
      </a>
    )
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {content}
    </button>
  )
}

export function SeedNotice({ source }: { source: "live" | "seed" }) {
  if (source === "live") return null
  return (
    <p className="text-[11px] text-slate-400">
      Billing data not yet available. Live figures appear once your subscription is provisioned.
    </p>
  )
}

export function PermissionNotice({ canManage }: { canManage: boolean }) {
  if (canManage) return null
  return (
    <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-[12.5px] text-amber-700">
      You have read-only access to billing. Only workspace owners and admins can make changes.
    </div>
  )
}
