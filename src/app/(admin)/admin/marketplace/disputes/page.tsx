import React from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, Gavel, ShieldCheck } from "lucide-react"
import { getAdminIdentity } from "@/lib/admin/guard"
import { listDisputesForAdmin } from "@/components/admin-marketplace/data"
import DisputesQueue from "@/components/admin-marketplace/DisputesQueue"
import StatusFilter from "@/components/admin-marketplace/StatusFilter"
import { NotProvisioned, EmptyState } from "@/components/admin-marketplace/states"

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
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/admin/marketplace" className="hover:text-[#2563EB] flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Marketplace
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">Disputes</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dispute queue</h1>
          <p className="text-xs text-slate-500">
            {available
              ? `${rows.length} dispute${rows.length === 1 ? "" : "s"}${sp.status ? "" : " in the active queue"}`
              : "marketplace not provisioned"}
          </p>
        </div>
        <StatusFilter options={STATUS_OPTIONS} />
      </div>

      {/* Honesty note */}
      <div className="flex items-start gap-2 rounded-xl border border-[#E2E8F0] bg-slate-50 px-3 py-2.5">
        <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-[11.5px] leading-relaxed text-slate-500">
          Every resolution is an explicit, recorded admin action. Authorisation is verified server-side via{" "}
          <code className="font-mono">can_resolve_dispute</code> and the outcome is written to the audit log.
          The system never auto-resolves a dispute.
        </p>
      </div>

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
