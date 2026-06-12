import React from "react"
import { listAllPlanningSets } from "@/lib/admin/data"
import DiagnosticsTable from "../portfolios/DiagnosticsTable"

export const dynamic = "force-dynamic"

export default async function AdminPlanningPage() {
  const rows = await listAllPlanningSets(300)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Planning — All Sets</h1>
        <p className="text-xs text-slate-500">
          {rows.length} planning set{rows.length === 1 ? "" : "s"} across all workspaces · read-only admin/support diagnostics
        </p>
      </div>
      <DiagnosticsTable rows={rows} primaryLabel="Planning set" metaLabel="Profile" />
    </div>
  )
}
