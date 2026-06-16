"use client"

import { useMemo, useState } from "react"
import { FileText, Send, X, Calendar, Banknote } from "lucide-react"
import { cn } from "@/lib/utils"
import { MobileTopBar, ResponsiveTable, type MobileCardMapping } from "@/components/mobile"
import {
  SupplierPageHeader,
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

const FILTERS = [
  { id: "open", label: "Open" },
  { id: "submitted", label: "Submitted" },
  { id: "all", label: "All" },
] as const

type FilterId = (typeof FILTERS)[number]["id"]

export default function SupplierQuotesPage() {
  const quotes = useSupplierApi<SupplierQuoteRequest[]>(
    useSupplierApiUrl("/api/supplier/quotes", { side: "supplier" }),
    {
      select: (j) =>
        (j as { items?: SupplierQuoteRequest[]; quotes?: SupplierQuoteRequest[]; data?: SupplierQuoteRequest[] }).items ??
        (j as { quotes?: SupplierQuoteRequest[] }).quotes ??
        (j as { data?: SupplierQuoteRequest[] }).data ??
        (Array.isArray(j) ? (j as SupplierQuoteRequest[]) : []),
    }
  )

  const [filter, setFilter] = useState<FilterId>("open")
  const [active, setActive] = useState<SupplierQuoteRequest | null>(null)

  const rows = quotes.data ?? []
  const filtered = useMemo(() => {
    if (filter === "all") return rows
    const submitted = ["submitted", "quoted", "accepted", "declined", "closed", "expired"]
    return rows.filter((q) => {
      const s = (q.status ?? "").toLowerCase()
      const isSubmitted = submitted.includes(s)
      return filter === "submitted" ? isSubmitted : !isSubmitted
    })
  }, [rows, filter])

  const mobileMapping: MobileCardMapping<SupplierQuoteRequest> = {
    getKey: (q) => q.id ?? q.reference ?? Math.random().toString(36),
    title: (q) => (q.category ? humaniseStatus(q.category) : q.reference ?? "Quote request"),
    subtitle: (q) => q.property_label ?? "Property",
    badge: (q) => (q.status ? <SupplierStatusBadge tone={toneForStatus(q.status)}>{humaniseStatus(q.status)}</SupplierStatusBadge> : null),
    onRowClick: (q) => setActive(q),
    fields: [
      { label: "Urgency", render: (q) => (q.urgency ? humaniseStatus(q.urgency) : "—") },
      { label: "Budget", render: (q) => (q.budget_max ? money(q.budget_max) : "—") },
      { label: "Deadline", render: (q) => shortDate(q.quote_deadline) },
      { label: "Received", render: (q) => timeAgo(q.created_at) },
    ],
  }

  return (
    <div className="space-y-5">
      <MobileTopBar title="Quotes" subtitle="Quote requests inbox" />

      <SupplierPageHeader
        title="Quotes"
        subtitle="Quote requests from property managers — respond to win the work"
        tabs={
          <div className="flex gap-1 border-b border-slate-200">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "px-3.5 py-2.5 text-sm font-semibold -mb-px border-b-2 transition-colors",
                  filter === f.id ? "border-[#2563EB] text-[#2563EB]" : "border-transparent text-slate-500 hover:text-slate-700"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="md:hidden flex gap-1 border-b border-slate-200">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "px-3.5 py-2.5 text-sm font-semibold -mb-px border-b-2 transition-colors",
              filter === f.id ? "border-[#2563EB] text-[#2563EB]" : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {quotes.loading ? (
        <SupplierCard className="p-5"><SupplierLoadingState rows={5} /></SupplierCard>
      ) : quotes.notReady ? (
        <SupplierCard className="p-5">
          <SupplierNotReady icon={FileText} title="Quotes coming online" description="Quote requests appear here once the supplier quotes service is connected." />
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
                      <p className="font-semibold text-slate-800">{q.category ? humaniseStatus(q.category) : q.reference ?? "Quote request"}</p>
                      <p className="text-xs text-slate-400">{timeAgo(q.created_at)}</p>
                    </Td>
                    <Td className="text-slate-600">{q.property_label ?? "—"}</Td>
                    <Td>{q.urgency ? <SupplierStatusBadge tone={toneForStatus(q.urgency)}>{humaniseStatus(q.urgency)}</SupplierStatusBadge> : "—"}</Td>
                    <Td className="text-slate-600">{q.budget_max ? money(q.budget_max) : "—"}</Td>
                    <Td className="text-slate-600">{shortDate(q.quote_deadline)}</Td>
                    <Td>{q.status ? <SupplierStatusBadge tone={toneForStatus(q.status)}>{humaniseStatus(q.status)}</SupplierStatusBadge> : "—"}</Td>
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

      {active && <SubmitQuotePanel request={active} onClose={() => setActive(null)} onSubmitted={() => { setActive(null); quotes.refresh() }} />}
    </div>
  )
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn("px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400", className)}>{children}</th>
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 align-top", className)}>{children}</td>
}

/* Submit-quote flow — overlay panel (works on desktop + mobile). POSTs to the
   sibling API and tolerates non-200 with an inline message. */
function SubmitQuotePanel({
  request,
  onClose,
  onSubmitted,
}: {
  request: SupplierQuoteRequest
  onClose: () => void
  onSubmitted: () => void
}) {
  const [amount, setAmount] = useState("")
  const [days, setDays] = useState("")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/supplier/quotes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          quote_request_id: request.id,
          amount: amount ? Number(amount) : null,
          estimated_days: days ? Number(days) : null,
          message,
        }),
      })
      if (!res.ok) {
        setError(res.status === 503 || res.status === 404 ? "The quotes service isn't available yet." : "Couldn't submit your quote. Please try again.")
        return
      }
      onSubmitted()
    } catch {
      setError("Network error — please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Submit quote"
        className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-100">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900">Submit a quote</h2>
            <p className="text-sm text-slate-500 truncate">
              {request.category ? humaniseStatus(request.category) : request.reference ?? "Quote request"} · {request.property_label ?? "Property"}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {request.description && (
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Scope</p>
              <p className="text-sm text-slate-700">{request.description}</p>
            </div>
          )}

          <Field label="Quote amount" icon={Banknote}>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">£</span>
              <input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30"
              />
            </div>
          </Field>

          <Field label="Estimated days to complete" icon={Calendar}>
            <input
              type="number"
              inputMode="numeric"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              placeholder="e.g. 2"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30"
            />
          </Field>

          <Field label="Message to the property manager">
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe what's included, materials, access needs…"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30"
            />
          </Field>

          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        </div>

        <div className="p-4 border-t border-slate-100 flex items-center gap-2" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}>
          <button onClick={onClose} className="flex-1 h-11 rounded-xl bg-slate-100 text-slate-600 font-semibold text-sm hover:bg-slate-200 transition-colors">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting || !amount}
            className="flex-1 h-11 rounded-xl bg-[#2563EB] text-white font-semibold text-sm hover:bg-[#1d4ed8] transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
          >
            {submitting ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
            Send quote
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, icon: Icon, children }: { label: string; icon?: typeof Send; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700 mb-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-slate-400" />}
        {label}
      </label>
      {children}
    </div>
  )
}
