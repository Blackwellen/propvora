"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ChevronLeft,
  Building2,
  Calendar,
  Banknote,
  Activity,
  MapPin,
  Truck,
  CheckCircle2,
  ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MobileTopBar } from "@/components/mobile"
import {
  SupplierCard,
  SupplierLoadingState,
  SupplierNotReady,
  SupplierStatusBadge,
  toneForStatus,
  humaniseStatus,
} from "@/components/supplier-workspace/ui"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { money, shortDate, timeAgo } from "@/components/supplier-workspace/format"
import type { SupplierJob, SupplierJobEvent } from "@/components/supplier-workspace/types"

/* Forward-only, non-destructive status transitions. We deliberately offer ONLY
   the next safe step from the supplier side and NEVER fabricate completion:
   "Mark complete" submits a completion REQUEST that the property manager
   approves. No CTA closes/pays/releases a job autonomously. */
const NEXT_STEP: Record<string, { status: string; label: string; icon: typeof ArrowRight }> = {
  scheduled: { status: "supplier_confirmed", label: "Confirm job", icon: CheckCircle2 },
  supplier_confirmed: { status: "en_route", label: "Mark en route", icon: Truck },
  en_route: { status: "arrived", label: "Mark arrived", icon: MapPin },
  arrived: { status: "in_progress", label: "Start work", icon: Activity },
  in_progress: { status: "completed_pending_evidence", label: "Mark work complete", icon: CheckCircle2 },
}

export default function SupplierJobDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id

  const job = useSupplierApi<SupplierJob>(id ? `/api/supplier/jobs/${id}` : null, {
    select: (j) => (j as { job?: SupplierJob }).job ?? (j as SupplierJob),
  })
  const events = useSupplierApi<SupplierJobEvent[]>(id ? `/api/supplier/jobs/${id}/events` : null, {
    select: (j) => (j as { events?: SupplierJobEvent[] }).events ?? (Array.isArray(j) ? (j as SupplierJobEvent[]) : []),
  })

  const [transitioning, setTransitioning] = useState(false)
  const [banner, setBanner] = useState<string | null>(null)

  const j = job.data
  const next = useMemo(() => {
    const s = (j?.status ?? "").toLowerCase()
    return NEXT_STEP[s] ?? null
  }, [j?.status])

  async function advance(toStatus: string) {
    if (!id) return
    setTransitioning(true)
    setBanner(null)
    try {
      const res = await fetch(`/api/supplier/jobs/${id}/status`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: toStatus }),
      })
      if (!res.ok) {
        setBanner(res.status === 503 || res.status === 404 ? "Status updates aren't available yet." : "Couldn't update the job status.")
        return
      }
      job.refresh()
      events.refresh()
    } catch {
      setBanner("Network error — please try again.")
    } finally {
      setTransitioning(false)
    }
  }

  return (
    <div className="space-y-5">
      <MobileTopBar title={j?.title ?? "Job"} subtitle={j?.reference ?? "Work order"} showBack backHref="/supplier/jobs" />

      <div className="hidden md:flex items-center justify-between gap-3">
        <div className="min-w-0">
          <Link href="/supplier/jobs" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2">
            <ChevronLeft className="w-4 h-4" /> Back to jobs
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">{j?.title ?? (job.loading ? "Loading…" : "Job")}</h1>
          {j?.reference && <p className="mt-1 text-sm text-slate-500">{j.reference}</p>}
        </div>
        {j?.status && <SupplierStatusBadge tone={toneForStatus(j.status)}>{humaniseStatus(j.status)}</SupplierStatusBadge>}
      </div>

      {banner && (
        <div className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50 px-3.5 py-2.5">
          <p className="text-[13px] font-medium text-amber-800">{banner}</p>
          <button onClick={() => setBanner(null)} className="text-[12px] font-semibold text-amber-700 hover:underline">Dismiss</button>
        </div>
      )}

      {job.loading ? (
        <SupplierCard className="p-5"><SupplierLoadingState rows={5} /></SupplierCard>
      ) : job.notReady || !j ? (
        <SupplierCard className="p-5">
          <SupplierNotReady icon={Activity} title="Job unavailable" description="This job will load once the supplier jobs service is connected to your workspace." />
        </SupplierCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4">
          <div className="space-y-4">
            <SupplierCard className="p-5">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Overview</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <Detail icon={Building2} label="Property" value={j.property_label ?? "—"} />
                <Detail icon={Calendar} label="Scheduled" value={shortDate(j.scheduled_date)} />
                <Detail icon={Activity} label="Category" value={j.category ? humaniseStatus(j.category) : "—"} />
                <Detail icon={Banknote} label="Value" value={j.amount ? money(j.amount, j.currency) : "—"} />
                {j.urgency && <Detail icon={Activity} label="Urgency" value={humaniseStatus(j.urgency)} />}
              </dl>
            </SupplierCard>

            <SupplierCard className="p-5">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Activity timeline</h2>
              {events.loading ? (
                <SupplierLoadingState rows={3} />
              ) : (events.data ?? []).length === 0 ? (
                <p className="text-sm text-slate-400 py-3">No activity recorded yet.</p>
              ) : (
                <ol className="space-y-4">
                  {(events.data ?? []).map((e, i) => (
                    <li key={e.id ?? i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] mt-1.5" />
                        {i < (events.data ?? []).length - 1 && <span className="flex-1 w-px bg-slate-200 my-1" />}
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
          </div>

          <div className="space-y-4">
            <SupplierCard className="p-5">
              <h2 className="text-base font-semibold text-slate-900 mb-3">Next action</h2>
              {next ? (
                <>
                  <p className="text-sm text-slate-500 mb-3">
                    Move this job forward. This records the step for the property manager — it never closes or pays out the job on its own.
                  </p>
                  <button
                    onClick={() => advance(next.status)}
                    disabled={transitioning}
                    className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-[#2563EB] text-white font-semibold text-sm hover:bg-[#1d4ed8] transition-colors disabled:opacity-50"
                  >
                    {transitioning ? (
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <next.icon className="w-4 h-4" />
                    )}
                    {next.label}
                  </button>
                </>
              ) : (
                <p className="text-sm text-slate-500">
                  No supplier action is pending. The property manager handles approval and payment release from here.
                </p>
              )}
            </SupplierCard>

            <SupplierCard className="p-5">
              <h2 className="text-base font-semibold text-slate-900 mb-3">Status</h2>
              <div className="flex items-center gap-2">
                {j.status && <SupplierStatusBadge tone={toneForStatus(j.status)}>{humaniseStatus(j.status)}</SupplierStatusBadge>}
              </div>
              <p className="mt-3 text-xs text-slate-400">Last updated {timeAgo(j.updated_at ?? j.created_at)}</p>
            </SupplierCard>
          </div>
        </div>
      )}
    </div>
  )
}

function Detail({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-slate-500" />
      </div>
      <div className="min-w-0">
        <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
        <dd className={cn("text-sm font-medium text-slate-800 mt-0.5 truncate")}>{value}</dd>
      </div>
    </div>
  )
}
