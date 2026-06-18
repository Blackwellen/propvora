import React from "react"
import { ServerCog, Clock, Activity, CheckCircle2, AlertTriangle, CalendarClock } from "lucide-react"
import {
  AdminPageHeader,
  AdminKpiStrip,
  AdminSectionCard,
  AdminTable,
  AdminStatusChip,
  AdminEmptyState,
  type AdminKpi,
} from "@/components/admin/ui"
import { getMaintenanceData } from "@/lib/admin/pages/batch4"
import MaintenanceClient from "./MaintenanceClient"

export const dynamic = "force-dynamic"
export const metadata = { title: "Maintenance mode — Propvora admin" }

function fmt(d: string | null) {
  return d ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"
}

export default async function MaintenanceModePage() {
  const data = await getMaintenanceData()

  const kpis: AdminKpi[] = [
    { label: "Current status", value: data.config.enabled ? "In maintenance" : "Operational", icon: data.config.enabled ? AlertTriangle : CheckCircle2, tone: data.config.enabled ? "amber" : "emerald" },
    { label: "Access policy", value: data.config.mode === "full" ? "Full" : data.config.mode === "restricted" ? "Restricted" : "Degraded", icon: ServerCog, tone: "blue", sub: "Applied when enabled" },
    { label: "Scheduled windows", value: data.windows.length, icon: CalendarClock, tone: "violet" },
    { label: "Last updated", value: data.updatedAt ? fmt(data.updatedAt) : "Never", icon: Clock, tone: "slate" },
  ]

  const healthItems = [
    { label: "Database", ok: data.health.db },
    { label: "Auth", ok: data.health.auth },
    { label: "Storage", ok: data.health.storage },
  ]

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={ServerCog}
        title="Maintenance mode"
        subtitle="Take the platform offline for planned work, restrict to read-only, or show a degraded-service banner. Allowlist and scheduled windows supported."
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Operations" }, { label: "Maintenance mode" }]}
      />

      <AdminKpiStrip kpis={kpis} cols={4} />

      <MaintenanceClient initial={data.config} notConfigured={data.notConfigured} />

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <AdminSectionCard title="Scheduled maintenance windows" icon={CalendarClock}>
          {data.windows.length === 0 ? (
            <AdminEmptyState icon={CalendarClock} title="No scheduled windows" description="Recorded maintenance windows appear here. Schedule one from the controls above." />
          ) : (
            <AdminTable head={[{ label: "Window" }, { label: "Starts" }, { label: "Ends" }, { label: "Scope" }, { label: "Status" }]} minWidth={620}>
              {data.windows.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-2.5 font-medium text-[#0B1B3F]">{w.title}</td>
                  <td className="px-4 py-2.5 text-slate-500">{fmt(w.startsAt)}</td>
                  <td className="px-4 py-2.5 text-slate-500">{fmt(w.endsAt)}</td>
                  <td className="px-4 py-2.5 text-slate-500">{w.scope ?? "Platform"}</td>
                  <td className="px-4 py-2.5">
                    <AdminStatusChip tone={w.status === "active" ? "amber" : w.status === "completed" ? "emerald" : "blue"} dot>{w.status}</AdminStatusChip>
                  </td>
                </tr>
              ))}
            </AdminTable>
          )}
        </AdminSectionCard>

        <AdminSectionCard title="System health checks" icon={Activity}>
          <ul className="space-y-2.5">
            {healthItems.map((h) => (
              <li key={h.label} className="flex items-center justify-between rounded-xl border border-[#EEF3FB] px-3 py-2.5">
                <span className="text-[13px] font-medium text-slate-700">{h.label}</span>
                <AdminStatusChip tone={h.ok ? "emerald" : "red"} dot>{h.ok ? "Healthy" : "Unreachable"}</AdminStatusChip>
              </li>
            ))}
            <li className="flex items-center justify-between rounded-xl border border-[#EEF3FB] px-3 py-2.5">
              <span className="text-[13px] font-medium text-slate-700">Workspaces reachable</span>
              <span className="text-[13px] font-semibold text-[#0B1B3F]">{data.health.workspaces ?? "—"}</span>
            </li>
          </ul>
          <p className="mt-3 text-[11px] text-slate-400">Live signals derived from real connectivity to core relations. Not fabricated.</p>
        </AdminSectionCard>
      </div>
    </div>
  )
}
