import React from "react"
import { listAudit, distinctAuditActions } from "@/lib/admin/data"
import AuditTable from "./AuditTable"

export const dynamic = "force-dynamic"

export default async function AdminAuditPage() {
  const [events, actions] = await Promise.all([
    listAudit({ limit: 300 }),
    distinctAuditActions(),
  ])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Audit Log</h1>
        <p className="text-xs text-slate-500">
          Live platform event trail from <code className="font-mono">audit_logs</code> · searchable and filterable
        </p>
      </div>
      <AuditTable events={events} actions={actions} />
    </div>
  )
}
