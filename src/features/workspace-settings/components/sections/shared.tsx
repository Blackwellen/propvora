"use client"

/**
 * Shared primitive components reused across workspace-settings section components.
 * Import individually — do NOT barrel-import the whole file if tree-shaking matters.
 */

import React, { useId } from "react"
import { cn } from "@/lib/utils"

/* ─── ToggleRow ─────────────────────────────────────────────────────────── */
export interface ToggleRowProps {
  label: string
  description?: string
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}

export function ToggleRow({ label, description, checked, onChange, disabled }: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between py-4 border-b border-slate-100 last:border-0">
      <div className="flex-1 pr-4">
        <p className="text-[13px] font-medium text-slate-800">{label}</p>
        {description && (
          <p className="text-[11.5px] text-slate-400 mt-0.5">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          "w-10 h-6 rounded-full transition-colors shrink-0 mt-0.5 disabled:opacity-40",
          checked ? "bg-[var(--brand)]" : "bg-slate-200"
        )}
      >
        <span
          className={cn(
            "block w-4 h-4 rounded-full bg-white shadow-sm transition-transform m-1",
            checked ? "translate-x-4" : "translate-x-0"
          )}
        />
      </button>
    </div>
  )
}

/* ─── InputField ────────────────────────────────────────────────────────── */
export interface InputFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  helper?: string
  readOnly?: boolean
  disabled?: boolean
  required?: boolean
  autoComplete?: string
}

export function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  helper,
  readOnly,
  disabled,
  required,
  autoComplete,
}: InputFieldProps) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        disabled={disabled}
        autoComplete={autoComplete}
        className={cn(
          "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white",
          "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)] transition-all",
          (readOnly || disabled) && "opacity-60 cursor-not-allowed bg-slate-50"
        )}
      />
      {helper && <p className="text-[11px] text-slate-400 mt-1">{helper}</p>}
    </div>
  )
}

/* ─── SelectField ───────────────────────────────────────────────────────── */
export interface SelectFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  helper?: string
  disabled?: boolean
}

export function SelectField({ label, value, onChange, options, helper, disabled }: SelectFieldProps) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
        {label}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white",
          "focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]/20 transition-all",
          disabled && "opacity-60 cursor-not-allowed"
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {helper && <p className="text-[11px] text-slate-400 mt-1">{helper}</p>}
    </div>
  )
}

/* ─── SectionCard ───────────────────────────────────────────────────────── */
export interface SectionCardProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function SectionCard({ title, description, children, className }: SectionCardProps) {
  return (
    <div className={cn("bg-white rounded-2xl border border-slate-200 p-6", className)}>
      <div className="mb-5">
        <h2 className="text-[14px] font-bold text-slate-900">{title}</h2>
        {description && (
          <p className="text-[12px] text-slate-400 mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </div>
  )
}

/* ─── SaveBar ───────────────────────────────────────────────────────────── */
export interface SaveBarProps {
  isDirty: boolean
  isPending: boolean
  saveError?: string | null
  onSave: () => void
  onDiscard: () => void
  saveLabel?: string
  pendingLabel?: string
}

export function SaveBar({
  isDirty,
  isPending,
  saveError,
  onSave,
  onDiscard,
  saveLabel = "Save changes",
  pendingLabel = "Saving…",
}: SaveBarProps) {
  if (!isDirty && !saveError) return null
  return (
    <div className="app-save-bar fixed left-0 right-0 flex items-center justify-between gap-3 px-4 sm:px-8 py-3 sm:py-4 bg-white border-t border-slate-200 shadow-lg">
      <p className="text-[13px] truncate min-w-0">
        {saveError ? (
          <span className="text-red-600">{saveError}</span>
        ) : (
          <span className="text-slate-600">
            <span className="hidden sm:inline">You have unsaved changes</span>
            <span className="sm:hidden">Unsaved changes</span>
          </span>
        )}
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onDiscard}
          className="px-4 py-2 rounded-xl border border-slate-200 text-[13px] text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Discard
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={isPending}
          className="px-5 py-2 rounded-xl bg-[var(--brand)] text-white text-[13px] font-semibold hover:bg-[var(--brand-strong)] transition-colors disabled:opacity-60"
        >
          {isPending ? pendingLabel : saveLabel}
        </button>
      </div>
    </div>
  )
}
