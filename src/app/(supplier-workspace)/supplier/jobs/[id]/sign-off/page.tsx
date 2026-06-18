"use client"

/* ──────────────────────────────────────────────────────────────────────────
   /supplier/jobs/[id]/sign-off — job completion & sign-off (manifest image 47).

   Completion / evidence / customer-review / payment KPIs, a completion
   checklist, an evidence summary, the customer sign-off request card, and
   warranty + recommendations. "Request sign-off" is a typed stub (toast + audit
   TODO). No control pays or releases the job — the operator does that.
─────────────────────────────────────────────────────────────────────────── */

import { useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ChevronLeft, CheckCircle2, Circle, Images, Star, Banknote, ClipboardCheck,
  ShieldCheck, Send, Sparkles, PenLine,
} from "lucide-react"
import { SupplierCard, SupplierButton, SupplierBanner, SupplierField, supplierTextareaClass } from "@/components/supplier-workspace/ui"
import { MobileTopBar } from "@/components/mobile"
import { moneyPence } from "@/components/supplier-workspace/format"
import { getSeedJobCompletion } from "@/features/supplier/jobs/data/completion"

export const dynamic = "force-dynamic"

export default function SupplierJobSignOffPage() {
  const { id } = useParams<{ id: string }>()
  const job = useMemo(() => getSeedJobCompletion(id), [id])
  const [note, setNote] = useState("")
  const [requested, setRequested] = useState(false)
  const [banner, setBanner] = useState<string | null>(null)

  const checklistDone = job.checklist.filter((c) => c.done).length
  const checklistAll = checklistDone === job.checklist.length
  const capturedPhotos = job.evidence.filter((e) => e.fileName).length
  const requiredPhotos = job.evidence.filter((e) => e.required)
  const photosReady = requiredPhotos.every((e) => e.fileName)

  function requestSignOff() {
    // STUB: TODO POST sign-off request + audit `job.signoff.requested`
    setRequested(true)
    setBanner("Sign-off request sent to the customer.")
  }

  return (
    <div className="space-y-5">
      <MobileTopBar title="Sign-off" subtitle={`Job ${job.ref}`} showBack backHref={`/supplier/jobs/${id}`} />

      <Link href={`/supplier/jobs/${id}`} className="hidden md:inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700">
        <ChevronLeft className="w-4 h-4" /> Back to job
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-slate-900">Job completion &amp; sign-off</h1>
        <p className="mt-0.5 text-sm text-slate-500">{job.title} · {job.workspace}</p>
      </div>

      {banner && <SupplierBanner tone="emerald" onDismiss={() => setBanner(null)}>{banner}</SupplierBanner>}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Completion" value={`${checklistDone}/${job.checklist.length}`} icon={ClipboardCheck} tone={checklistAll ? "emerald" : "amber"} />
        <Kpi label="Evidence" value={`${capturedPhotos} photo${capturedPhotos === 1 ? "" : "s"}`} icon={Images} tone={photosReady ? "emerald" : "amber"} />
        <Kpi label="Customer review" value={requested ? "Requested" : "Pending"} icon={Star} />
        <Kpi label="Payment" value={moneyPence(job.valuePence)} icon={Banknote} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 items-start">
        <div className="space-y-4 min-w-0">
          {/* Completion checklist */}
          <SupplierCard className="p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Completion checklist</h2>
            <ul className="space-y-2.5">
              {job.checklist.map((c) => (
                <li key={c.id} className="flex items-start gap-2 text-sm">
                  {c.done ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> : <Circle className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />}
                  <span className={c.done ? "text-slate-600" : "text-slate-800 font-medium"}>{c.label}</span>
                </li>
              ))}
            </ul>
            {!checklistAll && (
              <p className="mt-3 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">Complete every item to request sign-off.</p>
            )}
          </SupplierCard>

          {/* Evidence summary */}
          <SupplierCard className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900">Evidence summary</h2>
              <Link href={`/supplier/jobs/${id}/evidence`} className="text-xs font-semibold text-blue-600">Manage evidence</Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {job.evidence.map((e) => (
                <span key={e.id} className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${e.fileName ? "bg-emerald-50 text-emerald-700" : e.required ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500"}`}>
                  {e.fileName ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}{e.label}
                </span>
              ))}
            </div>
          </SupplierCard>

          {/* Warranty + recommendations */}
          {(job.warranty || job.recommendations.length > 0) && (
            <SupplierCard className="p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Warranty &amp; recommendations</h2>
              {job.warranty && (
                <div className="flex items-start gap-2 mb-3 text-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-slate-700"><span className="font-semibold">{job.warranty.months}-month warranty</span> — {job.warranty.note}</span>
                </div>
              )}
              {job.recommendations.length > 0 && (
                <ul className="space-y-1.5">
                  {job.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600"><Sparkles className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />{r}</li>
                  ))}
                </ul>
              )}
            </SupplierCard>
          )}
        </div>

        {/* Customer sign-off card */}
        <div className="space-y-4">
          <SupplierCard className="p-5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3"><PenLine className="w-5 h-5" /></div>
            <h2 className="text-base font-semibold text-slate-900">Customer sign-off</h2>
            <p className="text-sm text-slate-500 mt-1">Ask {job.customer} to confirm the work is complete. Sign-off helps release escrow faster.</p>
            <div className="mt-3">
              <SupplierField label="Message to customer (optional)">
                <textarea className={supplierTextareaClass} rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Thanks for having me — please confirm the work looks good." />
              </SupplierField>
            </div>
            <SupplierButton onClick={requestSignOff} disabled={!checklistAll || !photosReady || requested} className="w-full justify-center mt-3">
              <Send className="w-4 h-4" /> {requested ? "Sign-off requested" : "Request sign-off"}
            </SupplierButton>
            {(!checklistAll || !photosReady) && (
              <p className="text-[11px] text-slate-400 mt-2 text-center">Finish the checklist and required photos first.</p>
            )}
          </SupplierCard>
        </div>
      </div>
    </div>
  )
}

function Kpi({ label, value, icon: Icon, tone }: { label: string; value: string; icon: typeof Images; tone?: "emerald" | "amber" }) {
  return (
    <SupplierCard className="p-4">
      <div className="flex items-center justify-between"><span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{label}</span><Icon className="w-4 h-4 text-slate-400" /></div>
      <p className={`text-lg font-bold mt-1 ${tone === "emerald" ? "text-emerald-600" : tone === "amber" ? "text-amber-600" : "text-slate-900"}`}>{value}</p>
    </SupplierCard>
  )
}
