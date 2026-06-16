"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { AlertTriangle, ExternalLink } from "lucide-react"
import { MobileTopBar } from "@/components/mobile"
import {
  SupplierPageHeader, SupplierCard, SupplierLoadingState, SupplierEmptyState,
  SupplierStatusBadge, SupplierTabs, toneForStatus, humaniseStatus,
} from "@/components/supplier-workspace/ui"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { useSupplierApiUrl, useSupplierWorkspace } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import { timeAgo } from "@/components/supplier-workspace/format"
import type { SupplierDisputeRow } from "@/components/supplier-workspace/types"

export default function SupplierDisputesPage() {
  const { workspaceId } = useSupplierWorkspace()
  const disputes = useSupplierApi<SupplierDisputeRow[]>(useSupplierApiUrl("/api/supplier/disputes"), {
    select: (j) => (j as { items?: SupplierDisputeRow[] }).items ?? [],
  })
  const [tab, setTab] = useState("open")

  const items = disputes.data ?? []
  const open = items.filter((d) => d.status === "open" || d.status === "under_review")
  const closed = items.filter((d) => d.status === "resolved" || d.status === "rejected" || d.status === "withdrawn")
  const list = useMemo(() => (tab === "open" ? open : tab === "closed" ? closed : items), [tab, open, closed, items])

  async function withdraw(disputeId: string) {
    if (!workspaceId) return
    const res = await fetch("/api/supplier/disputes", {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify({ workspaceId, disputeId, action: "withdraw" }),
    })
    if (res.ok) disputes.refresh()
  }

  return (
    <div className="space-y-5">
      <MobileTopBar title="Disputes" subtitle="Job issues" />
      <SupplierPageHeader
        title="Disputes"
        subtitle="Issues you've raised on jobs, and their resolution. Raise a dispute from a job's Dispute tab."
        tabs={
          <SupplierTabs active={tab} onChange={setTab} tabs={[
            { key: "open", label: "Open", count: open.length },
            { key: "closed", label: "Closed", count: closed.length },
            { key: "all", label: "All", count: items.length },
          ]} />
        }
      />

      {disputes.loading ? (
        <SupplierCard className="p-5"><SupplierLoadingState rows={4} /></SupplierCard>
      ) : list.length === 0 ? (
        <SupplierCard className="p-5">
          <SupplierEmptyState
            icon={AlertTriangle}
            title={tab === "open" ? "No open disputes" : "No disputes"}
            description="If something goes wrong on a job — payment, scope, quality or access — raise a dispute from that job and track it here."
          />
        </SupplierCard>
      ) : (
        <SupplierCard className="divide-y divide-slate-100">
          {list.map((d) => (
            <div key={d.id} className="p-4">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-slate-900">{d.subject}</p>
                <SupplierStatusBadge tone={toneForStatus(d.status)}>{humaniseStatus(d.status)}</SupplierStatusBadge>
                <SupplierStatusBadge tone="slate">{humaniseStatus(d.category)}</SupplierStatusBadge>
              </div>
              {d.detail && <p className="text-xs text-slate-500 mt-1">{d.detail}</p>}
              {d.resolution && <p className="text-xs text-emerald-700 mt-1">Resolution: {d.resolution}</p>}
              <div className="flex items-center gap-3 mt-2">
                <p className="text-[11px] text-slate-400">Raised {timeAgo(d.created_at)} by {d.raised_by_side}</p>
                <Link href={`/supplier/jobs/${d.assignment_id}`} className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#2563EB] hover:text-[#1d4ed8]">
                  View job <ExternalLink className="w-3 h-3" />
                </Link>
                {(d.status === "open" || d.status === "under_review") && d.raised_by_side === "supplier" && (
                  <button onClick={() => withdraw(d.id)} className="text-[11px] font-semibold text-slate-500 hover:text-slate-700">Withdraw</button>
                )}
              </div>
            </div>
          ))}
        </SupplierCard>
      )}
    </div>
  )
}
