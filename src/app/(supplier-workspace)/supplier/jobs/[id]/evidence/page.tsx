"use client"

/* ──────────────────────────────────────────────────────────────────────────
   /supplier/jobs/[id]/evidence — job evidence upload.

   Live-wired: loads real uploaded evidence (GET /api/supplier/jobs/[id]/evidence),
   uploads files to R2 via POST /api/upload, then records each as job evidence via
   POST /api/supplier/jobs/[id]/evidence { phase, r2Key, ... }. Evidence is grouped
   before / during / after. Photos are private to the supplier until the operator
   approves them.
─────────────────────────────────────────────────────────────────────────── */

import { useRef, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ChevronLeft, Images, ShieldCheck, Upload, CheckCircle2, Lock, Trash2, Loader2 } from "lucide-react"
import { SupplierCard, SupplierButton, SupplierBanner, SupplierLoadingState } from "@/components/supplier-workspace/ui"
import { MobileTopBar } from "@/components/mobile"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { useSupplierWorkspace } from "@/components/supplier-workspace/SupplierWorkspaceContext"

export const dynamic = "force-dynamic"

type Phase = "before" | "during" | "after"

interface EvidenceItem {
  id: string
  phase: Phase
  r2_key: string
  file_name: string | null
  content_type: string | null
  url: string
}

const PHASES: { phase: Phase; label: string; hint: string }[] = [
  { phase: "before", label: "Before", hint: "Condition on arrival" },
  { phase: "during", label: "During", hint: "Work in progress" },
  { phase: "after", label: "After", hint: "Completed work" },
]

export default function SupplierJobEvidencePage() {
  const { id } = useParams<{ id: string }>()
  const { workspaceId } = useSupplierWorkspace()

  const evidenceState = useSupplierApi<EvidenceItem[]>(`/api/supplier/jobs/${id}/evidence`, {
    select: (j) => (j as { items?: EvidenceItem[] }).items ?? [],
  })
  const evidence = evidenceState.data ?? []

  const [banner, setBanner] = useState<{ tone: "emerald" | "amber" | "red"; msg: string } | null>(null)
  const [uploadingPhase, setUploadingPhase] = useState<Phase | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const pendingPhase = useRef<Phase | null>(null)

  function pick(phase: Phase) {
    if (uploadingPhase) return
    pendingPhase.current = phase
    fileRef.current?.click()
  }

  async function onChosen(f: File | undefined) {
    const phase = pendingPhase.current
    pendingPhase.current = null
    if (fileRef.current) fileRef.current.value = ""
    if (!f || !phase) return
    if (!workspaceId) {
      setBanner({ tone: "red", msg: "Workspace not ready. Please retry in a moment." })
      return
    }
    setUploadingPhase(phase)
    setBanner(null)
    try {
      // 1) Upload the file to R2 via the shared upload route.
      const form = new FormData()
      form.append("file", f)
      form.append("workspaceId", workspaceId)
      form.append("folder", `jobs/${id}/evidence/${phase}`)
      const upRes = await fetch("/api/upload", { method: "POST", body: form })
      if (!upRes.ok) {
        const b = (await upRes.json().catch(() => null)) as { error?: string } | null
        setBanner({ tone: "red", msg: b?.error ?? "Upload failed. Please try again." })
        return
      }
      const up = (await upRes.json()) as { key: string; name: string; type: string; size: number }

      // 2) Record the uploaded object as job evidence.
      const evRes = await fetch(`/api/supplier/jobs/${id}/evidence`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          phase,
          r2Key: up.key,
          fileName: up.name,
          contentType: up.type,
          sizeBytes: up.size,
        }),
      })
      if (!evRes.ok) {
        const b = (await evRes.json().catch(() => null)) as { error?: string } | null
        setBanner({ tone: "red", msg: b?.error ?? "Could not save evidence. Please try again." })
        return
      }
      setBanner({ tone: "emerald", msg: `${PHASES.find((p) => p.phase === phase)?.label} photo uploaded.` })
      evidenceState.refresh()
    } catch {
      setBanner({ tone: "red", msg: "Network error during upload. Please try again." })
    } finally {
      setUploadingPhase(null)
    }
  }

  async function remove(evidenceId: string) {
    setDeletingId(evidenceId)
    try {
      const res = await fetch(`/api/supplier/jobs/${id}/evidence?evidenceId=${encodeURIComponent(evidenceId)}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        setBanner({ tone: "red", msg: "Could not remove photo." })
        return
      }
      evidenceState.refresh()
    } catch {
      setBanner({ tone: "red", msg: "Network error removing photo." })
    } finally {
      setDeletingId(null)
    }
  }

  const totalCaptured = evidence.filter((e) => e.file_name || e.r2_key).length
  const hasAfter = evidence.some((e) => e.phase === "after")

  return (
    <div className="space-y-5">
      <MobileTopBar title="Evidence" subtitle={`Job ${String(id).slice(0, 8)}`} showBack backHref={`/supplier/jobs/${id}`} />

      <Link href={`/supplier/jobs/${id}`} className="hidden md:inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700">
        <ChevronLeft className="w-4 h-4" /> Back to job
      </Link>

      <input ref={fileRef} type="file" hidden accept="image/*,application/pdf" onChange={(e) => onChosen(e.target.files?.[0])} />

      <div>
        <h1 className="text-xl font-semibold text-slate-900">Job evidence</h1>
        <p className="mt-0.5 text-sm text-slate-500">Job {String(id).slice(0, 8)}</p>
      </div>

      {banner && <SupplierBanner tone={banner.tone} onDismiss={() => setBanner(null)}>{banner.msg}</SupplierBanner>}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Photos" value={String(totalCaptured)} icon={Images} />
        <Kpi label="Before" value={String(evidence.filter((e) => e.phase === "before").length)} icon={Images} />
        <Kpi label="After" value={String(evidence.filter((e) => e.phase === "after").length)} icon={Images} tone={hasAfter ? "emerald" : "amber"} />
        <Kpi label="Visibility" value="Private" icon={ShieldCheck} />
      </div>

      {evidenceState.loading ? (
        <SupplierCard className="p-5"><SupplierLoadingState rows={4} /></SupplierCard>
      ) : (
        <div className="space-y-4">
          {PHASES.map(({ phase, label, hint }) => {
            const items = evidence.filter((e) => e.phase === phase)
            return (
              <SupplierCard key={phase} className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">{label}</h2>
                    <p className="text-xs text-slate-400">{hint}</p>
                  </div>
                  <SupplierButton
                    variant="secondary"
                    size="sm"
                    onClick={() => pick(phase)}
                    disabled={uploadingPhase !== null}
                  >
                    {uploadingPhase === phase ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploadingPhase === phase ? "Uploading…" : "Add photo"}
                  </SupplierButton>
                </div>
                {items.length === 0 ? (
                  <p className="text-sm text-slate-400 py-4 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    No {label.toLowerCase()} photos yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {items.map((e) => (
                      <div key={e.id} className="group relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50 aspect-square">
                        {(e.content_type ?? "").startsWith("image/") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={e.url} alt={e.file_name ?? "evidence"} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <Images className="w-8 h-8" />
                          </div>
                        )}
                        <button
                          onClick={() => remove(e.id)}
                          disabled={deletingId === e.id}
                          aria-label="Remove photo"
                          className="absolute top-1.5 right-1.5 w-7 h-7 rounded-lg bg-white/90 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-100"
                        >
                          {deletingId === e.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </SupplierCard>
            )
          })}

          <SupplierCard className="p-4 flex items-start gap-2 text-xs text-slate-400">
            <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            Evidence is private to you until the operator approves it. Once you&apos;ve captured your photos,
            continue to <Link href={`/supplier/jobs/${id}/sign-off`} className="text-blue-600 font-semibold">sign-off</Link>.
          </SupplierCard>
        </div>
      )}
    </div>
  )
}

function Kpi({ label, value, icon: Icon, tone }: { label: string; value: string; icon: typeof Images; tone?: "emerald" | "amber" }) {
  return (
    <SupplierCard className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{label}</span>
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <p className={`text-lg font-bold mt-1 ${tone === "emerald" ? "text-emerald-600" : tone === "amber" ? "text-amber-600" : "text-slate-900"}`}>
        {value}
      </p>
    </SupplierCard>
  )
}
