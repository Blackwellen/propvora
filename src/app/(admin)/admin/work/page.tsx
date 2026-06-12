import React from "react"
import { listAllTasks } from "@/lib/admin/data"
import DiagnosticsTable from "../portfolios/DiagnosticsTable"

export const dynamic = "force-dynamic"

export default async function AdminWorkPage() {
  const rows = await listAllTasks(300)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Work — All Tasks</h1>
        <p className="text-xs text-slate-500">
          {rows.length} task{rows.length === 1 ? "" : "s"} across all workspaces · read-only admin/support diagnostics
        </p>
      </div>
      <DiagnosticsTable rows={rows} primaryLabel="Task" metaLabel="Priority" />
    </div>
  )
}
