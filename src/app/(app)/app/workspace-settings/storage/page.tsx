"use client"

import React, { useState, useEffect } from "react"
import { HardDrive, CheckSquare, Square, Loader2, Check, Info, Cloud, Zap, Package } from "lucide-react"
import { getWorkspaceSettings, saveWorkspaceSettings, getStorageUsage } from "@/lib/actions/settings"
import { useWorkspace } from "@/providers/AuthProvider"
import { normaliseTier, type PlanTier } from "@/lib/billing/plans"
import { cn } from "@/lib/utils"

const FILE_TYPES = [
  { key: "pdf",   label: "PDF documents" },
  { key: "image", label: "Images (JPG, PNG, WEBP, SVG)" },
  { key: "word",  label: "Word documents (DOCX)" },
  { key: "excel", label: "Excel spreadsheets (XLSX)" },
  { key: "video", label: "Videos (MP4, MOV)" },
]

// Storage quota per plan (in GB) — intentionally modest; property docs are
// 2–5 MB each so even 2 GB covers hundreds of compliance certs and agreements.
const PLAN_STORAGE_GB: Record<PlanTier | "default", number> = {
  default:    2,
  starter:    2,
  operator:   5,
  scale:      15,
  pro_agency: 35,
  enterprise: 100,
}

function formatStorage(gb: number): string {
  return `${gb} GB`
}

export default function StoragePage() {
  const { workspace } = useWorkspace()
  const [fileSizeLimit, setFileSizeLimit]       = useState("25")
  const [allowedTypes, setAllowedTypes]         = useState<string[]>(["pdf", "image", "word", "excel"])
  const [retentionPolicy, setRetentionPolicy]   = useState("forever")
  const [docRetention, setDocRetention]         = useState("forever")
  const [isDirty, setIsDirty]                   = useState(false)
  const [loading, setLoading]                   = useState(true)
  const [saving, setSaving]                     = useState(false)
  const [saved, setSaved]                       = useState(false)
  const [unavailable, setUnavailable]           = useState(false)
  const [saveError, setSaveError]               = useState<string | null>(null)
  const [usedBytes, setUsedBytes]               = useState<number | null>(null)
  const [totalQuotaBytes, setTotalQuotaBytes]   = useState<number | null>(null)
  const [addonPacks, setAddonPacks]             = useState(0)

  const tier = normaliseTier(workspace?.plan as string | undefined)
  // Base quota from plan tier (used for display when live data hasn't loaded yet)
  const baseQuotaGb = PLAN_STORAGE_GB[tier] ?? PLAN_STORAGE_GB.starter
  const resolvedQuotaBytes = totalQuotaBytes ?? (baseQuotaGb * 1024 ** 3)
  const resolvedQuotaGb    = resolvedQuotaBytes / 1024 ** 3
  const usedGb  = usedBytes != null ? usedBytes / 1024 ** 3 : null
  const usedPct = usedGb != null ? Math.min(100, (usedGb / resolvedQuotaGb) * 100) : 0

  useEffect(() => {
    // Load policy settings and real storage usage in parallel
    Promise.all([
      getWorkspaceSettings(),
      getStorageUsage(),
    ]).then(([{ settings: s, unavailable: unav }, usage]) => {
      if (unav) setUnavailable(true)
      if (s) {
        if (typeof s.storage_file_size_limit === "string") setFileSizeLimit(s.storage_file_size_limit as string)
        if (Array.isArray(s.storage_allowed_types)) setAllowedTypes(s.storage_allowed_types as string[])
        if (typeof s.storage_retention === "string") setRetentionPolicy(s.storage_retention as string)
        if (typeof s.storage_doc_retention === "string") setDocRetention(s.storage_doc_retention as string)
      }
      if (usage.ok) {
        setUsedBytes(usage.usedBytes)
        setTotalQuotaBytes(usage.totalQuotaBytes)
        setAddonPacks(usage.addonPacks)
      }
      setLoading(false)
    })
  }, [])

  function toggleFileType(key: string) {
    setAllowedTypes((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
    setIsDirty(true)
    setSaved(false)
    setSaveError(null)
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    const res = await saveWorkspaceSettings(
      {
        storage_file_size_limit: fileSizeLimit,
        storage_allowed_types: allowedTypes,
        storage_retention: retentionPolicy,
        storage_doc_retention: docRetention,
      },
      "documents"
    )
    setSaving(false)
    if (res.unavailable) {
      setUnavailable(true)
      setSaveError("Settings storage is not configured yet — changes can't be persisted.")
      return
    }
    if (!res.ok) {
      setSaveError(res.error ?? "Failed to save storage policy.")
      return
    }
    setSaved(true)
    setIsDirty(false)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="relative pb-20">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-slate-900">Storage</h1>
        <p className="text-[13.5px] text-slate-500 mt-1">
          Manage file storage, upload limits, and retention policies for your workspace
        </p>
      </div>

      {unavailable && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] text-amber-700">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          Storage settings are not yet provisioned in this environment. Policy values show defaults.
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
        </div>
      )}

      {/* Storage Usage */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--brand-soft)] flex items-center justify-center">
              <Cloud className="w-5 h-5 text-[var(--brand)]" />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-slate-900">Storage Usage</h3>
              <p className="text-[11.5px] text-slate-400">
                {formatStorage(baseQuotaGb)} included on your plan
                {addonPacks > 0 && ` + ${addonPacks * 10} GB add-on`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {addonPacks > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">
                <Package className="w-3 h-3" />{addonPacks}× add-on
              </span>
            )}
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[var(--brand-soft)] text-[var(--brand)]">
              {tier.charAt(0).toUpperCase() + tier.slice(1).replace("_", " ")} plan
            </span>
          </div>
        </div>

        {/* Usage bar */}
        <div className="mb-2">
          <div className="flex items-center justify-between text-[12px] mb-1.5">
            <span className="text-slate-600">
              {usedGb != null ? `${usedGb.toFixed(2)} GB used` : "Loading usage…"}
            </span>
            <span className="text-slate-400">{formatStorage(Math.round(resolvedQuotaGb))} total</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                usedPct > 90 ? "bg-red-500" : usedPct > 70 ? "bg-amber-500" : "bg-[var(--brand)]"
              )}
              style={{ width: `${usedPct}%` }}
            />
          </div>
          {usedPct > 80 && (
            <p className="text-[11.5px] text-amber-600 mt-1.5 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 shrink-0" />
              {usedPct > 90 ? "Storage almost full — consider upgrading your plan or purchasing more storage." : "Approaching storage limit."}
            </p>
          )}
        </div>

        {/* Breakdown by type */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-[11.5px] text-slate-400">
            Files are stored in encrypted, geo-redundant cloud storage. All files are scanned for malware on upload.
          </p>
        </div>
      </div>

      {/* Storage add-on upsell */}
      {tier === "starter" || tier === "operator" ? (
        <div className="bg-gradient-to-br from-[var(--brand-soft)] to-violet-50 border border-[var(--color-brand-100)] rounded-2xl p-5 mb-6 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white border border-[var(--color-brand-100)] flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-[#7C3AED]" />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-bold text-slate-900">Need more storage?</p>
            <p className="text-[12px] text-slate-500 mt-0.5">Upgrade your plan for more storage, or purchase an extra storage add-on.</p>
          </div>
          <a
            href="/property-manager/workspace-settings/addons"
            className="shrink-0 px-4 py-2 rounded-xl bg-[#7C3AED] text-white text-[12.5px] font-semibold hover:bg-[#6d28d9] transition-colors"
          >
            View add-ons
          </a>
        </div>
      ) : null}

      {/* File upload limits */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h3 className="text-[14px] font-bold text-slate-900 mb-5">Upload Limits</h3>
        <div className="mb-5">
          <label htmlFor="ws-max-file-size" className="block text-[12.5px] font-semibold text-slate-700 mb-2">
            Maximum file size per upload
          </label>
          <select
            id="ws-max-file-size"
            value={fileSizeLimit}
            onChange={(e) => { setFileSizeLimit(e.target.value); setIsDirty(true) }}
            className="w-full max-w-[240px] px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white focus:outline-none focus:border-[var(--brand)] transition-all"
          >
            <option value="5">5 MB</option>
            <option value="10">10 MB</option>
            <option value="25">25 MB</option>
            <option value="50">50 MB</option>
            <option value="100">100 MB</option>
          </select>
        </div>
        <div>
          <label className="block text-[12.5px] font-semibold text-slate-700 mb-2">
            Allowed file types
          </label>
          <div className="space-y-1.5">
            {FILE_TYPES.map((ft) => {
              const checked = allowedTypes.includes(ft.key)
              return (
                <button
                  key={ft.key}
                  onClick={() => toggleFileType(ft.key)}
                  aria-pressed={checked}
                  className="flex items-center gap-3 w-full text-left py-2 hover:bg-slate-50 rounded-xl px-2 transition-colors"
                >
                  <div className={cn("shrink-0", checked ? "text-[var(--brand)]" : "text-slate-300")}>
                    {checked ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </div>
                  <span className="text-[13px] text-slate-700">{ft.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Retention policy */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-[14px] font-bold text-slate-900 mb-5">Retention Policy</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="ws-archive-policy" className="block text-[12.5px] font-semibold text-slate-700 mb-2">
              Archive inactive records after
            </label>
            <select
              id="ws-archive-policy"
              value={retentionPolicy}
              onChange={(e) => { setRetentionPolicy(e.target.value); setIsDirty(true) }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white focus:outline-none focus:border-[var(--brand)] transition-all"
            >
              <option value="never">Never</option>
              <option value="6m">6 months</option>
              <option value="1y">1 year</option>
              <option value="2y">2 years</option>
            </select>
          </div>
          <div>
            <label htmlFor="ws-doc-retention" className="block text-[12.5px] font-semibold text-slate-700 mb-2">
              Document retention period
            </label>
            <select
              id="ws-doc-retention"
              value={docRetention}
              onChange={(e) => { setDocRetention(e.target.value); setIsDirty(true) }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white focus:outline-none focus:border-[var(--brand)] transition-all"
            >
              <option value="forever">Keep forever</option>
              <option value="2y">2 years</option>
              <option value="5y">5 years</option>
              <option value="7y">7 years</option>
            </select>
          </div>
        </div>
        <p className="text-[11.5px] text-slate-400 mt-4">
          Destructive data operations require owner permission and are audit-logged.
        </p>

        {isDirty && !unavailable && (
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--brand)] text-white text-[13px] font-semibold hover:bg-[var(--brand-strong)] transition-colors disabled:opacity-70"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
                {saving ? "Saving…" : saved ? "Saved!" : "Save changes"}
              </button>
              <button
                onClick={() => { setIsDirty(false); setSaveError(null) }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
            {saveError && <p className="text-[12px] text-red-500 mt-2">{saveError}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
