"use client"

import { useRef, useState } from "react"
import {
  FileText,
  Download,
  Upload,
  CheckCircle2,
  Loader2,
  Inbox,
  PenLine,
} from "lucide-react"
import type { ShareGrant } from "@/lib/portal/share"
import type { ShareDocument, ShareUpload } from "@/lib/portal/share-data"

function fileSize(n: number | null): string {
  if (!n) return ""
  if (n < 1024) return `${n} B`
  if (n < 1_048_576) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1_048_576).toFixed(1)} MB`
}
function when(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

/** Read the raw token from the current path (/p/<token>) for API calls. */
function tokenFromPath(): string {
  if (typeof window === "undefined") return ""
  const parts = window.location.pathname.split("/").filter(Boolean)
  const i = parts.indexOf("p")
  return i >= 0 && parts[i + 1] ? decodeURIComponent(parts[i + 1]) : ""
}

export function DocumentsView({
  grant,
  documents,
  uploads,
}: {
  grant: ShareGrant
  documents: ShareDocument[]
  uploads: ShareUpload[]
}) {
  const canDownload = grant.capabilities.includes("download")
  const canUpload = grant.capabilities.includes("upload")
  const canSign = grant.capabilities.includes("sign")

  const [localUploads, setLocalUploads] = useState<ShareUpload[]>(uploads)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [signed, setSigned] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleDownload(docId: string, name: string) {
    setError(null)
    try {
      const res = await fetch(
        `/api/portal/share/file?token=${encodeURIComponent(tokenFromPath())}&id=${encodeURIComponent(docId)}`
      )
      if (!res.ok) {
        setError("This file could not be downloaded.")
        return
      }
      const { url } = (await res.json()) as { url?: string }
      if (url) window.location.href = url
      else setError("This file is not available.")
    } catch {
      setError("This file could not be downloaded.")
    }
  }

  async function handleUpload(file: File) {
    setError(null)
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append("token", tokenFromPath())
      fd.append("file", file)
      const res = await fetch("/api/portal/share/upload", { method: "POST", body: fd })
      const json = (await res.json().catch(() => ({}))) as { error?: string; upload?: ShareUpload }
      if (!res.ok) {
        setError(json.error || "Upload failed.")
        return
      }
      if (json.upload) setLocalUploads((prev) => [json.upload as ShareUpload, ...prev])
    } catch {
      setError("Upload failed.")
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  async function handleSign() {
    setError(null)
    setBusy(true)
    try {
      const res = await fetch("/api/portal/share/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenFromPath() }),
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        setError(j.error || "Could not record your acknowledgement.")
        return
      }
      setSigned(true)
    } catch {
      setError("Could not record your acknowledgement.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Documents */}
      <section className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100">
          <p className="text-sm font-bold text-slate-900">Documents</p>
        </div>
        {documents.length === 0 ? (
          <div className="p-8 text-center">
            <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">No documents to show.</p>
            <p className="text-xs text-slate-400 mt-1">
              {canUpload ? "You can still upload files below." : "Please contact the sender if you expected files here."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {documents.map((d) => (
              <li key={d.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-slate-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 truncate">{d.name}</p>
                  <p className="text-xs text-slate-400">
                    {[d.category, fileSize(d.sizeBytes)].filter(Boolean).join(" · ") || "Document"}
                  </p>
                </div>
                {canDownload && d.r2Key && (
                  <button
                    onClick={() => handleDownload(d.id, d.name)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Upload */}
      {canUpload && (
        <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
          <p className="text-sm font-bold text-slate-900 mb-1">Upload a file</p>
          <p className="text-xs text-slate-500 mb-4">
            Send a document back to {grant.workspaceName}. PDFs, images and Office files up to 10&nbsp;MB.
          </p>

          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void handleUpload(f)
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm font-medium text-slate-600 hover:border-[var(--color-brand-300)] hover:bg-[var(--brand-soft)]/40 transition-colors disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {busy ? "Uploading…" : "Choose a file to upload"}
          </button>

          {localUploads.length > 0 && (
            <ul className="mt-4 space-y-2">
              {localUploads.map((u) => (
                <li key={u.id} className="flex items-center gap-2.5 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-xs font-medium text-emerald-800 truncate flex-1">{u.fileName ?? "File"}</span>
                  <span className="text-[11px] text-emerald-600">{when(u.uploadedAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Sign / acknowledge */}
      {canSign && (
        <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
          <p className="text-sm font-bold text-slate-900 mb-1">Acknowledge</p>
          <p className="text-xs text-slate-500 mb-4">
            Confirm you have read and agree to the shared document(s). Your acknowledgement is recorded with a timestamp.
          </p>
          {signed ? (
            <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
              Acknowledged. Thank you.
            </div>
          ) : (
            <button
              onClick={handleSign}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-strong)] transition-colors disabled:opacity-60"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />}
              I acknowledge
            </button>
          )}
        </section>
      )}

      {error && (
        <p className="text-xs text-red-500 text-center">{error}</p>
      )}
    </div>
  )
}
