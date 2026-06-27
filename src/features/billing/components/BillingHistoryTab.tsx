"use client"

import React, { useMemo, useState } from "react"
import { Download, Receipt, RotateCcw, CreditCard, FileText, History } from "lucide-react"
import { formatPence } from "@/lib/marketplace/money"
import { useBillingHistory, useSubscriptionEvents, useBillingRole } from "../data/hooks"
import { formatBillingDate } from "../data/calc"
import type { BillingDocType, BillingHistoryRow } from "../data/types"
import { openBillingPortal } from "../data/stripe-link"
import { BillingCard, StatusBadge, BillingButton, SeedNotice, PermissionNotice } from "./ui"

const DOC_LABEL: Record<BillingDocType, string> = {
  invoice: "Invoice",
  receipt: "Receipt",
  payment_attempt: "Payment attempt",
  refund: "Refund",
  credit: "Credit",
  tax_invoice: "VAT invoice",
}

const STATUS_TONE: Record<string, "emerald" | "amber" | "red" | "slate" | "blue"> = {
  paid: "emerald",
  due: "amber",
  failed: "red",
  refunded: "blue",
  credited: "blue",
}

const FILTERS: Array<{ id: "all" | BillingDocType; label: string }> = [
  { id: "all", label: "All" },
  { id: "invoice", label: "Invoices" },
  { id: "receipt", label: "Receipts" },
  { id: "payment_attempt", label: "Payments" },
  { id: "refund", label: "Refunds" },
  { id: "credit", label: "Credits" },
  { id: "tax_invoice", label: "VAT" },
]

function downloadRow(row: BillingHistoryRow) {
  // Modelled download — generates a client-side text document so the button is
  // never dead. Real PDFs are storage-backed at row.documentPath.
  const lines = [
    "PROPVORA — Blackwellen Ltd",
    `${DOC_LABEL[row.docType]} ${row.reference}`,
    `Date: ${formatBillingDate(row.issuedAt)}`,
    `Description: ${row.description}`,
    `Period: ${row.periodLabel}`,
    `Amount: ${formatPence(row.amountPence)}`,
    `Tax: ${formatPence(row.taxPence)}`,
    `Status: ${row.status}`,
  ]
  const blob = new Blob([lines.join("\n")], { type: "text/plain" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${row.reference}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

export function BillingHistoryTab() {
  const { data: rows, source } = useBillingHistory()
  const { data: events } = useSubscriptionEvents()
  const { canManageBilling } = useBillingRole()
  const [filter, setFilter] = useState<"all" | BillingDocType>("all")
  const [portalError, setPortalError] = useState<string | null>(null)

  async function openPortal() {
    setPortalError(null)
    try { await openBillingPortal() } catch (e) {
      setPortalError(e instanceof Error ? e.message : "The Stripe billing portal opens once your subscription is connected.")
    }
  }

  const filtered = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.docType === filter)),
    [rows, filter],
  )

  function exportAll() {
    const header = "Reference,Type,Date,Description,Period,Amount,Tax,Status"
    const body = rows
      .map((r) => [r.reference, DOC_LABEL[r.docType], formatBillingDate(r.issuedAt), `"${r.description}"`, r.periodLabel, (r.amountPence / 100).toFixed(2), (r.taxPence / 100).toFixed(2), r.status].join(","))
      .join("\n")
    const blob = new Blob([`${header}\n${body}`], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "billing-history.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <PermissionNotice canManage={canManageBilling} />

      <BillingCard
        title="Billing history"
        icon={History}
        description="Invoices, receipts, payments, refunds, credits and VAT documents."
        action={<BillingButton variant="ghost" icon={Download} className="text-[12px] px-3 py-1.5" disabled={rows.length === 0} onClick={exportAll}>Export CSV</BillingButton>}
      >
        <div className="flex flex-wrap gap-1.5 mb-4">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-xl px-3 py-1.5 text-[12px] font-medium transition-colors ${filter === f.id ? "bg-[var(--brand)] text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="py-10 text-center text-[13px] text-slate-400">No documents in this view yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-100">
                  <th className="py-2 font-medium">Reference</th>
                  <th className="py-2 font-medium">Type</th>
                  <th className="py-2 font-medium">Date</th>
                  <th className="py-2 font-medium">Period</th>
                  <th className="py-2 font-medium text-right">Amount</th>
                  <th className="py-2 font-medium">Status</th>
                  <th className="py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50">
                    <td className="py-2.5">
                      <span className="font-semibold text-slate-800">{r.reference}</span>
                      <p className="text-[11.5px] text-slate-400">{r.description}</p>
                    </td>
                    <td className="py-2.5 text-slate-600">{DOC_LABEL[r.docType]}</td>
                    <td className="py-2.5 text-slate-600">{formatBillingDate(r.issuedAt)}</td>
                    <td className="py-2.5 text-slate-600">{r.periodLabel}</td>
                    <td className="py-2.5 text-right font-medium text-slate-800 tabular-nums">{formatPence(r.amountPence)}</td>
                    <td className="py-2.5"><StatusBadge tone={STATUS_TONE[r.status] ?? "slate"}>{r.status}</StatusBadge></td>
                    <td className="py-2.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => downloadRow(r)} title={r.docType === "receipt" ? "Download receipt" : "Download invoice"} className="inline-flex items-center gap-1 text-[var(--brand)] hover:text-[var(--brand)] text-[12px] font-medium">
                          {r.docType === "receipt" ? <Receipt className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                          {r.docType === "receipt" ? "Receipt" : "Invoice"}
                        </button>
                        {r.status === "failed" && canManageBilling && (
                          <button title="Retry payment" onClick={openPortal} className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-700 text-[12px] font-medium">
                            <RotateCcw className="w-3.5 h-3.5" /> Retry
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {portalError && <p className="text-[11px] text-amber-600 mt-3">{portalError}</p>}
        <div className="mt-3 flex items-center justify-between">
          <SeedNotice source={source} />
          <BillingButton variant="ghost" icon={CreditCard} className="text-[12px] px-3 py-1.5" disabled={!canManageBilling} onClick={openPortal}>Manage payment methods</BillingButton>
        </div>
      </BillingCard>

      <BillingCard title="Subscription events" icon={History} description="Plan changes, add-on changes and lifecycle events.">
        {events.length === 0 ? (
          <p className="text-[12.5px] text-slate-400 py-2">No subscription events yet. Plan changes, add-on changes, renewals and payments appear here once your subscription is active.</p>
        ) : (
        <ol className="relative border-l border-slate-200 ml-2 space-y-4">
          {events.map((e) => (
            <li key={e.id} className="ml-4">
              <span className="absolute -left-1.5 w-3 h-3 rounded-full bg-[var(--brand)]" />
              <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] font-medium text-slate-800">{e.summary}</p>
                <span className="text-[12px] text-slate-400 whitespace-nowrap">{formatBillingDate(e.occurredAt)}</span>
              </div>
              <p className="text-[11.5px] text-slate-400">{e.eventType.replace("_", " ")} · {e.actor}</p>
            </li>
          ))}
        </ol>
        )}
      </BillingCard>
    </div>
  )
}
