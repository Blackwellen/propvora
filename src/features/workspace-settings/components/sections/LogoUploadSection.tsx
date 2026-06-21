"use client"

import React, { useRef, useState } from "react"
import { Upload, Loader2, Info } from "lucide-react"
import { uploadFile, validateUploadFile } from "@/lib/upload"

function keyToUrl(key: string | null): string | null {
  if (!key) return null
  if (key.startsWith("http") || key.startsWith("/api/")) return key
  return `/api/files/${key}`
}

async function uploadLogo(workspaceId: string, file: File): Promise<string> {
  const { key } = await uploadFile(file, workspaceId, "branding")
  return key
}

export interface LogoUploadZoneProps {
  name: string
  currentKey: string | null
  workspaceId: string | null
  onUploaded: (key: string) => void
}

export function LogoUploadZone({ name, currentKey, workspaceId, onUploaded }: LogoUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File | undefined) {
    if (!file || !workspaceId) return
    const invalid = validateUploadFile(file, { imagesOnly: true })
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
        <p className="text-[11px] text-emerald-600 mt-1">Uploaded</p>
      ) : (
        <p className="text-[11px] text-slate-400 mt-1">PNG, JPG, WEBP or SVG · Max 10MB</p>
      )}
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  )
}

export interface LogoUploadSectionProps {
  workspaceLogoKey: string | null
  workspaceId: string | null
  onWorkspaceLogoUploaded: (key: string) => void
}

export function LogoUploadSection({
  workspaceLogoKey,
  workspaceId,
  onWorkspaceLogoUploaded,
}: LogoUploadSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
      <h3 className="text-[14px] font-bold text-slate-900 mb-1">Logos</h3>
      <p className="text-[12px] text-slate-500 mb-4">
        Upload logos for different surfaces within the platform
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <LogoUploadZone
          name="Workspace Logo"
          currentKey={workspaceLogoKey}
          workspaceId={workspaceId}
          onUploaded={onWorkspaceLogoUploaded}
        />
        <LogoUploadZone
          name="Email Logo"
          currentKey={null}
          workspaceId={workspaceId}
          onUploaded={onWorkspaceLogoUploaded}
        />
        <LogoUploadZone
          name="Invoice Logo"
          currentKey={null}
          workspaceId={workspaceId}
          onUploaded={onWorkspaceLogoUploaded}
        />
      </div>
      <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1.5">
        <Info className="w-3.5 h-3.5 shrink-0" />
        Logos upload to secure storage. Remember to press Save branding to apply.
      </p>
    </div>
  )
}
