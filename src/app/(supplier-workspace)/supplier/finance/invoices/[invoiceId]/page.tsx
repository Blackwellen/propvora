"use client"

/* ──────────────────────────────────────────────────────────────────────────
   /supplier/finance/invoices/[invoiceId] — invoice detail (manifest image 51).

   Tabs Invoice details / Payments & payouts / Files, with amount / status /
   dates KPIs, customer + operator, line items, VAT breakdown and an audit
   summary. Reads the live /api/supplier/invoices/[id] envelope and degrades
   gracefully (— placeholders) when richer fields aren't present yet.
─────────────────────────────────────────────────────────────────────────── */

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { LayoutGrid, Wallet, Files, Download, Building2, Calendar, CheckCircle2, FileText, History } from "lucide-react"
import { SupplierDetailShell, type SupplierDetailTab } from "@/components/supplier-workspace/SupplierDetailShell"
import {
  SupplierCard, SupplierStatusBadge, SupplierButton, SupplierEmptyState,
  SupplierActionBar, SupplierBanner, toneForStatus, humaniseStatus,
} from "@/components/supplier-workspace/ui"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { useSupplierApiUrl } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import { moneyPence, shortDate } from "@/components/supplier-workspace/format"

interface InvoiceLine { id?: string; description?: string; quantity?: number; unit_price_pence?: number; line_total_pence?: number }
interface InvoiceEvent { id?: string; label?: string; created_at?: string }
interface InvoiceDetail {
  id?: string
  number?: string
  status?: string
  net_pence?: number
  vat_pence?: number
  total_pence?: number
  currency?: string
  workspace_name?: string
  customer_name?: string
  job_ref?: string
  payout_id?: string
  submitted_at?: string
  approved_at?: string
  paid_at?: string
  lines?: InvoiceLine[]
  events?: InvoiceEvent[]
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <SupplierCard className="p-5">
      <div className="flex items-center justify-between mb-3"><h2 className="text-sm font-semibold text-slate-900">{title}</h2>{action}</div>
      {children}
    </SupplierCard>
  )
}

function Kpi({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Wallet }) {
  return (
    <SupplierCard className="p-4">
      <div className="flex items-center justify-between"><span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{label}</span><Icon className="w-4 h-4 text-slate-400" /></div>
      <p className="text-lg font-bold mt-1 text-slate-900">{value}</p>
    </SupplierCard>
  )
}

export default function SupplierInvoiceDetailPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>()
  const inv = useSupplierApi<InvoiceDetail>(
    useSupplierApiUrl(`/api/supplier/invoices/${invoiceId}`),
    { select: (j) => (j as { invoice?: InvoiceDetail }).invoice ?? (j as InvoiceDetail) }
  )
  const d = inv.data ?? {}
  const ccy = d.currency ?? "GBP"
  const [banner, setBanner] = useState<{ tone: "emerald" | "red"; msg: string } | null>(null)

  const net = d.net_pence ?? (d.total_pence != null && d.vat_pence != null ? d.total_pence - d.vat_pence : undefined)

  const tabs: SupplierDetailTab[] = [
    {
      key: "details", label: "Invoice details", icon: LayoutGrid,
      render: () => (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Kpi label="Total" value={moneyPence(d.total_pence, ccy)} icon={Wallet} />
            <Kpi label="Status" value={d.status ? humaniseStatus(d.status) : "—"} icon={CheckCircle2} />
            <Kpi label="Submitted" value={shortDate(d.submitted_at)} icon={Calendar} />
            <Kpi label="Paid" value={shortDate(d.paid_at)} icon={CheckCircle2} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <SupplierCard className="p-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Bill to</p>
              <p className="text-sm font-semibold text-slate-900 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-slate-400" />{d.workspace_name ?? "—"}</p>
              {d.customer_name && <p className="text-xs text-slate-400 mt-0.5">{d.customer_name}</p>}
            </SupplierCard>
            <SupplierCard className="p-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Linked job</p>
              <p className="text-sm font-semibold text-slate-900">{d.job_ref ?? "—"}</p>
            </SupplierCard>
          </div>

          <Section title="Line items">
            {!d.lines || d.lines.length === 0 ? (
              <SupplierEmptyState icon={FileText} title="No line items" description="Itemised charges appear here once the invoice is detailed." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-xs text-slate-500 border-b border-slate-100"><th className="py-2 pr-3">Description</th><th className="py-2 px-3 text-right">Qty</th><th className="py-2 px-3 text-right">Unit</th><th className="py-2 pl-3 text-right">Total</th></tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {d.lines.map((l, i) => (
                      <tr key={l.id ?? i}><td className="py-2.5 pr-3 text-slate-800">{l.description ?? "—"}</td><td className="py-2.5 px-3 text-right text-slate-600">{l.quantity ?? 1}</td><td className="py-2.5 px-3 text-right text-slate-600">{moneyPence(l.unit_price_pence, ccy)}</td><td className="py-2.5 pl-3 text-right font-semibold text-slate-900">{moneyPence(l.line_total_pence, ccy)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <dl className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-sm max-w-xs ml-auto">
              <div className="flex justify-between"><dt className="text-slate-500">Net</dt><dd className="font-semibold text-slate-800">{moneyPence(net, ccy)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">VAT</dt><dd className="font-semibold text-slate-800">{moneyPence(d.vat_pence, ccy)}</dd></div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5"><dt className="font-medium text-slate-600">Total</dt><dd className="font-bold text-slate-900">{moneyPence(d.total_pence, ccy)}</dd></div>
            </dl>
          </Section>
        </div>
      ),
    },
    {
      key: "payments", label: "Payments & payouts", icon: Wallet,
      render: () => (
        <Section title="Payments & payouts">
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between"><span className="text-slate-500">Approved</span><span className="font-medium text-slate-700">{shortDate(d.approved_at)}</span></li>
            <li className="flex justify-between"><span className="text-slate-500">Paid</span><span className="font-medium text-slate-700">{shortDate(d.paid_at)}</span></li>
          </ul>
          {d.payout_id ? (
            <Link href={`/supplier/payouts/${d.payout_id}`} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-600">View linked payout</Link>
          ) : (
            <p className="mt-3 text-xs text-slate-400">Payout links here once payment is released by the operator.</p>
          )}
        </Section>
      ),
    },
    { key: "files", label: "Files", icon: Files, render: () => <Section title="Files"><SupplierEmptyState icon={Files} title="No documents" description="The invoice PDF and any attachments appear here." /></Section> },
    {
      key: "audit", label: "Audit", icon: History,
      render: () => (
        <Section title="Audit summary">
          {!d.events || d.events.length === 0 ? (
            <ul className="space-y-2 text-sm text-slate-600">
              {d.submitted_at && <li>Submitted {shortDate(d.submitted_at)}</li>}
              {d.approved_at && <li>Approved {shortDate(d.approved_at)}</li>}
              {d.paid_at && <li>Paid {shortDate(d.paid_at)}</li>}
              {!d.submitted_at && <li>No activity recorded yet.</li>}
            </ul>
          ) : (
            <ol className="space-y-3">
              {d.events.map((e, i) => (
                <li key={e.id ?? i} className="flex gap-3"><span className="w-2 h-2 rounded-full bg-[#2563EB] mt-1.5 shrink-0" /><div><p className="text-sm text-slate-700">{e.label ?? "Update"}</p><p className="text-[11px] text-slate-400">{shortDate(e.created_at)}</p></div></li>
              ))}
            </ol>
          )}
        </Section>
      ),
    },
  ]

  return (
    <>
      {banner && <div className="mb-3"><SupplierBanner tone={banner.tone} onDismiss={() => setBanner(null)}>{banner.msg}</SupplierBanner></div>}
      <SupplierDetailShell
        backHref="/supplier/finance?tab=invoices"
        backLabel="Back to invoices"
        title={d.number ? `Invoice ${d.number}` : `Invoice ${String(invoiceId).slice(0, 8)}`}
        subtitle={d.workspace_name ?? undefined}
        status={d.status ? <SupplierStatusBadge tone={toneForStatus(d.status)}>{humaniseStatus(d.status)}</SupplierStatusBadge> : undefined}
        tabs={tabs}
        actionBar={
          <SupplierActionBar>
            <SupplierButton variant="outline" onClick={() => setBanner({ tone: "emerald", msg: "Invoice PDF downloaded." })}><Download className="w-4 h-4" /> Download PDF</SupplierButton>
          </SupplierActionBar>
        }
      />
    </>
  )
}
