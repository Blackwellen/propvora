"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Plus, Search, X, Globe, Eye, Clock, XCircle, Send,
} from "lucide-react"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { PortalsTabNav } from "@/components/portals/PortalsTabNav"
import { GrantPortalAccessModal } from "@/components/portals/GrantPortalAccessModal"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { MobileTabs } from "@/components/mobile"
import { useWorkspace } from "@/providers/AuthProvider"
import {
  usePortalGrants, useRevokeGrant, useExtendGrant, type PortalGrant,
} from "@/hooks/usePortals"
import {
  GRANT_STATUS_META, profileLabel, purposeLabel, type PortalGrantStatus,
} from "@/lib/portals/config"
import { cn } from "@/lib/utils"

const STATUS_FILTERS: { key: "all" | PortalGrantStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "created", label: "Pending" },
  { key: "expired", label: "Expired" },
  { key: "revoked", label: "Revoked" },
]

function fmtDate(d: string | null): string {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

function GrantRow({ grant, workspaceId }: { grant: PortalGrant; workspaceId: string | undefined }) {
  const router = useRouter()
  const revoke = useRevokeGrant()
  const extend = useExtendGrant()
  const meta = GRANT_STATUS_META[grant.status] ?? GRANT_STATUS_META.created
  const isRevoked = grant.status === "revoked"

  return (
    <tr
      className="hover:bg-slate-50/60 transition-colors cursor-pointer"
      onClick={() => router.push(`/app/portals/access/${grant.id}`)}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2563EB] to-[#0EA5E9] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
            {(grant.contact?.full_name ?? "?").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">
              {grant.contact?.full_name || "Unknown contact"}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {grant.contact?.company || grant.contact?.email || "—"}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs text-slate-600 whitespace-nowrap">{profileLabel(grant.access_type)}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs text-slate-600 whitespace-nowrap">{purposeLabel(grant.purpose)}</span>
      </td>
      <td className="px-4 py-3">
        <span className={cn("inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold", meta.cls)}>
          {meta.label}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs text-slate-500 whitespace-nowrap">{fmtDate(grant.expires_at)}</span>
      </td>
      <td className="px-4 py-3">
        <span className={cn("text-xs whitespace-nowrap", grant.last_opened_at ? "text-slate-500" : "text-slate-400 italic")}>
          {grant.last_opened_at ? fmtDate(grant.last_opened_at) : "Never"}
        </span>
      </td>
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <ActionMenu
          items={[
            { label: "View grant", icon: Eye, onClick: () => router.push(`/app/portals/access/${grant.id}`) },
            { label: "Extend expiry (+30d)", icon: Clock, onClick: () => workspaceId && extend.mutate({ id: grant.id, workspaceId, days: 30 }), disabled: isRevoked },
            { label: "Resend link", icon: Send, onClick: () => {}, disabled: true },
            { label: isRevoked ? "Revoked" : "Revoke access", icon: XCircle, variant: "danger", onClick: () => workspaceId && revoke.mutate({ id: grant.id, workspaceId }), disabled: isRevoked },
          ]}
        />
      </td>
    </tr>
  )
}

export default function PortalAccessListPage() {
  const { workspace } = useWorkspace()
  const { data: grants = [], isLoading } = usePortalGrants(workspace?.id)
  const [showGrant, setShowGrant] = useState(false)
  const [statusFilter, setStatusFilter] = useState<"all" | PortalGrantStatus>("all")
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    return grants.filter((g) => {
      const matchStatus = statusFilter === "all" || g.status === statusFilter
      const q = search.trim().toLowerCase()
      const matchSearch =
        !q ||
        g.contact?.full_name?.toLowerCase().includes(q) ||
        g.contact?.email?.toLowerCase().includes(q) ||
        purposeLabel(g.purpose).toLowerCase().includes(q)
      return matchStatus && matchSearch
    })
  }, [grants, statusFilter, search])

  return (
    <DashboardContainer>
      <PortalsTabNav />

      <div className="px-6 pt-6 pb-10 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Portals</p>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Access Grants</h1>
            <p className="text-sm text-slate-500 mt-0.5">Every portal grant across the workspace.</p>
          </div>
          <button
            onClick={() => setShowGrant(true)}
            className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" /> Grant portal access
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="md:hidden w-full">
            <MobileTabs
              tabs={STATUS_FILTERS.map((f) => ({ id: f.key, label: f.label }))}
              value={statusFilter}
              onChange={(id) => setStatusFilter(id as "all" | PortalGrantStatus)}
              aria-label="Filter grants by status"
            />
          </div>
          <div className="hidden md:flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  statusFilter === f.key ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search grants…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-8 py-1.5 text-sm border border-slate-200 rounded-lg bg-white shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-56 transition-all"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 whitespace-nowrap">Contact</th>
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Profile</th>
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Purpose</th>
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Expiry</th>
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Last accessed</th>
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <div className="flex items-center justify-center gap-2 text-slate-400">
                        <div className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-blue-500 animate-spin" />
                        <span className="text-sm">Loading grants…</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((g) => <GrantRow key={g.id} grant={g} workspaceId={workspace?.id} />)
                )}
              </tbody>
            </table>
            {!isLoading && filtered.length === 0 && (
              <div className="py-16 text-center">
                <Globe className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-500">
                  {grants.length === 0 ? "No portal grants yet" : "No grants match your filters"}
                </p>
                {grants.length === 0 && (
                  <p className="text-xs text-slate-400 mt-1">Grant a contact secure portal access to get started.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showGrant && (
        <GrantPortalAccessModal workspaceId={workspace?.id} onClose={() => setShowGrant(false)} />
      )}
    </DashboardContainer>
  )
}
