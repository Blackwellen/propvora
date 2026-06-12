import React from "react"
import { listAllProperties } from "@/lib/admin/data"
import DiagnosticsTable from "./DiagnosticsTable"

export const dynamic = "force-dynamic"

export default async function AdminPortfoliosPage() {
  const rows = await listAllProperties(300)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Portfolios — All Properties</h1>
        <p className="text-xs text-slate-500">
          {rows.length} propert{rows.length === 1 ? "y" : "ies"} across all workspaces · read-only admin/support diagnostics
        </p>
      </div>
      <DiagnosticsTable rows={rows} primaryLabel="Property" metaLabel="Type" />
    </div>
  )
}
