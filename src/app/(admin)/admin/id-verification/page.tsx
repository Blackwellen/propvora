import React from "react"
import { redirect } from "next/navigation"
import { ShieldCheck, FileSearch, AlertTriangle, Hourglass, ClipboardList } from "lucide-react"
import { getAdminIdentity } from "@/lib/admin/guard"
import { listVerificationQueue } from "@/components/admin-verification/data"
import QueueTable from "@/components/admin-verification/QueueTable"
import {
  AdminPageHeader, AdminKpiStrip, AdminBanner, AdminNotConfigured, AdminEmptyState,
  type AdminKpi,
} from "@/components/admin/ui"

export const dynamic = "force-dynamic"

function num(n: number): string {
  return n.toLocaleString("en-GB")
}

/**
 * Identity / KYC verification review queue (manifest row 26, target path).
 *
 * Cross-tenant BY DESIGN — a platform admin reviews identity verifications across
 * every workspace. Gated by the (admin) layout AND re-checked here server-side
 * (fail-closed): a non-admin is redirected before any data loads.
 *
 * Approve / reject / request-info are EXPLICIT recorded admin actions handled in
 * the per-verification detail panel; the system never auto-decides. Sanctions /
 * PEP rows are screening SIGNALS for review, not legal determinations.
 */
export default async function AdminIdVerificationPage() {
  const identity = await getAdminIdentity()
  if (!identity) redirect("/bw-console-x9f3")

  const { available, rows } = await listVerificationQueue(200)

  const pending = rows.filter((r) => r.status === "pending").length
  const processing = rows.filter((r) => r.status === "processing").length
  const needsInfo = rows.filter((r) => r.status === "requires_input").length
  const signals = rows.filter((r) => r.sanctionsSignal).length

  const kpis: AdminKpi[] = [
    { label: "In review queue", value: num(rows.length), icon: ClipboardList, tone: "blue" },
    { label: "Pending", value: num(pending), icon: Hourglass, tone: pending ? "amber" : "slate" },
    { label: "Processing", value: num(processing), icon: FileSearch, tone: "violet" },
    { label: "Needs info", value: num(needsInfo), icon: FileSearch, tone: needsInfo ? "amber" : "slate" },
    { label: "Screening signals", value: num(signals), icon: AlertTriangle, tone: signals ? "red" : "emerald" },
  ]

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Identity verification"
        icon={ShieldCheck}
        subtitle="KYC review queue across all workspaces — oldest first. Each verification is decided by an explicit, recorded admin action."
      />

      {available && rows.length > 0 && <AdminKpiStrip kpis={kpis} cols={5} />}

      <AdminBanner tone="slate" icon={ShieldCheck} title="Signals, not determinations.">
        Every verification is decided by an explicit, recorded admin action — approve, reject, or request more info — in the
        review panel. Sanctions / PEP flags shown here are screening signals for human review, not automated decisions or
        legal determinations. This is not a government identity-verification service.
      </AdminBanner>

      {!available ? (
        <AdminNotConfigured
          title="Verification subsystem not provisioned"
          description="The identity_verifications table is not present in this database yet. The KYC review queue will populate once the verification subsystem is provisioned."
        />
      ) : rows.length === 0 ? (
        <AdminEmptyState
          icon={FileSearch}
          title="Queue is clear"
          description="No verifications are pending, processing, or awaiting input across any workspace."
        />
      ) : (
        <QueueTable rows={rows} />
      )}
    </div>
  )
}
