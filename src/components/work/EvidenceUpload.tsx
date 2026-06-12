"use client"

import React, { useRef, useState } from "react"
import { UploadCloud, FileText, ImageIcon, X, Loader2, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

export interface EvidenceDoc {
  name: string
  url: string
  type: string
  size: number
}

interface Props {
  /** Workspace id (required to upload — uploads are no-ops without it). */
  workspaceId?: string
  /** R2 folder prefix, e.g. "job-evidence" or "task-evidence". */
  folder: string
  /** Optional Supabase table to store metadata in (42P01-safe). */
  table?: string
  /** Extra columns to write alongside the file metadata (e.g. { job_id }). */
  extra?: Record<string, unknown>
  /** Existing docs to render (live data from the parent). */
  initialDocs?: EvidenceDoc[]
  /** Fired after a successful upload. */
  onUploaded?: (doc: EvidenceDoc) => void
  /** Accept attribute for the file input. */
  accept?: string
  className?: string
}

function isImage(type: string) {
  return type.startsWith("image/")
}

function humanSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1_048_576).toFixed(1)} MB`
}

export function EvidenceUpload({
  workspaceId,
  folder,
  table,
  extra,
  initialDocs = [],
  onUploaded,
  accept,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [docs, setDocs] = useState<EvidenceDoc[]>(initialDocs)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function uploadOne(file: File) {
    if (!workspaceId) {
      setError("No workspace — cannot upload.")
      return
    }
    setError(null)
    setUploading(true)
    try {
      // 1. Server-proxied upload to R2 (no browser→R2 CORS needed)
      const fd = new FormData()
      fd.append("file", file)
      fd.append("workspaceId", workspaceId)
      fd.append("folder", folder)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || "Upload failed")
      const { url } = json as { key: string; url: string }

      const doc: EvidenceDoc = { name: file.name, url, type: file.type, size: file.size }

      // 2. Persist metadata (42P01-safe) — store the R2 key + authed view url
      if (table) {
        try {
          const supabase = createClient()
          await supabase.from(table).insert({
            workspace_id: workspaceId,
            name: file.name,
            file_url: url,
            file_type: file.type,
            file_size: file.size,
            ...extra,
          })
        } catch (e) {
          const code = (e as { code?: string })?.code
          if (code !== "42P01") console.error("Evidence metadata save failed:", e)
        }
      }

      // 3. Optimistic UI
      setDocs((prev) => [doc, ...prev])
      onUploaded?.(doc)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files) return
    for (const file of Array.from(files)) {
      await uploadOne(file)
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center cursor-pointer transition-colors",
          dragOver ? "border-[#2563EB] bg-blue-50/50" : "border-slate-200 bg-slate-50/50 hover:border-slate-300"
        )}
      >
        {uploading ? (
          <Loader2 className="w-6 h-6 text-[#2563EB] animate-spin" />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
            <UploadCloud className="w-5 h-5 text-[#2563EB]" />
          </div>
        )}
        <p className="text-sm font-semibold text-slate-700">
          {uploading ? "Uploading…" : "Drag & drop evidence, or click to browse"}
        </p>
        <p className="text-[11px] text-slate-400">Images, PDF, Word, Excel · up to 10 MB</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          className="hidden"
          onChange={(e) => { handleFiles(e.target.files); e.target.value = "" }}
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {/* Uploaded list */}
      {docs.length > 0 && (
        <div className="space-y-2">
          {docs.map((d, i) => (
            <div key={`${d.url}-${i}`} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                {isImage(d.type) ? <ImageIcon className="w-4 h-4 text-slate-500" /> : <FileText className="w-4 h-4 text-slate-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{d.name}</p>
                <p className="text-[11px] text-slate-400">{humanSize(d.size)}</p>
              </div>
              <a
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-[#2563EB] hover:bg-slate-50"
                aria-label="Open"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={() => setDocs((prev) => prev.filter((_, idx) => idx !== i))}
                className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"
                aria-label="Remove from list"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
