import Link from "next/link"
import {
  Briefcase, Wrench, AlertCircle, CalendarClock, FileText, Building2,
  ChevronRight, User,
} from "lucide-react"
import { requirePortalSession } from "../../_guard"
import { getSupplierJobs } from "@/lib/portal/data"
import { formatMoney, formatDate, jobStatusMeta, isOpenJob } from "@/lib/portal/format"
import {
  PortalCard, PortalPageHeader, PortalKpiStrip, StatusChip, PortalEmptyState,
  type PortalKpi, type PortalTone,
} from "@/components/portals/portal-ui"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const FILTERS: { key: string; label: string; match: (s: string) => boolean }[] = [
  { key: "all", label: "All", match: () => true },
  { key: "open", label: "Open", match: (s) => isOpenJob(s) },
  { key: "awaiting", label: "Awaiting Quote", match: (s) => ["supplier_requested", "scoped"].includes(s) },
  { key: "in_progress", label: "In Progress", match: (s) => s === "in_progress" },
  { key: "scheduled", label: "Scheduled", match: (s) => s === "scheduled" },
  { key: "complete", label: "Complete", match: (s) => ["complete", "invoiced"].includes(s) },
]

export default async function SupplierJobsPage({ params, searchParams }: { params: Promise<{ sessionId: string }>; searchParams: Promise<{ filter?: string }> }) {
  const { sessionId } = await params
  const { filter = "all" } = await searchParams
  const session = await requirePortalSession(sessionId, "supplier")
  const base = `/portal/${session.id}/supplier`
  const jobs = await getSupplierJobs(session)

  const activeFilter = FILTERS.find((f) => f.key === filter) ?? FILTERS[0]
  const rows = jobs.filter((j) => activeFilter.match(j.status))

  const kpis: PortalKpi[] = [
    { label: "Open", value: String(jobs.filter((j) => isOpenJob(j.status)).length), icon: Briefcase, tone: "blue" },
    { label: "In Progress", value: String(jobs.filter((j) => j.status === "in_progress").length), icon: Wrench, tone: "blue" },
    { label: "Awaiting Quote", value: String(jobs.filter((j) => ["supplier_requested", "scoped"].includes(j.status)).length), icon: AlertCircle, tone: "amber" },
    { label: "Due Today", value: String(jobs.filter((j) => j.scheduled_date && new Date(j.scheduled_date).toDateString() === new Date().toDateString()).length), icon: CalendarClock, tone: "violet" },
    { label: "Ready to Invoice", value: String(jobs.filter((j) => j.status === "complete").length), icon: FileText, tone: "emerald" },
  ]

  return (
    <div className="space-y-5">
      <PortalPageHeader title="My Jobs" subtitle={`${jobs.length} total jobs assigned to you`} backHref={base} />
      <PortalKpiStrip kpis={kpis} cols={5} />

      <div className="flex gap-1.5 flex-wrap">
        {FILTERS.map((f) => (
          <Link key={f.key} href={`${base}/jobs?filter=${f.key}`} className={`h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center transition-colors ${filter === f.key ? "bg-[var(--brand)] text-white" : "bg-white border border-[#E2EAF6] text-slate-600 hover:bg-slate-50"}`}>{f.label}</Link>
        ))}
      </div>

      <PortalCard className="overflow-hidden">
        {rows.length === 0 ? (
          <PortalEmptyState icon={Briefcase} title="No jobs here" description="Jobs assigned to you appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead><tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 border-b border-[#EEF3FB] bg-[#FAFCFF]"><th className="px-4 py-3">Job</th><th className="px-4 py-3">Property</th><th className="px-4 py-3">Schedule</th><th className="px-4 py-3">Operator</th><th className="px-4 py-3 text-right">Fee</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Action</th></tr></thead>
              <tbody className="divide-y divide-[#F1F5FB]">
                {rows.map((j) => {
                  const meta = jobStatusMeta(j.status)
                  const tone: PortalTone = meta.variant === "success" ? "emerald" : meta.variant === "warning" ? "amber" : "blue"
                  const amount = j.approved_amount ?? j.quoted_amount
                  return (
                    <tr key={j.id} className="hover:bg-[#FAFCFF]">
                      <td className="px-4 py-3"><div className="flex items-center gap-2.5"><span className="w-8 h-8 rounded-lg bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center shrink-0"><Wrench className="w-4 h-4" /></span><div className="min-w-0"><p className="font-semibold text-[#071B4D] truncate max-w-[200px]">{j.title}</p><p className="text-[11px] text-slate-400">#{j.id.slice(0, 8).toUpperCase()}</p></div></div></td>
                      <td className="px-4 py-3 text-slate-500"><span className="flex items-center gap-1 truncate max-w-[160px]"><Building2 className="w-3.5 h-3.5 shrink-0" />{j.propertyLabel || "—"}</span></td>
                      <td className="px-4 py-3 text-slate-500">{j.scheduled_date ? formatDate(j.scheduled_date) : "TBC"}</td>
                      <td className="px-4 py-3 text-slate-500"><span className="flex items-center gap-1 truncate max-w-[120px]"><User className="w-3.5 h-3.5 shrink-0" />{j.operatorLabel || "—"}</span></td>
                      <td className="px-4 py-3 text-right font-semibold text-[#071B4D]">{amount != null ? formatMoney(amount) : "—"}</td>
                      <td className="px-4 py-3"><StatusChip tone={tone} dot>{meta.label}</StatusChip></td>
                      <td className="px-4 py-3 text-right"><Link href={`${base}/jobs/${j.id}`} className="inline-flex items-center gap-0.5 text-xs font-semibold text-[var(--brand)]">View Job <ChevronRight className="w-3.5 h-3.5" /></Link></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </PortalCard>
      <p className="text-xs text-slate-400">Showing {rows.length} of {jobs.length} jobs.</p>
    </div>
  )
}
