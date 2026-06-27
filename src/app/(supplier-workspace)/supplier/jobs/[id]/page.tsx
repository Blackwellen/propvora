"use client"

import { Suspense, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import {
  LayoutGrid, ClipboardList, CalendarClock, MessagesSquare, Images,
  FileText, Banknote, GitBranch, KeyRound, AlertTriangle, History,
  Play, CheckCircle2, ArrowRight, Upload, XCircle, KeySquare, ChevronRight, ChevronLeft,
} from "lucide-react"
import { MobileTopBar } from "@/components/mobile"
import {
  SupplierCard, SupplierLoadingState, SupplierNotReady, SupplierStatusBadge,
  SupplierTabs, SupplierButton, SupplierBanner,
  toneForStatus, humaniseStatus,
  type SupplierTab,
} from "@/components/supplier-workspace/ui"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { useSupplierWorkspace } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import { useSupplierPlan } from "@/components/supplier-workspace/useSupplierPlan"
import { shortDate, timeAgo, moneyPence } from "@/components/supplier-workspace/format"
import type {
  SupplierAssignmentRow, SupplierJobEvent, SupplierEvidenceRow, SupplierDisputeRow,
} from "@/components/supplier-workspace/types"

// Extracted tab components
import { JobOverviewTab } from "@/features/supplier/jobs/components/detail-tabs/JobOverviewTab"
import { JobScopeTab } from "@/features/supplier/jobs/components/detail-tabs/JobScopeTab"
import { JobScheduleTab } from "@/features/supplier/jobs/components/detail-tabs/JobScheduleTab"
import { JobMessagesTab } from "@/features/supplier/jobs/components/detail-tabs/JobMessagesTab"
import { JobEvidenceTab } from "@/features/supplier/jobs/components/detail-tabs/JobEvidenceTab"
import { JobQuoteTab } from "@/features/supplier/jobs/components/detail-tabs/JobQuoteTab"
import { JobPaymentsTab } from "@/features/supplier/jobs/components/detail-tabs/JobPaymentsTab"
import { JobVariationsTab } from "@/features/supplier/jobs/components/detail-tabs/JobVariationsTab"
import { JobAccessTab } from "@/features/supplier/jobs/components/detail-tabs/JobAccessTab"
import { JobDisputeTab } from "@/features/supplier/jobs/components/detail-tabs/JobDisputeTab"
import { JobAuditTab } from "@/features/supplier/jobs/components/detail-tabs/JobAuditTab"
import { JobLifecycleStepper, STAGES } from "@/features/supplier/jobs/components/JobLifecycleStepper"
import { JobTeamRail } from "@/features/supplier/jobs/components/JobTeamRail"

/* Forward-only, status-guarded transitions mirroring src/lib/supplier/jobs.ts:
   assigned → accepted → in_progress → completed. The supplier only ever sees the
   single next safe step; "Mark complete" is the only path to 'completed' and is
   written server-side (completeJob stamps completed_at). No CTA pays or releases. */
const NEXT_STEP: Record<string, { status: string; label: string; icon: typeof ArrowRight }> = {
  assigned: { status: "accepted", label: "Accept job", icon: CheckCircle2 },
  accepted: { status: "in_progress", label: "Start work", icon: Play },
  in_progress: { status: "completed", label: "Mark work complete", icon: CheckCircle2 },
}

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
  return <Suspense fallback={null}><JobDetailInner /></Suspense>
}

function JobDetailInner() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const search = useSearchParams()
  const isMobile = search.get("view") === "mobile"
  const { workspaceId } = useSupplierWorkspace()
  const { isTeam } = useSupplierPlan()
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

  // ── On-site field view (manifest image 45) — ?view=mobile ─────────────────
  if (isMobile) {
    const evCount = (evidence.data ?? []).length
    const payoutBlocked = j?.status === "completed" && evCount === 0
    return (
      <div className="mx-auto w-full max-w-md py-2">
        <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Field header */}
          <div className="bg-[#0D1B2A] text-white px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/supplier/jobs" className="p-1.5 -ml-1.5 rounded-lg text-white/70 hover:bg-white/10">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              {j && <SupplierStatusBadge tone={toneForStatus(j.status)}>{humaniseStatus(j.status)}</SupplierStatusBadge>}
            </div>
            <p className="text-[11px] uppercase tracking-widest text-white/50 mt-2">On-site · Job {id?.slice(0, 8)}</p>
            <p className="text-base font-semibold mt-0.5">
              {j?.scheduled_for ? `Scheduled ${shortDate(j.scheduled_for)}` : "Awaiting schedule"}
            </p>
          </div>

          {job.loading || !j ? (
            <div className="p-5"><SupplierLoadingState rows={4} /></div>
          ) : (
            <div className="p-4 space-y-3">
              {/* Quick actions */}
              <div className="grid grid-cols-2 gap-2">
                <Link href="/supplier/messages" className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[var(--brand-soft)] text-[var(--brand-strong)] py-2.5 text-sm font-semibold hover:bg-[var(--color-brand-100)]">
                  <MessagesSquare className="w-4 h-4" /> Message PM
                </Link>
                <Link href="/supplier/inbox" className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 text-slate-700 py-2.5 text-sm font-semibold hover:bg-slate-200">
                  <KeySquare className="w-4 h-4" /> Access details
                </Link>
              </div>

              {/* Access note */}
              <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 flex items-start gap-2">
                <KeyRound className="w-4 h-4 shrink-0 mt-0.5" />
                Access codes are shared securely via Messages for each visit — never stored on the job.
              </div>

              {/* Evidence checklist */}
              <div className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                    <Images className="w-4 h-4 text-slate-400" /> Evidence
                  </p>
                  <span className={`text-xs font-semibold ${evCount > 0 ? "text-emerald-600" : "text-slate-400"}`}>
                    {evCount} photo{evCount === 1 ? "" : "s"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-2">Capture before / during / after photos to document the work.</p>
                <Link href={`/supplier/jobs/${id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 w-full justify-center">
                  <Upload className="w-4 h-4" /> Add photos
                </Link>
              </div>

              {/* Payout-blocker warning */}
              {payoutBlocked && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs text-red-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  Payout is blocked until you upload completion evidence for this job.
                </div>
              )}

              {/* Primary field action */}
              {next ? (
                <SupplierButton onClick={() => advance(next.status)} loading={transitioning} className="w-full justify-center">
                  <next.icon className="w-4 h-4" /> {next.label}
                </SupplierButton>
              ) : j.status === "completed" ? (
                <div className="rounded-xl bg-emerald-50 text-emerald-700 px-3 py-2.5 text-sm font-medium text-center flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Work complete
                </div>
              ) : null}

              <Link href={`/supplier/jobs/${id}`} className="flex items-center justify-center gap-1 text-xs text-slate-400 hover:text-slate-600 pt-1">
                Open full job view <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    )
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
          <SupplierNotReady
            icon={AlertTriangle}
            title="Job unavailable"
            description="This job will load once the supplier jobs service is connected to your workspace."
          />
        </SupplierCard>
      ) : (
        <>
          <JobLifecycleStepper stageIndex={stageIndex} />

          <SupplierTabs tabs={TABS} active={tab} onChange={setTab} />

          <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-4">
            <div className="space-y-4 min-w-0">
              {tab === "overview" && <JobOverviewTab job={j} />}
              {tab === "scope" && <JobScopeTab job={j} />}
              {tab === "schedule" && <JobScheduleTab job={j} />}
              {tab === "messages" && <JobMessagesTab />}
              {tab === "evidence" && (
                <JobEvidenceTab
                  assignmentId={id!}
                  workspaceId={workspaceId}
                  rows={evidence.data ?? []}
                  loading={evidence.loading}
                  refresh={() => { evidence.refresh(); events.refresh() }}
                  canEdit={j.status === "in_progress" || j.status === "accepted"}
                />
              )}
              {tab === "quote" && <JobQuoteTab job={j} />}
              {tab === "payments" && <JobPaymentsTab />}
              {tab === "variations" && <JobVariationsTab />}
              {tab === "access" && <JobAccessTab />}
              {tab === "dispute" && (
                <JobDisputeTab
                  assignmentId={id!}
                  workspaceId={workspaceId}
                  rows={disputes.data ?? []}
                  loading={disputes.loading}
                  refresh={() => { disputes.refresh(); events.refresh() }}
                />
              )}
              {tab === "audit" && <JobAuditTab events={events.data ?? []} loading={events.loading} />}
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

              {isTeam && <JobTeamRail onReassign={() => setBanner("Reassigning worker…")} />}
            </div>
          </div>
        </>
      )}
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
