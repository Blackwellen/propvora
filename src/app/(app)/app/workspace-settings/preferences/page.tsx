"use client"

import React, { useEffect, useId, useState, useTransition } from "react"
import { Check, Loader2, Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import { useWorkspace } from "@/providers/AuthProvider"
import { SUPPORTED_LOCALES, LOCALE_META } from "@/lib/i18n/config"
import { saveI18nPreferences } from "./actions"

function SectionCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="mb-5">
        <h2 className="text-[14px] font-bold text-slate-900">{title}</h2>
        {description && <p className="text-[12px] text-slate-400 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
  helper,
  disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  helper?: string
  disabled?: boolean
}) {
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
        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 transition-all disabled:opacity-60"
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

const CURRENCY_OPTIONS = [
  { value: "GBP", label: "GBP — British Pound (£)" },
  { value: "EUR", label: "EUR — Euro (€)" },
  { value: "USD", label: "USD — US Dollar ($)" },
  { value: "AUD", label: "AUD — Australian Dollar ($)" },
  { value: "NZD", label: "NZD — New Zealand Dollar ($)" },
  { value: "CAD", label: "CAD — Canadian Dollar ($)" },
  { value: "AED", label: "AED — UAE Dirham (د.إ)" },
]

const DATE_FORMAT_OPTIONS = [
  { value: "dd/MM/yyyy", label: "DD/MM/YYYY (United Kingdom)" },
  { value: "MM/dd/yyyy", label: "MM/DD/YYYY (United States)" },
  { value: "yyyy-MM-dd", label: "YYYY-MM-DD (ISO 8601)" },
  { value: "dd.MM.yyyy", label: "DD.MM.YYYY (Germany)" },
  { value: "dd-MM-yyyy", label: "DD-MM-YYYY (Netherlands)" },
]

const TIMEZONE_OPTIONS = [
  { value: "Europe/London", label: "Europe/London (UTC+0/+1)" },
  { value: "Europe/Dublin", label: "Europe/Dublin (UTC+0/+1)" },
  { value: "Europe/Paris", label: "Europe/Paris (UTC+1/+2)" },
  { value: "Europe/Berlin", label: "Europe/Berlin (UTC+1/+2)" },
  { value: "America/New_York", label: "America/New_York (UTC-5/-4)" },
  { value: "America/Chicago", label: "America/Chicago (UTC-6/-5)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (UTC-8/-7)" },
  { value: "America/Toronto", label: "America/Toronto (UTC-5/-4)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (UTC+10/+11)" },
  { value: "Australia/Melbourne", label: "Australia/Melbourne (UTC+10/+11)" },
  { value: "Pacific/Auckland", label: "Pacific/Auckland (UTC+12/+13)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (UTC+4)" },
]

const LOCALE_OPTIONS = SUPPORTED_LOCALES.map((l) => ({
  value: l,
  label: LOCALE_META[l].label,
}))

export default function PreferencesPage() {
  const { workspace, refreshWorkspace } = useWorkspace()
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  // Derive initial values from workspace.settings
  const settings = (workspace?.settings as Record<string, unknown> | undefined) ?? {}

  const [currency, setCurrency] = useState(
    (settings.currency as string | undefined) ?? "GBP"
  )
  const [locale, setLocale] = useState(
    (settings.locale as string | undefined) ?? "en-GB"
  )
  const [dateFormat, setDateFormat] = useState(
    (settings.dateFormat as string | undefined) ?? "dd/MM/yyyy"
  )
  const [timezone, setTimezone] = useState(
    (settings.timezone as string | undefined) ?? "Europe/London"
  )

  // Update form fields when workspace loads / changes
  useEffect(() => {
    const s = (workspace?.settings as Record<string, unknown> | undefined) ?? {}
    setCurrency((s.currency as string | undefined) ?? "GBP")
    setLocale((s.locale as string | undefined) ?? "en-GB")
    setDateFormat((s.dateFormat as string | undefined) ?? "dd/MM/yyyy")
    setTimezone((s.timezone as string | undefined) ?? "Europe/London")
  }, [workspace])

  function markDirty() {
    setIsDirty(true)
    setSaved(false)
    setSaveError(null)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaveError(null)
    setSaved(false)

    // Use countryCode from existing workspace settings if available (managed via Jurisdiction page)
    const countryCode = (settings.countryCode as string | undefined) ?? "GB"

    startTransition(async () => {
      try {
        await saveI18nPreferences({ countryCode, currency, locale, dateFormat, timezone })
        await refreshWorkspace()
        setSaved(true)
        setIsDirty(false)
        setTimeout(() => setSaved(false), 3000)
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "Failed to save preferences.")
      }
    })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Preferences</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure localisation, currency and date display for this workspace.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <SectionCard
          title="Display preferences"
          description="Currency, date format and timezone used across all PM workspace pages."
        >
          <div className="space-y-4">
            <SelectField
              label="Currency"
              value={currency}
              onChange={(v) => { setCurrency(v); markDirty() }}
              options={CURRENCY_OPTIONS}
              helper="Controls how all money values are displayed in the PM workspace. Change jurisdiction in Settings → Jurisdiction."
            />
            <SelectField
              label="Locale / language"
              value={locale}
              onChange={(v) => { setLocale(v); markDirty() }}
              options={LOCALE_OPTIONS}
              helper="Affects date, number, and list formatting."
            />
            <SelectField
              label="Date format"
              value={dateFormat}
              onChange={(v) => { setDateFormat(v); markDirty() }}
              options={DATE_FORMAT_OPTIONS}
              helper="How dates are displayed in reports and calendar views."
            />
            <SelectField
              label="Timezone"
              value={timezone}
              onChange={(v) => { setTimezone(v); markDirty() }}
              options={TIMEZONE_OPTIONS}
              helper="Used for deadline calculations, rent chase reminders and calendar events."
            />
          </div>
        </SectionCard>

        {/* Note about jurisdiction */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
          <Globe className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
          <p className="text-[12px] text-blue-700 leading-relaxed">
            To change your workspace country, legal jurisdiction, tax regime or VAT settings, go to{" "}
            <a href="/app/workspace-settings/jurisdiction" className="underline font-medium">
              Settings → Jurisdiction
            </a>
            .
          </p>
        </div>

        {/* Save row */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending || !isDirty}
            className={cn(
              "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all",
              isDirty && !isPending
                ? "bg-[#2563EB] text-white hover:bg-blue-700"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            )}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <Check className="w-4 h-4" />
            ) : null}
            {isPending ? "Saving…" : saved ? "Saved" : "Save preferences"}
          </button>
          {saveError && (
            <p className="text-sm text-red-600">{saveError}</p>
          )}
          {saved && !saveError && (
            <p className="text-sm text-emerald-600">Preferences saved.</p>
          )}
        </div>
      </form>
    </div>
  )
}
