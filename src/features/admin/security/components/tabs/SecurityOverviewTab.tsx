import React from "react"
import { AlertTriangle, Shield, Lock, Activity } from "lucide-react"
import { AdminSectionCard, AdminEmptyState, AdminStatusChip } from "@/components/admin/ui"

type AuditEvent = {
  id: string
  action: string
  actorName: string | null
  actorEmail: string | null
  ip: string | null
  workspaceName: string | null
  createdAt: string | null
}

type Control = {
  label: string
  detail: string
  enforced: boolean
}

function fmt(d: string | null) {
  return d
    ? new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : "—"
}

interface Props {
  securityEvents: AuditEvent[]
  controls: Control[]
  tab: string
}

export function SecurityOverviewTab({ securityEvents, controls, tab }: Props) {
  return (
    <div className="space-y-5 min-w-0">
      {(tab === "overview" || tab === "incidents") && (
        <AdminSectionCard
          title="Security alerts and incident queue"
          icon={AlertTriangle}
          actions={
            <AdminStatusChip tone={securityEvents.length > 0 ? "amber" : "emerald"}>
              {securityEvents.length} event{securityEvents.length === 1 ? "" : "s"}
            </AdminStatusChip>
          }
        >
          {securityEvents.length === 0 ? (
            <AdminEmptyState
              icon={Shield}
              title="No security-relevant admin events"
              description="Account suspensions, archives, role changes and settings updates are surfaced here as they happen, sourced from the immutable audit log."
            />
          ) : (
            <ul className="space-y-2.5">
              {securityEvents.slice(0, 12).map((e) => (
                <li key={e.id} className="flex items-start gap-3 py-1.5 border-b border-[#F1F5FB] last:border-0">
                  <span className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <Activity className="w-3.5 h-3.5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[12px] font-medium text-[#0B1B3F]">{e.action}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {e.actorName ?? e.actorEmail ?? "system"}
                      {e.ip ? ` · ${e.ip}` : ""}
                      {e.workspaceName ? ` · ${e.workspaceName}` : ""}
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">{fmt(e.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </AdminSectionCard>
      )}

      {(tab === "overview" || tab === "policies" || tab === "access") && (
        <AdminSectionCard title="Security policies and controls" icon={Lock}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {controls.map((c) => (
              <div
                key={c.label}
                className={`rounded-xl border p-3 ${c.enforced ? "border-emerald-100 bg-[#ECFDF5]/40" : "border-amber-200 bg-[#FFFBEB]"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[12.5px] font-medium text-[#0B1B3F]">{c.label}</p>
                  {c.enforced
                    ? <AdminStatusChip tone="emerald">Enforced</AdminStatusChip>
                    : <AdminStatusChip tone="amber">Inactive</AdminStatusChip>}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">{c.detail}</p>
              </div>
            ))}
          </div>
        </AdminSectionCard>
      )}
    </div>
  )
}
