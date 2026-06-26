import React from "react"
import { redirect } from "next/navigation"
import { ShieldCheck, FileSearch, BadgeCheck } from "lucide-react"
import { getAdminIdentity } from "@/lib/admin/guard"
import { listSupplierQueue } from "@/components/admin-supplier-verification/data"
import QueueTable from "@/components/admin-supplier-verification/QueueTable"
import { AdminPageHeader, AdminBanner, AdminNotConfigured, AdminEmptyState } from "@/components/admin/ui"

export const dynamic = "force-dynamic"
export const metadata = { title: "Supplier verification — Propvora admin" }

/**
 * Platform-admin SUPPLIER ID verification review queue.
 *
 * Cross-tenant BY DESIGN — a platform admin reviews supplier verifications
 * (L4 ID evidence / L5 insurance + licence) across every supplier workspace.
 * Access is gated by the (admin) layout AND re-checked here server-side
 * (fail-closed): a non-admin is redirected before any data loads.
 *
 * SEPARATE from the identity/KYC queue (/admin/id-verification).
 */
export default async function AdminSupplierVerificationQueuePage() {
  const identity = await getAdminIdentity()
  if (!identity) redirect("/bw-console-x9f3")

  const { available, rows } = await listSupplierQueue(200)
  const flagged = rows.filter((r) => r.openRiskFlags > 0).length

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={ShieldCheck}
        title="Supplier verification"
        subtitle={available && rows.length > 0
          ? `${rows.length} awaiting review${flagged > 0 ? ` · ${flagged} with open risk flags` : ""} — oldest first`
          : "ID evidence (L4) & insurance / licence (L5) review across all supplier workspaces"}
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Operations" }, { label: "Supplier verification" }]}
      />

      <AdminBanner tone="slate" icon={BadgeCheck} title="Explicit admin decisions only.">
        Every decision is an explicit, recorded admin action. Approving records that{" "}
        <span className="font-semibold text-slate-700">evidence was reviewed</span> — it is not a
        guarantee, a background check, or a government verification. Identity, insurance and licence
        evidence is <span className="font-semibold text-slate-700">never auto-approved</span>.
      </AdminBanner>

      {!available ? (
        <AdminNotConfigured
          title="supplier_identity_verifications table not provisioned"
          description="The supplier verification subsystem is not present in this database yet. Apply the migration to enable the review queue."
        />
      ) : rows.length === 0 ? (
        <AdminEmptyState
          icon={FileSearch}
          title="Queue is clear"
          description="No supplier verifications are awaiting review."
        />
      ) : (
        <QueueTable rows={rows} />
      )}
    </div>
  )
}
