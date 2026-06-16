"use client"

import { useState } from "react"
import { ReceiptText, Plus, Send, Ban } from "lucide-react"
import { cn } from "@/lib/utils"
import { MobileTopBar, ResponsiveTable, type MobileCardMapping } from "@/components/mobile"
import {
  SupplierPageHeader, SupplierCard, SupplierLoadingState, SupplierEmptyState,
  SupplierStatusBadge, SupplierButton, SupplierDrawer, SupplierField, SupplierBanner,
  SupplierKpiStrip, supplierInputClass, supplierTextareaClass,
  toneForStatus, humaniseStatus, type SupplierKpi,
} from "@/components/supplier-workspace/ui"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { useSupplierApiUrl, useSupplierWorkspace } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import { moneyPence, shortDate } from "@/components/supplier-workspace/format"
import type { SupplierInvoiceRow, SupplierInvoiceSummary } from "@/components/supplier-workspace/types"

export default function SupplierInvoicesPage() {
  const { workspaceId } = useSupplierWorkspace()
  const inv = useSupplierApi<{ items: SupplierInvoiceRow[]; summary: SupplierInvoiceSummary }>(
    useSupplierApiUrl("/api/supplier/invoices"),
    { select: (j) => j as { items: SupplierInvoiceRow[]; summary: SupplierInvoiceSummary } }
  )
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ invoice_number: "", amount: "", notes: "" })
  const [busy, setBusy] = useState(false)
  const [banner, setBanner] = useState<{ tone: "emerald" | "red"; msg: string } | null>(null)

  const items = inv.data?.items ?? []
  const s = inv.data?.summary
  const ccy = s?.currency ?? "GBP"

  const kpis: SupplierKpi[] = [
    { icon: ReceiptText, iconBg: "bg-blue-50", iconColor: "text-blue-600", value: s ? moneyPence(s.totalPence, ccy) : "—", label: "Total billed" },
    { icon: Send, iconBg: "bg-amber-50", iconColor: "text-amber-600", value: s ? moneyPence(s.outstandingPence, ccy) : "—", label: "Outstanding" },
    { icon: ReceiptText, iconBg: "bg-emerald-50", iconColor: "text-emerald-600", value: s ? moneyPence(s.paidPence, ccy) : "—", label: "Paid" },
    { icon: ReceiptText, iconBg: "bg-slate-100", iconColor: "text-slate-500", value: s ? moneyPence(s.draftPence, ccy) : "—", label: "Draft" },
  ]

  async function create() {
    if (!workspaceId) return
    const amt = Number(form.amount)
    if (!Number.isFinite(amt) || amt <= 0) { setBanner({ tone: "red", msg: "Enter a valid amount." }); return }
    setBusy(true)
    try {
      const res = await fetch("/api/supplier/invoices", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ workspaceId, amount_pence: Math.round(amt * 100), invoice_number: form.invoice_number || undefined, notes: form.notes || undefined }),
      })
      if (!res.ok) { setBanner({ tone: "red", msg: "Couldn't create the invoice." }); return }
      setOpen(false); setForm({ invoice_number: "", amount: "", notes: "" }); inv.refresh()
      setBanner({ tone: "emerald", msg: "Draft invoice created." })
    } catch { setBanner({ tone: "red", msg: "Network error." }) }
    finally { setBusy(false) }
  }

  async function act(invoiceId: string, action: "submit" | "void") {
    if (!workspaceId) return
    const res = await fetch("/api/supplier/invoices", {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify({ workspaceId, invoiceId, action }),
    })
    if (res.ok) inv.refresh()
  }

  const mobileMapping: MobileCardMapping<SupplierInvoiceRow> = {
    getKey: (i) => i.id,
    title: (i) => i.invoice_number ?? `INV ${i.id.slice(0, 8)}`,
    subtitle: (i) => shortDate(i.created_at),
    badge: (i) => <SupplierStatusBadge tone={toneForStatus(i.status)}>{humaniseStatus(i.status)}</SupplierStatusBadge>,
    fields: [
      { label: "Amount", render: (i) => (i.amount_pence != null ? moneyPence(i.amount_pence, i.currency) : "—") },
      { label: "Submitted", render: (i) => shortDate(i.submitted_at) },
      { label: "Paid", render: (i) => shortDate(i.paid_at) },
    ],
  }

  return (
    <div className="space-y-5">
      <MobileTopBar title="Invoices" subtitle="Billing" />
      <SupplierPageHeader
        title="Invoices"
        subtitle="Raise and track invoices for completed work. Submitted invoices go to the property manager for approval."
        actions={<SupplierButton onClick={() => { setOpen(true); setBanner(null) }}><Plus className="w-4 h-4" /> New invoice</SupplierButton>}
      />

      {banner && <SupplierBanner tone={banner.tone} onDismiss={() => setBanner(null)}>{banner.msg}</SupplierBanner>}

      <SupplierKpiStrip kpis={kpis} />

      {inv.loading ? (
        <SupplierCard className="p-5"><SupplierLoadingState rows={4} /></SupplierCard>
      ) : items.length === 0 ? (
        <SupplierCard className="p-5">
          <SupplierEmptyState
            icon={ReceiptText}
            title="No invoices yet"
            description="Create a draft invoice for a completed job, then submit it for the property manager to approve and pay."
            action={<SupplierButton onClick={() => setOpen(true)}><Plus className="w-4 h-4" /> Create invoice</SupplierButton>}
          />
        </SupplierCard>
      ) : (
        <ResponsiveTable rows={items} mobile={mobileMapping}>
          <SupplierCard className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-left">
                  <Th>Invoice</Th><Th>Amount</Th><Th>Submitted</Th><Th>Paid</Th><Th>Status</Th><Th className="text-right"></Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50/60 transition-colors">
                    <Td><p className="font-semibold text-slate-800">{i.invoice_number ?? `INV ${i.id.slice(0, 8)}`}</p><p className="text-xs text-slate-400">Created {shortDate(i.created_at)}</p></Td>
                    <Td className="font-semibold text-slate-800">{i.amount_pence != null ? moneyPence(i.amount_pence, i.currency) : "—"}</Td>
                    <Td className="text-slate-600">{shortDate(i.submitted_at)}</Td>
                    <Td className="text-slate-600">{shortDate(i.paid_at)}</Td>
                    <Td><SupplierStatusBadge tone={toneForStatus(i.status)}>{humaniseStatus(i.status)}</SupplierStatusBadge></Td>
                    <Td className="text-right whitespace-nowrap">
                      {i.status === "draft" && (
                        <span className="inline-flex gap-1">
                          <button onClick={() => act(i.id, "submit")} className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8]"><Send className="w-3.5 h-3.5" /> Submit</button>
                          <button onClick={() => act(i.id, "void")} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-red-600 ml-2"><Ban className="w-3.5 h-3.5" /> Void</button>
                        </span>
                      )}
                      {i.status !== "draft" && i.status !== "paid" && (
                        <button onClick={() => act(i.id, "void")} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-red-600"><Ban className="w-3.5 h-3.5" /> Void</button>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SupplierCard>
        </ResponsiveTable>
      )}

      <SupplierDrawer
        open={open} onClose={() => setOpen(false)} title="New invoice"
        footer={<>
          <SupplierButton variant="secondary" onClick={() => setOpen(false)}>Cancel</SupplierButton>
          <SupplierButton onClick={create} loading={busy}>Create draft</SupplierButton>
        </>}
      >
        <SupplierField label="Invoice number" hint="Your own reference. Optional.">
          <input className={supplierInputClass} value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} placeholder="INV-0001" />
        </SupplierField>
        <SupplierField label="Amount (GBP)" required>
          <input className={supplierInputClass} inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
        </SupplierField>
        <SupplierField label="Notes">
          <textarea className={supplierTextareaClass} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </SupplierField>
      </SupplierDrawer>
    </div>
  )
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn("px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400", className)}>{children}</th>
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 align-top", className)}>{children}</td>
}
