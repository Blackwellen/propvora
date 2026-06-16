"use client"

import React, { useId } from "react"
import { cn } from "@/lib/utils"
import { phoneDialCode, phonePlaceholder, isPlausiblePhone } from "@/lib/i18n/phone-format"

/**
 * PhoneInput — country-aware phone field. Shows the dialling prefix for the
 * country and a plausible placeholder; flags an obviously-invalid number on blur.
 */
export function PhoneInput({
  countryCode,
  value,
  onChange,
  label = "Phone number",
  disabled,
  className,
}: {
  countryCode: string
  value: string
  onChange: (next: string) => void
  label?: string
  disabled?: boolean
  className?: string
}) {
  const id = useId()
  const dial = phoneDialCode(countryCode)
  const [touched, setTouched] = React.useState(false)
  const invalid = touched && value.trim().length > 0 && !isPlausiblePhone(value, countryCode)

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[12px] font-medium text-slate-600">
        {label}
      </label>
      <div
        className={cn(
          "flex items-stretch rounded-xl border bg-white overflow-hidden focus-within:ring-2 focus-within:ring-blue-100",
          invalid ? "border-red-300" : "border-slate-200 focus-within:border-blue-400"
        )}
      >
        {dial && (
          <span className="inline-flex items-center px-3 bg-slate-50 border-r border-slate-200 text-[13px] text-slate-500 select-none">
            {dial}
          </span>
        )}
        <input
          id={id}
          type="tel"
          inputMode="tel"
          disabled={disabled}
          value={value}
          placeholder={phonePlaceholder(countryCode)}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setTouched(true)}
          className="flex-1 h-10 px-3 text-[13px] text-slate-900 placeholder:text-slate-300 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
        />
      </div>
      {invalid && (
        <p className="text-[11px] text-red-500">
          That doesn’t look like a valid {countryCode} phone number.
        </p>
      )}
    </div>
  )
}
