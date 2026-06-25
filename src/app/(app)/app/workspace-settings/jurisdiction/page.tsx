"use client"

import React, { useEffect, useState, useId } from "react"
import { Check, Loader2, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import {
  CountryPicker,
  JurisdictionStatusBanner,
  JurisdictionDisclaimer,
} from "@/components/jurisdiction"
import { SUPPORTED_LOCALES, LOCALE_META } from "@/lib/i18n/config"
import type { SelectableCountry, WorkspaceJurisdiction } from "@/lib/international/workspace-jurisdiction"

/* ------------------------------------------------------------------ */
/* Section card (matches the workspace-settings convention)            */
/* ------------------------------------------------------------------ */
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
  { value: "SAR", label: "SAR — Saudi Riyal (﷼)" },
  { value: "CHF", label: "CHF — Swiss Franc (CHF)" },
  { value: "SEK", label: "SEK — Swedish Krona (kr)" },
  { value: "DKK", label: "DKK — Danish Krone (kr)" },
  { value: "CZK", label: "CZK — Czech Koruna (Kč)" },
]

const LOCALE_OPTIONS = SUPPORTED_LOCALES.map((l) => ({
  value: l,
  label: LOCALE_META[l].label,
}))

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
export default function JurisdictionSettingsPage() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [countries, setCountries] = useState<SelectableCountry[]>([])
  const [current, setCurrent] = useState<WorkspaceJurisdiction | null>(null)
  const [canEdit, setCanEdit] = useState(false)

  const [countryCode, setCountryCode] = useState("GB")
  const [currency, setCurrency] = useState("GBP")
  const [locale, setLocale] = useState("en-GB")
  // Sub-jurisdiction within GB: England & Wales (EW), Scotland (SCT), Northern
  // Ireland (NI). Drives the compliance requirement pack for UK workspaces.
  const [region, setRegion] = useState("EW")
  // The region as last loaded/saved from the server — used to restore on Discard
  // (region isn't part of the WorkspaceJurisdiction `current` object).
  const [loadedRegion, setLoadedRegion] = useState("EW")

  const [loadError, setLoadError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Load current workspace id, then fetch jurisdiction state from the API.
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return
        const { data: profile } = await supabase
          .from("profiles")
          .select("current_workspace_id")
          .eq("id", user.id)
          .maybeSingle()
        const wsId = profile?.current_workspace_id as string | undefined
        if (!wsId) {
          if (!cancelled) setLoadError("No active workspace found.")
          return
        }
        if (cancelled) return
        setWorkspaceId(wsId)

        const res = await fetch(`/api/workspace/jurisdiction?workspaceId=${encodeURIComponent(wsId)}`)
        if (!res.ok) {
          if (!cancelled) setLoadError("Failed to load jurisdiction settings.")
          return
        }
        const json = (await res.json()) as {
          current: WorkspaceJurisdiction
          region?: string | null
          countries: SelectableCountry[]
          canEdit: boolean
        }
        if (cancelled) return
        setCurrent(json.current)
        setCountries(json.countries.length ? json.countries : fallbackGb())
        setCanEdit(json.canEdit)
        setCountryCode(json.current.countryCode || "GB")
        setCurrency(json.current.currency || "GBP")
        setLocale(json.current.locale || "en-GB")
        setRegion(json.region || "EW")
        setLoadedRegion(json.region || "EW")
      } catch {
        if (!cancelled) setLoadError("Could not load jurisdiction settings.")
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  function fallbackGb(): SelectableCountry[] {
    return [
      {
        code: "GB",
        name: "United Kingdom",
        defaultCurrency: "GBP",
        defaultLocale: "en-GB",
        legalStatus: "reviewed",
        taxStatus: "reviewed",
        offerStatus: "offer",
      },
    ]
  }

  function handleCountryChange(code: string) {
    setCountryCode(code)
    const pack = countries.find((c) => c.code === code)
    if (pack?.defaultCurrency) setCurrency(pack.defaultCurrency)
    if (pack?.defaultLocale) {
      // Snap to a supported locale if the pack default isn't shipped yet.
      const supported = LOCALE_OPTIONS.some((o) => o.value === pack.defaultLocale)
      if (supported) setLocale(pack.defaultLocale)
    }
    setIsDirty(true)
    setSaved(false)
    setSaveError(null)
  }

  // Preview the chosen country's status for the live banner/disclaimer.
  const previewPack = countries.find((c) => c.code === countryCode)
  const previewStatus = previewPack
    ? // worst-of legal/tax as the effective preview
      previewPack.legalStatus === "reviewed" && previewPack.taxStatus === "reviewed"
      ? "reviewed"
      : "research_only"
    : current?.effectiveStatus ?? "research_only"

  const previewJurisdiction = {
    countryCode,
    countryName: previewPack?.name ?? current?.countryName ?? null,
    effectiveStatus: previewStatus as WorkspaceJurisdiction["effectiveStatus"],
    currency,
    locale,
  }

  async function handleSave() {
    if (!workspaceId) {
      setSaveError("No active workspace found.")
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch("/api/workspace/jurisdiction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, countryCode, currency, locale, region: countryCode === "GB" ? region : undefined }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setSaveError(
          typeof json.error === "string" ? json.error : "Failed to save jurisdiction."
        )
        return
      }
      if (json.current) setCurrent(json.current as WorkspaceJurisdiction)
      setLoadedRegion(countryCode === "GB" ? region : "EW")
      setSaved(true)
      setIsDirty(false)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setSaveError("An unexpected error occurred.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-[20px] font-bold text-slate-900">Jurisdiction &amp; Locale</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">
          Where your workspace operates. This controls which legal, tax and compliance features
          apply and how the AI Copilot frames guidance.
        </p>
        <a
          href="/property-manager/workspace/global"
          className="inline-flex items-center gap-1.5 mt-2 text-[12.5px] font-medium text-blue-600 hover:text-blue-700"
        >
          View full Global &amp; internationalisation settings →
        </a>
      </div>

      {loadError && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-700">
          {loadError}
        </div>
      )}

      <div className="space-y-5">
        {/* Current status banner (reflects the chosen preview) */}
        <JurisdictionStatusBanner jurisdiction={previewJurisdiction} />

        {/* Picker + locale/currency */}
        <SectionCard
          title="Operating jurisdiction"
          description="Only supported, non-sanctioned countries can be selected. The United Kingdom is the default and is fully supported."
        >
          {!canEdit && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[12.5px] text-slate-500">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              Only a workspace owner or admin can change the jurisdiction.
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <CountryPicker
                countries={countries}
                value={countryCode}
                onChange={handleCountryChange}
                disabled={!canEdit}
              />
            </div>
            {/* UK sub-jurisdiction — England & Wales and Scotland have distinct
                statutory compliance regimes, so the region drives the pack. */}
            {countryCode === "GB" && (
              <div className="md:col-span-2">
                <SelectField
                  label="UK region"
                  value={region}
                  onChange={(v) => {
                    setRegion(v)
                    setIsDirty(true)
                    setSaved(false)
                  }}
                  options={[
                    { value: "EW", label: "England & Wales" },
                    { value: "SCT", label: "Scotland" },
                    { value: "NI", label: "Northern Ireland" },
                  ]}
                  disabled={!canEdit}
                  helper="Scotland has a distinct compliance regime (Repairing Standard, Landlord Registration, interlinked alarms). Drives the Compliance requirement pack."
                />
              </div>
            )}
            <SelectField
              label="Currency"
              value={currency}
              onChange={(v) => {
                setCurrency(v)
                setIsDirty(true)
                setSaved(false)
              }}
              options={CURRENCY_OPTIONS}
              disabled={!canEdit}
              helper="Default currency for new records. Money remains multi-currency per record."
            />
            <SelectField
              label="Language / locale"
              value={locale}
              onChange={(v) => {
                setLocale(v)
                setIsDirty(true)
                setSaved(false)
              }}
              options={LOCALE_OPTIONS}
              disabled={!canEdit}
              helper="Formatting and copy default. en-GB keeps today's UK experience."
            />
          </div>
        </SectionCard>

        {/* Applicable disclaimer for the chosen jurisdiction */}
        <SectionCard
          title="Legal, tax &amp; AI guardrails"
          description="How Propvora and the AI Copilot handle legal, tax and compliance topics in this jurisdiction."
        >
          <JurisdictionDisclaimer status={previewStatus} />
          <p className="text-[12px] text-slate-400 mt-3 leading-relaxed">
            For the United Kingdom the AI may reference UK regulations by name as general
            information. For jurisdictions that aren&apos;t yet reviewed, the AI is restricted to
            generic guidance, won&apos;t cite local statutes, and will always direct you to a
            qualified local professional.
          </p>
        </SectionCard>
      </div>

      {/* Save bar (matches workspace-settings convention) */}
      <div
        className={cn(
          "app-save-bar fixed left-0 right-0 border-t border-slate-200 bg-white px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between gap-3 transition-all duration-200",
          isDirty ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
        )}
      >
        <div>
          <p className="text-[13px] text-slate-500">You have unsaved changes</p>
          {saveError && <p className="text-[12px] text-red-500 mt-0.5">{saveError}</p>}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsDirty(false)
              setSaved(false)
              setSaveError(null)
              if (current) {
                setCountryCode(current.countryCode || "GB")
                setCurrency(current.currency || "GBP")
                setLocale(current.locale || "en-GB")
              }
              setRegion(loadedRegion)
            }}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Discard
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !canEdit}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] transition-colors disabled:opacity-70"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <Check className="w-4 h-4" />
            ) : null}
            {saving ? "Saving…" : saved ? "Saved!" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  )
}
