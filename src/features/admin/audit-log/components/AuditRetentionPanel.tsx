import React from "react"
import { CalendarClock, ShieldCheck } from "lucide-react"
import { AdminSectionCard, AdminCard, AdminBanner, AdminStatusChip } from "@/components/admin/ui"

function fmtDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"
}

type SuspiciousActor = {
  actorId: string
  actorName: string | null
  events: number
  securityEvents: number
  lastSeen: string | null
}

function relAge(d: string | null) {
  if (!d) return "—"
  const mins = Math.max(0, Math.round((Date.now() - new Date(d).getTime()) / 60000))
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 48) return `${hrs} hr ago`
  return `${Math.round(hrs / 24)} d ago`
}

interface Props {
  oldestRetainedAt: string | null
  suspiciousActors: SuspiciousActor[]
}

export function AuditRetentionPanel({ oldestRetainedAt, suspiciousActors }: Props) {
  return (
    <>
      <AdminSectionCard title="Retention and export policy" icon={CalendarClock}>
        <dl className="space-y-2.5 text-[12.5px]">
          {[
            { label: "Storage", value: "audit_logs (append-only)" },
            { label: "Retention", value: "Indefinite" },
            { label: "Oldest record", value: fmtDate(oldestRetainedAt) },
            { label: "Export", value: "CSV (filtered)" },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <dt className="text-slate-500">{row.label}</dt>
              <dd className="font-medium text-[#0B1B3F]">{row.value}</dd>
            </div>
          ))}
          <div className="flex items-center justify-between">
            <dt className="text-slate-500">Deletion</dt>
            <dd className="font-semibold text-red-600">Not permitted</dd>
          </div>
        </dl>
      </AdminSectionCard>

      <AdminSectionCard
        title="Most active actors"
        icon={ShieldCheck}
        actions={
          <AdminStatusChip tone={suspiciousActors.some((a) => a.securityEvents > 0) ? "amber" : "slate"}>
            {suspiciousActors.length}
          </AdminStatusChip>
        }
      >
        {suspiciousActors.length === 0 ? (
          <p className="text-[13px] text-slate-400 py-1">No actor activity recorded yet.</p>
        ) : (
          <ul className="space-y-3">
            {suspiciousActors.map((a) => (
              <li key={a.actorId} className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[#0B1B3F] truncate">{a.actorName ?? "System"}</p>
                  <p className="text-[11px] text-slate-400">
                    {a.events} event{a.events === 1 ? "" : "s"} · last {relAge(a.lastSeen)}
                  </p>
                </div>
                {a.securityEvents > 0 ? (
                  <AdminStatusChip tone="red" dot>{a.securityEvents} security</AdminStatusChip>
                ) : (
                  <AdminStatusChip tone="emerald">clean</AdminStatusChip>
                )}
              </li>
            ))}
          </ul>
        )}
      </AdminSectionCard>

      <AdminCard>
        <div className="flex items-start gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-[18px] h-[18px]" />
          </span>
          <div>
            <p className="text-[13px] font-semibold text-[#0B1B3F]">Tamper-evident</p>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Writes go through the service-role append path. The admin console exposes no edit or delete operation on audit records.
            </p>
          </div>
        </div>
      </AdminCard>

      <AdminBanner tone="blue">
        High-volume actors are surfaced for visibility, not as accusations. Investigate context before acting.
      </AdminBanner>
    </>
  )
}
