"use client"

import React, { useState, useEffect, useRef } from "react"
import { Upload, Check, Loader2, Info } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { uploadFile, validateUploadFile } from "@/lib/upload"
import { broadcastBranding } from "@/lib/branding/BrandingLiveApply"

/** Resolve a stored R2 key to its authed streaming URL. */
function keyToUrl(key: string | null): string | null {
  if (!key) return null
  if (key.startsWith("http") || key.startsWith("/api/")) return key
  return `/api/files/${key}`
}

/** Propvora defaults used when workspace has not uploaded its own assets. */
const PROPVORA_DEFAULTS = {
  logo:    "/propvora-logo-dark.png",
  favicon: "/propvora-favicon.png",
} as const

interface BrandColours {
  primary: string
  secondary: string
  accent: string
  background: string
}

async function uploadLogo(workspaceId: string, file: File): Promise<string> {
  const { key } = await uploadFile(file, workspaceId, "branding")
  return key
}

function LogoUploadZone({
  name,
  currentKey,
  workspaceId,
  onUploaded,
  hint,
  defaultUrl,
}: {
  name: string
  currentKey: string | null
  workspaceId: string | null
  onUploaded: (key: string) => void
  hint?: string
  /** URL shown when no custom logo is uploaded — the Propvora default. */
  defaultUrl?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File | undefined) {
    if (!file || !workspaceId) return
    const invalid = validateUploadFile(file, { imagesOnly: true })
    if (invalid && file.type !== "image/svg+xml") { setError(invalid); return }
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

  const customUrl   = keyToUrl(currentKey)
  const displayUrl  = customUrl ?? defaultUrl ?? null
  const isDefault   = !currentKey && !!defaultUrl

  return (
    <div>
      <p className="text-[12px] font-semibold text-slate-700 mb-2">{name}</p>
      {hint && <p className="text-[11px] text-slate-400 mb-2">{hint}</p>}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-[#2563EB] transition-colors cursor-pointer group"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {displayUrl ? (
          <div className={`w-14 h-14 rounded-xl bg-white border overflow-hidden flex items-center justify-center mx-auto mb-3 ${isDefault ? "border-dashed border-slate-200 opacity-50" : "border-slate-200"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={displayUrl} alt={`${name} preview`} className="max-w-full max-h-full object-contain" />
          </div>
        ) : (
          <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-blue-50 flex items-center justify-center mx-auto mb-3 transition-colors">
            {uploading ? (
              <Loader2 className="w-4 h-4 text-[#2563EB] animate-spin" />
            ) : (
              <Upload className="w-4 h-4 text-slate-400 group-hover:text-[#2563EB] transition-colors" />
            )}
          </div>
        )}
        <p className="text-[12.5px] font-semibold text-slate-700 group-hover:text-[#2563EB] transition-colors">
          {uploading ? "Uploading…" : currentKey ? "Replace" : "Upload"}
        </p>
        {currentKey ? (
          <p className="text-[11px] text-emerald-600 mt-0.5">Custom logo ✓</p>
        ) : isDefault ? (
          <p className="text-[10.5px] text-slate-400 mt-0.5">Using Propvora default</p>
        ) : (
          <p className="text-[10.5px] text-slate-400 mt-0.5">PNG, JPG, WEBP or SVG · Max 10MB</p>
        )}
        {error && <p className="text-[10.5px] text-red-500 mt-1">{error}</p>}
      </div>
    </div>
  )
}

function FaviconUploadZone({
  workspaceId,
  currentKey,
  onUploaded,
}: {
  workspaceId: string | null
  currentKey: string | null
  onUploaded: (key: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File | undefined) {
    if (!file || !workspaceId) return
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

  const customUrl  = keyToUrl(currentKey)
  const displayUrl = customUrl ?? PROPVORA_DEFAULTS.favicon
  const isDefault  = !currentKey

  return (
    <div
      onClick={() => !uploading && inputRef.current?.click()}
      className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-[#2563EB] transition-colors cursor-pointer group max-w-[200px]"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/x-icon,image/vnd.microsoft.icon"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <div className={`w-8 h-8 rounded-lg bg-white border overflow-hidden flex items-center justify-center mx-auto mb-2 ${isDefault ? "border-dashed border-slate-200 opacity-50" : "border-slate-200"}`}>
        {uploading ? (
          <Loader2 className="w-4 h-4 text-[#2563EB] animate-spin" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displayUrl} alt="Favicon preview" className="w-6 h-6 object-contain" />
        )}
      </div>
      <p className="text-[12px] font-semibold text-slate-700 group-hover:text-[#2563EB] transition-colors">
        {currentKey ? "Replace favicon" : "Upload favicon"}
      </p>
      {isDefault ? (
        <p className="text-[10px] text-slate-400 mt-0.5">Using Propvora default</p>
      ) : (
        <p className="text-[10px] text-emerald-600 mt-0.5">Custom favicon ✓</p>
      )}
      <p className="text-[10px] text-slate-400 mt-0.5">ICO or PNG · 32×32px</p>
      {error && <p className="text-[10px] text-red-500 mt-1">{error}</p>}
    </div>
  )
}

export default function BrandingPage() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [workspaceLogoKey, setWorkspaceLogoKey] = useState<string | null>(null)
  const [emailLogoKey, setEmailLogoKey]         = useState<string | null>(null)
  const [invoiceLogoKey, setInvoiceLogoKey]     = useState<string | null>(null)
  const [faviconKey, setFaviconKey]             = useState<string | null>(null)
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
          .select("logo_url, email_logo_url, invoice_logo_url, favicon_url, brand_color, brand_colours")
          .eq("id", wsId)
          .maybeSingle()
        if (ws?.logo_url)         setWorkspaceLogoKey(ws.logo_url as string)
        if (ws?.email_logo_url)   setEmailLogoKey(ws.email_logo_url as string)
        if (ws?.invoice_logo_url) setInvoiceLogoKey(ws.invoice_logo_url as string)
        if (ws?.favicon_url)      setFaviconKey(ws.favicon_url as string)
        const bc = ws?.brand_colours as Partial<BrandColours> | null
        const single = ws?.brand_color as string | null
        if (bc && typeof bc === "object") {
          setColours((c) => ({ ...c, ...bc }))
        } else if (single) {
          setColours((c) => ({ ...c, primary: single }))
        }
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
        .update({
          logo_url:         workspaceLogoKey,
          email_logo_url:   emailLogoKey,
          invoice_logo_url: invoiceLogoKey,
          favicon_url:      faviconKey,
          brand_color:      colours.primary,
          brand_colours:    colours,
          updated_at:       new Date().toISOString(),
        })
        .eq("id", workspaceId)
      if (error) {
        setSaveError("Failed to save branding settings. Please try again.")
        return
      }
      broadcastBranding({ brandColor: colours.primary, brandColours: colours })
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
    { key: "primary",    label: "Primary colour",    hint: "Buttons, links, and active highlights"  },
    { key: "secondary",  label: "Secondary colour",  hint: "Hover states and secondary actions"      },
    { key: "accent",     label: "Accent colour",     hint: "Badges, tags and feature highlights"     },
    { key: "background", label: "Background colour", hint: "Page and panel background colour"        },
  ]

  return (
    <div className="pb-20">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-slate-900">Branding</h1>
        <p className="text-[13.5px] text-slate-500 mt-1">Customise your workspace logo, brand colours and identity assets</p>
      </div>

      {/* Logo uploads */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
        <h3 className="text-[14px] font-bold text-slate-900 mb-1">Logos</h3>
        <p className="text-[12px] text-slate-500 mb-4">Upload logos for different surfaces — app UI, emails, and documents</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <LogoUploadZone
            name="Workspace Logo"
            hint="Shown in the sidebar and app UI"
            currentKey={workspaceLogoKey}
            workspaceId={workspaceId}
            defaultUrl={PROPVORA_DEFAULTS.logo}
            onUploaded={(key) => { setWorkspaceLogoKey(key); setIsDirty(true); setSaved(false) }}
          />
          <LogoUploadZone
            name="Email Logo"
            hint="Used in notification and transactional emails"
            currentKey={emailLogoKey}
            workspaceId={workspaceId}
            defaultUrl={PROPVORA_DEFAULTS.logo}
            onUploaded={(key) => { setEmailLogoKey(key); setIsDirty(true); setSaved(false) }}
          />
          <LogoUploadZone
            name="Invoice Logo"
            hint="Printed on invoices, PDFs and documents"
            currentKey={invoiceLogoKey}
            workspaceId={workspaceId}
            defaultUrl={PROPVORA_DEFAULTS.logo}
            onUploaded={(key) => { setInvoiceLogoKey(key); setIsDirty(true); setSaved(false) }}
          />
        </div>
        <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 shrink-0" />
          Logos upload to secure storage and apply immediately across the app. Save branding to persist colour changes.
        </p>
      </div>

      {/* Brand colours */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
        <h3 className="text-[14px] font-bold text-slate-900 mb-1">Brand Colours</h3>
        <p className="text-[12px] text-slate-500 mb-4">Applied across the app, portals, emails and documents</p>
        <div>
          {COLOUR_ROWS.map(row => (
            <div key={row.key} className="flex items-center gap-4 py-3.5 border-b border-slate-100 last:border-0">
              <input
                type="color"
                value={colours[row.key]}
                onChange={e => updateColour(row.key, e.target.value)}
                className="w-10 h-10 rounded-xl cursor-pointer border-2 border-slate-200 p-0.5 shrink-0"
                aria-label={row.label}
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
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-3">Live preview</p>
        <div className="border border-slate-100 rounded-xl overflow-hidden">
          <div
            className="px-4 py-3 border-b border-slate-100 flex items-center gap-3"
            style={{ backgroundColor: colours.primary + "08" }}
          >
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center overflow-hidden shrink-0 bg-white border border-slate-200"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={keyToUrl(workspaceLogoKey) ?? PROPVORA_DEFAULTS.logo}
                alt="Logo"
                className="w-5 h-5 object-contain"
              />
            </div>
            <p className="text-[12px] font-bold" style={{ color: colours.primary }}>
              Your Workspace
            </p>
            <div className="ml-auto">
              <div
                className="px-3 py-1 rounded-lg text-[11px] font-semibold text-white"
                style={{ backgroundColor: colours.primary }}
              >
                Save
              </div>
            </div>
          </div>
          <div className="p-4" style={{ backgroundColor: colours.background }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-2 rounded-full w-20" style={{ backgroundColor: colours.primary }} />
              <div className="h-2 rounded-full w-32 bg-slate-100" />
            </div>
            <div className="h-2 rounded-full w-full bg-slate-100 mb-2" />
            <div className="h-2 rounded-full w-4/5 bg-slate-100 mb-4" />
            <div className="flex gap-2">
              <div className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white" style={{ backgroundColor: colours.primary }}>
                Primary action
              </div>
              <div className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white" style={{ backgroundColor: colours.accent }}>
                Accent
              </div>
              <div className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-slate-600 bg-white border border-slate-200">
                Secondary
              </div>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-3">
          Preview reflects your current colour settings. Changes apply live across the app after saving.
        </p>
      </div>

      {/* Favicon */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="text-[14px] font-bold text-slate-900 mb-1">Favicon</h3>
        <p className="text-[12px] text-slate-500 mb-4">Shown in browser tabs. Recommended: 32×32px ICO or PNG.</p>
        <FaviconUploadZone
          workspaceId={workspaceId}
          currentKey={faviconKey}
          onUploaded={(key) => { setFaviconKey(key); setIsDirty(true); setSaved(false) }}
        />
      </div>

      {/* Sticky save bar */}
      {isDirty && (
        <div className="app-save-bar fixed left-0 right-0 bg-white border-t border-slate-200 px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between gap-3 shadow-lg">
          <div>
            <p className="text-[13px] text-slate-600">You have unsaved changes</p>
            {saveError && <p className="text-[12px] text-amber-600 mt-0.5">{saveError}</p>}
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
              {saving ? "Saving…" : saved ? "Saved!" : "Save branding"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
