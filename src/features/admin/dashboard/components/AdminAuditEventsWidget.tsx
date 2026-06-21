import { Database, ShieldAlert } from "lucide-react"
import { AdminSectionCard } from "@/components/admin/ui"

interface AuditEvent {
  id: string
  action: string
  actorName: string | null
  actorEmail: string | null
  workspaceName: string | null
  createdAt: string | null
}

function shortDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"
}

interface Props {
  events: AuditEvent[]
}

export function AdminAuditEventsWidget({ events }: Props) {
  return (
    <AdminSectionCard title="Recent admin events" icon={ShieldAlert} viewAllHref="/admin/audit-log">
      {events.length === 0 ? (
        <div className="text-center py-6">
          <Database className="w-6 h-6 text-slate-300 mx-auto mb-2" />
          <p className="text-[12px] text-slate-400">No audit events recorded yet.</p>
        </div>
      ) : (
        <ol className="space-y-3">
          {events.map((ev) => (
            <li key={ev.id} className="flex gap-3">
              <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-mono font-medium text-slate-700 truncate">{ev.action}</p>
                <p className="text-[11px] text-slate-400 truncate">
                  {ev.actorName ?? ev.actorEmail ?? "system"}
                  {ev.workspaceName ? ` · ${ev.workspaceName}` : ""}
                </p>
              </div>
              <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">{shortDate(ev.createdAt)}</span>
            </li>
          ))}
        </ol>
      )}
    </AdminSectionCard>
  )
}
