import React from "react"
import { redirect } from "next/navigation"
import { ShieldCheck, FileSearch } from "lucide-react"
import { getAdminIdentity } from "@/lib/admin/guard"
import { listVerificationQueue, QUEUE_STATUSES } from "@/components/admin-verification/data"
import QueueTable from "@/components/admin-verification/QueueTable"

export const dynamic = "force-dynamic"

/**
 * Platform-admin Identity / KYC review queue.
 *
 * Cross-tenant BY DESIGN — a platform admin reviews verifications across every
 * workspace. Access is gated by the (admin) layout AND re-checked here
 * server-side (fail-closed): a non-admin is redirected before any data loads.
 */
export default async function AdminVerificationQueuePage() {
  const identity = await getAdminIdentity()
  if (!identity) redirect("/bw-console-x9f3")

  const { available, rows } = await listVerificationQueue(200)

  const signalCount = rows.filter((r) => r.sanctionsSignal).length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Identity verification</h1>
          <p className="text-xs text-slate-500">
            KYC review queue across all workspaces · {QUEUE_STATUSES.map((s) => s.replace(/_/g, " ")).join(" · ")} · oldest first
          </p>
        </div>
        {available && rows.length > 0 && (
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <FileSearch className="w-3.5 h-3.5 text-slate-400" />
              {rows.length} in queue
            </span>
            {signalCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[#B45309]">
                <ShieldCheck className="w-3.5 h-3.5" />
                {signalCount} with screening signal
              </span>
            )}
          </div>
        )}
      </div>

      {/* Honesty note: signals are not determinations; the admin decides. */}
      <div className="flex items-start gap-2 rounded-xl border border-[#E2E8F0] bg-slate-50 px-3 py-2.5">
        <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-[11.5px] leading-relaxed text-slate-500">
          Every verification is decided by an explicit, recorded admin action. Sanctions / PEP flags
          shown here are <span className="font-semibold text-slate-700">screening signals for
          review</span>, not automated decisions or legal determinations.
        </p>
      </div>

      {!available ? (
        <div className="rounded-xl border border-[#E2E8F0] bg-white py-12 text-center">
          <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-medium">
            identity_verifications table not provisioned
          </p>
          <p className="text-xs text-slate-400 mt-1">
            The verification subsystem is not present in this database yet.
          </p>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-[#E2E8F0] bg-white py-12 text-center">
          <FileSearch className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-medium">Queue is clear</p>
          <p className="text-xs text-slate-400 mt-1">
            No verifications are pending, processing, or awaiting input.
          </p>
        </div>
      ) : (
        <QueueTable rows={rows} />
      )}
    </div>
  )
}
