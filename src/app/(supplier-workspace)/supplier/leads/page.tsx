"use client"

import React, { useMemo, useState } from "react"
import {
  Inbox, FileText, Mail, Send, List, LayoutGrid, Columns3, ThumbsDown,
  Calendar, Banknote, User, ChevronRight,
} from "lucide-react"
import { MobileTopBar } from "@/components/mobile"
import {
  SupplierPageHeader,
  SupplierCard,
  SupplierEmptyState,
  SupplierLoadingState,
  SupplierStatusBadge,
  SupplierTabs,
  SupplierDrawer,
  SupplierField,
  SupplierButton,
  SupplierBanner,
  supplierInputClass,
  supplierTextareaClass,
  toneForStatus,
  humaniseStatus,
} from "@/components/supplier-workspace/ui"
import { SupplierViewSwitcher, SupplierKanban, type KanbanColumn } from "@/components/supplier-workspace/views"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { useSupplierApiUrl } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import { moneyPence, timeAgo } from "@/components/supplier-workspace/format"
import type { SupplierLead } from "@/components/supplier-workspace/types"

// ─── Status tab configuration ──────────────────────────────────────────────

type StatusTab = "new" | "quoted" | "active" | "completed" | "declined" | "all"

const STATUS_TABS: { key: StatusTab; label: string }[] = [
  { key: "new",       label: "New" },
  { key: "quoted",    label: "Quoted" },
  { key: "active",    label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "declined",  label: "Declined" },
  { key: "all",       label: "All" },
]

function statusTab(l: SupplierLead): StatusTab {
  const s = (l.status ?? "").toLowerCase()
  if (/declin|cancel|reject|closed/.test(s)) return "declined"
  if (/complet|done|finish/.test(s)) return "completed"
  if (/accept|won|approved|active|in_progress|in progress/.test(s)) return "active"
  if (/submit|respond|quoted|sent|priced/.test(s)) return "quoted"
  return "new"
}

// ─── Kanban columns ────────────────────────────────────────────────────────

type LeadView = "list" | "cards" | "board"

const LEAD_COLS: KanbanColumn[] = [
  { key: "new",       label: "New",       accent: "text-blue-600",    dot: "bg-blue-500" },
  { key: "quoted",    label: "Quoted",    accent: "text-violet-600",  dot: "bg-violet-500" },
  { key: "active",    label: "Active",    accent: "text-emerald-600", dot: "bg-emerald-500" },
  { key: "completed", label: "Completed", accent: "text-slate-600",   dot: "bg-slate-400" },
  { key: "declined",  label: "Declined",  accent: "text-red-600",     dot: "bg-red-400" },
]

// ─── Page ─────────────────────────────────────────────────────────────────

export default function SupplierLeadsPage() {
  const leads = useSupplierApi<{ items: SupplierLead[]; openCount: number }>(
    useSupplierApiUrl("/api/supplier/leads"),
    { select: (j) => j as { items: SupplierLead[]; openCount: number } }
  )
  const [statusFilter, setStatusFilter] = useState<StatusTab>("new")
  const [sourceFilter, setSourceFilter] = useState<"all" | "quote_request" | "enquiry">("all")
  const [view, setView] = useState<LeadView>("list")

  // Drawer state
  const [quoting, setQuoting] = useState<SupplierLead | null>(null)
  const [decliningLead, setDecliningLead] = useState<SupplierLead | null>(null)
  const [viewingLead, setViewingLead] = useState<SupplierLead | null>(null)
  const [quoteLines, setQuoteLines] = useState<QuoteLine[]>([{ desc: "", qty: "1", unitPence: "" }])
  const [quoteNote, setQuoteNote] = useState("")
  const [quoteValidUntil, setQuoteValidUntil] = useState("")
  const [declineReason, setDeclineReason] = useState("")
  const [busy, setBusy] = useState(false)
  const [banner, setBanner] = useState<{ tone: "emerald" | "red"; msg: string } | null>(null)

  const items = leads.data?.items ?? []

  // Tab counts
  const tabCounts: Record<StatusTab, number> = useMemo(() => {
    const counts: Record<StatusTab, number> = { new: 0, quoted: 0, active: 0, completed: 0, declined: 0, all: 0 }
    for (const l of items) {
      const t = statusTab(l)
      counts[t]++
      counts.all++
    }
    return counts
  }, [items])

  const filtered = useMemo(() => {
    let list = statusFilter === "all" ? items : items.filter((l) => statusTab(l) === statusFilter)
    if (sourceFilter !== "all") list = list.filter((l) => l.source === sourceFilter)
    return list
  }, [items, statusFilter, sourceFilter])

  // Quote total
  const quoteTotal = useMemo(() => {
    return quoteLines.reduce((acc, line) => {
      const qty = Number(line.qty) || 0
      const unit = Math.round((Number(line.unitPence) || 0) * 100)
      return acc + qty * unit
    }, 0)
  }, [quoteLines])

  async function submitQuote() {
    if (!quoting?.quoteId) return
    const validLines = quoteLines.filter((l) => l.desc.trim() && Number(l.unitPence) > 0)
    if (validLines.length === 0) { setBanner({ tone: "red", msg: "Add at least one line item." }); return }
    setBusy(true)
    try {
      const res = await fetch(`/api/supplier/quotes/${quoting.quoteId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "submit",
          amountPence: quoteTotal,
          description: quoteNote || undefined,
          validUntil: quoteValidUntil || undefined,
          lineItems: validLines.map((l) => ({
            description: l.desc,
            quantity: Number(l.qty) || 1,
            unit_price_pence: Math.round(Number(l.unitPence) * 100),
          })),
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setBanner({ tone: "red", msg: (body as { error?: string }).error ?? (res.status === 409 ? "This request can no longer be quoted." : "Couldn't submit the quote.") })
        return
      }
      setQuoting(null)
      resetQuoteForm()
      setBanner({ tone: "emerald", msg: "Quote submitted to the property manager." })
      leads.refresh()
    } catch {
      setBanner({ tone: "red", msg: "Network error — please try again." })
    } finally { setBusy(false) }
  }

  async function submitDecline() {
    if (!decliningLead?.quoteId) return
    setBusy(true)
    try {
      const res = await fetch(`/api/supplier/quotes/${decliningLead.quoteId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "decline", reason: declineReason || undefined }),
      })
      if (!res.ok) { setBanner({ tone: "red", msg: "Couldn't decline this lead." }); return }
      setDecliningLead(null); setDeclineReason("")
      setBanner({ tone: "emerald", msg: "Lead declined." })
      leads.refresh()
    } catch {
      setBanner({ tone: "red", msg: "Network error — please try again." })
    } finally { setBusy(false) }
  }

  function resetQuoteForm() {
    setQuoteLines([{ desc: "", qty: "1", unitPence: "" }])
    setQuoteNote("")
    setQuoteValidUntil("")
  }

  function addLine() {
    setQuoteLines((l) => [...l, { desc: "", qty: "1", unitPence: "" }])
  }
  function removeLine(i: number) {
    setQuoteLines((l) => l.filter((_, idx) => idx !== i))
  }
  function updateLine(i: number, key: keyof QuoteLine, val: string) {
    setQuoteLines((l) => l.map((ln, idx) => idx === i ? { ...ln, [key]: val } : ln))
  }

  return (
    <div className="space-y-5">
      <MobileTopBar title="Leads & requests" subtitle="Inbound opportunities" />

      <SupplierPageHeader
        title="Leads & requests"
        subtitle="Quote requests from property managers and enquiries on your marketplace listings."
        actions={
          <SupplierViewSwitcher<LeadView>
            value={view}
            onChange={setView}
            options={[
              { key: "list",  label: "List",  icon: List },
              { key: "cards", label: "Cards", icon: LayoutGrid },
              { key: "board", label: "Board", icon: Columns3 },
            ]}
          />
        }
        tabs={
          <div className="space-y-2">
            {/* Status tabs */}
            <SupplierTabs
              active={statusFilter}
              onChange={(k) => setStatusFilter(k as StatusTab)}
              tabs={STATUS_TABS.map((t) => ({ key: t.key, label: t.label, count: tabCounts[t.key] }))}
            />
            {/* Source filter chips */}
            <div className="flex items-center gap-1.5">
              {(["all", "quote_request", "enquiry"] as const).map((src) => (
                <button
                  key={src}
                  onClick={() => setSourceFilter(src)}
                  className={`px-3 h-7 rounded-lg text-[12px] font-semibold transition-colors ${sourceFilter === src ? "bg-[#2563EB] text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                >
                  {src === "all" ? "All types" : src === "quote_request" ? "Quote requests" : "Enquiries"}
                </button>
              ))}
            </div>
          </div>
        }
      />

      {banner && <SupplierBanner tone={banner.tone} onDismiss={() => setBanner(null)}>{banner.msg}</SupplierBanner>}

      {leads.loading ? (
        <SupplierCard className="p-5"><SupplierLoadingState rows={5} /></SupplierCard>
      ) : filtered.length === 0 ? (
        <SupplierCard className="p-2 sm:p-3">
          <SupplierEmptyState
            icon={Inbox}
            title={statusFilter === "new" ? "No new leads" : `No ${statusFilter} leads`}
            description={
              statusFilter === "new"
                ? "When a property manager invites you to quote, or a buyer enquires on one of your listings, it lands here. Keep your services, coverage and profile current to receive more."
                : `No leads in this status. ${statusFilter === "quoted" ? "Leads you've sent a quote for appear here." : ""}`
            }
          />
        </SupplierCard>
      ) : view === "board" ? (
        <SupplierKanban<SupplierLead>
          columns={LEAD_COLS}
          items={filtered}
          getColumn={(l) => statusTab(l)}
          getKey={(l) => l.id}
          renderCard={(lead) => <LeadKanbanCard lead={lead} onQuote={(l) => { setQuoting(l); setBanner(null) }} onDecline={(l) => { setDecliningLead(l); setBanner(null) }} onView={(l) => setViewingLead(l)} />}
        />
      ) : view === "cards" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onQuote={(l) => { setQuoting(l); setBanner(null) }} onDecline={(l) => { setDecliningLead(l); setBanner(null) }} onView={(l) => setViewingLead(l)} />
          ))}
        </div>
      ) : (
        <SupplierCard className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60 text-left">
                <Th>Lead</Th>
                <Th>Type</Th>
                <Th>Budget</Th>
                <Th>Received</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((lead) => {
                const isRequest = lead.source === "quote_request"
                const canQuote = isRequest && (lead.status ?? "").toLowerCase() === "requested"
                const tab = statusTab(lead)
                return (
                  <tr key={lead.id} className="hover:bg-slate-50/60 transition-colors">
                    <Td>
                      <p className="font-semibold text-slate-800 truncate max-w-[220px]">{lead.title}</p>
                      {lead.counterpartyName && <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><User className="w-3 h-3" />{lead.counterpartyName}</p>}
                    </Td>
                    <Td>
                      <SupplierStatusBadge tone={isRequest ? "violet" : "blue"}>
                        {isRequest ? "Quote req." : "Enquiry"}
                      </SupplierStatusBadge>
                    </Td>
                    <Td className="text-slate-600">
                      {lead.amountPence != null ? moneyPence(lead.amountPence, lead.currency ?? "GBP") : "—"}
                    </Td>
                    <Td className="text-slate-500 text-xs">{timeAgo(lead.createdAt)}</Td>
                    <Td>
                      <SupplierStatusBadge tone={tab === "new" ? "blue" : tab === "quoted" ? "violet" : tab === "active" ? "emerald" : tab === "declined" ? "red" : "slate"}>
                        {humaniseStatus(lead.status)}
                      </SupplierStatusBadge>
                    </Td>
                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingLead(lead)}
                          className="text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8] flex items-center gap-0.5"
                        >
                          Brief <ChevronRight className="w-3 h-3" />
                        </button>
                        {canQuote && (
                          <>
                            <button
                              onClick={() => { setQuoting(lead); setBanner(null) }}
                              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg bg-[#2563EB] text-white text-[11px] font-semibold hover:bg-[#1d4ed8]"
                            >
                              <Send className="w-3 h-3" /> Quote
                            </button>
                            <button
                              onClick={() => { setDecliningLead(lead); setBanner(null) }}
                              className="inline-flex items-center gap-1 h-7 px-2 rounded-lg border border-slate-200 text-slate-500 text-[11px] hover:bg-slate-50"
                              title="Decline"
                            >
                              <ThumbsDown className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </SupplierCard>
      )}

      {/* Full brief drawer */}
      <SupplierDrawer
        open={!!viewingLead}
        onClose={() => setViewingLead(null)}
        title="Lead brief"
        footer={
          <div className="flex items-center gap-2">
            <SupplierButton variant="secondary" onClick={() => setViewingLead(null)}>Close</SupplierButton>
            {viewingLead?.quoteId && (viewingLead.status ?? "").toLowerCase() === "requested" && (
              <SupplierButton onClick={() => { const l = viewingLead; setViewingLead(null); setQuoting(l); setBanner(null) }}>
                <Send className="w-3.5 h-3.5" /> Send quote
              </SupplierButton>
            )}
          </div>
        }
      >
        {viewingLead && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">{viewingLead.title}</h3>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <SupplierStatusBadge tone={viewingLead.source === "quote_request" ? "violet" : "blue"}>
                  {viewingLead.source === "quote_request" ? "Quote request" : "Marketplace enquiry"}
                </SupplierStatusBadge>
                <SupplierStatusBadge tone={toneForStatus(viewingLead.status)}>{humaniseStatus(viewingLead.status)}</SupplierStatusBadge>
              </div>
            </div>
            {viewingLead.detail && (
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Job description</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{viewingLead.detail}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {viewingLead.amountPence != null && (
                <InfoChip icon={Banknote} label="Budget" value={moneyPence(viewingLead.amountPence, viewingLead.currency ?? "GBP")} />
              )}
              <InfoChip icon={Calendar} label="Received" value={timeAgo(viewingLead.createdAt)} />
              {viewingLead.counterpartyName && (
                <InfoChip icon={User} label="From" value={viewingLead.counterpartyName} />
              )}
            </div>
          </div>
        )}
      </SupplierDrawer>

      {/* Quote builder drawer */}
      <SupplierDrawer
        open={!!quoting}
        onClose={() => { setQuoting(null); resetQuoteForm() }}
        title="Build a quote"
        footer={
          <>
            <SupplierButton variant="secondary" onClick={() => { setQuoting(null); resetQuoteForm() }}>Cancel</SupplierButton>
            <SupplierButton onClick={submitQuote} loading={busy}>Submit quote · {moneyPence(quoteTotal)}</SupplierButton>
          </>
        }
      >
        {quoting && (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
              <p className="text-sm font-semibold text-slate-800">{quoting.title}</p>
              {quoting.amountPence != null && (
                <p className="text-xs text-slate-500 mt-0.5">Buyer budget: {moneyPence(quoting.amountPence, quoting.currency ?? "GBP")}</p>
              )}
            </div>

            <div>
              <p className="text-[12px] font-bold uppercase tracking-widest text-slate-400 mb-2">Line items</p>
              <div className="space-y-2">
                {quoteLines.map((line, i) => (
                  <div key={i} className="grid grid-cols-[1fr_60px_90px_24px] gap-1.5 items-start">
                    <input
                      className={supplierInputClass}
                      placeholder="Service description"
                      value={line.desc}
                      onChange={(e) => updateLine(i, "desc", e.target.value)}
                    />
                    <input
                      className={supplierInputClass}
                      inputMode="numeric"
                      placeholder="Qty"
                      value={line.qty}
                      onChange={(e) => updateLine(i, "qty", e.target.value)}
                    />
                    <input
                      className={supplierInputClass}
                      inputMode="decimal"
                      placeholder="£/unit"
                      value={line.unitPence}
                      onChange={(e) => updateLine(i, "unitPence", e.target.value)}
                    />
                    <button
                      onClick={() => removeLine(i)}
                      disabled={quoteLines.length === 1}
                      className="text-slate-300 hover:text-red-400 disabled:opacity-20 mt-2"
                      title="Remove line"
                    >×</button>
                  </div>
                ))}
              </div>
              <button onClick={addLine} className="mt-2 text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8]">+ Add line</button>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="text-sm font-semibold text-slate-700">Total</span>
              <span className="text-lg font-bold text-slate-900">{moneyPence(quoteTotal)}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <SupplierField label="Valid until">
                <input type="date" className={supplierInputClass} value={quoteValidUntil} onChange={(e) => setQuoteValidUntil(e.target.value)} />
              </SupplierField>
            </div>

            <SupplierField label="Notes (optional)" hint="Scope, assumptions, lead time, exclusions.">
              <textarea className={supplierTextareaClass} value={quoteNote} onChange={(e) => setQuoteNote(e.target.value)} placeholder="e.g. Price based on single visit; materials included; 2–3 day lead time." />
            </SupplierField>
          </div>
        )}
      </SupplierDrawer>

      {/* Decline drawer */}
      <SupplierDrawer
        open={!!decliningLead}
        onClose={() => { setDecliningLead(null); setDeclineReason("") }}
        title="Decline lead"
        footer={
          <>
            <SupplierButton variant="secondary" onClick={() => { setDecliningLead(null); setDeclineReason("") }}>Cancel</SupplierButton>
            <SupplierButton onClick={submitDecline} loading={busy}>Confirm decline</SupplierButton>
          </>
        }
      >
        {decliningLead && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">{decliningLead.title}</p>
            <SupplierField label="Reason (optional)" hint="Helps property managers understand your capacity.">
              <textarea
                className={supplierTextareaClass}
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="e.g. Outside my coverage area, unavailable for the requested date, fully booked…"
              />
            </SupplierField>
          </div>
        )}
      </SupplierDrawer>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────

interface QuoteLine { desc: string; qty: string; unitPence: string }

interface LeadActionProps {
  lead: SupplierLead
  onQuote: (l: SupplierLead) => void
  onDecline: (l: SupplierLead) => void
  onView: (l: SupplierLead) => void
}

function LeadCard({ lead, onQuote, onDecline, onView }: LeadActionProps) {
  const isRequest = lead.source === "quote_request"
  const canQuote = isRequest && (lead.status ?? "").toLowerCase() === "requested"
  const tab = statusTab(lead)

  return (
    <SupplierCard className="p-4 flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isRequest ? "bg-violet-50" : "bg-blue-50"}`}>
          {isRequest ? <FileText className="w-4 h-4 text-violet-600" /> : <Mail className="w-4 h-4 text-blue-600" />}
        </div>
        <SupplierStatusBadge
          tone={tab === "new" ? "blue" : tab === "quoted" ? "violet" : tab === "active" ? "emerald" : tab === "declined" ? "red" : "slate"}
        >
          {humaniseStatus(lead.status)}
        </SupplierStatusBadge>
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-900 line-clamp-2">{lead.title}</p>
      {lead.detail && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{lead.detail}</p>}
      <div className="mt-2 space-y-1">
        {lead.amountPence != null && (
          <p className="text-xs text-slate-600 flex items-center gap-1"><Banknote className="w-3 h-3 text-slate-400" /> Budget: {moneyPence(lead.amountPence, lead.currency ?? "GBP")}</p>
        )}
        {lead.counterpartyName && (
          <p className="text-xs text-slate-500 flex items-center gap-1"><User className="w-3 h-3 text-slate-400" />{lead.counterpartyName}</p>
        )}
        <p className="text-[11px] text-slate-400">{timeAgo(lead.createdAt)}</p>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
        <button onClick={() => onView(lead)} className="text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8] flex items-center gap-0.5">
          Full brief <ChevronRight className="w-3 h-3" />
        </button>
        {canQuote && (
          <>
            <SupplierButton size="sm" onClick={() => onQuote(lead)}><Send className="w-3.5 h-3.5" /> Quote</SupplierButton>
            <SupplierButton size="sm" variant="ghost" onClick={() => onDecline(lead)}><ThumbsDown className="w-3.5 h-3.5" /> Decline</SupplierButton>
          </>
        )}
      </div>
    </SupplierCard>
  )
}

function LeadKanbanCard({ lead, onQuote, onDecline, onView }: LeadActionProps) {
  const isRequest = lead.source === "quote_request"
  const canQuote = isRequest && (lead.status ?? "").toLowerCase() === "requested"
  return (
    <div>
      <p className="text-sm font-semibold text-slate-900 line-clamp-2">{lead.title}</p>
      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
        <SupplierStatusBadge tone={isRequest ? "violet" : "blue"}>{isRequest ? "Quote req." : "Enquiry"}</SupplierStatusBadge>
        {lead.amountPence != null && <span className="text-[11px] font-semibold text-slate-700">{moneyPence(lead.amountPence, lead.currency ?? "GBP")}</span>}
      </div>
      <p className="text-[11px] text-slate-400 mt-1.5">{timeAgo(lead.createdAt)}</p>
      <div className="mt-2 flex items-center gap-1.5">
        <button onClick={() => onView(lead)} className="text-[11px] font-semibold text-[#2563EB]">Brief</button>
        {canQuote && (
          <>
            <SupplierButton size="sm" className="h-6 px-2 text-[11px]" onClick={() => onQuote(lead)}>
              <Send className="w-3 h-3" /> Quote
            </SupplierButton>
            <button onClick={() => onDecline(lead)} className="text-[11px] text-slate-400 hover:text-red-500" title="Decline">
              <ThumbsDown className="w-3 h-3" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function InfoChip({ icon: Icon, label, value }: { icon: typeof Banknote; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon className="w-3.5 h-3.5 text-slate-400" />
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-sm font-semibold text-slate-800">{value}</p>
    </div>
  )
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400 ${className ?? ""}`}>{children}</th>
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-top ${className ?? ""}`}>{children}</td>
}
