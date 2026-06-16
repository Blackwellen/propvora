"use client"

import React, { useMemo, useState, useCallback } from "react"
import { Search, FileText } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/Input"
import { cn } from "@/lib/utils"
import { ResponsiveTable, type MobileCardMapping } from "@/components/mobile"
import { formatMoney, formatDate, invoiceStatusMeta } from "@/lib/portal/format"
import type { SupplierInvoice, SupplierJob } from "@/lib/portal/data"
import SubmitInvoiceForm from "./SubmitInvoiceForm"

const STATUS_FILTERS = ["All", "Submitted", "Reviewing", "Approved", "Paid", "Rejected"] as const

// Client list: server-scoped invoices in, local search/filter only.
export default function InvoicesList({
  invoices: initialInvoices,
  session,
  jobs,
}: {
  invoices: SupplierInvoice[]
  session: { id: string }
  jobs: SupplierJob[]
}) {
  const [invoices, setInvoices] = useState<SupplierInvoice[]>(initialInvoices)

  // After a new invoice is submitted, refresh the list from the server
  const handleSubmitted = useCallback(() => {
    // Trigger a page reload to pick up fresh server data
    window.location.reload()
  }, [])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")

  const filtered = useMemo(
    () =>
      invoices.filter((inv) => {
        const q = search.toLowerCase()
        const matchSearch =
          !search ||
          (inv.invoice_number ?? "").toLowerCase().includes(q) ||
          inv.id.toLowerCase().includes(q)
        const matchStatus =
          statusFilter === "All" || inv.status === statusFilter.toLowerCase()
        return matchSearch && matchStatus
      }),
    [invoices, search, statusFilter]
  )

  const totalPending = invoices
    .filter((i) => ["submitted", "reviewing"].includes(i.status))
    .reduce((s, i) => s + (i.amount ?? 0), 0)
  const totalApproved = invoices
    .filter((i) => i.status === "approved")
    .reduce((s, i) => s + (i.amount ?? 0), 0)
  const totalPaid = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + (i.amount ?? 0), 0)

  const invoiceCardMapping: MobileCardMapping<SupplierInvoice> = {
    getKey: (inv) => inv.id,
    title: (inv) => inv.invoice_number || inv.id.slice(0, 8).toUpperCase(),
    subtitle: (inv) => `Submitted ${formatDate(inv.submitted_at)}`,
    badge: (inv) => {
      const meta = invoiceStatusMeta(inv.status)
      return <Badge variant={meta.variant} dot>{meta.label}</Badge>
    },
    fields: [
      { label: "Amount", render: (inv) => formatMoney(inv.amount, inv.currency ?? "GBP") },
      {
        label: "Approved / Paid",
        render: (inv) => (inv.paid_at ? formatDate(inv.paid_at) : inv.approved_at ? formatDate(inv.approved_at) : "—"),
      },
    ],
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Invoices</h1>
          <p className="text-sm text-slate-500">
            {invoices.length} invoice{invoices.length === 1 ? "" : "s"} total
          </p>
        </div>
        <SubmitInvoiceForm sessionId={session.id} jobs={jobs} onSubmitted={handleSubmitted} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="p-4 rounded-2xl border-slate-200">
          <p className="text-xs text-slate-500 mb-1">Pending Payment</p>
          <p className="text-xl font-bold text-[#d97706]">{formatMoney(totalPending)}</p>
          <p className="text-xs text-slate-400">Submitted &amp; reviewing</p>
        </Card>
        <Card className="p-4 rounded-2xl border-slate-200">
          <p className="text-xs text-slate-500 mb-1">Approved</p>
          <p className="text-xl font-bold text-[#2563EB]">{formatMoney(totalApproved)}</p>
          <p className="text-xs text-slate-400">Ready for payout</p>
        </Card>
        <Card className="p-4 rounded-2xl border-slate-200">
          <p className="text-xs text-slate-500 mb-1">Total Paid Out</p>
          <p className="text-xl font-bold text-[#059669]">{formatMoney(totalPaid)}</p>
          <p className="text-xs text-slate-400">Paid out</p>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search by invoice number..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                statusFilter === s
                  ? "bg-[#2563EB] text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveTable
        rows={filtered}
        mobile={invoiceCardMapping}
        emptyState={
          <Card className="rounded-2xl border-slate-200">
            <div className="text-center py-12">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">
                {invoices.length === 0 ? "No invoices submitted yet." : "No invoices match your filter."}
              </p>
            </div>
          </Card>
        }
      >
      <Card noPadding className="rounded-2xl border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {["Invoice #", "Amount", "Submitted", "Status", "Approved / Paid"].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 px-4 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((inv) => {
                const meta = invoiceStatusMeta(inv.status)
                return (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-700 font-medium">
                      {inv.invoice_number || inv.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {formatMoney(inv.amount, inv.currency ?? "GBP")}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(inv.submitted_at)}
                    </td>
                    <td className="px-4 py-3"><Badge variant={meta.variant} dot>{meta.label}</Badge></td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {inv.paid_at ? formatDate(inv.paid_at) : inv.approved_at ? formatDate(inv.approved_at) : "—"}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">
                {invoices.length === 0 ? "No invoices submitted yet." : "No invoices match your filter."}
              </p>
            </div>
          )}
        </div>
      </Card>
      </ResponsiveTable>

      {filtered.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Showing {filtered.length} of {invoices.length} invoices
          </span>
        </div>
      )}
    </div>
  )
}
