"use client"

import React, { useState, useEffect } from "react"
import { HardDrive, Database, CheckSquare, Square, Loader2, Check, Info } from "lucide-react"
import { getWorkspaceSettings, saveWorkspaceSettings } from "@/lib/actions/settings"

const FILE_TYPES = [
  { key: "pdf",   label: "PDF documents" },
  { key: "image", label: "Images (JPG, PNG, WEBP)" },
  { key: "word",  label: "Word documents (DOCX)" },
  { key: "excel", label: "Excel spreadsheets (XLSX)" },
]

export default function StoragePage() {
  const [fileSizeLimit, setFileSizeLimit]       = useState("10")
  const [allowedTypes, setAllowedTypes]         = useState<string[]>(["pdf", "image", "word", "excel"])
  const [retentionPolicy, setRetentionPolicy]   = useState("forever")
  const [isDirty, setIsDirty]                   = useState(false)
  const [loading, setLoading]                   = useState(true)
  const [saving, setSaving]                     = useState(false)
  const [saved, setSaved]                       = useState(false)
  const [unavailable, setUnavailable]           = useState(false)
  const [saveError, setSaveError]               = useState<string | null>(null)

  // Hydrate storage policy from workspace_settings.documents bucket.
  useEffect(() => {
    getWorkspaceSettings().then(({ settings: s, unavailable }) => {
      if (unavailable) setUnavailable(true)
      if (s) {
        if (typeof s.storage_file_size_limit === "string") setFileSizeLimit(s.storage_file_size_limit as string)
        if (Array.isArray(s.storage_allowed_types)) setAllowedTypes(s.storage_allowed_types as string[])
        if (typeof s.storage_retention === "string") setRetentionPolicy(s.storage_retention as string)
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
        <h1 className="text-[20px] font-bold text-slate-900">Storage</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">
          Manage file storage, providers, limits and retention policies
        </p>
      </div>

      {unavailable && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] text-amber-700">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          Settings storage is not provisioned in this environment yet. Policy values show defaults and can&apos;t be persisted until the <code className="font-mono">workspace_settings</code> table exists.
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
        </div>
      )}

      {/* Storage Usage */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <HardDrive className="w-4 h-4 text-slate-400" />
          <h3 className="text-[14px] font-bold text-slate-900">Storage Usage</h3>
        </div>
        <p className="text-[12.5px] text-slate-400">
          Per-workspace storage usage and breakdown by file type will appear here once usage metering is
          enabled. Files are stored securely in Supabase Storage.
        </p>
      </div>

      {/* Storage providers */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h3 className="text-[14px] font-bold text-slate-900 mb-4">Storage Providers</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border-2 border-[#2563EB] bg-blue-50">
            <div className="flex items-center gap-2.5 mb-2">
              <div style={{ color: "#3ECF8E" }}>
                <Database className="w-4 h-4" />
              </div>
              <p className="text-[13px] font-bold text-slate-900">Supabase Storage</p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 ml-auto">
                Active
              </span>
            </div>
            <p className="text-[12px] text-slate-500">Default managed storage. No additional configuration required.</p>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center gap-2.5 mb-2">
              <div style={{ color: "#F38020" }}>
                <HardDrive className="w-4 h-4" />
              </div>
              <p className="text-[13px] font-bold text-slate-900">Cloudflare R2</p>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 ml-auto">
                Not configured
              </span>
            </div>
            <p className="text-[12px] text-slate-500 mb-3">S3-compatible object storage for large document libraries.</p>
            <button className="w-full py-2 rounded-xl border border-[#2563EB] text-[#2563EB] text-[12px] font-semibold hover:bg-blue-50 transition-colors">
              Configure R2
            </button>
          </div>
        </div>
      </div>

      {/* File limits */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h3 className="text-[14px] font-bold text-slate-900 mb-5">Upload Limits</h3>
        <div className="mb-5">
          <label htmlFor="ws-max-file-size" className="block text-[12.5px] font-semibold text-slate-700 mb-2">
            Maximum file size
          </label>
          <select
            id="ws-max-file-size"
            value={fileSizeLimit}
            onChange={(e) => { setFileSizeLimit(e.target.value); setIsDirty(true) }}
            className="w-full max-w-[240px] px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white focus:outline-none focus:border-[#2563EB] transition-all"
          >
            <option value="5">5 MB</option>
            <option value="10">10 MB</option>
            <option value="25">25 MB</option>
            <option value="50">50 MB</option>
          </select>
        </div>
        <div>
          <label className="block text-[12.5px] font-semibold text-slate-700 mb-2">
            Allowed file types
          </label>
          <div className="space-y-2">
            {FILE_TYPES.map((ft) => {
              const checked = allowedTypes.includes(ft.key)
              return (
                <button
                  key={ft.key}
                  onClick={() => toggleFileType(ft.key)}
                  className="flex items-center gap-3 w-full text-left py-2 hover:bg-slate-50 rounded-xl px-2 transition-colors"
                >
                  <div style={{ color: checked ? "var(--brand)" : "var(--text-disabled)" }}>
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
              Archive inactive records
            </label>
            <select
              id="ws-archive-policy"
              value={retentionPolicy}
              onChange={(e) => { setRetentionPolicy(e.target.value); setIsDirty(true) }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white focus:outline-none focus:border-[#2563EB] transition-all"
            >
              <option value="never">Never</option>
              <option value="6m">After 6 months</option>
              <option value="1y">After 1 year</option>
              <option value="2y">After 2 years</option>
            </select>
          </div>
          <div>
            <label htmlFor="ws-doc-retention" className="block text-[12.5px] font-semibold text-slate-700 mb-2">
              Document retention
            </label>
            <select
              id="ws-doc-retention"
              onChange={() => setIsDirty(true)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white focus:outline-none focus:border-[#2563EB] transition-all"
            >
              <option value="forever">Keep forever</option>
              <option value="2y">2 years</option>
              <option value="5y">5 years</option>
            </select>
          </div>
        </div>
        <p className="text-[11.5px] text-slate-400 mt-4">
          Note: Destructive data operations require owner permission and are audit logged.
        </p>
        {isDirty && !unavailable && (
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] transition-colors disabled:opacity-70"
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
