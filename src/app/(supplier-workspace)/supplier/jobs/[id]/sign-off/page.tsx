"use client"

/* ──────────────────────────────────────────────────────────────────────────
   /supplier/jobs/[id]/sign-off — job completion & sign-off.

   Live-wired: loads the real assignment + uploaded evidence, lets the supplier
   confirm a pre-submission checklist, and on "Mark complete & request sign-off"
   calls PATCH /api/supplier/jobs/[id] { action: "complete" } which transitions
   the job in_progress → completed and stamps completed_at. The operator/customer
   then reviews and releases escrow — this control does not pay or release funds.
─────────────────────────────────────────────────────────────────────────── */

import { useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ChevronLeft, CheckCircle2, Circle, Images, Star, Banknote, ClipboardCheck,
  Send, PenLine,
} from "lucide-react"
import {
  SupplierCard, SupplierButton, SupplierBanner, SupplierField,
  SupplierLoadingState, supplierTextareaClass,
} from "@/components/supplier-workspace/ui"
import { MobileTopBar } from "@/components/mobile"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"

export const dynamic = "force-dynamic"

interface JobRow {
  id: string
  status: string
  scheduled_for: string | null
  completed_at: string | null
  job_id: string | null
}

interface EvidenceItem {
  id: string
  phase: "before" | "during" | "after"
  file_name: string | null
}

/** The supplier's own pre-submission self-check (a form, not stored data). */
const CHECKLIST_TEMPLATE = [
  "Work completed to the agreed scope",
  "Site left clean and safe",
  "Before / during / after photos captured",
  "Customer walked through the finished work",
  "Any follow-up actions noted",
]

export default function SupplierJobSignOffPage() {
  const { id } = useParams<{ id: string }>()

  const jobState = useSupplierApi<JobRow | null>(`/api/supplier/jobs/${id}`, {
    select: (j) => (j as { job?: JobRow }).job ?? null,
  })
  const evidenceState = useSupplierApi<EvidenceItem[]>(`/api/supplier/jobs/${id}/evidence`, {
    select: (j) => (j as { items?: EvidenceItem[] }).items ?? [],
  })

  const [checked, setChecked] = useState<boolean[]>(() => CHECKLIST_TEMPLATE.map(() => false))
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [banner, setBanner] = useState<{ tone: "emerald" | "red"; msg: string } | null>(null)

  const job = jobState.data
  const evidence = evidenceState.data ?? []
  const alreadyComplete = job?.status === "completed" || Boolean(job?.completed_at)

  const checklistDone = checked.filter(Boolean).length
  const checklistAll = checklistDone === CHECKLIST_TEMPLATE.length
  const capturedPhotos = evidence.filter((e) => e.file_name).length
  const photosReady = capturedPhotos > 0
  const canSubmit =
    !alreadyComplete && checklistAll && photosReady && !submitting && job?.status === "in_progress"

  const evidencePhases = useMemo(() => {
    const phases: Array<{ phase: "before" | "during" | "after"; label: string }> = [
      { phase: "before", label: "Before" },
      { phase: "during", label: "During" },
      { phase: "after", label: "After" },
    ]
    return phases.map((p) => ({
      ...p,
      count: evidence.filter((e) => e.phase === p.phase && e.file_name).length,
    }))
  }, [evidence])

  function toggle(i: number) {
    setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)))
  }

  async function requestSignOff() {
    if (!canSubmit) return
    setSubmitting(true)
    setBanner(null)
    try {
      const res = await fetch(`/api/supplier/jobs/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "complete", note: note.trim() || undefined }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        if (res.status === 409) {
          setBanner({ tone: "red", msg: "This job can't be completed from its current status." })
        } else {
          setBanner({ tone: "red", msg: body?.error ?? "Could not request sign-off. Try again." })
        }
        return
      }
      setBanner({ tone: "emerald", msg: "Job marked complete. The customer has been asked to confirm." })
      jobState.refresh()
    } catch {
      setBanner({ tone: "red", msg: "Network error. Please try again." })
    } finally {
      setSubmitting(false)
    }
  }

  if (jobState.loading) {
    return (
      <div className="space-y-5">
        <MobileTopBar title="Sign-off" subtitle="Loading…" showBack backHref={`/supplier/jobs/${id}`} />
        <SupplierCard className="p-5"><SupplierLoadingState rows={4} /></SupplierCard>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <MobileTopBar title="Sign-off" subtitle={`Job ${String(id).slice(0, 8)}`} showBack backHref={`/supplier/jobs/${id}`} />

      <Link href={`/supplier/jobs/${id}`} className="hidden md:inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700">
        <ChevronLeft className="w-4 h-4" /> Back to job
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-slate-900">Job completion &amp; sign-off</h1>
        <p className="mt-0.5 text-sm text-slate-500">Job {String(id).slice(0, 8)}</p>
      </div>

      {banner && <SupplierBanner tone={banner.tone} onDismiss={() => setBanner(null)}>{banner.msg}</SupplierBanner>}

      {alreadyComplete && !banner && (
        <SupplierBanner tone="emerald">This job is already marked complete and is awaiting customer confirmation.</SupplierBanner>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Completion" value={`${checklistDone}/${CHECKLIST_TEMPLATE.length}`} icon={ClipboardCheck} tone={checklistAll ? "emerald" : "amber"} />
        <Kpi label="Evidence" value={`${capturedPhotos} photo${capturedPhotos === 1 ? "" : "s"}`} icon={Images} tone={photosReady ? "emerald" : "amber"} />
        <Kpi label="Status" value={alreadyComplete ? "Completed" : job?.status === "in_progress" ? "In progress" : "Not started"} icon={Star} tone={alreadyComplete ? "emerald" : undefined} />
        <Kpi label="Sign-off" value={alreadyComplete ? "Requested" : "Pending"} icon={Banknote} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 items-start">
        <div className="space-y-4 min-w-0">
          {/* Completion checklist (supplier self-check) */}
          <SupplierCard className="p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Completion checklist</h2>
            <ul className="space-y-2.5">
              {CHECKLIST_TEMPLATE.map((label, i) => (
                <li key={label}>
                  <button
                    type="button"
                    onClick={() => toggle(i)}
                    disabled={alreadyComplete}
                    className="flex items-start gap-2 text-sm text-left w-full disabled:opacity-60"
                  >
                    {checked[i] ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> : <Circle className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />}
                    <span className={checked[i] ? "text-slate-600" : "text-slate-800 font-medium"}>{label}</span>
                  </button>
                </li>
              ))}
            </ul>
            {!checklistAll && !alreadyComplete && (
              <p className="mt-3 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">Confirm every item to request sign-off.</p>
            )}
          </SupplierCard>

          {/* Evidence summary (real uploaded evidence) */}
          <SupplierCard className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900">Evidence summary</h2>
              <Link href={`/supplier/jobs/${id}/evidence`} className="text-xs font-semibold text-[var(--brand)]">Manage evidence</Link>
            </div>
            {evidenceState.loading ? (
              <SupplierLoadingState rows={1} />
            ) : (
              <div className="flex flex-wrap gap-2">
                {evidencePhases.map((p) => (
                  <span key={p.phase} className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${p.count > 0 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {p.count > 0 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}{p.label} ({p.count})
                  </span>
                ))}
              </div>
            )}
            {!photosReady && !evidenceState.loading && (
              <p className="mt-3 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">Upload at least one evidence photo before requesting sign-off.</p>
            )}
          </SupplierCard>
        </div>

        {/* Customer sign-off card */}
        <div className="space-y-4">
          <SupplierCard className="p-5">
            <div className="w-10 h-10 rounded-xl bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center mb-3"><PenLine className="w-5 h-5" /></div>
            <h2 className="text-base font-semibold text-slate-900">Customer sign-off</h2>
            <p className="text-sm text-slate-500 mt-1">Mark the work complete and ask the customer to confirm. Completion helps release escrow faster.</p>
            <div className="mt-3">
              <SupplierField label="Message to customer (optional)">
                <textarea className={supplierTextareaClass} rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Thanks for having me — please confirm the work looks good." disabled={alreadyComplete} />
              </SupplierField>
            </div>
            <SupplierButton onClick={requestSignOff} disabled={!canSubmit} className="w-full justify-center mt-3">
              <Send className="w-4 h-4" /> {alreadyComplete ? "Sign-off requested" : submitting ? "Submitting…" : "Mark complete & request sign-off"}
            </SupplierButton>
            {!alreadyComplete && (!checklistAll || !photosReady) && (
              <p className="text-[11px] text-slate-400 mt-2 text-center">Finish the checklist and capture evidence first.</p>
            )}
            {!alreadyComplete && checklistAll && photosReady && job?.status !== "in_progress" && (
              <p className="text-[11px] text-amber-500 mt-2 text-center">The job must be in progress before it can be completed.</p>
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
