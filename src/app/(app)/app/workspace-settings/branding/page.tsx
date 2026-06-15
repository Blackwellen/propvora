"use client"

import React, { useState, useEffect, useRef } from "react"
import { Upload, Check, Loader2, Info } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { uploadFile, validateUploadFile } from "@/lib/upload"

/** Resolve a stored R2 key to its authed streaming URL (survives refresh). */
function keyToUrl(key: string | null): string | null {
  if (!key) return null
  // Already an absolute/app URL (legacy rows stored a full url) — use as-is.
  if (key.startsWith("http") || key.startsWith("/api/")) return key
  return `/api/files/${key}`
}

interface BrandColours {
  primary: string
  secondary: string
  accent: string
  background: string
}

/**
 * Uploads a logo via the presigned /api/upload route, then returns its key.
 * The key is stored on the workspace; signed URLs are generated on read.
 */
async function uploadLogo(workspaceId: string, file: File): Promise<string> {
  const { key } = await uploadFile(file, workspaceId, "branding")
  return key
}

function LogoUploadZone({
  name,
  currentKey,
  workspaceId,
  onUploaded,
}: {
  name: string
  currentKey: string | null
  workspaceId: string | null
  onUploaded: (key: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File | undefined) {
    if (!file || !workspaceId) return
    const invalid = validateUploadFile(file, { imagesOnly: true })
    // SVG passes the server allowlist but not the image MIME mirror — accept it.
    if (invalid && file.type !== "image/svg+xml") {
      setError(invalid)
      return
    }
    setError(null)
    setUploading(true)
    try {
      const key = await uploadLogo(workspaceId, file)
      onUploaded(key)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const previewUrl = keyToUrl(currentKey)

  return (
    <div
      onClick={() => !uploading && inputRef.current?.click()}
      className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-[#2563EB] transition-colors cursor-pointer group"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {previewUrl ? (
        // Render the persisted logo from its authed URL — survives refresh.
        <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center mx-auto mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt={`${name} preview`} className="max-w-full max-h-full object-contain" />
        </div>
      ) : (
        <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-blue-50 flex items-center justify-center mx-auto mb-3 transition-colors">
          {uploading ? (
            <Loader2 className="w-5 h-5 text-[#2563EB] animate-spin" />
          ) : (
            <Upload className="w-5 h-5 text-slate-400 group-hover:text-[#2563EB] transition-colors" />
          )}
        </div>
      )}
      <p className="text-[13px] font-semibold text-slate-700 group-hover:text-[#2563EB] transition-colors">
        {uploading ? "Uploading…" : currentKey ? `Replace ${name}` : `Upload ${name}`}
      </p>
      {currentKey ? (
        <p className="text-[11px] text-emerald-600 mt-1">Uploaded ✓</p>
      ) : (
        <p className="text-[11px] text-slate-400 mt-1">PNG, JPG, WEBP or SVG · Max 10MB</p>
      )}
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  )
}

export default function BrandingPage() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [logoKey, setLogoKey] = useState<string | null>(null)
  const [colours, setColours] = useState<BrandColours>({
    primary:    "#2563EB",
    secondary:  "#1d4ed8",
    accent:     "#7C3AED",
    background: "#F8FAFC",
  })
  const [isDirty, setIsDirty] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
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
          .select("logo_url, brand_colours")
          .eq("id", wsId)
          .maybeSingle()
        if (ws?.logo_url) setLogoKey(ws.logo_url as string)
        const bc = ws?.brand_colours as Partial<BrandColours> | null
        if (bc && typeof bc === "object") setColours((c) => ({ ...c, ...bc }))
      } catch { /* defaults */ }
    }
    load()
  }, [])

  const updateColour = (key: keyof BrandColours, val: string) => {
    setColours(prev => ({ ...prev, [key]: val }))
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
        .update({ logo_url: logoKey, brand_colours: colours, updated_at: new Date().toISOString() })
        .eq("id", workspaceId)
      if (error) { setSaveError("Branding columns may not exist on the workspaces table yet."); return }
      setSaved(true)
      setIsDirty(false)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setSaveError("Failed to save branding.")
    } finally {
      setSaving(false)
    }
  }

  const COLOUR_ROWS: { key: keyof BrandColours; label: string; hint: string }[] = [
    { key: "primary",    label: "Primary colour",    hint: "Main brand colour used for buttons and highlights"  },
    { key: "secondary",  label: "Secondary colour",  hint: "Used for hover states and secondary actions"         },
    { key: "accent",     label: "Accent colour",     hint: "Used for badges, tags and highlight elements"        },
    { key: "background", label: "Background colour", hint: "Page and panel background colour"                   },
  ]

  return (
    <div className="pb-20">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-slate-900">Branding</h1>
        <p className="text-[13.5px] text-slate-500 mt-1">Customise your workspace logo and brand colours</p>
      </div>

      {/* Logo uploads */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
        <h3 className="text-[14px] font-bold text-slate-900 mb-1">Logos</h3>
        <p className="text-[12px] text-slate-500 mb-4">Upload logos for different surfaces within the platform</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <LogoUploadZone
            name="Workspace Logo"
            currentKey={logoKey}
            workspaceId={workspaceId}
            onUploaded={(key) => { setLogoKey(key); setIsDirty(true); setSaved(false) }}
          />
          <LogoUploadZone
            name="Email Logo"
            currentKey={null}
            workspaceId={workspaceId}
            onUploaded={(key) => { setLogoKey(key); setIsDirty(true); setSaved(false) }}
          />
          <LogoUploadZone
            name="Invoice Logo"
            currentKey={null}
            workspaceId={workspaceId}
            onUploaded={(key) => { setLogoKey(key); setIsDirty(true); setSaved(false) }}
          />
        </div>
        <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 shrink-0" />
          Logos upload to secure storage. Remember to press Save branding to apply.
        </p>
      </div>

      {/* Brand colours */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
        <h3 className="text-[14px] font-bold text-slate-900 mb-1">Brand Colours</h3>
        <p className="text-[12px] text-slate-500 mb-4">Set the colours used throughout your workspace</p>
        <div>
          {COLOUR_ROWS.map(row => (
            <div key={row.key} className="flex items-center gap-4 py-3.5 border-b border-slate-100 last:border-0">
              <input
                type="color"
                value={colours[row.key]}
                onChange={e => updateColour(row.key, e.target.value)}
                className="w-10 h-10 rounded-xl cursor-pointer border-2 border-slate-200 p-0.5 shrink-0"
              />
              <div className="flex-1">
                <p className="text-[13px] font-medium text-slate-800">{row.label}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{row.hint}</p>
              </div>
              <span className="text-[12px] font-mono text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                {colours[row.key].toUpperCase()}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] transition-colors disabled:opacity-70"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
            {saving ? "Saving…" : saved ? "Saved" : "Save branding"}
          </button>
          <button
            onClick={() => {
              setColours({ primary: "#2563EB", secondary: "#1d4ed8", accent: "#7C3AED", background: "#F8FAFC" })
              setIsDirty(true)
              setSaved(false)
            }}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Reset to defaults
          </button>
        </div>
        {saveError && <p className="text-[12px] text-amber-600 mt-3">{saveError}</p>}
      </div>

      {/* Preview panel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-3">Preview</p>
        <div className="border border-slate-100 rounded-xl overflow-hidden">
          {/* Mock topbar */}
          <div
            className="px-4 py-3 border-b border-slate-100 flex items-center gap-3"
            style={{ backgroundColor: colours.primary + "08" }}
          >
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-black shrink-0"
              style={{ backgroundColor: colours.primary }}
            >
              P
            </div>
            <p className="text-[12px] font-bold" style={{ color: colours.primary }}>
              Propvora Demo Workspace
            </p>
            <div className="ml-auto flex items-center gap-2">
              <div
                className="px-3 py-1 rounded-lg text-[11px] font-semibold text-white"
                style={{ backgroundColor: colours.primary }}
              >
                Save
              </div>
            </div>
          </div>
          {/* Mock content */}
          <div className="p-4" style={{ backgroundColor: colours.background }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-2 rounded-full w-20" style={{ backgroundColor: colours.primary }} />
              <div className="h-2 rounded-full w-32 bg-slate-100" />
            </div>
            <div className="h-2 rounded-full w-full bg-slate-100 mb-2" />
            <div className="h-2 rounded-full w-4/5 bg-slate-100 mb-4" />
            <div className="flex gap-2">
              <div
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white"
                style={{ backgroundColor: colours.primary }}
              >
                Primary action
              </div>
              <div
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white"
                style={{ backgroundColor: colours.accent }}
              >
                Accent
              </div>
              <div className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-slate-600 bg-white border border-slate-200">
                Secondary
              </div>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-3">
          This preview reflects your current colour settings. Actual results may vary slightly.
        </p>
      </div>

      {/* Favicon / favicon */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="text-[14px] font-bold text-slate-900 mb-1">Favicon</h3>
        <p className="text-[12px] text-slate-500 mb-4">Shown in browser tabs. Recommended size: 32×32px ICO or PNG.</p>
        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-[#2563EB] transition-colors cursor-pointer group max-w-[200px]">
          <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-blue-50 flex items-center justify-center mx-auto mb-2 transition-colors">
            <Upload className="w-4 h-4 text-slate-400 group-hover:text-[#2563EB] transition-colors" />
          </div>
          <p className="text-[12px] font-semibold text-slate-700 group-hover:text-[#2563EB] transition-colors">Upload favicon</p>
          <p className="text-[10px] text-slate-400 mt-0.5">ICO or PNG · 32×32px</p>
        </div>
      </div>

      {/* Sticky save bar */}
      {isDirty && (
        <div className="pwa-safe-bottom fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between gap-3 shadow-lg">
          <p className="text-[13px] text-slate-600">You have unsaved changes</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDirty(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#2563EB] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] transition-colors"
            >
              {saved && <Check className="w-4 h-4" />}
              Save branding
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
