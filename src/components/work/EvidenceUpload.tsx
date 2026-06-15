"use client"

import React, { useRef, useState } from "react"
import { UploadCloud, FileText, X, Loader2, ExternalLink, Camera } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { uploadFile, validateUploadFile, type UploadedFile } from "@/lib/upload"

export interface EvidenceDoc {
  name: string
  url: string
  type: string
  size: number
  /** Persisted R2 key — the durable reference. Previews resolve from `url`
   *  (an authed /api/files/{key} stream), never a transient blob URL. */
  key?: string
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
  /** Restrict to images only (avatar / photo evidence). */
  imagesOnly?: boolean
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
  imagesOnly,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [docs, setDocs] = useState<EvidenceDoc[]>(initialDocs)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function uploadOne(file: File) {
    if (!workspaceId) {
      setError("No workspace — cannot upload.")
      return
    }
    // 1. Fast-fail client validation (size + type) before the network.
    const invalid = validateUploadFile(file, { imagesOnly })
    if (invalid) {
      setError(invalid)
      return
    }
    setError(null)
    setUploading(true)
    setProgress(0)
    try {
      // 2. Server-proxied upload to R2 — returns a PERSISTED { key, url }.
      const result: UploadedFile = await uploadFile(file, workspaceId, folder, {
        onProgress: (pct) => setProgress(pct),
      })

      const doc: EvidenceDoc = {
        name: result.name ?? file.name,
        url: result.url, // authed /api/files/{key} — survives refresh (no blob)
        type: result.type ?? file.type,
        size: result.size ?? file.size,
        key: result.key,
      }

      // 3. Persist metadata (42P01-safe) — store the R2 key + authed view url so
      //    the record survives a website/PWA refresh and re-renders from the URL.
      if (table) {
        try {
          const supabase = createClient()
          await supabase.from(table).insert({
            workspace_id: workspaceId,
            name: doc.name,
            file_key: doc.key,
            file_url: doc.url,
            file_type: doc.type,
            file_size: doc.size,
            ...extra,
          })
        } catch (e) {
          const code = (e as { code?: string })?.code
          // file_key may not exist on every legacy table — retry without it.
          if (code === "42703") {
            try {
              const supabase = createClient()
              await supabase.from(table).insert({
                workspace_id: workspaceId,
                name: doc.name,
                file_url: doc.url,
                file_type: doc.type,
                file_size: doc.size,
                ...extra,
              })
            } catch (e2) {
              const c2 = (e2 as { code?: string })?.code
              if (c2 !== "42P01") console.error("Evidence metadata save failed:", e2)
            }
          } else if (code !== "42P01") {
            console.error("Evidence metadata save failed:", e)
          }
        }
      }

      // 4. Optimistic UI — render the thumbnail from the persisted URL.
      setDocs((prev) => [doc, ...prev])
      onUploaded?.(doc)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setUploading(false)
      setProgress(null)
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files) return
    for (const file of Array.from(files)) {
      await uploadOne(file)
    }
  }

  const acceptAttr = accept ?? (imagesOnly ? "image/*" : undefined)

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
          {uploading
            ? progress != null ? `Uploading… ${progress}%` : "Uploading…"
            : "Drag & drop, or click to browse"}
        </p>
        <p className="text-[11px] text-slate-400">
          {imagesOnly ? "Images (JPG, PNG, WebP, HEIC) · up to 10 MB" : "Images, PDF, Word, Excel · up to 10 MB"}
        </p>

        {/* Progress bar */}
        {uploading && progress != null && (
          <div className="w-full max-w-[220px] h-1.5 rounded-full bg-slate-200 overflow-hidden mt-1">
            <div className="h-full bg-[#2563EB] transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          multiple
          accept={acceptAttr}
          className="hidden"
          onChange={(e) => { handleFiles(e.target.files); e.target.value = "" }}
        />
      </div>

      {/* Mobile / PWA camera capture — opens the camera directly on devices. */}
      <button
        type="button"
        onClick={() => cameraRef.current?.click()}
        className="sm:hidden flex items-center justify-center gap-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
      >
        <Camera className="w-4 h-4 text-[#2563EB]" />
        Take a photo
      </button>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => { handleFiles(e.target.files); e.target.value = "" }}
      />

      {error && <p className="text-xs text-red-600" role="alert">{error}</p>}

      {/* Uploaded list — image thumbnails resolve from the persisted signed URL */}
      {docs.length > 0 && (
        <div className="space-y-2">
          {docs.map((d, i) => (
            <div key={`${d.key ?? d.url}-${i}`} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
              <div className="w-9 h-9 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                {isImage(d.type) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.url} alt={d.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <FileText className="w-4 h-4 text-slate-500" />
                )}
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
