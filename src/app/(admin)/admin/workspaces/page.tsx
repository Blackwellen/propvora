import React from "react"
import { Building2 } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { listWorkspaces } from "@/lib/admin/data"
import WorkspacesFilter from "./WorkspacesFilter"

export const dynamic = "force-dynamic"

export default async function AdminWorkspacesPage() {
  const workspaces = await listWorkspaces(500)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Workspaces</h1>
        <p className="text-xs text-slate-500">
          {workspaces.length} workspace{workspaces.length === 1 ? "" : "s"} on the platform · live cross-workspace view
        </p>
      </div>

      {workspaces.length === 0 ? (
        <Card className="py-12 text-center">
          <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-medium">No workspaces found</p>
          <p className="text-xs text-slate-400 mt-1">Workspaces will appear here as customers sign up.</p>
        </Card>
      ) : (
        <WorkspacesFilter workspaces={workspaces} />
      )}
    </div>
  )
}
