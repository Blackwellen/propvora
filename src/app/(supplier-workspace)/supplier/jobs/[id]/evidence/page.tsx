"use client"

/* ──────────────────────────────────────────────────────────────────────────
   /supplier/jobs/[id]/evidence — job evidence upload (manifest image 46).

   Quality-score + escrow KPIs, before/during/after evidence checklist with
   per-slot upload (upload-only — no URL inputs), upload queue, escrow release
   requirements, and "Submit evidence". Submitting is a typed stub (toast +
   audit TODO) until the live evidence write is wired here. Storage target:
   supplier-workspaces/{wsId}/jobs/{jobId}/evidence/{phase}/…
─────────────────────────────────────────────────────────────────────────── */

import { useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ChevronLeft, Images, ShieldCheck, Gauge, Upload, CheckCircle2, Circle, Lock } from "lucide-react"
import { SupplierCard, SupplierButton, SupplierBanner } from "@/components/supplier-workspace/ui"
import { MobileTopBar } from "@/components/mobile"
import { moneyPence } from "@/components/supplier-workspace/format"
import { getSeedJobCompletion } from "@/features/supplier/jobs/data/completion"
import { EvidencePhaseList } from "@/features/supplier/jobs/components/evidence/EvidencePhaseList"
import type { EvidenceSlot } from "@/features/supplier/jobs/components/evidence/EvidencePhaseCard"

export const dynamic = "force-dynamic"

export default function SupplierJobEvidencePage() {
  const { id } = useParams<{ id: string }>()
  const job = useMemo(() => getSeedJobCompletion(id), [id])

  const [files, setFiles] = useState<Record<string, string>>(
    () => Object.fromEntries(job.evidence.filter((e) => e.fileName).map((e) => [e.id, e.fileName as string]))
  )
  const [banner, setBanner] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const pending = useRef<string | null>(null)

  function pick(slotId: string) { pending.current = slotId; fileRef.current?.click() }
  function onChosen(f: File | undefined) {
    const slot = pending.current
    if (!f || !slot) return
    // STUB: TODO upload to supplier-workspaces/{wsId}/jobs/{id}/evidence/{phase}
    setFiles((m) => ({ ...m, [slot]: f.name }))
    pending.current = null
    if (fileRef.current) fileRef.current.value = ""
  }

  const slots: EvidenceSlot[] = job.evidence.map((e) => ({
    id: e.id,
    label: e.label,
    required: e.required,
    phase: e.phase,
    fileName: e.fileName ?? undefined,
  }))

  const requiredSlots = slots.filter((e) => e.required)
  const capturedRequired = requiredSlots.filter((e) => files[e.id]).length
  const allRequired = capturedRequired === requiredSlots.length
  const totalCaptured = slots.filter((e) => files[e.id]).length

  const releaseReqs = [
    { label: "All required photos captured", ok: allRequired },
    { label: "Quality score above 70", ok: (job.qualityScore ?? 0) >= 70 },
    { label: "Job marked complete", ok: true },
  ]

  function submit() {
    // STUB: TODO POST evidence batch + audit `evidence.submitted`
    setBanner(allRequired ? "Evidence submitted for review." : "Upload all required photos before submitting.")
  }

  return (
    <div className="space-y-5">
      <MobileTopBar title="Evidence" subtitle={`Job ${job.ref}`} showBack backHref={`/supplier/jobs/${id}`} />

      <Link href={`/supplier/jobs/${id}`} className="hidden md:inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700">
        <ChevronLeft className="w-4 h-4" /> Back to job
      </Link>

      <input ref={fileRef} type="file" hidden accept="image/*,application/pdf" onChange={(e) => onChosen(e.target.files?.[0])} />

      <div>
        <h1 className="text-xl font-semibold text-slate-900">Job evidence</h1>
        <p className="mt-0.5 text-sm text-slate-500">{job.title} · {job.workspace}</p>
      </div>

      {banner && <SupplierBanner tone={allRequired ? "emerald" : "amber"} onDismiss={() => setBanner(null)}>{banner}</SupplierBanner>}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Quality score" value={job.qualityScore != null ? String(job.qualityScore) : "—"} icon={Gauge} tone={(job.qualityScore ?? 0) >= 70 ? "emerald" : "amber"} />
        <Kpi label="Photos" value={`${totalCaptured}/${slots.length}`} icon={Images} />
        <Kpi label="Escrow" value={job.escrowStatus === "held" ? "Held" : job.escrowStatus === "ready" ? "Ready" : "Released"} icon={ShieldCheck} tone={job.escrowStatus === "released" ? "emerald" : "amber"} />
        <Kpi label="Job value" value={moneyPence(job.valuePence)} icon={Lock} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 items-start">
        {/* Evidence checklist — extracted EvidencePhaseList */}
        <EvidencePhaseList slots={slots} capturedFiles={files} onPickSlot={pick} />

        {/* Escrow release requirements + submit */}
        <div className="space-y-4">
          <SupplierCard className="p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Escrow release requirements</h2>
            <ul className="space-y-2.5">
              {releaseReqs.map((r) => (
                <li key={r.label} className="flex items-start gap-2 text-sm">
                  {r.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />
                  )}
                  <span className={r.ok ? "text-slate-600" : "text-slate-800 font-medium"}>{r.label}</span>
                </li>
              ))}
            </ul>
            <SupplierButton onClick={submit} disabled={!allRequired} className="w-full justify-center mt-4">
              <Upload className="w-4 h-4" /> Submit evidence
            </SupplierButton>
            <p className="text-[11px] text-slate-400 mt-2 flex items-start gap-1.5">
              <Lock className="w-3 h-3 mt-0.5 shrink-0" /> Evidence is private to you until the operator approves it.
            </p>
          </SupplierCard>

          <Link href={`/supplier/jobs/${id}/sign-off`}>
            <SupplierCard className="p-4 hover:shadow-md transition-shadow flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">Continue to sign-off</p>
                <p className="text-xs text-slate-400">Request customer confirmation</p>
              </div>
            </SupplierCard>
          </Link>
        </div>
      </div>
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
