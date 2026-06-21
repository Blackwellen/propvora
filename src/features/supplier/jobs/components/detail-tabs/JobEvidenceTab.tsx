"use client"

import { useRef, useState } from "react"
import { Upload, Trash2, FileText } from "lucide-react"
import {
  SupplierCard, SupplierButton, SupplierBanner, SupplierLoadingState,
} from "@/components/supplier-workspace/ui"
import { timeAgo } from "@/components/supplier-workspace/format"
import type { SupplierEvidenceRow } from "@/components/supplier-workspace/types"

export interface JobEvidenceTabProps {
  assignmentId: string
  workspaceId: string | null
  rows: SupplierEvidenceRow[]
  loading: boolean
  refresh: () => void
  canEdit: boolean
}

export function JobEvidenceTab({
  assignmentId, workspaceId, rows, loading, refresh, canEdit,
}: JobEvidenceTabProps) {
  const [phase, setPhase] = useState<"before" | "during" | "after">("during")
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function onFile(file: File) {
    if (!workspaceId) return
    setUploading(true); setErr(null)
    try {
      const form = new FormData()
      form.append("file", file)
      form.append("workspaceId", workspaceId)
      form.append("folder", `supplier-jobs/${assignmentId}/${phase}`)
      const up = await fetch("/api/upload", { method: "POST", body: form })
      if (!up.ok) { setErr("Upload failed."); return }
      const meta = await up.json() as { key: string; name: string; type: string; size: number }
      const rec = await fetch(`/api/supplier/jobs/${assignmentId}/evidence`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ phase, r2Key: meta.key, fileName: meta.name, contentType: meta.type, sizeBytes: meta.size }),
      })
      if (!rec.ok) { setErr("Couldn't record evidence."); return }
      refresh()
    } catch { setErr("Network error during upload.") }
    finally { setUploading(false); if (inputRef.current) inputRef.current.value = "" }
  }

  async function remove(evidenceId: string) {
    const res = await fetch(`/api/supplier/jobs/${assignmentId}/evidence?evidenceId=${evidenceId}`, { method: "DELETE" })
    if (res.ok) refresh()
  }

  const byPhase = (p: string) => rows.filter((r) => r.phase === p)

  return (
    <SupplierCard className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-slate-900">Evidence</h2>
        {canEdit && (
          <div className="flex items-center gap-2">
            <select
              value={phase}
              onChange={(e) => setPhase(e.target.value as typeof phase)}
              className="h-8 rounded-lg border border-slate-200 text-[13px] px-2"
            >
              <option value="before">Before</option>
              <option value="during">During</option>
              <option value="after">After</option>
            </select>
            <input
              ref={inputRef}
              type="file"
              hidden
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f) }}
              accept="image/*,application/pdf"
            />
            <SupplierButton size="sm" onClick={() => inputRef.current?.click()} loading={uploading}>
              <Upload className="w-3.5 h-3.5" /> Upload
            </SupplierButton>
          </div>
        )}
      </div>
      {err && <SupplierBanner tone="red" onDismiss={() => setErr(null)}>{err}</SupplierBanner>}
      {loading ? (
        <SupplierLoadingState rows={2} />
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-400 py-4">
          No evidence yet.{" "}
          {canEdit
            ? "Capture before/during/after photos to document the work."
            : "Evidence can be added while the job is accepted or in progress."}
        </p>
      ) : (
        <div className="space-y-4 mt-2">
          {(["before", "during", "after"] as const).map((p) => {
            const list = byPhase(p)
            if (list.length === 0) return null
            return (
              <div key={p}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">
                  {p} ({list.length})
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {list.map((ev) => (
                    <div key={ev.id} className="group relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                      {ev.content_type?.startsWith("image/") && ev.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={ev.url} alt={ev.file_name ?? "Evidence"} className="w-full h-24 object-cover" />
                      ) : (
                        <div className="w-full h-24 flex items-center justify-center">
                          <FileText className="w-6 h-6 text-slate-400" />
                        </div>
                      )}
                      <div className="px-2 py-1.5">
                        <p className="text-[11px] font-medium text-slate-600 truncate">{ev.file_name ?? "File"}</p>
                        <p className="text-[10px] text-slate-400">{timeAgo(ev.created_at)}</p>
                      </div>
                      {canEdit && (
                        <button
                          onClick={() => remove(ev.id)}
                          className="absolute top-1.5 right-1.5 p-1 rounded-md bg-white/90 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </SupplierCard>
  )
}
