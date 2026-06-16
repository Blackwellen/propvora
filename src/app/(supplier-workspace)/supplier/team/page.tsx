"use client"

import { useState } from "react"
import { Users, Trash2 } from "lucide-react"
import { MobileTopBar } from "@/components/mobile"
import {
  SupplierPageHeader, SupplierCard, SupplierLoadingState, SupplierEmptyState,
  SupplierStatusBadge, SupplierBanner,
} from "@/components/supplier-workspace/ui"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { useSupplierApiUrl, useSupplierWorkspace } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import { shortDate } from "@/components/supplier-workspace/format"
import type { SupplierTeamRow } from "@/components/supplier-workspace/types"

const ROLES = ["owner", "admin", "member"] as const

function initials(name: string | null, id: string): string {
  if (name) return name.trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase()
  return id.slice(0, 2).toUpperCase()
}

export default function SupplierTeamPage() {
  const { workspaceId } = useSupplierWorkspace()
  const team = useSupplierApi<SupplierTeamRow[]>(useSupplierApiUrl("/api/supplier/team"), {
    select: (j) => (j as { items?: SupplierTeamRow[] }).items ?? [],
  })
  const [banner, setBanner] = useState<{ tone: "emerald" | "red"; msg: string } | null>(null)

  async function setRole(memberId: string, role: string) {
    if (!workspaceId) return
    const res = await fetch("/api/supplier/team", {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify({ workspaceId, memberId, role }),
    })
    if (res.ok) { team.refresh(); setBanner({ tone: "emerald", msg: "Role updated." }) }
    else setBanner({ tone: "red", msg: "Couldn't update the role." })
  }

  async function remove(memberId: string) {
    if (!workspaceId) return
    if (!window.confirm("Remove this member from the workspace?")) return
    const res = await fetch(`/api/supplier/team?workspaceId=${workspaceId}&memberId=${memberId}`, { method: "DELETE" })
    if (res.ok) { team.refresh(); setBanner({ tone: "emerald", msg: "Member removed." }) }
    else setBanner({ tone: "red", msg: "Couldn't remove the member." })
  }

  const items = team.data ?? []

  return (
    <div className="space-y-5">
      <MobileTopBar title="Team" subtitle="Workspace members" />
      <SupplierPageHeader title="Team" subtitle="People who can access this supplier workspace and their roles." />

      {banner && <SupplierBanner tone={banner.tone} onDismiss={() => setBanner(null)}>{banner.msg}</SupplierBanner>}

      {team.loading ? (
        <SupplierCard className="p-5"><SupplierLoadingState rows={3} /></SupplierCard>
      ) : items.length === 0 ? (
        <SupplierCard className="p-5">
          <SupplierEmptyState
            icon={Users}
            title="No team members"
            description="The people invited to your supplier workspace appear here. Inviting new colleagues is handled during onboarding and by your account owner."
          />
        </SupplierCard>
      ) : (
        <SupplierCard className="divide-y divide-slate-100">
          {items.map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-4">
              <div className="w-10 h-10 rounded-full bg-[#0D1B2A] text-white flex items-center justify-center text-xs font-semibold shrink-0">
                {initials(m.name, m.user_id)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{m.name ?? `Member ${m.user_id.slice(0, 8)}`}</p>
                <p className="text-xs text-slate-400">Joined {shortDate(m.created_at)}</p>
              </div>
              <select
                value={ROLES.includes(m.role as typeof ROLES[number]) ? m.role : "member"}
                onChange={(e) => setRole(m.id, e.target.value)}
                className="h-9 rounded-lg border border-slate-200 text-[13px] px-2 font-medium text-slate-700"
                aria-label="Role"
              >
                {ROLES.map((r) => <option key={r} value={r}>{r[0].toUpperCase() + r.slice(1)}</option>)}
              </select>
              {m.role !== "owner" && (
                <button onClick={() => remove(m.id)} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50" aria-label="Remove member">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </SupplierCard>
      )}

      <p className="text-[11px] text-slate-400">Roles control who can manage services, quotes, jobs and money in this workspace.</p>
      <SupplierStatusBadge tone="slate">{items.length} member{items.length === 1 ? "" : "s"}</SupplierStatusBadge>
    </div>
  )
}
