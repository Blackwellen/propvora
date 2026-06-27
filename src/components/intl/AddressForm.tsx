"use client"

import React, { useId, useMemo } from "react"
import { cn } from "@/lib/utils"
import { addressFields, getAddressModel, type AddressModel } from "@/lib/i18n/address-models"

/**
 * AddressForm — the dynamic, country-aware address engine rendered as a form.
 *
 * Renders the right fields/labels/region picker for a country WITHOUT any
 * per-country branching in callers: pass the resolved address model id (from
 * the country-pack locale context) and a value object; the engine does the rest.
 */
export function AddressForm({
  modelId,
  model: modelProp,
  value,
  onChange,
  disabled,
  className,
}: {
  /** Address model id (e.g. 'gb','us','ca','ae','generic'). */
  modelId?: string
  /** Or pass a resolved model directly (e.g. live-fetched). */
  model?: AddressModel
  value: Record<string, string>
  onChange: (next: Record<string, string>) => void
  disabled?: boolean
  className?: string
}) {
  const baseId = useId()
  const model = useMemo(() => modelProp ?? getAddressModel(modelId), [modelProp, modelId])
  const fields = useMemo(() => addressFields(model), [model])

  function set(key: string, v: string) {
    onChange({ ...value, [key]: v })
  }

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-4", className)}>
      {fields.map((f) => {
        const fid = `${baseId}-${f.key}`
        // Address line 1/2 span the full width for readability.
        const fullWidth = f.key.startsWith("address_line")
        return (
          <div key={f.key} className={cn("flex flex-col gap-1.5", fullWidth && "sm:col-span-2")}>
            <label htmlFor={fid} className="text-[12px] font-medium text-slate-600">
              {f.label}
              {f.required && <span className="text-red-500"> *</span>}
            </label>
            {f.type === "select" ? (
              <select
                id={fid}
                disabled={disabled}
                value={value[f.key] ?? ""}
                onChange={(e) => set(f.key, e.target.value)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-900 focus:border-[var(--color-brand-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-100)] disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">Select {model.regionLabel ?? "region"}…</option>
                {(f.options ?? []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={fid}
                type="text"
                disabled={disabled}
                required={f.required}
                value={value[f.key] ?? ""}
                placeholder={model.example[f.key] ?? ""}
                onChange={(e) => set(f.key, e.target.value)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-900 placeholder:text-slate-300 focus:border-[var(--color-brand-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-100)] disabled:bg-slate-50 disabled:text-slate-400"
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
