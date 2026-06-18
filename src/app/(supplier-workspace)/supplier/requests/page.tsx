"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { RequestsPipeline } from "@/features/supplier/requests/RequestsPipeline"
import { useSupplierPlan } from "@/components/supplier-workspace/useSupplierPlan"
import { TeamQuoteApprovalQueue } from "@/features/supplier/team/requests/TeamQuoteApprovalQueue"
import { MobileTopBar } from "@/components/mobile"
import { SupplierCard, SupplierLoadingState } from "@/components/supplier-workspace/ui"

/* Supplier → Requests — the sales pipeline (route-aware tabs via ?tab=).
   Team/enterprise plans additionally get the Quote Approval Queue (image 5) at
   ?tab=quotes&view=approvals. The full pipeline lives in
   src/features/supplier/requests/**. */
export default function SupplierRequestsPage() {
  return (
    <Suspense fallback={<SupplierCard className="p-5"><SupplierLoadingState rows={5} /></SupplierCard>}>
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
        <TeamQuoteApprovalQueue />
      </>
    )
  }
  return (
    <>
      {isTeam && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <OpsStat label="Open leads / RFQs" value="24" tone="blue" />
          <OpsStat label="Awaiting quote approval" value="6" tone="amber" />
          <OpsStat label="Win rate (30d)" value="38%" tone="emerald" />
          <OpsStat label="Avg response" value="2.4h" tone="slate" />
        </div>
      )}
      <RequestsPipeline />
    </>
  )
}

function OpsStat({ label, value, tone }: { label: string; value: string; tone: "blue" | "amber" | "emerald" | "slate" }) {
  const c = tone === "blue" ? "text-[#2563EB]" : tone === "amber" ? "text-amber-600" : tone === "emerald" ? "text-emerald-600" : "text-slate-900"
  return <SupplierCard className="p-3.5"><span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</span><p className={`text-lg font-bold mt-1 ${c}`}>{value}</p></SupplierCard>
}
