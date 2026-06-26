"use client"

import React, { useState, useEffect } from "react"
import { Globe, Check, Loader2, Info, Lock } from "lucide-react"
import { useWorkspace } from "@/providers/AuthProvider"
import { normaliseTier } from "@/lib/billing/plans"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const FEATURES = [
  "Hide 'Powered by Propvora' branding",
  "Custom brand name across platform",
  "Custom support email in notifications",
  "Branded landlord & tenant portals",
  "Custom invoice and document headers",
  "Custom login screen (Enterprise)",
]

// Plans eligible for white-label
const ELIGIBLE_TIERS = ["pro_agency", "enterprise"]
const TIER_ORDER = ["starter", "operator", "scale", "pro_agency", "enterprise"]

interface WhiteLabelSettings {
  wl_enabled: boolean
  wl_brand_name: string
  wl_hide_powered_by: boolean
  wl_custom_support_email: string
  wl_custom_login_headline: string
  wl_portal_custom_name: string
}

const DEFAULTS: WhiteLabelSettings = {
  wl_enabled: false,
  wl_brand_name: "",
  wl_hide_powered_by: true,
  wl_custom_support_email: "",
  wl_custom_login_headline: "",
  wl_portal_custom_name: "",
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  helper,
  disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  helper?: string
  disabled?: boolean
}) {
  return (
    <div>
      <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "w-full px-3.5 py-2.5 rounded-xl border text-[13px] text-slate-800 bg-white focus:outline-none focus:border-[#2563EB] transition-all",
          disabled ? "border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed" : "border-slate-200"
        )}
      />
      {helper && <p className="text-[11px] text-slate-400 mt-1">{helper}</p>}
    </div>
  )
}

function ToggleRow({
  label,
  desc,
  enabled,
  onToggle,
  disabled,
}: {
  label: string
  desc: string
  enabled: boolean
  onToggle: () => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-slate-100 last:border-0">
      <div className="flex-1 pr-4">
        <p className={cn("text-[13px] font-medium", disabled ? "text-slate-400" : "text-slate-800")}>{label}</p>
        <p className="text-[11.5px] text-slate-400 mt-0.5">{desc}</p>
      </div>
      <button
        onClick={disabled ? undefined : onToggle}
        disabled={disabled}
        aria-pressed={enabled}
        className={cn(
          "w-10 h-6 rounded-full transition-colors shrink-0 relative",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
          enabled ? "bg-[#2563EB]" : "bg-slate-200"
        )}
      >
        <span className={cn(
          "absolute top-1 block w-4 h-4 rounded-full bg-white shadow-sm transition-transform",
          enabled ? "translate-x-5" : "translate-x-1"
        )} />
      </button>
    </div>
  )
}

export default function WhiteLabelPage() {
  const { workspace } = useWorkspace()
  const tier = normaliseTier(workspace?.plan as string | undefined)
  const tierRank = TIER_ORDER.indexOf(tier)
  const isEligible = ELIGIBLE_TIERS.includes(tier)

  const [settings, setSettings] = useState<WhiteLabelSettings>(DEFAULTS)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDirty, setIsDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: profile } = await supabase
          .from("profiles")
          .select("current_workspace_id")
          .eq("id", user.id)
          .maybeSingle()
        const wsId = profile?.current_workspace_id
        if (!wsId) return
        setWorkspaceId(wsId)
        const { data: ws } = await supabase
          .from("workspaces")
          .select("white_label_settings")
          .eq("id", wsId)
          .maybeSingle()
        if (ws?.white_label_settings && typeof ws.white_label_settings === "object") {
          setSettings((prev) => ({ ...prev, ...ws.white_label_settings as Partial<WhiteLabelSettings> }))
        }
      } catch { /* defaults */ }
      setLoading(false)
    }
    load()
  }, [])

  function set<K extends keyof WhiteLabelSettings>(key: K, value: WhiteLabelSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setIsDirty(true)
    setSaved(false)
    setSaveError(null)
  }

  async function handleSave() {
    if (!workspaceId) { setSaveError("No active workspace."); return }
    setSaving(true)
    setSaveError(null)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("workspaces")
        .update({
          white_label_settings: settings,
          updated_at: new Date().toISOString(),
        })
        .eq("id", workspaceId)
      if (error) {
        setSaveError("Failed to save white-label settings. Please try again.")
        return
      }
      setSaved(true)
      setIsDirty(false)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setSaveError("Failed to save white-label settings.")
    } finally {
      setSaving(false)
    }
  }

  // Upsell state for lower tiers
  if (!isEligible) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-slate-900">White Label</h1>
          <p className="text-[13.5px] text-slate-500 mt-1">Custom branding, portals and identity for your business</p>
        </div>

        <div className="bg-white rounded-2xl border border-violet-200 p-10 text-center max-w-[540px] mx-auto mt-8">
          <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-5">
            <Globe className="w-7 h-7 text-[#7C3AED]" />
          </div>
          <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-violet-100 text-violet-700 uppercase tracking-wide">
            Pro / Agency plan or add-on required
          </span>
          <h2 className="text-[18px] font-black text-slate-900 mt-4 mb-2">White Label Branding</h2>
          <p className="text-[13.5px] text-slate-500 mb-6">
            Remove Propvora branding, use your own brand name, configure custom support email, and deliver a fully branded experience to your landlords and tenants.
          </p>
          <div className="text-left bg-slate-50 rounded-xl p-4 mb-6 space-y-2.5">
            {FEATURES.map(f => (
              <div key={f} className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 text-[#7C3AED]" />
                </div>
                <p className="text-[12.5px] text-slate-700">{f}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <a
              href="/property-manager/workspace-settings/subscription"
              className="flex-1 py-3 rounded-xl bg-[#7C3AED] text-white text-[13px] font-semibold hover:bg-[#6d28d9] transition-colors text-center"
            >
              Upgrade to Pro / Agency
            </a>
            <a
              href="/property-manager/workspace-settings/addons"
              className="flex-1 py-3 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-center"
            >
              View add-ons
            </a>
          </div>
        </div>

        {/* Grayed-out preview */}
        <div className="mt-8 opacity-40 pointer-events-none max-w-[540px] mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-[14px] font-bold text-slate-900 mb-4">White Label Settings</h3>
            {["Custom brand name", "Hide Propvora branding", "Custom support email", "Custom portal name"].map(field => (
              <div key={field} className="py-3 border-b border-slate-100 last:border-0">
                <div className="h-3 bg-slate-200 rounded w-40 mb-2" />
                <div className="h-8 bg-slate-100 rounded-xl w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Eligible plan — show full settings
  return (
    <div className="pb-20">
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-slate-900">White Label</h1>
        <p className="text-[13.5px] text-slate-500 mt-1">Customise the branding experience for your team, landlords and tenants</p>
      </div>

      {/* Info */}
      <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-[12.5px] text-blue-700">
        <Info className="w-4 h-4 mt-0.5 shrink-0" />
        White-label branding is active on your plan. Changes apply across the app, portals, emails and documents.
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Master toggle */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <ToggleRow
              label="Enable white-label branding"
              desc="Apply custom branding across the app, portals, emails and documents"
              enabled={settings.wl_enabled}
              onToggle={() => set("wl_enabled", !settings.wl_enabled)}
            />
          </div>

          {/* Brand identity */}
          <div className={cn("bg-white rounded-2xl border border-slate-200 p-5", !settings.wl_enabled && "opacity-60")}>
            <h3 className="text-[14px] font-bold text-slate-900 mb-4">Brand Identity</h3>
            <div className="space-y-4">
              <InputField
                label="Custom brand name"
                value={settings.wl_brand_name}
                onChange={(v) => set("wl_brand_name", v)}
                placeholder="e.g. Smith Property Group"
                helper="Replaces 'Propvora' in headings and emails"
                disabled={!settings.wl_enabled}
              />
              <InputField
                label="Custom support email"
                value={settings.wl_custom_support_email}
                onChange={(v) => set("wl_custom_support_email", v)}
                placeholder="e.g. support@yourcompany.com"
                helper="Shown to tenants and landlords in place of the default support address"
                disabled={!settings.wl_enabled}
              />
              <InputField
                label="Portal custom name"
                value={settings.wl_portal_custom_name}
                onChange={(v) => set("wl_portal_custom_name", v)}
                placeholder="e.g. Smith Property Portal"
                helper="Name shown on the tenant and landlord portal login screens"
                disabled={!settings.wl_enabled}
              />
            </div>
          </div>

          {/* Visibility toggles */}
          <div className={cn("bg-white rounded-2xl border border-slate-200 p-5", !settings.wl_enabled && "opacity-60")}>
            <h3 className="text-[14px] font-bold text-slate-900 mb-1">Branding Visibility</h3>
            <p className="text-[12px] text-slate-500 mb-4">Control where Propvora attribution appears</p>
            <ToggleRow
              label="Hide 'Powered by Propvora' footer"
              desc="Remove the Propvora attribution from portals, emails and documents"
              enabled={settings.wl_hide_powered_by}
              onToggle={() => set("wl_hide_powered_by", !settings.wl_hide_powered_by)}
              disabled={!settings.wl_enabled}
            />
          </div>

          {/* Login screen (enterprise only) */}
          <div className={cn(
            "bg-white rounded-2xl border p-5",
            tier === "enterprise" ? "border-slate-200" : "border-slate-100 opacity-60"
          )}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[14px] font-bold text-slate-900">Custom Login Screen</h3>
                <p className="text-[12px] text-slate-500 mt-0.5">Enterprise plan only</p>
              </div>
              {tier !== "enterprise" && (
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                  <Lock className="w-3.5 h-3.5" />
                  Enterprise
                </div>
              )}
            </div>
            <InputField
              label="Login screen headline"
              value={settings.wl_custom_login_headline}
              onChange={(v) => set("wl_custom_login_headline", v)}
              placeholder="e.g. Welcome to Smith Property Group"
              helper="Shown on the custom login page instead of the default heading"
              disabled={tier !== "enterprise" || !settings.wl_enabled}
            />
          </div>
        </div>
      )}

      {/* Sticky save bar */}
      {isDirty && (
        <div className="app-save-bar fixed left-0 right-0 bg-white border-t border-slate-200 px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between gap-3 shadow-lg">
          <div>
            <p className="text-[13px] text-slate-600">You have unsaved changes</p>
            {saveError && <p className="text-[12px] text-red-500 mt-0.5">{saveError}</p>}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setIsDirty(false); setSaveError(null) }}
              className="px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#2563EB] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] transition-colors disabled:opacity-70"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
              {saving ? "Saving…" : saved ? "Saved!" : "Save changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
