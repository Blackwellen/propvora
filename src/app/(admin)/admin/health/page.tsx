import React from "react"
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Database,
  Mail,
  CreditCard,
  HardDrive,
  Zap,
  Server,
  RefreshCw,
  ShieldCheck,
  ListChecks,
  Gauge,
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
  type AdminTone,
} from "@/components/admin/ui"
import { getHealthReport } from "@/lib/admin/pages/batch5"

export const dynamic = "force-dynamic"

const ICONS: Record<string, React.ElementType> = {
  "Supabase Database": Database,
  "Supabase Auth": Activity,
  "Resend Email": Mail,
  "Cloudflare R2": HardDrive,
  "Stripe": CreditCard,
  "AI Gateway": Zap,
}

function svcTone(status: string): AdminTone {
  if (status === "healthy") return "emerald"
  if (status === "not_configured") return "slate"
  return "red"
}
function svcLabel(status: string) {
  if (status === "healthy") return "Healthy"
  if (status === "not_configured") return "Not configured"
  return "Degraded"
}

export default async function AdminHealthPage() {
  const report = await getHealthReport()

  const overallTone: AdminTone = report.overall === "healthy" ? "emerald" : report.overall === "degraded" ? "amber" : "red"
  const overallLabel = report.overall === "healthy" ? "All systems operational" : report.overall === "degraded" ? "Degraded performance" : "Service disruption"
  const OverallIcon = report.overall === "healthy" ? CheckCircle2 : report.overall === "down" ? XCircle : AlertTriangle

  const healthy = report.services.filter((s) => s.status === "healthy").length
  const configured = report.services.filter((s) => s.status !== "not_configured").length

  const kpis: AdminKpi[] = [
    { label: "Overall status", value: report.overall === "healthy" ? "Healthy" : report.overall === "degraded" ? "Degraded" : "Down", icon: Activity, tone: overallTone },
    { label: "Services healthy", value: `${healthy}/${report.services.length}`, icon: Server, tone: healthy === report.services.length ? "emerald" : "amber" },
    { label: "DB latency", value: report.dbLatencyMs != null ? `${report.dbLatencyMs} ms` : "—", icon: Gauge, tone: report.dbLatencyMs != null && report.dbLatencyMs < 250 ? "emerald" : "amber" },
    { label: "Integrations live", value: `${configured}/${report.services.length}`, icon: ShieldCheck, tone: "blue" },
  ]

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="System health"
        subtitle={`Live service reachability and queue depth. Last checked ${new Date(report.checkedAt).toLocaleTimeString("en-GB")}.`}
        icon={Activity}
        actions={
          <form>
            <button type="submit" className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-[#E2EAF6] bg-white text-[13px] font-semibold text-slate-700 hover:bg-slate-50 hover:border-[#C8DBF5] transition-colors">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </form>
        }
      />

      {/* Overall status banner */}
      <AdminCard className={overallTone === "emerald" ? "border-emerald-200 bg-[#ECFDF5]/60" : overallTone === "amber" ? "border-amber-200 bg-[#FFFBEB]" : "border-red-200 bg-[#FEF2F2]"}>
        <div className="flex items-center gap-3">
          <OverallIcon className={`w-6 h-6 shrink-0 ${overallTone === "emerald" ? "text-emerald-600" : overallTone === "amber" ? "text-amber-600" : "text-red-600"}`} />
          <div>
            <p className="text-[15px] font-semibold text-[#0B1B3F]">{overallLabel}</p>
            <p className="text-[12.5px] text-slate-600">{healthy} of {report.services.length} services healthy · database {report.dbLatencyMs != null ? `reachable in ${report.dbLatencyMs}ms` : "unreachable"}.</p>
          </div>
        </div>
      </AdminCard>

      <AdminKpiStrip kpis={kpis} cols={4} />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
        <div className="space-y-5 min-w-0">
          {/* Live services grid */}
          <AdminSectionCard title="Live services" icon={Server}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {report.services.map((svc) => {
                const Icon = ICONS[svc.name] ?? Server
                return (
                  <div key={svc.name} className={`flex items-center justify-between rounded-xl border p-3 ${svc.status === "healthy" ? "border-emerald-100 bg-[#ECFDF5]/40" : svc.status === "degraded" ? "border-red-200 bg-[#FEF2F2]" : "border-[#E2EAF6] bg-[#FAFCFF]"}`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-8 h-8 rounded-lg bg-white border border-[#E2EAF6] flex items-center justify-center shadow-sm shrink-0"><Icon className="w-4 h-4 text-slate-600" /></span>
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-semibold text-[#0B1B3F] truncate">{svc.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{svc.detail}{svc.latencyMs != null ? ` · ${svc.latencyMs}ms` : ""}</p>
                      </div>
                    </div>
                    <AdminStatusChip tone={svcTone(svc.status)} dot>{svcLabel(svc.status)}</AdminStatusChip>
                  </div>
                )
              })}
            </div>
          </AdminSectionCard>

          {/* Incidents timeline */}
          <AdminSectionCard title="Incident timeline" icon={ListChecks}>
            {report.overall === "healthy" ? (
              <div className="flex items-center gap-3 py-3">
                <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><CheckCircle2 className="w-4 h-4" /></span>
                <div>
                  <p className="text-[13px] font-medium text-[#0B1B3F]">No active incidents</p>
                  <p className="text-[11px] text-slate-400">All monitored services responded normally at the last check.</p>
                </div>
              </div>
            ) : (
              <ul className="space-y-3">
                {report.services.filter((s) => s.status === "degraded").map((s) => (
                  <li key={s.name} className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-[13px] text-slate-700"><span className="font-semibold text-[#0B1B3F]">{s.name}</span> degraded</p>
                      <p className="text-[11px] text-slate-400">{s.detail} · detected {new Date(report.checkedAt).toLocaleTimeString("en-GB")}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </AdminSectionCard>
        </div>

        {/* Right rail — queues + DR readiness */}
        <AdminRightRail>
          <AdminSectionCard title="Job & queue health" icon={ListChecks}>
            <ul className="space-y-2.5">
              {report.queues.map((qx) => (
                <li key={qx.name} className="flex items-center justify-between">
                  <span className="text-[13px] text-slate-600">{qx.name}</span>
                  {!qx.available
                    ? <AdminStatusChip tone="slate">n/a</AdminStatusChip>
                    : <AdminStatusChip tone={qx.pending > 0 ? "amber" : "emerald"}>{qx.pending} pending</AdminStatusChip>}
                </li>
              ))}
            </ul>
          </AdminSectionCard>

          <AdminSectionCard title="Disaster recovery readiness" icon={ShieldCheck}>
            <ul className="space-y-2 text-[12.5px]">
              <li className="flex items-center justify-between"><span className="text-slate-600">Managed Postgres backups</span><AdminStatusChip tone="emerald" dot>Supabase</AdminStatusChip></li>
              <li className="flex items-center justify-between"><span className="text-slate-600">Object storage durability</span><AdminStatusChip tone={report.services.find((s) => s.name === "Cloudflare R2")?.status === "healthy" ? "emerald" : "slate"} dot>R2</AdminStatusChip></li>
              <li className="flex items-center justify-between"><span className="text-slate-600">Config restore (settings)</span><AdminStatusChip tone="emerald" dot>Versioned</AdminStatusChip></li>
            </ul>
          </AdminSectionCard>

          <AdminBanner tone="blue" icon={Gauge}>
            Status is a live point-in-time check from this server. Historical uptime and latency trends require an external monitoring sink, which is not yet wired — no synthetic uptime figures are shown.
          </AdminBanner>
        </AdminRightRail>
      </div>
    </div>
  )
}
