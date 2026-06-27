"use client"

import React, { useId } from "react"
import { ToggleLeft, ToggleRight } from "lucide-react"

export function InputField({
  label,
  value,
  onChange,
  required,
  placeholder,
  type = "text",
  prefix,
  hint,
  error,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  placeholder?: string
  type?: string
  prefix?: string
  hint?: string
  error?: string
}) {
  const fieldId = useId()
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-slate-500 text-sm select-none pointer-events-none">{prefix}</span>
        )}
        <input
          id={fieldId}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={[
            "w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition",
            "focus:ring-2 focus:ring-[var(--brand)] focus:border-[var(--brand)]",
            prefix ? "pl-7" : "",
            error ? "border-red-400" : "border-slate-200",
          ].join(" ")}
        />
      </div>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

export function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  const fieldId = useId()
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className="text-sm font-medium text-slate-700">{label}</label>
      <textarea
        id={fieldId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-[var(--brand)] focus:border-[var(--brand)] resize-none"
      />
    </div>
  )
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
}) {
  const fieldId = useId()
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className="text-sm font-medium text-slate-700">{label}</label>
      <select
        id={fieldId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-[var(--brand)] focus:border-[var(--brand)]"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

export function ToggleSwitch({
  label,
  checked,
  onChange,
  description,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  description?: string
}) {
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="mt-0.5 flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 rounded"
        aria-pressed={checked}
        aria-label={label}
      >
        {checked ? (
          <div style={{ color: "#2563EB" }}><ToggleRight className="w-8 h-8" /></div>
        ) : (
          <div style={{ color: "var(--text-disabled)" }}><ToggleLeft className="w-8 h-8" /></div>
        )}
      </button>
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {description && <p className="text-xs text-slate-400">{description}</p>}
      </div>
    </div>
  )
}

export function ChipGrid({
  options,
  selected,
  onChange,
}: {
  options: string[]
  selected: string[]
  onChange: (v: string[]) => void
}) {
  const toggle = (opt: string) => {
    onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt])
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt)
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            aria-pressed={active}
            className={[
              "px-3 py-1.5 rounded-full text-xs font-medium border transition",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-1",
              active
                ? "bg-[var(--brand)] border-[var(--brand)] text-white"
                : "bg-white border-slate-200 text-slate-600 hover:border-[var(--color-brand-300)]",
            ].join(" ")}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

export function GroupedChipGrid({
  groups,
  selected,
  onChange,
}: {
  groups: { group: string; options: string[] }[]
  selected: string[]
  onChange: (v: string[]) => void
}) {
  const toggle = (opt: string) => {
    onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt])
  }
  return (
    <div className="flex flex-col gap-3">
      {groups.map((grp) => (
        <div key={grp.group} className="flex flex-col gap-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{grp.group}</p>
          <div className="flex flex-wrap gap-2">
            {grp.options.map((opt) => {
              const active = selected.includes(opt)
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggle(opt)}
                  aria-pressed={active}
                  className={[
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-1",
                    active
                      ? "bg-[var(--brand)] border-[var(--brand)] text-white"
                      : "bg-white border-slate-200 text-slate-600 hover:border-[var(--color-brand-300)]",
                  ].join(" ")}
                >
                  {opt}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
