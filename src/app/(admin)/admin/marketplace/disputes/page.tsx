import React from "react"
import { redirect } from "next/navigation"
import { Gavel, ShieldCheck } from "lucide-react"
import { getAdminIdentity } from "@/lib/admin/guard"
import { listDisputesForAdmin } from "@/components/admin-marketplace/data"
import DisputesQueue from "@/components/admin-marketplace/DisputesQueue"
import StatusFilter from "@/components/admin-marketplace/StatusFilter"
import { NotProvisioned, EmptyState } from "@/components/admin-marketplace/states"
import { AdminPageHeader, AdminBanner } from "@/components/admin/ui"

export const dynamic = "force-dynamic"

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

const STATUS_OPTIONS = [
  { value: "", label: "Queue" },
  { value: "open", label: "Open" },
  { value: "under_review", label: "Under review" },
  { value: "escalated", label: "Escalated" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
]

/**
 * Cross-workspace dispute queue + resolve panel.
 *
 * Resolution is an EXPLICIT, AUTHORISED admin action: the resolve panel posts to
 * /api/admin/disputes, which dynamically imports `resolveDispute` from
 * @/lib/marketplace/disputes — that helper checks `can_resolve_dispute` and
 * records an audit entry. Disputes are NEVER auto-resolved. Guard-enforced.
 */
export default async function MarketplaceDisputesPage({ searchParams }: PageProps) {
  const identity = await getAdminIdentity()
  if (!identity) redirect("/bw-console-x9f3")

  const sp = await searchParams
  const { available, rows } = await listDisputesForAdmin({ status: sp.status })

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={Gavel}
        title="Dispute queue"
        subtitle={available
          ? `${rows.length} dispute${rows.length === 1 ? "" : "s"}${sp.status ? "" : " in the active queue"} — cross-workspace`
          : "Marketplace not provisioned"}
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Marketplace" }, { label: "Disputes" }]}
        actions={<StatusFilter options={STATUS_OPTIONS} />}
      />

      <AdminBanner tone="slate" icon={ShieldCheck} title="Explicit admin decisions only.">
        Every resolution is an explicit, recorded admin action. Authorisation is verified server-side via{" "}
        <code className="font-mono">can_resolve_dispute</code> and the outcome is written to the audit log.
        The system never auto-resolves a dispute.
      </AdminBanner>

      {!available ? (
        <NotProvisioned table="marketplace_disputes" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Gavel}
          title={sp.status ? "No disputes in this state" : "Queue is clear"}
          hint={sp.status ? undefined : "No disputes are open, under review, or escalated."}
        />
      ) : (
        <DisputesQueue rows={rows} />
      )}
    </div>
  )
}
