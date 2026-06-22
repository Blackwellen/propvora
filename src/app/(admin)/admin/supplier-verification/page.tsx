import React from "react"
import { redirect } from "next/navigation"
import { ShieldCheck, FileSearch, BadgeCheck } from "lucide-react"
import { getAdminIdentity } from "@/lib/admin/guard"
import { listSupplierQueue } from "@/components/admin-supplier-verification/data"
import QueueTable from "@/components/admin-supplier-verification/QueueTable"

export const dynamic = "force-dynamic"

/**
 * Platform-admin SUPPLIER ID verification review queue.
 *
 * Cross-tenant BY DESIGN — a platform admin reviews supplier verifications
 * (L4 ID evidence / L5 insurance + licence) across every supplier workspace.
 * Access is gated by the (admin) layout AND re-checked here server-side
 * (fail-closed): a non-admin is redirected before any data loads.
 *
 * SEPARATE from the P6 identity/KYC queue (/admin/verification).
 */
export default async function AdminSupplierVerificationQueuePage() {
  const identity = await getAdminIdentity()
  if (!identity) redirect("/bw-console-x9f3")

  const { available, rows } = await listSupplierQueue(200)
  const flagged = rows.filter((r) => r.openRiskFlags > 0).length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Supplier verification</h1>
          <p className="text-xs text-slate-500">
            ID evidence (L4) &amp; insurance / licence (L5) review across all supplier workspaces · oldest first
          </p>
        </div>
        {available && rows.length > 0 && (
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <FileSearch className="w-3.5 h-3.5 text-slate-400" />
              {rows.length} awaiting review
            </span>
            {flagged > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[#B45309]">
                <ShieldCheck className="w-3.5 h-3.5" />
                {flagged} with open risk flags
              </span>
            )}
          </div>
        )}
      </div>

      {/* Honesty note. */}
      <div className="flex items-start gap-2 rounded-xl border border-[#E2E8F0] bg-slate-50 px-3 py-2.5">
        <BadgeCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-[11.5px] leading-relaxed text-slate-500">
          Every decision is an explicit, recorded admin action. Approving records that{" "}
          <span className="font-semibold text-slate-700">evidence was reviewed</span> — it is not a
          guarantee, a background check, or a government verification. Identity, insurance and licence
          evidence is <span className="font-semibold text-slate-700">never auto-approved</span>.
        </p>
      </div>

      {!available ? (
        <div className="rounded-xl border border-[#E2E8F0] bg-white py-12 text-center">
          <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-medium">
            supplier_identity_verifications table not provisioned
          </p>
          <p className="text-xs text-slate-400 mt-1">
            The supplier verification subsystem is not present in this database yet.
          </p>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-[#E2E8F0] bg-white py-12 text-center">
          <FileSearch className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-medium">Queue is clear</p>
          <p className="text-xs text-slate-400 mt-1">
            No supplier verifications are awaiting review.
          </p>
        </div>
      ) : (
        <QueueTable rows={rows} />
      )}
    </div>
  )
}
