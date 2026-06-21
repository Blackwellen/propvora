import React from "react"
import { ListChecks, ShieldCheck, Gauge } from "lucide-react"
import { AdminSectionCard, AdminStatusChip, AdminBanner, AdminRightRail } from "@/components/admin/ui"

type QueueRow = {
  name: string
  available: boolean
  pending: number
}

type ServiceRow = {
  name: string
  status: "healthy" | "degraded" | "not_configured"
}

interface Props {
  queues: QueueRow[]
  services: ServiceRow[]
}

export function HealthRailPanel({ queues, services }: Props) {
  const r2Status = services.find((s) => s.name === "Cloudflare R2")?.status

  return (
    <AdminRightRail>
      <AdminSectionCard title="Job and queue health" icon={ListChecks}>
        <ul className="space-y-2.5">
          {queues.map((qx) => (
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
          <li className="flex items-center justify-between">
            <span className="text-slate-600">Managed Postgres backups</span>
            <AdminStatusChip tone="emerald" dot>Supabase</AdminStatusChip>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-slate-600">Object storage durability</span>
            <AdminStatusChip tone={r2Status === "healthy" ? "emerald" : "slate"} dot>R2</AdminStatusChip>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-slate-600">Config restore (settings)</span>
            <AdminStatusChip tone="emerald" dot>Versioned</AdminStatusChip>
          </li>
        </ul>
      </AdminSectionCard>

      <AdminBanner tone="blue" icon={Gauge}>
        Status is a live point-in-time check from this server. Historical uptime and latency trends require an external monitoring sink, which is not yet wired.
      </AdminBanner>
    </AdminRightRail>
  )
}
