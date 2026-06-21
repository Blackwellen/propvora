import React from "react"
import { AlertCircle } from "lucide-react"
import { AdminQueuePanel, AdminStatusChip } from "@/components/admin/ui"

type DisputeRow = {
  id: string
  reason: string | null
  status: string
  raisedByWorkspaceName: string | null
  createdAt: string | null
}

function shortDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"
}

interface Props {
  disputes: DisputeRow[]
}

export function OpenDisputesPanel({ disputes }: Props) {
  return (
    <AdminQueuePanel
      title="Open disputes"
      icon={AlertCircle}
      count={disputes.length}
      viewAllHref="/admin/marketplace/disputes"
    >
      {disputes.length === 0 ? (
        <div className="text-center py-6">
          <AlertCircle className="w-6 h-6 text-slate-300 mx-auto mb-2" />
          <p className="text-[12px] text-slate-400">No open disputes.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {disputes.map((d) => (
            <li key={d.id} className="flex items-center gap-3 py-1.5">
              <span className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-3.5 h-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-semibold text-[#0B1B3F] truncate">
                  {d.reason ?? "Dispute"} — {d.raisedByWorkspaceName ?? d.id.slice(0, 8)}
                </p>
                <p className="text-[11px] text-slate-400">{shortDate(d.createdAt)}</p>
              </div>
              <AdminStatusChip tone={d.status === "open" ? "red" : "amber"}>
                {d.status.replace("_", " ")}
              </AdminStatusChip>
            </li>
          ))}
        </ul>
      )}
    </AdminQueuePanel>
  )
}
