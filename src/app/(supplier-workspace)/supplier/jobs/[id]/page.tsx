"use client"

import { useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ChevronLeft, LayoutGrid, ClipboardList, CalendarClock, MessagesSquare, Images,
  FileText, Banknote, GitBranch, KeyRound, AlertTriangle, History, ShieldCheck,
  Play, CheckCircle2, ArrowRight, Upload, Trash2, Building2, Calendar, Activity, XCircle,
} from "lucide-react"
import { MobileTopBar } from "@/components/mobile"
import {
  SupplierCard, SupplierLoadingState, SupplierNotReady, SupplierStatusBadge,
  SupplierTabs, SupplierButton, SupplierBanner, SupplierField, SupplierDrawer,
  supplierInputClass, supplierTextareaClass, toneForStatus, humaniseStatus,
  type SupplierTab,
} from "@/components/supplier-workspace/ui"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { useSupplierWorkspace } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import { shortDate, timeAgo, moneyPence } from "@/components/supplier-workspace/format"
import type {
  SupplierAssignmentRow, SupplierJobEvent, SupplierEvidenceRow, SupplierDisputeRow,
} from "@/components/supplier-workspace/types"

/* Forward-only, status-guarded transitions mirroring src/lib/supplier/jobs.ts:
   assigned → accepted → in_progress → completed. The supplier only ever sees the
   single next safe step; "Mark complete" is the only path to 'completed' and is
   written server-side (completeJob stamps completed_at). No CTA pays or releases. */
const NEXT_STEP: Record<string, { status: string; label: string; icon: typeof ArrowRight }> = {
  assigned: { status: "accepted", label: "Accept job", icon: CheckCircle2 },
  accepted: { status: "in_progress", label: "Start work", icon: Play },
  in_progress: { status: "completed", label: "Mark work complete", icon: CheckCircle2 },
}

const STAGES = ["assigned", "accepted", "in_progress", "completed"] as const

const TABS: SupplierTab[] = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "scope", label: "Scope", icon: ClipboardList },
  { key: "schedule", label: "Schedule", icon: CalendarClock },
  { key: "messages", label: "Messages", icon: MessagesSquare },
  { key: "evidence", label: "Evidence", icon: Images },
  { key: "quote", label: "Quote", icon: FileText },
  { key: "payments", label: "Payments", icon: Banknote },
  { key: "variations", label: "Variations", icon: GitBranch },
  { key: "access", label: "Access", icon: KeyRound },
  { key: "dispute", label: "Dispute", icon: AlertTriangle },
  { key: "audit", label: "Audit", icon: History },
]

export default function SupplierJobDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const { workspaceId } = useSupplierWorkspace()
  const [tab, setTab] = useState("overview")
  const [transitioning, setTransitioning] = useState(false)
  const [banner, setBanner] = useState<string | null>(null)

  const job = useSupplierApi<SupplierAssignmentRow>(id ? `/api/supplier/jobs/${id}` : null, {
    select: (j) => (j as { job?: SupplierAssignmentRow }).job ?? (j as SupplierAssignmentRow),
  })
  const events = useSupplierApi<SupplierJobEvent[]>(id ? `/api/supplier/jobs/${id}/events` : null, {
    select: (j) => (j as { events?: SupplierJobEvent[] }).events ?? [],
  })
  const evidence = useSupplierApi<SupplierEvidenceRow[]>(id ? `/api/supplier/jobs/${id}/evidence` : null, {
    select: (j) => (j as { items?: SupplierEvidenceRow[] }).items ?? [],
  })
  const disputes = useSupplierApi<SupplierDisputeRow[]>(
    id && workspaceId ? `/api/supplier/disputes?workspaceId=${workspaceId}&assignmentId=${id}` : null,
    { select: (j) => (j as { items?: SupplierDisputeRow[] }).items ?? [] }
  )

  const j = job.data
  const next = useMemo(() => NEXT_STEP[(j?.status ?? "").toLowerCase()] ?? null, [j?.status])
  const stageIndex = j ? STAGES.indexOf(j.status as (typeof STAGES)[number]) : -1

  async function advance(toStatus: string) {
    if (!id) return
    setTransitioning(true); setBanner(null)
    try {
      const res = await fetch(`/api/supplier/jobs/${id}/status`, {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({ to: toStatus }),
      })
      if (!res.ok) {
        setBanner(res.status === 409 ? "That step is no longer available for this job." : "Couldn't update the job status.")
        return
      }
      job.refresh(); events.refresh()
    } catch { setBanner("Network error — please try again.") }
    finally { setTransitioning(false) }
  }

  async function cancelJob() {
    if (!id) return
    if (!window.confirm("Cancel this job? This cannot be undone.")) return
    await advance("cancelled")
  }

  return (
    <div className="space-y-5">
      <MobileTopBar title={`Job ${id?.slice(0, 8) ?? ""}`} subtitle="Work order" showBack backHref="/supplier/jobs" />

      <div className="hidden md:flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href="/supplier/jobs" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2">
            <ChevronLeft className="w-4 h-4" /> Back to jobs
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">Job {id?.slice(0, 8)}</h1>
          {j && <p className="mt-1 text-sm text-slate-500">{j.quote_id ? "From an accepted quote" : "Direct assignment"} · created {shortDate(j.created_at)}</p>}
        </div>
        {j && <SupplierStatusBadge tone={toneForStatus(j.status)}>{humaniseStatus(j.status)}</SupplierStatusBadge>}
      </div>

      {banner && <SupplierBanner tone="amber" onDismiss={() => setBanner(null)}>{banner}</SupplierBanner>}

      {job.loading ? (
        <SupplierCard className="p-5"><SupplierLoadingState rows={5} /></SupplierCard>
      ) : job.notReady || !j ? (
        <SupplierCard className="p-5">
          <SupplierNotReady icon={Activity} title="Job unavailable" description="This job will load once the supplier jobs service is connected to your workspace." />
        </SupplierCard>
      ) : (
        <>
          {/* Lifecycle stepper */}
          <SupplierCard className="p-4">
            <div className="flex items-center gap-1 overflow-x-auto">
              {STAGES.map((stage, i) => {
                const reached = stageIndex >= i && stageIndex !== -1
                const current = stageIndex === i
                return (
                  <div key={stage} className="flex items-center gap-1 shrink-0">
                    <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${current ? "bg-[#0D1B2A] text-white" : reached ? "text-emerald-600" : "text-slate-400"}`}>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${current ? "bg-white text-[#0D1B2A]" : reached ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                        {reached && !current ? "✓" : i + 1}
                      </span>
                      <span className="text-[12px] font-semibold whitespace-nowrap">{humaniseStatus(stage)}</span>
                    </div>
                    {i < STAGES.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-slate-300" />}
                  </div>
                )
              })}
            </div>
          </SupplierCard>

          <SupplierTabs tabs={TABS} active={tab} onChange={setTab} />

          <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-4">
            <div className="space-y-4 min-w-0">
              {tab === "overview" && <OverviewTab job={j} />}
              {tab === "scope" && <ScopeTab job={j} />}
              {tab === "schedule" && <ScheduleTab job={j} />}
              {tab === "messages" && <MessagesTab />}
              {tab === "evidence" && (
                <EvidenceTab
                  assignmentId={id!}
                  workspaceId={workspaceId}
                  rows={evidence.data ?? []}
                  loading={evidence.loading}
                  refresh={() => { evidence.refresh(); events.refresh() }}
                  canEdit={j.status === "in_progress" || j.status === "accepted"}
                />
              )}
              {tab === "quote" && <QuoteTab job={j} />}
              {tab === "payments" && <PaymentsTab />}
              {tab === "variations" && <VariationsTab />}
              {tab === "access" && <AccessTab />}
              {tab === "dispute" && (
                <DisputeTab
                  assignmentId={id!}
                  workspaceId={workspaceId}
                  rows={disputes.data ?? []}
                  loading={disputes.loading}
                  refresh={() => { disputes.refresh(); events.refresh() }}
                />
              )}
              {tab === "audit" && <AuditTab events={events.data ?? []} loading={events.loading} />}
            </div>

            {/* Right rail: next action + facts */}
            <div className="space-y-4">
              <SupplierCard className="p-5">
                <h2 className="text-base font-semibold text-slate-900 mb-3">Next action</h2>
                {next ? (
                  <>
                    <p className="text-sm text-slate-500 mb-3">
                      Move this job forward. This records the step for the property manager — it never closes or pays out the job on its own.
                    </p>
                    <SupplierButton onClick={() => advance(next.status)} loading={transitioning} className="w-full">
                      <next.icon className="w-4 h-4" /> {next.label}
                    </SupplierButton>
                  </>
                ) : j.status === "completed" ? (
                  <p className="text-sm text-slate-500">Work is complete. The property manager handles approval and payment release from here.</p>
                ) : (
                  <p className="text-sm text-slate-500">No supplier action is pending on this job.</p>
                )}
                {(j.status === "assigned" || j.status === "accepted" || j.status === "in_progress") && (
                  <button onClick={cancelJob} className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-red-600 hover:text-red-700">
                    <XCircle className="w-4 h-4" /> Cancel job
                  </button>
                )}
              </SupplierCard>

              <SupplierCard className="p-5">
                <h2 className="text-base font-semibold text-slate-900 mb-3">At a glance</h2>
                <dl className="space-y-3">
                  <Fact label="Status" value={humaniseStatus(j.status)} />
                  <Fact label="Scheduled" value={shortDate(j.scheduled_for)} />
                  <Fact label="Completed" value={shortDate(j.completed_at)} />
                  <Fact label="Source" value={j.quote_id ? "Accepted quote" : "Direct assignment"} />
                  <Fact label="Evidence" value={`${(evidence.data ?? []).length} file${(evidence.data ?? []).length === 1 ? "" : "s"}`} />
                  <Fact label="Last update" value={timeAgo(j.updated_at ?? j.created_at)} />
                </dl>
              </SupplierCard>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/* ── Tabs ─────────────────────────────────────────────────────────────────── */

function OverviewTab({ job }: { job: SupplierAssignmentRow }) {
  return (
    <SupplierCard className="p-5">
      <h2 className="text-base font-semibold text-slate-900 mb-4">Overview</h2>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        <Detail icon={Building2} label="Operator workspace" value={job.operator_workspace_id.slice(0, 8)} />
        <Detail icon={Calendar} label="Scheduled" value={shortDate(job.scheduled_for)} />
        <Detail icon={Activity} label="Status" value={humaniseStatus(job.status)} />
        <Detail icon={FileText} label="Linked job" value={job.job_id ? job.job_id.slice(0, 8) : "—"} />
      </dl>
    </SupplierCard>
  )
}

function ScopeTab({ job }: { job: SupplierAssignmentRow }) {
  return (
    <SupplierCard className="p-5">
      <h2 className="text-base font-semibold text-slate-900 mb-2">Scope of work</h2>
      <p className="text-sm text-slate-500">
        {job.quote_id
          ? "This job was created from a quote you submitted. The agreed scope is the description and price of that accepted quote — see the Quote tab."
          : "This job was assigned directly. Confirm the scope with the property manager via Messages before starting work."}
      </p>
    </SupplierCard>
  )
}

function ScheduleTab({ job }: { job: SupplierAssignmentRow }) {
  return (
    <SupplierCard className="p-5">
      <h2 className="text-base font-semibold text-slate-900 mb-3">Schedule</h2>
      {job.scheduled_for ? (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center"><CalendarClock className="w-5 h-5 text-blue-600" /></div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{shortDate(job.scheduled_for)}</p>
            <p className="text-xs text-slate-500">Agreed appointment</p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500">No appointment scheduled yet. The property manager sets the date when the job is assigned; coordinate via Messages if it needs to change.</p>
      )}
    </SupplierCard>
  )
}

function MessagesTab() {
  return (
    <SupplierCard className="p-5">
      <h2 className="text-base font-semibold text-slate-900 mb-2">Messages</h2>
      <p className="text-sm text-slate-500">
        Job messaging with the property manager runs through your workspace inbox. Open <Link href="/supplier/messages" className="font-semibold text-[#2563EB]">Messages</Link> to see the full thread.
      </p>
    </SupplierCard>
  )
}

function EvidenceTab({
  assignmentId, workspaceId, rows, loading, refresh, canEdit,
}: {
  assignmentId: string; workspaceId: string | null; rows: SupplierEvidenceRow[]
  loading: boolean; refresh: () => void; canEdit: boolean
}) {
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
      const meta = await up.json()
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
            <select value={phase} onChange={(e) => setPhase(e.target.value as typeof phase)} className="h-8 rounded-lg border border-slate-200 text-[13px] px-2">
              <option value="before">Before</option>
              <option value="during">During</option>
              <option value="after">After</option>
            </select>
            <input ref={inputRef} type="file" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f) }} accept="image/*,application/pdf" />
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
        <p className="text-sm text-slate-400 py-4">No evidence yet. {canEdit ? "Capture before/during/after photos to document the work." : "Evidence can be added while the job is accepted or in progress."}</p>
      ) : (
        <div className="space-y-4 mt-2">
          {(["before", "during", "after"] as const).map((p) => {
            const list = byPhase(p)
            if (list.length === 0) return null
            return (
              <div key={p}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">{p} ({list.length})</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {list.map((ev) => (
                    <div key={ev.id} className="group relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                      {ev.content_type?.startsWith("image/") && ev.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={ev.url} alt={ev.file_name ?? "Evidence"} className="w-full h-24 object-cover" />
                      ) : (
                        <div className="w-full h-24 flex items-center justify-center"><FileText className="w-6 h-6 text-slate-400" /></div>
                      )}
                      <div className="px-2 py-1.5">
                        <p className="text-[11px] font-medium text-slate-600 truncate">{ev.file_name ?? "File"}</p>
                        <p className="text-[10px] text-slate-400">{timeAgo(ev.created_at)}</p>
                      </div>
                      {canEdit && (
                        <button onClick={() => remove(ev.id)} className="absolute top-1.5 right-1.5 p-1 rounded-md bg-white/90 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Remove">
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

function QuoteTab({ job }: { job: SupplierAssignmentRow }) {
  return (
    <SupplierCard className="p-5">
      <h2 className="text-base font-semibold text-slate-900 mb-2">Quote</h2>
      {job.quote_id ? (
        <p className="text-sm text-slate-500">
          This job originated from quote <span className="font-mono text-slate-700">{job.quote_id.slice(0, 8)}</span>. The agreed amount and terms live on the quote record. See <Link href="/supplier/quotes" className="font-semibold text-[#2563EB]">Quotes</Link>.
        </p>
      ) : (
        <p className="text-sm text-slate-500">This job was assigned directly without a marketplace quote.</p>
      )}
    </SupplierCard>
  )
}

function PaymentsTab() {
  return (
    <SupplierCard className="p-5">
      <h2 className="text-base font-semibold text-slate-900 mb-2">Payments</h2>
      <p className="text-sm text-slate-500">
        You raise invoices and track payouts at the workspace level. Open <Link href="/supplier/invoices" className="font-semibold text-[#2563EB]">Invoices</Link> to bill for this job, and <Link href="/supplier/payouts" className="font-semibold text-[#2563EB]">Payouts</Link> to see settled funds. Payment release is controlled by the property manager.
      </p>
    </SupplierCard>
  )
}

function VariationsTab() {
  return (
    <SupplierCard className="p-5">
      <h2 className="text-base font-semibold text-slate-900 mb-2">Variations</h2>
      <p className="text-sm text-slate-500">
        Extra work beyond the agreed scope should be quoted separately so it is approved and paid correctly. Raise a new quote from <Link href="/supplier/quotes" className="font-semibold text-[#2563EB]">Quotes</Link> and reference this job.
      </p>
    </SupplierCard>
  )
}

function AccessTab() {
  return (
    <SupplierCard className="p-5">
      <h2 className="text-base font-semibold text-slate-900 mb-2">Property access</h2>
      <p className="text-sm text-slate-500">
        Access details (key collection, alarm codes, tenant contact, parking) are shared by the property manager via Messages for security. Never store sensitive access codes in evidence or notes.
      </p>
    </SupplierCard>
  )
}

function DisputeTab({
  assignmentId, workspaceId, rows, loading, refresh,
}: {
  assignmentId: string; workspaceId: string | null; rows: SupplierDisputeRow[]; loading: boolean; refresh: () => void
}) {
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState("")
  const [category, setCategory] = useState("payment")
  const [detail, setDetail] = useState("")
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function raise() {
    if (!workspaceId || !subject.trim()) { setErr("A subject is required."); return }
    setBusy(true); setErr(null)
    try {
      const res = await fetch("/api/supplier/disputes", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ workspaceId, assignmentId, subject: subject.trim(), category, detail: detail || undefined }),
      })
      if (!res.ok) { setErr("Couldn't raise the dispute."); return }
      setOpen(false); setSubject(""); setDetail(""); refresh()
    } catch { setErr("Network error.") }
    finally { setBusy(false) }
  }

  async function withdraw(disputeId: string) {
    if (!workspaceId) return
    const res = await fetch("/api/supplier/disputes", {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify({ workspaceId, disputeId, action: "withdraw" }),
    })
    if (res.ok) refresh()
  }

  return (
    <SupplierCard className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-slate-900">Disputes</h2>
        <SupplierButton size="sm" variant="secondary" onClick={() => setOpen(true)}>
          <AlertTriangle className="w-3.5 h-3.5" /> Raise dispute
        </SupplierButton>
      </div>
      {loading ? (
        <SupplierLoadingState rows={2} />
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-400 py-3">No disputes on this job. Raise one if there is a problem with payment, scope, quality or access that you can&apos;t resolve directly.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((d) => (
            <li key={d.id} className="rounded-xl border border-slate-200 p-3.5">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-slate-900">{d.subject}</p>
                <SupplierStatusBadge tone={toneForStatus(d.status)}>{humaniseStatus(d.status)}</SupplierStatusBadge>
                <SupplierStatusBadge tone="slate">{humaniseStatus(d.category)}</SupplierStatusBadge>
              </div>
              {d.detail && <p className="text-xs text-slate-500 mt-1">{d.detail}</p>}
              {d.resolution && <p className="text-xs text-emerald-700 mt-1">Resolution: {d.resolution}</p>}
              <p className="text-[11px] text-slate-400 mt-1">Raised {timeAgo(d.created_at)} by {d.raised_by_side}</p>
              {(d.status === "open" || d.status === "under_review") && d.raised_by_side === "supplier" && (
                <button onClick={() => withdraw(d.id)} className="mt-2 text-[12px] font-semibold text-slate-500 hover:text-slate-700">Withdraw</button>
              )}
            </li>
          ))}
        </ul>
      )}
      <SupplierDrawer
        open={open} onClose={() => setOpen(false)} title="Raise a dispute"
        footer={<>
          <SupplierButton variant="secondary" onClick={() => setOpen(false)}>Cancel</SupplierButton>
          <SupplierButton onClick={raise} loading={busy}>Submit</SupplierButton>
        </>}
      >
        {err && <SupplierBanner tone="red" onDismiss={() => setErr(null)}>{err}</SupplierBanner>}
        <SupplierField label="Subject" required>
          <input className={supplierInputClass} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Payment not released after completion" />
        </SupplierField>
        <SupplierField label="Category">
          <select className={supplierInputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="payment">Payment</option>
            <option value="scope">Scope</option>
            <option value="quality">Quality</option>
            <option value="access">Access</option>
            <option value="other">Other</option>
          </select>
        </SupplierField>
        <SupplierField label="Detail" hint="What happened, and what outcome you're seeking.">
          <textarea className={supplierTextareaClass} value={detail} onChange={(e) => setDetail(e.target.value)} />
        </SupplierField>
      </SupplierDrawer>
    </SupplierCard>
  )
}

function AuditTab({ events, loading }: { events: SupplierJobEvent[]; loading: boolean }) {
  return (
    <SupplierCard className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="w-4 h-4 text-slate-500" />
        <h2 className="text-base font-semibold text-slate-900">Audit trail</h2>
      </div>
      {loading ? (
        <SupplierLoadingState rows={3} />
      ) : events.length === 0 ? (
        <p className="text-sm text-slate-400 py-3">No activity recorded yet.</p>
      ) : (
        <ol className="space-y-4">
          {events.map((e, i) => (
            <li key={e.id ?? i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] mt-1.5" />
                {i < events.length - 1 && <span className="flex-1 w-px bg-slate-200 my-1" />}
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <p className="text-sm font-semibold text-slate-800">{e.status ? humaniseStatus(e.status) : "Update"}</p>
                {e.note && <p className="text-xs text-slate-500 mt-0.5">{e.note}</p>}
                <p className="text-[11px] text-slate-400 mt-0.5">{timeAgo(e.created_at)}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </SupplierCard>
  )
}

/* ── Small helpers ──────────────────────────────────────────────────────── */

function Detail({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-slate-500" /></div>
      <div className="min-w-0">
        <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
        <dd className="text-sm font-medium text-slate-800 mt-0.5 truncate">{value}</dd>
      </div>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-semibold text-slate-800 text-right">{value}</dd>
    </div>
  )
}

// moneyPence retained for future amount surfacing on payments tab
void moneyPence
