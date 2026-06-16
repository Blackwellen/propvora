"use client"

import Link from "next/link"
import { MessagesSquare, Inbox, Wrench, ArrowUpRight } from "lucide-react"
import { MobileTopBar } from "@/components/mobile"
import {
  SupplierPageHeader, SupplierCard, SupplierLoadingState, SupplierEmptyState,
  SupplierStatusBadge, toneForStatus, humaniseStatus,
} from "@/components/supplier-workspace/ui"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { useSupplierApiUrl } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import { timeAgo } from "@/components/supplier-workspace/format"
import type { SupplierLead, SupplierAssignmentRow } from "@/components/supplier-workspace/types"

/* Messages surfaces the live conversation context for this workspace: each open
   lead and active job is a thread you respond to. Until a dedicated supplier
   thread store ships, this is the honest, real index of who you owe a reply —
   linking straight to the actionable surface (Leads / the job). */
export default function SupplierMessagesPage() {
  const leads = useSupplierApi<{ items: SupplierLead[] }>(useSupplierApiUrl("/api/supplier/leads"), {
    select: (j) => j as { items: SupplierLead[] },
  })
  const jobs = useSupplierApi<SupplierAssignmentRow[]>(
    useSupplierApiUrl("/api/supplier/jobs", { side: "supplier" }),
    { select: (j) => (j as { items?: SupplierAssignmentRow[] }).items ?? [] }
  )

  const openLeads = (leads.data?.items ?? []).filter((l) => {
    const s = (l.status ?? "").toLowerCase()
    return l.source === "quote_request" ? s === "requested" : ["new", "open", "received", "pending"].includes(s)
  })
  const activeJobs = (jobs.data ?? []).filter((j) => ["assigned", "accepted", "in_progress"].includes(j.status))
  const loading = leads.loading || jobs.loading
  const empty = openLeads.length === 0 && activeJobs.length === 0

  return (
    <div className="space-y-5">
      <MobileTopBar title="Messages" subtitle="Conversations" />
      <SupplierPageHeader
        title="Messages"
        subtitle="Threads that need your attention — new leads to respond to and active jobs to coordinate."
      />

      {loading ? (
        <SupplierCard className="p-5"><SupplierLoadingState rows={4} /></SupplierCard>
      ) : empty ? (
        <SupplierCard className="p-5">
          <SupplierEmptyState
            icon={MessagesSquare}
            title="No conversations need you"
            description="When a property manager sends a quote request or you have an active job to coordinate, it appears here so you can reply promptly."
          />
        </SupplierCard>
      ) : (
        <div className="space-y-4">
          {openLeads.length > 0 && (
            <SupplierCard className="p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <Inbox className="w-4 h-4 text-blue-600" />
                <h2 className="text-base font-semibold text-slate-900">Awaiting your response</h2>
              </div>
              <ul className="divide-y divide-slate-100">
                {openLeads.map((l) => (
                  <li key={l.id}>
                    <Link href="/supplier/leads" className="flex items-center gap-3 py-2.5 group">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{l.title}</p>
                        <p className="text-xs text-slate-400">{l.counterpartyName ? `${l.counterpartyName} · ` : ""}{timeAgo(l.createdAt)}</p>
                      </div>
                      <SupplierStatusBadge tone={toneForStatus(l.status)}>{humaniseStatus(l.status)}</SupplierStatusBadge>
                      <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-[#2563EB]" />
                    </Link>
                  </li>
                ))}
              </ul>
            </SupplierCard>
          )}

          {activeJobs.length > 0 && (
            <SupplierCard className="p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <Wrench className="w-4 h-4 text-emerald-600" />
                <h2 className="text-base font-semibold text-slate-900">Active jobs</h2>
              </div>
              <ul className="divide-y divide-slate-100">
                {activeJobs.map((j) => (
                  <li key={j.id}>
                    <Link href={`/supplier/jobs/${j.id}`} className="flex items-center gap-3 py-2.5 group">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">Job {j.id.slice(0, 8)}</p>
                        <p className="text-xs text-slate-400">Updated {timeAgo(j.updated_at ?? j.created_at)}</p>
                      </div>
                      <SupplierStatusBadge tone={toneForStatus(j.status)}>{humaniseStatus(j.status)}</SupplierStatusBadge>
                      <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-[#2563EB]" />
                    </Link>
                  </li>
                ))}
              </ul>
            </SupplierCard>
          )}
        </div>
      )}
    </div>
  )
}
