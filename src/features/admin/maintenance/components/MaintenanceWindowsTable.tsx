import React from "react"
import { CalendarClock, Activity } from "lucide-react"
import { AdminSectionCard, AdminTable, AdminStatusChip, AdminEmptyState } from "@/components/admin/ui"

type MaintenanceWindow = {
  id: string
  title: string
  startsAt: string | null
  endsAt: string | null
  scope: string | null
  status: string
}

type HealthItem = {
  label: string
  ok: boolean
}

function fmt(d: string | null) {
  return d
    ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—"
}

interface Props {
  windows: MaintenanceWindow[]
  health: HealthItem[]
  workspacesReachable: number | null
}

export function MaintenanceWindowsTable({ windows, health, workspacesReachable }: Props) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <AdminSectionCard title="Scheduled maintenance windows" icon={CalendarClock}>
        {windows.length === 0 ? (
          <AdminEmptyState
            icon={CalendarClock}
            title="No scheduled windows"
            description="Recorded maintenance windows appear here. Schedule one from the controls above."
          />
        ) : (
          <AdminTable
            head={[{ label: "Window" }, { label: "Starts" }, { label: "Ends" }, { label: "Scope" }, { label: "Status" }]}
            minWidth={620}
          >
            {windows.map((w) => (
              <tr key={w.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-2.5 font-medium text-[#0B1B3F]">{w.title}</td>
                <td className="px-4 py-2.5 text-slate-500">{fmt(w.startsAt)}</td>
                <td className="px-4 py-2.5 text-slate-500">{fmt(w.endsAt)}</td>
                <td className="px-4 py-2.5 text-slate-500">{w.scope ?? "Platform"}</td>
                <td className="px-4 py-2.5">
                  <AdminStatusChip
                    tone={w.status === "active" ? "amber" : w.status === "completed" ? "emerald" : "blue"}
                    dot
                  >
                    {w.status}
                  </AdminStatusChip>
                </td>
              </tr>
            ))}
          </AdminTable>
        )}
      </AdminSectionCard>

      <AdminSectionCard title="System health checks" icon={Activity}>
        <ul className="space-y-2.5">
          {health.map((h) => (
            <li key={h.label} className="flex items-center justify-between rounded-xl border border-[#EEF3FB] px-3 py-2.5">
              <span className="text-[13px] font-medium text-slate-700">{h.label}</span>
              <AdminStatusChip tone={h.ok ? "emerald" : "red"} dot>{h.ok ? "Healthy" : "Unreachable"}</AdminStatusChip>
            </li>
          ))}
          <li className="flex items-center justify-between rounded-xl border border-[#EEF3FB] px-3 py-2.5">
            <span className="text-[13px] font-medium text-slate-700">Workspaces reachable</span>
            <span className="text-[13px] font-semibold text-[#0B1B3F]">{workspacesReachable ?? "—"}</span>
          </li>
        </ul>
        <p className="mt-3 text-[11px] text-slate-400">
          Live signals derived from real connectivity to core relations. Not fabricated.
        </p>
      </AdminSectionCard>
    </div>
  )
}
