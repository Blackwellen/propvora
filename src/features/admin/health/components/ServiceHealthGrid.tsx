import React from "react"
import {
  Database, Activity, Mail, HardDrive, CreditCard, Zap, Server,
  CheckCircle2, ListChecks,
} from "lucide-react"
import { AdminSectionCard, AdminStatusChip } from "@/components/admin/ui"
import type { AdminTone } from "@/components/admin/ui"

type ServiceStatus = "healthy" | "degraded" | "not_configured"

type ServiceRow = {
  name: string
  status: ServiceStatus
  detail: string
  latencyMs: number | null
}

type QueueRow = {
  name: string
  available: boolean
  pending: number
}

const ICONS: Record<string, React.ElementType> = {
  "Supabase Database": Database,
  "Supabase Auth": Activity,
  "Resend Email": Mail,
  "Cloudflare R2": HardDrive,
  "Stripe": CreditCard,
  "AI Gateway": Zap,
}

function svcTone(status: ServiceStatus): AdminTone {
  if (status === "healthy") return "emerald"
  if (status === "not_configured") return "slate"
  return "red"
}
function svcLabel(status: ServiceStatus) {
  if (status === "healthy") return "Healthy"
  if (status === "not_configured") return "Not configured"
  return "Degraded"
}

interface Props {
  services: ServiceRow[]
  queues: QueueRow[]
  overall: "healthy" | "degraded" | "down"
  checkedAt: string
}

export function ServiceHealthGrid({ services, queues, overall, checkedAt }: Props) {
  return (
    <div className="space-y-5 min-w-0">
      <AdminSectionCard title="Live services" icon={Server}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {services.map((svc) => {
            const Icon = ICONS[svc.name] ?? Server
            return (
              <div
                key={svc.name}
                className={`flex items-center justify-between rounded-xl border p-3 ${
                  svc.status === "healthy"
                    ? "border-emerald-100 bg-[#ECFDF5]/40"
                    : svc.status === "degraded"
                    ? "border-red-200 bg-[#FEF2F2]"
                    : "border-[#E2EAF6] bg-[#FAFCFF]"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-8 h-8 rounded-lg bg-white border border-[#E2EAF6] flex items-center justify-center shadow-sm shrink-0">
                    <Icon className="w-4 h-4 text-slate-600" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-semibold text-[#0B1B3F] truncate">{svc.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {svc.detail}{svc.latencyMs != null ? ` · ${svc.latencyMs}ms` : ""}
                    </p>
                  </div>
                </div>
                <AdminStatusChip tone={svcTone(svc.status)} dot>{svcLabel(svc.status)}</AdminStatusChip>
              </div>
            )
          })}
        </div>
      </AdminSectionCard>

      <AdminSectionCard title="Incident timeline" icon={ListChecks}>
        {overall === "healthy" ? (
          <div className="flex items-center gap-3 py-3">
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </span>
            <div>
              <p className="text-[13px] font-medium text-[#0B1B3F]">No active incidents</p>
              <p className="text-[11px] text-slate-400">All monitored services responded normally at the last check.</p>
            </div>
          </div>
        ) : (
          <ul className="space-y-3">
            {services.filter((s) => s.status === "degraded").map((s) => (
              <li key={s.name} className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-[13px] text-slate-700">
                    <span className="font-semibold text-[#0B1B3F]">{s.name}</span> degraded
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {s.detail} · detected {new Date(checkedAt).toLocaleTimeString("en-GB")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminSectionCard>
    </div>
  )
}
