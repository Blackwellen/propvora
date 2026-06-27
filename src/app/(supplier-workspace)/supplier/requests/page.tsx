"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { RequestsPipeline } from "@/features/supplier/requests/RequestsPipeline"
import { useSupplierPlan } from "@/components/supplier-workspace/useSupplierPlan"
import { useSupplierRequests } from "@/features/supplier/requests/data/hooks"
import { MobileTopBar } from "@/components/mobile"
import { SupplierCard, SupplierLoadingState } from "@/components/supplier-workspace/ui"
import { RequestsKpiStrip } from "@/features/supplier/requests/components/RequestsKpiStrip"
import { TeamQuoteApprovalTab } from "@/features/supplier/requests/components/TeamQuoteApprovalTab"

/* Supplier → Requests — the sales pipeline (route-aware tabs via ?tab=).
   Team/enterprise plans additionally get the Quote Approval Queue (image 5) at
   ?tab=quotes&view=approvals. The full pipeline lives in
   src/features/supplier/requests/**. */
export default function SupplierRequestsPage() {
  return (
    <Suspense
      fallback={
        <SupplierCard className="p-5">
          <SupplierLoadingState rows={5} />
        </SupplierCard>
      }
    >
      <RequestsRouter />
    </Suspense>
  )
}

function RequestsRouter() {
  const { isTeam } = useSupplierPlan()
  const params = useSearchParams()

  if (isTeam && params.get("tab") === "quotes" && params.get("view") === "approvals") {
    return (
      <>
        <MobileTopBar title="Quote approvals" subtitle="Requests" />
        <TeamQuoteApprovalTab />
      </>
    )
  }

  return <RequestsWithKpi isTeam={isTeam} />
}

function RequestsWithKpi({ isTeam }: { isTeam: boolean }) {
  const { data: rows, loading } = useSupplierRequests()
  const openLeads = loading ? "—" : String(rows.filter((r) => r.tab === "new").length)
  const awaitingApproval = loading ? "—" : String(rows.filter((r) => r.tab === "quoted").length)
  const wonRows = rows.filter((r) => r.tab === "won")
  const totalClosed = wonRows.length + rows.filter((r) => r.tab === "lost").length
  const winRate = loading
    ? "—"
    : totalClosed > 0
    ? `${Math.round((wonRows.length / totalClosed) * 100)}%`
    : "0%"
  // Due soon = open/quoted requests with a due date inside the next 48h.
  const dueSoonThreshold = Date.now() + 48 * 60 * 60 * 1000
  const dueSoon = loading
    ? "—"
    : String(
        rows.filter((r) => {
          if (r.tab !== "new" && r.tab !== "quoted") return false
          if (!r.dueAt) return false
          const t = new Date(r.dueAt).getTime()
          return t >= Date.now() && t <= dueSoonThreshold
        }).length
      )

  return (
    <>
      <MobileTopBar title="Requests" subtitle="Sales pipeline" />
      {isTeam && (
        <RequestsKpiStrip
          stats={[
            { label: "Open leads / RFQs", value: openLeads, tone: "blue" },
            { label: "Quoted (awaiting decision)", value: awaitingApproval, tone: "amber" },
            { label: "Win rate", value: winRate, tone: "emerald" },
            { label: "Due soon (48h)", value: dueSoon, tone: "slate" },
          ]}
        />
      )}
      <RequestsPipeline />
    </>
  )
}
