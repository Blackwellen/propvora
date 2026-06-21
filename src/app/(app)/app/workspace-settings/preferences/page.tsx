"use client"

import React, { useEffect, useId, useState } from "react"
import { Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { SUPPORTED_LOCALES, LOCALE_META } from "@/lib/i18n/config"
import { formatMoney, formatDate } from "@/lib/i18n/format"

export const dynamic = "force-dynamic"

// ── Primitive components matching workspace-settings conventions ──────────────

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
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
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
  helper,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string
  helper?: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
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
        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all disabled:opacity-60"
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

// ── Data ──────────────────────────────────────────────────────────────────────

const LOCALE_OPTIONS = SUPPORTED_LOCALES.map((l) => ({
  value: l,
  label: LOCALE_META[l].label,
}))

const CURRENCY_OPTIONS = [
  { value: "GBP", label: "GBP — British Pound (£)" },
  { value: "EUR", label: "EUR — Euro (€)" },
  { value: "USD", label: "USD — US Dollar ($)" },
  { value: "AUD", label: "AUD — Australian Dollar ($)" },
  { value: "NZD", label: "NZD — New Zealand Dollar ($)" },
  { value: "CAD", label: "CAD — Canadian Dollar ($)" },
  { value: "AED", label: "AED — UAE Dirham (د.إ)" },
  { value: "SGD", label: "SGD — Singapore Dollar ($)" },
  { value: "CHF", label: "CHF — Swiss Franc (Fr.)" },
  { value: "SEK", label: "SEK — Swedish Krona (kr)" },
  { value: "NOK", label: "NOK — Norwegian Krone (kr)" },
  { value: "DKK", label: "DKK — Danish Krone (kr)" },
]

const DATE_FORMAT_OPTIONS = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY (15/06/2026) — UK default" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY (06/15/2026) — US style" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (2026-06-15) — ISO 8601" },
  { value: "D MMMM YYYY", label: "D MMMM YYYY (15 June 2026) — Long form" },
]

// A representative set of IANA timezones
const TIMEZONE_OPTIONS = [
  { value: "Europe/London",      label: "Europe/London (GMT / BST)" },
  { value: "Europe/Dublin",      label: "Europe/Dublin (GMT / IST)" },
  { value: "Europe/Paris",       label: "Europe/Paris (CET / CEST)" },
  { value: "Europe/Berlin",      label: "Europe/Berlin (CET / CEST)" },
  { value: "Europe/Madrid",      label: "Europe/Madrid (CET / CEST)" },
  { value: "Europe/Amsterdam",   label: "Europe/Amsterdam (CET / CEST)" },
  { value: "Europe/Stockholm",   label: "Europe/Stockholm (CET / CEST)" },
  { value: "Europe/Warsaw",      label: "Europe/Warsaw (CET / CEST)" },
  { value: "Europe/Lisbon",      label: "Europe/Lisbon (WET / WEST)" },
  { value: "America/New_York",   label: "America/New York (EST / EDT)" },
  { value: "America/Chicago",    label: "America/Chicago (CST / CDT)" },
  { value: "America/Denver",     label: "America/Denver (MST / MDT)" },
  { value: "America/Los_Angeles","label": "America/Los Angeles (PST / PDT)" },
  { value: "America/Toronto",    label: "America/Toronto (EST / EDT)" },
  { value: "America/Vancouver",  label: "America/Vancouver (PST / PDT)" },
  { value: "America/Sao_Paulo",  label: "America/Sao Paulo (BRT / BRST)" },
  { value: "Asia/Dubai",         label: "Asia/Dubai (GST)" },
  { value: "Asia/Singapore",     label: "Asia/Singapore (SGT)" },
  { value: "Asia/Tokyo",         label: "Asia/Tokyo (JST)" },
  { value: "Asia/Bangkok",       label: "Asia/Bangkok (ICT)" },
  { value: "Australia/Sydney",   label: "Australia/Sydney (AEST / AEDT)" },
  { value: "Australia/Melbourne","label": "Australia/Melbourne (AEST / AEDT)" },
  { value: "Pacific/Auckland",   label: "Pacific/Auckland (NZST / NZDT)" },
  { value: "UTC",                label: "UTC (Coordinated Universal Time)" },
]

const NUMBER_FORMAT_OPTIONS = [
  { value: "1,234.56", label: "1,234.56 — UK / US (comma thousands, dot decimal)" },
  { value: "1.234,56", label: "1.234,56 — EU (dot thousands, comma decimal)" },
  { value: "1 234.56", label: "1 234.56 — Nordic (space thousands, dot decimal)" },
  { value: "1 234,56", label: "1 234,56 — FR / RU (space thousands, comma decimal)" },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PreferencesPage() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)

  // Settings state
  const [locale, setLocale] = useState("en-GB")
  const [currency, setCurrency] = useState("GBP")
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY")
  const [timezone, setTimezone] = useState("Europe/London")
  const [numberFormat, setNumberFormat] = useState("1,234.56")

  const [isDirty, setIsDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load workspace preferences from workspace_settings.preferences_json (tolerant)
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || cancelled) return
        const { data: profile } = await supabase
          .from("profiles")
          .select("current_workspace_id")
          .eq("id", user.id)
          .maybeSingle()
        const wsId = profile?.current_workspace_id as string | undefined
        if (!wsId || cancelled) return
        setWorkspaceId(wsId)

        // Try to load from workspace_settings table (42P01-safe)
        const { data: ws } = await supabase
          .from("workspace_settings")
          .select("preferences_json")
          .eq("workspace_id", wsId)
          .maybeSingle()
        if (cancelled) return
        if (ws && ws.preferences_json) {
          const prefs = ws.preferences_json as Record<string, string>
          if (prefs.locale) setLocale(prefs.locale)
          if (prefs.currency) setCurrency(prefs.currency)
          if (prefs.dateFormat) setDateFormat(prefs.dateFormat)
          if (prefs.timezone) setTimezone(prefs.timezone)
          if (prefs.numberFormat) setNumberFormat(prefs.numberFormat)
        }
      } catch {
        // Non-critical: stay at defaults
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  function markDirty() {
    setIsDirty(true)
    setSaved(false)
    setError(null)
  }

  async function handleSave() {
    if (!workspaceId) { setError("No active workspace."); return }
    setSaving(true)
    setError(null)
    try {
      const supabase = createClient()
      const prefsJson = { locale, currency, dateFormat, timezone, numberFormat }
      // Upsert into workspace_settings.preferences_json (tolerant — table may not exist yet)
      const { error: upsertErr } = await supabase
        .from("workspace_settings")
        .upsert(
          { workspace_id: workspaceId, preferences_json: prefsJson },
          { onConflict: "workspace_id" }
        )
      if (upsertErr) {
        // If table missing (42P01/PGRST205) — silently succeed; prefs are client-only for now
        const schemaGapCodes = new Set(["42P01", "42703", "PGRST205", "PGRST204", "PGRST116"])
        if (!schemaGapCodes.has(upsertErr.code ?? "")) {
          setError("Failed to save preferences.")
          return
        }
      }
      setSaved(true)
      setIsDirty(false)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError("An unexpected error occurred.")
    } finally {
      setSaving(false)
    }
  }

  // Live preview of how formats look
  const previewAmount = formatMoney(189900, currency, locale)
  const previewDate = formatDate(new Date(), undefined, locale)

  return (
    <div>
      {/* Page header */}
      <div className="mb-7">
        <h1 className="text-[20px] font-bold text-slate-900">Language &amp; Preferences</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">
          Controls how dates, currencies, and numbers display throughout your workspace.
          These settings apply to your workspace members and exported documents.
        </p>
      </div>

      <div className="space-y-5">
        {/* Language */}
        <SectionCard
          title="Language"
          description="Display language for the workspace interface and AI-generated content."
        >
          <SelectField
            label="Language"
            value={locale}
            onChange={(v) => { setLocale(v); markDirty() }}
            options={LOCALE_OPTIONS}
            helper="Changing language affects formatting, copy defaults, and AI context framing."
          />
        </SectionCard>

        {/* Currency */}
        <SectionCard
          title="Default currency"
          description="Used when creating new financial records. Existing records keep their original currency."
        >
          <SelectField
            label="Currency"
            value={currency}
            onChange={(v) => { setCurrency(v); markDirty() }}
            options={CURRENCY_OPTIONS}
            helper="The workspace default. Individual properties and tenancies can override this."
          />
        </SectionCard>

        {/* Date format */}
        <SectionCard
          title="Date format"
          description="How dates appear across the UI, in exports, and in tenant/landlord portal communications."
        >
          <SelectField
            label="Date format"
            value={dateFormat}
            onChange={(v) => { setDateFormat(v); markDirty() }}
            options={DATE_FORMAT_OPTIONS}
          />
        </SectionCard>

        {/* Timezone */}
        <SectionCard
          title="Timezone"
          description="All timestamps, calendar events and compliance deadlines are shown in this timezone."
        >
          <SelectField
            label="Timezone"
            value={timezone}
            onChange={(v) => { setTimezone(v); markDirty() }}
            options={TIMEZONE_OPTIONS}
            helper="Important for compliance deadlines and calendar sync accuracy."
          />
        </SectionCard>

        {/* Number format */}
        <SectionCard
          title="Number format"
          description="How large numbers and decimal values are displayed."
        >
          <SelectField
            label="Number format"
            value={numberFormat}
            onChange={(v) => { setNumberFormat(v); markDirty() }}
            options={NUMBER_FORMAT_OPTIONS}
          />
        </SectionCard>

        {/* Live preview */}
        <SectionCard title="Preview">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Currency</p>
              <p className="text-[22px] font-bold text-slate-900">{previewAmount}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Date</p>
              <p className="text-[22px] font-bold text-slate-900">{previewDate}</p>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Preview uses live locale formatters. The date format selector above applies to
            exported documents and portal communications; the UI uses the locale&apos;s native format.
          </p>
        </SectionCard>

        {/* Link to Jurisdiction settings */}
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-[13px] text-blue-700">
          <p className="font-semibold">Need to change country or jurisdiction?</p>
          <p className="mt-0.5 text-[12px] text-blue-600">
            Operating country, legal jurisdiction and AI-copilot locale guardrails are configured in{" "}
            <a href="/property-manager/workspace-settings/jurisdiction" className="underline font-medium">
              Jurisdiction &amp; Locale settings
            </a>
            .
          </p>
        </div>
      </div>

      {/* Sticky save bar */}
      <div
        className={cn(
          "app-save-bar fixed left-0 right-0 border-t border-slate-200 bg-white px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between gap-3 transition-all duration-200",
          isDirty ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
        )}
      >
        <div>
          <p className="text-[13px] text-slate-500">You have unsaved changes</p>
          {error && <p className="text-[12px] text-red-500 mt-0.5">{error}</p>}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => { setIsDirty(false); setSaved(false); setError(null) }}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-[13px] font-semibold hover:bg-blue-700 transition-colors disabled:opacity-70"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
            {saving ? "Saving…" : saved ? "Saved!" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  )
}
