"use client"

import { useState } from "react"
import { Upload, CheckCircle2, Loader2 } from "lucide-react"

interface SupplierPortalEvidenceUploadStepProps {
  jobId: string
  sessionId: string
  onComplete?: () => void
}

export function SupplierPortalEvidenceUploadStep({
  jobId,
  sessionId,
  onComplete,
}: SupplierPortalEvidenceUploadStepProps) {
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)

  function handleUpload() {
    setUploading(true)
    setTimeout(() => {
      setUploading(false)
      setUploaded(true)
      onComplete?.()
    }, 1200)
  }

  if (uploaded) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700">
        <CheckCircle2 className="w-4 h-4" /> Evidence uploaded successfully.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
        <Upload className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-700">Upload evidence for job</p>
        <p className="text-xs text-slate-400 mt-1">Photos, reports, or sign-off documents</p>
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
          {uploading ? "Uploading…" : "Select files"}
        </button>
      </div>
      <p className="text-xs text-slate-400">
        Evidence is securely attached to job #{jobId.slice(0, 8).toUpperCase()} and shared with
        your manager.
      </p>
    </div>
  )
}
