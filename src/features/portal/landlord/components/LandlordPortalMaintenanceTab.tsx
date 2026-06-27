import Link from "next/link"
import {
  Wrench, AlertTriangle, CalendarClock, CheckCircle2, PoundSterling, ChevronRight,
  MessageSquare, FileText, Building2,
} from "lucide-react"
import {
  PortalCard, PortalPageHeader, PortalSectionCard, PortalKpiStrip, StatusChip,
  PortalEmptyState, PortalButtonLink, PortalAlertBanner, type PortalKpi, type PortalTone,
} from "@/components/portals/portal-ui"
import { formatDate } from "@/lib/portal/format"
import { History, Download, LifeBuoy } from "lucide-react"

interface Job {
  id: string
  title: string | null
  status: string | null
  created_at: string | null
  priority: string | null
}

const STATUS: Record<string, { label: string; tone: PortalTone }> = {
  new: { label: "Open", tone: "blue" },
  scoped: { label: "Reviewing", tone: "blue" },
  supplier_requested: { label: "Awaiting quote", tone: "amber" },
  quote_received: { label: "Quote in", tone: "violet" },
  approved: { label: "Approved", tone: "blue" },
  scheduled: { label: "Scheduled", tone: "blue" },
  in_progress: { label: "In progress", tone: "blue" },
  complete: { label: "Completed", tone: "emerald" },
  invoiced: { label: "Completed", tone: "emerald" },
  closed: { label: "Closed", tone: "slate" },
}
const DONE = ["complete", "invoiced", "closed"]

interface LandlordPortalMaintenanceTabProps {
  kpis: PortalKpi[]
  jobs: Job[]
  urgent: Job[]
  scheduled: Job[]
  base: string
}

export function LandlordPortalMaintenanceTab({
  kpis,
  jobs,
  urgent,
  scheduled,
  base,
}: LandlordPortalMaintenanceTabProps) {
  return (
    <div className="space-y-5">
      <PortalPageHeader
        title="Maintenance"
        subtitle="Track repairs, quotes, visits and spend across your portfolio."
        backHref={base}
        actions={
          <>
            <PortalButtonLink href="#" icon={History}>
              View history
            </PortalButtonLink>
            <PortalButtonLink href="#" variant="primary" icon={Download}>
              Download report
            </PortalButtonLink>
          </>
        }
      />
      {urgent.length > 0 && (
        <PortalAlertBanner
          tone="red"
          icon={AlertTriangle}
          title={`${urgent.length} urgent issue${urgent.length === 1 ? "" : "s"} need attention`}
        >
          Review and approve action to keep your tenants safe.
        </PortalAlertBanner>
      )}
      <PortalKpiStrip kpis={kpis} cols={6} />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4 items-start">
        <PortalCard className="overflow-hidden min-w-0">
          <div className="px-5 py-3.5 border-b border-[#EEF3FB]">
            <h2 className="text-sm font-semibold text-[#071B4D]">Maintenance requests</h2>
          </div>
          {jobs.length === 0 ? (
            <PortalEmptyState
              icon={Wrench}
              title="No maintenance requests"
              description="Repairs across your portfolio appear here."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 border-b border-[#EEF3FB] bg-[#FAFCFF]">
                    <th className="px-4 py-3">Issue</th>
                    <th className="px-4 py-3">Reported</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5FB]">
                  {jobs.map((j) => {
                    const st = STATUS[j.status ?? ""] ?? {
                      label: j.status ?? "—",
                      tone: "slate" as PortalTone,
                    }
                    const urgentJob = (j.priority ?? "").toLowerCase() === "urgent"
                    return (
                      <tr key={j.id} className="hover:bg-[#FAFCFF]">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                              <Wrench className="w-4 h-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-[#071B4D] truncate max-w-[200px]">
                                {j.title ?? "Maintenance"}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                #{j.id.slice(0, 8).toUpperCase()}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(j.created_at)}</td>
                        <td className="px-4 py-3">
                          <StatusChip tone={urgentJob ? "red" : "blue"}>
                            {urgentJob ? "Urgent" : "Normal"}
                          </StatusChip>
                        </td>
                        <td className="px-4 py-3">
                          <StatusChip tone={st.tone} dot>
                            {st.label}
                          </StatusChip>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`${base}/maintenance/${j.id}`}
                            className="inline-flex items-center gap-0.5 text-xs font-semibold text-[var(--brand)]"
                          >
                            View <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-4 border-t border-[#EEF3FB]">
            <PortalButtonLink href={`${base}/messages`} icon={MessageSquare} className="justify-center">
              Messages
            </PortalButtonLink>
            <PortalButtonLink href={`${base}/documents`} icon={FileText} className="justify-center">
              Documents
            </PortalButtonLink>
            <PortalButtonLink href={`${base}/properties`} icon={Building2} className="justify-center">
              Properties
            </PortalButtonLink>
          </div>
        </PortalCard>

        <div className="space-y-4">
          <PortalSectionCard title="Upcoming contractor visits" icon={CalendarClock}>
            {scheduled.length === 0 ? (
              <p className="text-xs text-slate-400">No visits scheduled.</p>
            ) : (
              <ul className="space-y-2">
                {scheduled.slice(0, 3).map((j) => (
                  <li key={j.id} className="text-sm">
                    <p className="font-semibold text-[#071B4D] truncate">{j.title}</p>
                    <p className="text-[11px] text-slate-400">{formatDate(j.created_at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </PortalSectionCard>
          <PortalSectionCard title="Quick help / policy" icon={LifeBuoy}>
            <p className="text-xs text-slate-500">
              Approvals over your threshold are sent to you before work proceeds.
            </p>
          </PortalSectionCard>
        </div>
      </div>
    </div>
  )
}
