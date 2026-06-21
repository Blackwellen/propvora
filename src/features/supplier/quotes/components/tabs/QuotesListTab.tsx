"use client"

import { useMemo, useState } from "react"
import { FileText, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { ResponsiveTable, type MobileCardMapping } from "@/components/mobile"
import {
  SupplierCard,
  SupplierEmptyState,
  SupplierLoadingState,
  SupplierNotReady,
  SupplierStatusBadge,
  toneForStatus,
  humaniseStatus,
} from "@/components/supplier-workspace/ui"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { useSupplierApiUrl } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import { money, shortDate, timeAgo } from "@/components/supplier-workspace/format"
import type { SupplierQuoteRequest } from "@/components/supplier-workspace/types"
import { SubmitQuotePanel } from "../SubmitQuotePanel"

const FILTERS = [
  { id: "open", label: "Open" },
  { id: "submitted", label: "Submitted" },
  { id: "all", label: "All" },
] as const

type FilterId = (typeof FILTERS)[number]["id"]

/** Shared filter rail — used as both the desktop tab strip and mobile strip. */
export function QuotesFilterRail({
  active,
  onChange,
}: {
  active: FilterId
  onChange: (id: FilterId) => void
}) {
  return (
    <div className="flex gap-1 border-b border-slate-200">
      {FILTERS.map((f) => (
        <button
          key={f.id}
          onClick={() => onChange(f.id)}
          className={cn(
            "px-3.5 py-2.5 text-sm font-semibold -mb-px border-b-2 transition-colors",
            active === f.id
              ? "border-[#2563EB] text-[#2563EB]"
              : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}

export function OpenQuotesTab() {
  return <QuotesListTab filter="open" />
}

export function SubmittedQuotesTab() {
  return <QuotesListTab filter="submitted" />
}

export function AllQuotesTab() {
  return <QuotesListTab filter="all" />
}

function QuotesListTab({ filter: initialFilter }: { filter: FilterId }) {
  const quotes = useSupplierApi<SupplierQuoteRequest[]>(
    useSupplierApiUrl("/api/supplier/quotes", { side: "supplier" }),
    {
      select: (j) =>
        (
          j as {
            items?: SupplierQuoteRequest[]
            quotes?: SupplierQuoteRequest[]
            data?: SupplierQuoteRequest[]
          }
        ).items ??
        (j as { quotes?: SupplierQuoteRequest[] }).quotes ??
        (j as { data?: SupplierQuoteRequest[] }).data ??
        (Array.isArray(j) ? (j as SupplierQuoteRequest[]) : []),
    }
  )

  const [filter, setFilter] = useState<FilterId>(initialFilter)
  const [active, setActive] = useState<SupplierQuoteRequest | null>(null)

  const rows = quotes.data ?? []
  const submitted = ["submitted", "quoted", "accepted", "declined", "closed", "expired"]
  const filtered = useMemo(() => {
    if (filter === "all") return rows
    return rows.filter((q) => {
      const s = (q.status ?? "").toLowerCase()
      const isSubmitted = submitted.includes(s)
      return filter === "submitted" ? isSubmitted : !isSubmitted
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, filter])

  const mobileMapping: MobileCardMapping<SupplierQuoteRequest> = {
    getKey: (q) => q.id ?? q.reference ?? Math.random().toString(36),
    title: (q) => (q.category ? humaniseStatus(q.category) : (q.reference ?? "Quote request")),
    subtitle: (q) => q.property_label ?? "Property",
    badge: (q) =>
      q.status ? (
        <SupplierStatusBadge tone={toneForStatus(q.status)}>
          {humaniseStatus(q.status)}
        </SupplierStatusBadge>
      ) : null,
    onRowClick: (q) => setActive(q),
    fields: [
      { label: "Urgency", render: (q) => (q.urgency ? humaniseStatus(q.urgency) : "—") },
      { label: "Budget", render: (q) => (q.budget_max ? money(q.budget_max) : "—") },
      { label: "Deadline", render: (q) => shortDate(q.quote_deadline) },
      { label: "Received", render: (q) => timeAgo(q.created_at) },
    ],
  }

  return (
    <div className="space-y-4">
      <QuotesFilterRail active={filter} onChange={setFilter} />

      {quotes.loading ? (
        <SupplierCard className="p-5">
          <SupplierLoadingState rows={5} />
        </SupplierCard>
      ) : quotes.notReady ? (
        <SupplierCard className="p-5">
          <SupplierNotReady
            icon={FileText}
            title="Quotes coming online"
            description="Quote requests appear here once the supplier quotes service is connected."
          />
        </SupplierCard>
      ) : filtered.length === 0 ? (
        <SupplierCard className="p-5">
          <SupplierEmptyState
            icon={FileText}
            title={filter === "submitted" ? "No submitted quotes" : "No open requests"}
            description={
              filter === "submitted"
                ? "Quotes you've submitted will be tracked here until they're accepted or declined."
                : "When a property manager invites you to quote, the request lands here. Keep your coverage and services up to date to receive more."
            }
          />
        </SupplierCard>
      ) : (
        <ResponsiveTable rows={filtered} mobile={mobileMapping}>
          <SupplierCard className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-left">
                  <Th>Request</Th>
                  <Th>Property</Th>
                  <Th>Urgency</Th>
                  <Th>Budget</Th>
                  <Th>Deadline</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Action</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((q, i) => (
                  <tr key={q.id ?? i} className="hover:bg-slate-50/60 transition-colors">
                    <Td>
                      <p className="font-semibold text-slate-800">
                        {q.category ? humaniseStatus(q.category) : (q.reference ?? "Quote request")}
                      </p>
                      <p className="text-xs text-slate-400">{timeAgo(q.created_at)}</p>
                    </Td>
                    <Td className="text-slate-600">{q.property_label ?? "—"}</Td>
                    <Td>
                      {q.urgency ? (
                        <SupplierStatusBadge tone={toneForStatus(q.urgency)}>
                          {humaniseStatus(q.urgency)}
                        </SupplierStatusBadge>
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td className="text-slate-600">{q.budget_max ? money(q.budget_max) : "—"}</Td>
                    <Td className="text-slate-600">{shortDate(q.quote_deadline)}</Td>
                    <Td>
                      {q.status ? (
                        <SupplierStatusBadge tone={toneForStatus(q.status)}>
                          {humaniseStatus(q.status)}
                        </SupplierStatusBadge>
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td className="text-right">
                      <button
                        onClick={() => setActive(q)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8]"
                      >
                        <Send className="w-3.5 h-3.5" /> Quote
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SupplierCard>
        </ResponsiveTable>
      )}

      {active && (
        <SubmitQuotePanel
          request={active}
          onClose={() => setActive(null)}
          onSubmitted={() => {
            setActive(null)
            quotes.refresh()
          }}
        />
      )}
    </div>
  )
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400",
        className
      )}
    >
      {children}
    </th>
  )
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 align-top", className)}>{children}</td>
}
