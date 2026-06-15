"use client"

import { useRef, useState } from "react"
import {
  Upload,
  FileText,
  Camera,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { VerificationDocument } from "./status"

/* ──────────────────────────────────────────────────────────────────────────
   DocumentUpload — supporting-document capture.

   Two-step, reusing existing infra:
     1. multipart POST the file to /api/upload (R2; validates + sniffs) → { key }
     2. POST { docType, key, name, contentType } to /api/identity/documents to
        record the metadata row.

   Mobile-first: the file input accepts images + PDF and sets `capture` so phones
   offer the camera directly. Targets are ≥44px. A clear secure-handling note
   reassures the user; no data is ever auto-marked "verified" here.
─────────────────────────────────────────────────────────────────────────── */

const DOC_TYPES: { value: string; label: string }[] = [
  { value: "passport", label: "Passport" },
  { value: "driving_licence", label: "Driving licence" },
  { value: "national_id", label: "National ID card" },
  { value: "residence_permit", label: "Residence permit" },
  { value: "proof_of_address", label: "Proof of address" },
  { value: "insurance", label: "Insurance certificate" },
  { value: "licence", label: "Trade licence" },
  { value: "business_registration", label: "Business registration" },
  { value: "other", label: "Other supporting document" },
]

const ACCEPT = "image/jpeg,image/png,image/heic,image/heif,image/webp,application/pdf"

interface UploadResponse {
  key?: string
  name?: string
  type?: string
  error?: string
}

export function DocumentUpload({
  verificationId,
  documents,
  onUploaded,
}: {
  verificationId?: string | null
  documents: VerificationDocument[]
  onUploaded: () => void
}) {
  const [docType, setDocType] = useState<string>(DOC_TYPES[0].value)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  async function handleFile(file: File) {
    setBusy(true)
    setError(null)
    setDone(null)
    try {
      // Step 1 — upload bytes to R2 via the existing route. We deliberately do
      // NOT pass a workspaceId here; the upload route reads the membership from
      // the session and rejects cross-workspace writes. To satisfy its contract
      // we resolve the workspace through the form by leaving it to the server's
      // current-workspace lookup is not supported by /api/upload, so we send the
      // status-derived workspace via the documents route which re-validates.
      const form = new FormData()
      form.append("file", file)
      form.append("folder", "verification")
      // /api/upload requires workspaceId. Resolve it from the status endpoint so
      // the key is namespaced to this workspace.
      const wsRes = await fetch("/api/identity/status", { headers: { accept: "application/json" } })
      const wsJson = (await wsRes.json().catch(() => ({}))) as { workspaceId?: string }
      if (!wsJson.workspaceId) {
        setError("Could not resolve your workspace. Please reload and try again.")
        return
      }
      form.append("workspaceId", wsJson.workspaceId)

      const upRes = await fetch("/api/upload", { method: "POST", body: form })
      const upJson = (await upRes.json().catch(() => ({}))) as UploadResponse
      if (!upRes.ok || !upJson.key) {
        setError(upJson.error || "Upload failed. Please try a clearer photo or a smaller file.")
        return
      }

      // Step 2 — record the verification document metadata.
      const recRes = await fetch("/api/identity/documents", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          workspaceId: wsJson.workspaceId,
          verificationId: verificationId ?? undefined,
          docType,
          key: upJson.key,
          name: upJson.name ?? file.name,
          contentType: upJson.type ?? file.type,
        }),
      })
      const recJson = (await recRes.json().catch(() => ({}))) as { error?: string; notReady?: boolean }
      if (!recRes.ok) {
        setError(
          recRes.status === 503 || recJson.notReady
            ? "Your file uploaded securely, but document recording isn't switched on yet. Please try again shortly."
            : recJson.error || "Could not attach the document. Please try again."
        )
        return
      }

      setDone(`${file.name} uploaded securely.`)
      onUploaded()
    } catch {
      setError("Network error — please try again.")
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div>
      {/* Doc type picker */}
      <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Document type</label>
      <select
        value={docType}
        onChange={(e) => setDocType(e.target.value)}
        disabled={busy}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 disabled:opacity-60"
      >
        {DOC_TYPES.map((d) => (
          <option key={d.value} value={d.value}>
            {d.label}
          </option>
        ))}
      </select>

      {/* Hidden camera-friendly input */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void handleFile(f)
        }}
      />

      {/* Upload CTA — large tap target */}
      <button
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className={cn(
          "mt-3 w-full flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-7 transition-colors min-h-[120px]",
          busy
            ? "border-slate-200 bg-slate-50 cursor-wait"
            : "border-slate-200 bg-slate-50/60 hover:border-[#2563EB]/40 hover:bg-blue-50/40"
        )}
      >
        {busy ? (
          <>
            <Loader2 className="w-6 h-6 text-[#2563EB] animate-spin motion-reduce:animate-none" />
            <span className="text-sm font-medium text-slate-600">Uploading securely…</span>
          </>
        ) : (
          <>
            <span className="flex items-center gap-2 text-[#2563EB]">
              <Camera className="w-5 h-5" />
              <Upload className="w-5 h-5" />
            </span>
            <span className="text-sm font-semibold text-slate-800">Take a photo or upload</span>
            <span className="text-[12px] text-slate-500 text-center">
              JPG, PNG, HEIC or PDF · up to 10&nbsp;MB · camera supported on mobile
            </span>
          </>
        )}
      </button>

      {error && (
        <p className="mt-2.5 flex items-start gap-1.5 text-[12.5px] font-medium text-amber-700">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {error}
        </p>
      )}
      {done && (
        <p className="mt-2.5 flex items-start gap-1.5 text-[12.5px] font-medium text-emerald-700">
          <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {done}
        </p>
      )}

      <p className="mt-3 flex items-start gap-1.5 text-[12px] text-slate-500">
        <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
        Documents are stored privately and encrypted. They&apos;re only accessed for verification review and never shown on your public profile.
      </p>

      {/* Uploaded list */}
      {documents.length > 0 && (
        <ul className="mt-4 divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
          {documents.map((d, i) => {
            const name = d.name ?? d.file_name ?? "Document"
            const type = (d.docType ?? d.document_type ?? "").replace(/[_-]+/g, " ")
            return (
              <li key={d.id ?? d.key ?? i} className="flex items-center gap-3 px-3 py-2.5 bg-white">
                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-slate-800 truncate">{name}</p>
                  {type && <p className="text-[11.5px] text-slate-500 capitalize">{type}</p>}
                </div>
                <span className="text-[11px] font-semibold text-slate-500 shrink-0">Received</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
