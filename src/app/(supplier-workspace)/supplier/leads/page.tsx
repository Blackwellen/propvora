"use client"

import { useMemo, useState } from "react"
import { Inbox, FileText, Mail, Send, List, LayoutGrid, Columns3 } from "lucide-react"
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

type LeadView = "list" | "cards" | "board"

const LEAD_COLS: KanbanColumn[] = [
  { key: "open", label: "New / open", accent: "text-blue-600", dot: "bg-blue-500" },
  { key: "responded", label: "Responded", accent: "text-violet-600", dot: "bg-violet-500" },
  { key: "won", label: "Accepted", accent: "text-emerald-600", dot: "bg-emerald-500" },
  { key: "closed", label: "Closed", accent: "text-slate-600", dot: "bg-slate-400" },
]

function leadColumn(l: SupplierLead): string {
  const s = (l.status ?? "").toLowerCase()
  if (/accept|won|approved/.test(s)) return "won"
  if (/declin|cancel|expired|closed|reject/.test(s)) return "closed"
  if (/submit|respond|quoted|sent/.test(s)) return "responded"
  return "open"
}

export default function SupplierLeadsPage() {
  const leads = useSupplierApi<{ items: SupplierLead[]; openCount: number }>(
    useSupplierApiUrl("/api/supplier/leads"),
    { select: (j) => j as { items: SupplierLead[]; openCount: number } }
  )
  const [tab, setTab] = useState<"all" | "quote_request" | "enquiry">("all")
  const [view, setView] = useState<LeadView>("list")
  const [quoting, setQuoting] = useState<SupplierLead | null>(null)
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const [banner, setBanner] = useState<{ tone: "emerald" | "red"; msg: string } | null>(null)

  const items = leads.data?.items ?? []
  const filtered = useMemo(
    () => (tab === "all" ? items : items.filter((l) => l.source === tab)),
    [items, tab]
  )

  const counts = {
    all: items.length,
    quote_request: items.filter((l) => l.source === "quote_request").length,
    enquiry: items.filter((l) => l.source === "enquiry").length,
  }

  async function submitQuote() {
    if (!quoting?.quoteId) return
    const pounds = Number(amount)
    if (!Number.isFinite(pounds) || pounds <= 0) {
      setBanner({ tone: "red", msg: "Enter a valid amount." })
      return
    }
    setBusy(true)
    try {
      const res = await fetch(`/api/supplier/quotes/${quoting.quoteId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "submit", amountPence: Math.round(pounds * 100), description: note || undefined }),
      })
      if (!res.ok) {
        setBanner({ tone: "red", msg: res.status === 409 ? "This request can no longer be quoted." : "Couldn't submit the quote." })
        return
      }
      setQuoting(null)
      setAmount("")
      setNote("")
      setBanner({ tone: "emerald", msg: "Quote submitted to the property manager." })
      leads.refresh()
    } catch {
      setBanner({ tone: "red", msg: "Network error — please try again." })
    } finally {
      setBusy(false)
    }
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
              { key: "list", label: "List", icon: List },
              { key: "cards", label: "Cards", icon: LayoutGrid },
              { key: "board", label: "Board", icon: Columns3 },
            ]}
          />
        }
        tabs={
          <SupplierTabs
            active={tab}
            onChange={(k) => setTab(k as typeof tab)}
            tabs={[
              { key: "all", label: "All", count: counts.all },
              { key: "quote_request", label: "Quote requests", icon: FileText, count: counts.quote_request },
              { key: "enquiry", label: "Enquiries", icon: Mail, count: counts.enquiry },
            ]}
          />
        }
      />

      {banner && <SupplierBanner tone={banner.tone} onDismiss={() => setBanner(null)}>{banner.msg}</SupplierBanner>}

      {leads.loading ? (
        <SupplierCard className="p-5"><SupplierLoadingState rows={5} /></SupplierCard>
      ) : filtered.length === 0 ? (
        <SupplierCard className="p-2 sm:p-3">
          <SupplierEmptyState
            icon={Inbox}
            title="No leads yet"
            description="When a property manager invites you to quote, or a buyer enquires on one of your listings, it lands here. Keep your services, coverage and profile current to receive more."
          />
        </SupplierCard>
      ) : view === "board" ? (
        <SupplierKanban<SupplierLead>
          columns={LEAD_COLS}
          items={filtered}
          getColumn={leadColumn}
          getKey={(l) => l.id}
          renderCard={(lead) => {
            const isRequest = lead.source === "quote_request"
            const canQuote = isRequest && (lead.status ?? "").toLowerCase() === "requested"
            return (
              <div>
                <p className="text-sm font-semibold text-slate-900 line-clamp-2">{lead.title}</p>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <SupplierStatusBadge tone={isRequest ? "violet" : "blue"}>{isRequest ? "Quote request" : "Enquiry"}</SupplierStatusBadge>
                  {lead.amountPence != null && <span className="text-[11px] font-semibold text-slate-700">{moneyPence(lead.amountPence, lead.currency ?? "GBP")}</span>}
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">{timeAgo(lead.createdAt)}</p>
                {canQuote && (
                  <SupplierButton size="sm" className="mt-2 w-full" onClick={() => { setQuoting(lead); setBanner(null) }}>
                    <Send className="w-3.5 h-3.5" /> Quote
                  </SupplierButton>
                )}
              </div>
            )
          }}
        />
      ) : view === "cards" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((lead) => {
            const isRequest = lead.source === "quote_request"
            const canQuote = isRequest && (lead.status ?? "").toLowerCase() === "requested"
            return (
              <SupplierCard key={lead.id} className="p-4 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isRequest ? "bg-violet-50" : "bg-blue-50"}`}>
                    {isRequest ? <FileText className="w-4 h-4 text-violet-600" /> : <Mail className="w-4 h-4 text-blue-600" />}
                  </div>
                  <SupplierStatusBadge tone={toneForStatus(lead.status)}>{humaniseStatus(lead.status)}</SupplierStatusBadge>
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900 line-clamp-2">{lead.title}</p>
                {lead.detail && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{lead.detail}</p>}
                <p className="text-[11px] text-slate-400 mt-2">
                  {lead.counterpartyName ? `${lead.counterpartyName} · ` : ""}{timeAgo(lead.createdAt)}
                  {lead.amountPence != null ? ` · ${moneyPence(lead.amountPence, lead.currency ?? "GBP")}` : ""}
                </p>
                {canQuote && (
                  <SupplierButton size="sm" className="mt-3 self-start" onClick={() => { setQuoting(lead); setBanner(null) }}>
                    <Send className="w-3.5 h-3.5" /> Quote
                  </SupplierButton>
                )}
              </SupplierCard>
            )
          })}
        </div>
      ) : (
        <SupplierCard className="p-2 sm:p-3">
          <ul className="divide-y divide-slate-100">
            {filtered.map((lead) => {
              const isRequest = lead.source === "quote_request"
              const canQuote = isRequest && (lead.status ?? "").toLowerCase() === "requested"
              return (
                <li key={lead.id} className="p-3 flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isRequest ? "bg-violet-50" : "bg-blue-50"}`}>
                    {isRequest ? <FileText className="w-4 h-4 text-violet-600" /> : <Mail className="w-4 h-4 text-blue-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-900 truncate">{lead.title}</p>
                      <SupplierStatusBadge tone={toneForStatus(lead.status)}>{humaniseStatus(lead.status)}</SupplierStatusBadge>
                      <SupplierStatusBadge tone={isRequest ? "violet" : "blue"}>
                        {isRequest ? "Quote request" : "Enquiry"}
                      </SupplierStatusBadge>
                    </div>
                    {lead.detail && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{lead.detail}</p>}
                    <p className="text-[11px] text-slate-400 mt-1">
                      {lead.counterpartyName ? `${lead.counterpartyName} · ` : ""}
                      {timeAgo(lead.createdAt)}
                      {lead.amountPence != null ? ` · ${moneyPence(lead.amountPence, lead.currency ?? "GBP")}` : ""}
                    </p>
                  </div>
                  {canQuote && (
                    <SupplierButton size="sm" onClick={() => { setQuoting(lead); setBanner(null) }}>
                      <Send className="w-3.5 h-3.5" /> Quote
                    </SupplierButton>
                  )}
                </li>
              )
            })}
          </ul>
        </SupplierCard>
      )}

      <SupplierDrawer
        open={!!quoting}
        onClose={() => setQuoting(null)}
        title="Respond with a quote"
        footer={
          <>
            <SupplierButton variant="secondary" onClick={() => setQuoting(null)}>Cancel</SupplierButton>
            <SupplierButton onClick={submitQuote} loading={busy}>Submit quote</SupplierButton>
          </>
        }
      >
        <p className="text-sm text-slate-500">
          {quoting?.title}. Your price is sent to the property manager, who may accept it — accepting spawns a job for you.
        </p>
        <SupplierField label="Your price (GBP)" required hint="Inclusive of materials and labour as you see fit.">
          <input
            className={supplierInputClass}
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </SupplierField>
        <SupplierField label="Note (optional)" hint="Scope, assumptions, lead time, etc.">
          <textarea className={supplierTextareaClass} value={note} onChange={(e) => setNote(e.target.value)} />
        </SupplierField>
      </SupplierDrawer>
    </div>
  )
}
