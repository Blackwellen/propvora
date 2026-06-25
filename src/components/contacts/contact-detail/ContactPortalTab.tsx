"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Plus, RefreshCw, Trash2, ExternalLink, Globe } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRevokeGrant, useExtendGrant } from "@/hooks/usePortals"
import { Button } from "@/components/ui/Button"
import type { ContactDetail } from "./types"
import { SectionCard, FieldRow, StatusChip, EmptyState } from "./shared"

interface ContactGrant {
  id: string
  status: string
  access_type: string | null
  purpose: string | null
  expires_at: string | null
  last_opened_at: string | null
  created_at: string
}

function useContactGrants(workspaceId: string | undefined, contactId: string) {
  return useQuery<ContactGrant[]>({
    queryKey: ["contact-portal-grants", workspaceId, contactId],
    enabled: !!workspaceId && !!contactId,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("contact_portal_access")
        .select("id, status, access_type, purpose, expires_at, last_opened_at, created_at")
        .eq("workspace_id", workspaceId!)
        .eq("contact_id", contactId)
        .order("created_at", { ascending: false })
      if (error) {
        if (error.code === "42P01") return []
        throw error
      }
      return (data ?? []) as ContactGrant[]
    },
  })
}

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"

export function PortalAccessTab({ contact, workspaceId }: { contact: ContactDetail; workspaceId: string | undefined }) {
  const router = useRouter()
  const { data: grants = [], isLoading, refetch } = useContactGrants(workspaceId, contact.id)
  const revoke = useRevokeGrant()
  const extend = useExtendGrant()

  const active = grants.find((g) => g.status === "active")
  const manageHref = `/property-manager/contacts/portal-access?contact=${contact.id}`

  async function onRevoke(id: string) {
    if (!workspaceId) return
    await revoke.mutateAsync({ id, workspaceId })
    await refetch()
  }
  async function onExtend(id: string) {
    if (!workspaceId) return
    await extend.mutateAsync({ id, workspaceId, days: 30 })
    await refetch()
  }

  return (
    <div className="space-y-5">
      <SectionCard className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-slate-900">Current Portal Status</h4>
          <StatusChip status={active ? "active" : grants.length > 0 ? (grants[0].status || "expired") : "not_created"} />
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <FieldRow label="Access Type" value={active?.access_type ? active.access_type.replace(/_/g, " ") : "—"} />
          <FieldRow label="Last Accessed" value={fmt(active?.last_opened_at ?? null)} />
          <FieldRow label="Link Created" value={fmt(active?.created_at ?? null)} />
          <FieldRow label="Link Expires" value={fmt(active?.expires_at ?? null)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => router.push(manageHref)}>
            Create New Link
          </Button>
          {active && (
            <>
              <Button variant="outline" size="sm" leftIcon={<RefreshCw className="w-3.5 h-3.5" />} loading={extend.isPending} onClick={() => onExtend(active.id)}>
                Extend 30 days
              </Button>
              <Button variant="destructive-soft" size="sm" leftIcon={<Trash2 className="w-3.5 h-3.5" />} loading={revoke.isPending} onClick={() => onRevoke(active.id)}>
                Revoke
              </Button>
            </>
          )}
          <Button variant="ghost" size="sm" leftIcon={<ExternalLink className="w-3.5 h-3.5" />} onClick={() => router.push(manageHref)}>
            Manage in Portal Access
          </Button>
        </div>
      </SectionCard>

      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Link History</p>
        {isLoading ? (
          <div className="py-8 text-center text-sm text-slate-400">Loading portal links…</div>
        ) : grants.length === 0 ? (
          <EmptyState icon={Globe} message="No portal links created for this contact yet." cta="Create New Link" onCta={() => router.push(manageHref)} />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {["Purpose", "Created", "Expires", "Last Opened", "Status"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grants.map((g) => (
                  <tr key={g.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 text-slate-700 text-xs">{g.purpose ?? g.access_type?.replace(/_/g, " ") ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{fmt(g.created_at)}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{fmt(g.expires_at)}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{fmt(g.last_opened_at)}</td>
                    <td className="px-4 py-3"><StatusChip status={g.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
