import React from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, Building2 } from "lucide-react"
import { getAdminIdentity } from "@/lib/admin/guard"
import { listWorkspaceDirectory } from "@/components/admin-marketplace/data"
import WorkspaceDirectoryTable from "@/components/admin-marketplace/WorkspaceDirectoryTable"
import { NotProvisioned, EmptyState } from "@/components/admin-marketplace/states"

export const dynamic = "force-dynamic"

/**
 * Workspace directory for marketplace oversight (read-only). Shows each
 * workspace's type / plan / status / owner and its marketplace transaction
 * count; rows link to a marketplace-footprint detail. Guard-enforced server-side.
 */
export default async function MarketplaceWorkspacesPage() {
  const identity = await getAdminIdentity()
  if (!identity) redirect("/admin-login")

  const { available, rows } = await listWorkspaceDirectory(300)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/admin/marketplace" className="hover:text-[#2563EB] flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Marketplace
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">Workspaces</span>
      </div>

      <div>
        <h1 className="text-xl font-bold text-slate-900">Workspace directory</h1>
        <p className="text-xs text-slate-500">
          {available
            ? `${rows.length} workspace${rows.length === 1 ? "" : "s"} · marketplace footprint oversight`
            : "workspaces not provisioned"}
        </p>
      </div>

      {!available ? (
        <NotProvisioned table="workspaces" />
      ) : rows.length === 0 ? (
        <EmptyState icon={Building2} title="No workspaces" hint="Workspaces appear here as customers sign up." />
      ) : (
        <WorkspaceDirectoryTable rows={rows} />
      )}
    </div>
  )
}
