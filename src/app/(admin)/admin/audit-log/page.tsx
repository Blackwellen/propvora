import React from "react"
import {
  FileText,
  Activity,
  Clock,
  Users,
  ShieldAlert,
  Layers,
  Lock,
  ShieldCheck,
  CalendarClock,
} from "lucide-react"
import {
  AdminPageHeader,
  AdminKpiStrip,
  AdminCard,
  AdminSectionCard,
  AdminStatusChip,
  AdminRightRail,
  AdminBanner,
  type AdminKpi,
} from "@/components/admin/ui"
import { listAudit, distinctAuditActions } from "@/lib/admin/data"
import { getAuditKpis, summariseSuspiciousActors } from "@/lib/admin/pages/batch5"
import AuditLogClient from "./AuditLogClient"

export const dynamic = "force-dynamic"

function fmtDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"
}

function relAge(d: string | null) {
  if (!d) return "—"
  const mins = Math.max(0, Math.round((Date.now() - new Date(d).getTime()) / 60000))
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 48) return `${hrs} hr ago`
  return `${Math.round(hrs / 24)} d ago`
}

export default async function AdminAuditLogPage() {
  const [events, actions, kpis] = await Promise.all([
    listAudit({ limit: 500 }),
    distinctAuditActions(),
    getAuditKpis(),
  ])

  const suspicious = summariseSuspiciousActors(events, 6)

  const kpiCards: AdminKpi[] = [
    { label: "Total events", value: kpis.total.toLocaleString("en-GB"), icon: FileText, tone: "blue" },
    { label: "Last 24 hours", value: kpis.last24h.toLocaleString("en-GB"), icon: Clock, tone: "sky" },
    { label: "Last 7 days", value: kpis.last7d.toLocaleString("en-GB"), icon: Activity, tone: "violet" },
    { label: "Distinct actors", value: kpis.distinctActors.toLocaleString("en-GB"), icon: Users, tone: "emerald" },
    { label: "Action types", value: kpis.distinctActions.toLocaleString("en-GB"), icon: Layers, tone: "slate" },
    { label: "Security / lifecycle", value: kpis.failedOrSecurity.toLocaleString("en-GB"), icon: ShieldAlert, tone: kpis.failedOrSecurity > 0 ? "amber" : "emerald" },
  ]

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Audit log"
        subtitle="Append-only trail of every administrative action across the platform. Records are immutable — exportable, never editable or deletable."
        icon={FileText}
        actions={<AdminStatusChip tone="emerald" dot><Lock className="w-3 h-3" /> Immutable trail</AdminStatusChip>}
      />

      <AdminKpiStrip kpis={kpiCards} cols={6} />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
        <div className="min-w-0">
          <AuditLogClient events={events} actions={actions} />
        </div>

        <AdminRightRail>
          {/* Retention / export policy */}
          <AdminSectionCard title="Retention & export policy" icon={CalendarClock}>
            <dl className="space-y-2.5 text-[12.5px]">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Storage</dt>
                <dd className="font-medium text-[#0B1B3F]">audit_logs (append-only)</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Retention</dt>
                <dd className="font-medium text-[#0B1B3F]">Indefinite</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Oldest record</dt>
                <dd className="font-medium text-[#0B1B3F]">{fmtDate(kpis.oldestRetainedAt)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Export</dt>
                <dd className="font-medium text-[#0B1B3F]">CSV (filtered)</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Deletion</dt>
                <dd className="font-semibold text-red-600">Not permitted</dd>
              </div>
            </dl>
          </AdminSectionCard>

          {/* Suspicious actors */}
          <AdminSectionCard
            title="Most active actors"
            icon={ShieldAlert}
            actions={<AdminStatusChip tone={suspicious.some((a) => a.securityEvents > 0) ? "amber" : "slate"}>{suspicious.length}</AdminStatusChip>}
          >
            {suspicious.length === 0 ? (
              <p className="text-[13px] text-slate-400 py-1">No actor activity recorded yet.</p>
            ) : (
              <ul className="space-y-3">
                {suspicious.map((a) => (
                  <li key={a.actorId} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-[#0B1B3F] truncate">{a.actorName ?? "System"}</p>
                      <p className="text-[11px] text-slate-400">{a.events} event{a.events === 1 ? "" : "s"} · last {relAge(a.lastSeen)}</p>
                    </div>
                    {a.securityEvents > 0
                      ? <AdminStatusChip tone="red" dot>{a.securityEvents} security</AdminStatusChip>
                      : <AdminStatusChip tone="emerald">clean</AdminStatusChip>}
                  </li>
                ))}
              </ul>
            )}
          </AdminSectionCard>

          <AdminCard>
            <div className="flex items-start gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><ShieldCheck className="w-[18px] h-[18px]" /></span>
              <div>
                <p className="text-[13px] font-semibold text-[#0B1B3F]">Tamper-evident</p>
                <p className="text-[12px] text-slate-500 mt-0.5">Writes go through the service-role append path. The admin console exposes no edit or delete operation on audit records.</p>
              </div>
            </div>
          </AdminCard>

          <AdminBanner tone="blue">
            High-volume actors are surfaced for visibility, not as accusations. Investigate context before acting.
          </AdminBanner>
        </AdminRightRail>
      </div>
    </div>
  )
}
