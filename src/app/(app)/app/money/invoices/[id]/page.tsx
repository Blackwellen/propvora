"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft, Pencil, Send, FileText, Sparkles, CreditCard, CheckCircle2,
  AlertTriangle, XCircle, Download, ChevronRight, Upload, RefreshCw,
  Building2, User, Link2, Clock, Eye, Mail, Shield, Activity,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useWorkspace } from "@/providers/AuthProvider"
import { useMoneyInvoice, useUpdateInvoiceStatus } from "@/hooks/useMoneyData"
import { createClient } from "@/lib/supabase/client"
import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { InlineEditField } from "@/components/portfolio/InlineEditField"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"

/* ------------------------------------------------------------------ */
/* Status chip                                                          */
/* ------------------------------------------------------------------ */
function InvoiceStatusChip({ status }: { status: string }) {
  const configs: Record<string, { label: string; colour: string; bg: string }> = {
    draft:      { label: "Draft",      colour: "text-slate-600",   bg: "bg-slate-100" },
    planned:    { label: "Planned",    colour: "text-violet-600",  bg: "bg-violet-50" },
    scheduled:  { label: "Scheduled",  colour: "text-violet-600",  bg: "bg-violet-50" },
    sent:       { label: "Sent",       colour: "text-blue-600",    bg: "bg-blue-50" },
    viewed:     { label: "Viewed",     colour: "text-blue-600",    bg: "bg-blue-50" },
    due:        { label: "Due",        colour: "text-amber-600",   bg: "bg-amber-50" },
    overdue:    { label: "Overdue",    colour: "text-red-600",     bg: "bg-red-50" },
    part_paid:  { label: "Part Paid",  colour: "text-amber-600",   bg: "bg-amber-50" },
    paid:       { label: "Paid",       colour: "text-emerald-600", bg: "bg-emerald-50" },
    disputed:   { label: "Disputed",   colour: "text-red-600",     bg: "bg-red-50" },
    cancelled:  { label: "Cancelled",  colour: "text-slate-500",   bg: "bg-slate-100" },
    reconciled: { label: "Reconciled", colour: "text-emerald-700", bg: "bg-emerald-50" },
  }
  const c = configs[status] ?? { label: status, colour: "text-slate-600", bg: "bg-slate-100" }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${c.bg} ${c.colour}`}>
      {status === "overdue" && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse mr-1.5" />}
      {c.label}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* KPI strip card                                                       */
/* ------------------------------------------------------------------ */
function KpiCard({ label, value, colour }: { label: string; value: string; colour: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex flex-col gap-0.5">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
      <p className={`text-xl font-bold ${colour}`}>{value}</p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Section card                                                         */
/* ------------------------------------------------------------------ */
function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Live data types                                                       */
/* ------------------------------------------------------------------ */
interface LineItem {
  description: string
  quantity: number
  unit_price: number
  tax_rate: number
}

interface PaymentRow {
  id: string
  date: string
  method: string | null
  amount: number
  reference: string | null
  recorded_by: string | null
}

interface AuditRow {
  id: string
  ts: string
  user: string
  action: string
  detail: string
}

/* ------------------------------------------------------------------ */
/* Tabs                                                                 */
/* ------------------------------------------------------------------ */
const TABS = ["Overview", "Line Items", "Payments", "Linked Records", "Documents", "Email", "Activity", "Audit"]

/* ------------------------------------------------------------------ */
/* Loading skeleton                                                     */
/* ------------------------------------------------------------------ */
function LoadingSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-5 w-40 bg-slate-100 rounded-lg" />
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="h-8 w-64 bg-slate-100 rounded-lg" />
        <div className="h-5 w-48 bg-slate-100 rounded-lg" />
        <div className="h-10 w-32 bg-slate-100 rounded-lg" />
      </div>
      <div className="grid grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-100 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
export default function InvoiceDetailPage() {
  const params = useParams()
  const id = (Array.isArray(params?.id) ? params.id[0] : params?.id) as string | undefined

  const { workspace } = useWorkspace()
  const { data: invoice, isLoading } = useMoneyInvoice(workspace?.id, id)
  const updateStatus = useUpdateInvoiceStatus(workspace?.id)
  const qc = useQueryClient()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState("Overview")
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // Persist a single field on the live money_invoices row (42P01-tolerant)
  async function saveField(field: string, value: string | number | null) {
    if (!id) return
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from("money_invoices")
        .update({ [field]: value })
        .eq("id", id)
        .eq("workspace_id", workspace?.id ?? "")
      if (error) {
        if (error.code === "42P01") {
          showToast("Invoices table not provisioned yet — change not saved")
          return
        }
        throw error
      }
      qc.invalidateQueries({ queryKey: ["money_invoice", workspace?.id, id] })
    } catch (e) {
      showToast("Could not save change")
      throw e
    }
  }

  async function deleteInvoice() {
    if (!id) return
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from("money_invoices")
        .delete()
        .eq("id", id)
        .eq("workspace_id", workspace?.id ?? "")
      if (error && error.code !== "42P01") throw error
      router.push("/app/money/invoices")
    } catch {
      showToast("Could not delete invoice")
    }
  }

  // Live data state
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [auditRows, setAuditRows] = useState<AuditRow[]>([])

  useEffect(() => {
    if (!id) return
    const supabase = createClient();
    (async () => {
      // Payments
      try {
        const { data, error } = await supabase
          .from("money_payments")
          .select("*")
          .eq("invoice_id", id)
          .order("created_at", { ascending: false })
        if (!error) {
          setPayments((data ?? []).map((r: Record<string, unknown>) => ({
            id: r.id as string,
            date: (r.paid_date ?? r.created_at ?? "") as string,
            method: (r.payment_method ?? r.method ?? null) as string | null,
            amount: r.amount as number,
            reference: (r.reference ?? null) as string | null,
            recorded_by: (r.recorded_by ?? null) as string | null,
          })))
        }
      } catch { /* money_payments table may not exist — stay empty */ }

      // Audit logs
      try {
        const { data, error } = await supabase
          .from("audit_logs")
          .select("*")
          .eq("resource_type", "invoice")
          .eq("resource_id", id)
          .order("created_at", { ascending: false })
        if (!error) {
          setAuditRows((data ?? []).map((r: Record<string, unknown>) => ({
            id: r.id as string,
            ts: ((r.created_at as string) ?? "").slice(0, 16).replace("T", " "),
            user: (r.actor_email ?? r.user_email ?? r.user_id ?? "system") as string,
            action: (r.action ?? r.event_type ?? "") as string,
            detail: (r.detail ?? r.description ?? "") as string,
          })))
        }
      } catch { /* audit_logs table may not exist — stay empty */ }
    })()
  }, [id])

  function showToast(msg: string) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 4000)
  }

  if (isLoading) return <LoadingSkeleton />

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <FileText className="w-12 h-12 text-slate-300" />
        <p className="text-slate-500 font-medium">Invoice not found</p>
        <Link
          href="/app/money/invoices"
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Invoices
        </Link>
      </div>
    )
  }

  // Capture a non-null reference for use inside inner component functions
  const inv = invoice
  // Derive display values from live data
  const invoiceRaw = inv as unknown as Record<string, unknown>
  const invoiceNumber = invoiceRaw.invoice_number as string | undefined ?? inv.id.slice(0, 12).toUpperCase()
  const recipient = invoiceRaw.tenant_name as string | undefined ?? inv.contact_id ?? "—"
  const property = invoiceRaw.property_address as string | undefined ?? inv.property_id ?? "—"
  const invoiceType = inv.invoice_type

  // Line items from live JSONB column, fallback to empty
  const lineItems: LineItem[] = Array.isArray(invoiceRaw.line_items)
    ? (invoiceRaw.line_items as LineItem[])
    : []

  const subtotal = lineItems.length > 0
    ? lineItems.reduce((s, li) => s + li.quantity * li.unit_price, 0)
    : (inv.amount ?? 0)
  const taxTotal = lineItems.reduce((s, li) => s + li.quantity * li.unit_price * (li.tax_rate / 100), 0)
  const total = inv.amount ?? subtotal + taxTotal
  const amountPaid = invoice.status === "paid" ? (invoice.paid_amount ?? total) : 0
  const outstanding = total - amountPaid
  const paidPct = total > 0 ? Math.round((amountPaid / total) * 100) : 0

  /* ---------------------------------------------------------------- */
  /* Tab content                                                        */
  /* ---------------------------------------------------------------- */
  function TabContent() {
    switch (activeTab) {
      case "Overview":
        return (
          <div className="space-y-4">
            {/* Summary card */}
            <SectionCard title="Invoice Summary">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Invoice Type</p>
                  <div className="mt-0.5">
                    <InlineEditField
                      value={invoiceType}
                      type="select"
                      options={[
                        { value: "rent", label: "Rent" },
                        { value: "service_charge", label: "Service Charge" },
                        { value: "one_off", label: "One Off" },
                        { value: "deposit", label: "Deposit" },
                        { value: "other", label: "Other" },
                      ]}
                      onSave={(v) => saveField("invoice_type", v)}
                    />
                  </div>
                </div>
                <div><p className="text-xs text-slate-500">Invoice Number</p><p className="font-mono font-semibold text-blue-600 mt-0.5">{invoiceNumber}</p></div>
                <div>
                  <p className="text-xs text-slate-500">Status</p>
                  <div className="mt-0.5">
                    <InlineEditField
                      value={inv.status}
                      type="select"
                      options={[
                        { value: "draft", label: "Draft" },
                        { value: "sent", label: "Sent" },
                        { value: "paid", label: "Paid" },
                        { value: "overdue", label: "Overdue" },
                        { value: "cancelled", label: "Cancelled" },
                        { value: "void", label: "Void" },
                      ]}
                      onSave={(v) => saveField("status", v)}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Issue Date</p>
                  <div className="mt-0.5">
                    <InlineEditField value={inv.issue_date} type="date" onSave={(v) => saveField("issue_date", v)} />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Due Date</p>
                  <div className="mt-0.5">
                    <InlineEditField value={inv.due_date} type="date" onSave={(v) => saveField("due_date", v)} />
                  </div>
                </div>
                <div><p className="text-xs text-slate-500">Property</p><p className="font-medium text-slate-800 mt-0.5">{property}</p></div>
                <div>
                  <p className="text-xs text-slate-500">Amount (£)</p>
                  <div className="mt-0.5">
                    <InlineEditField value={inv.amount} type="number" prefix="£" onSave={(v) => saveField("amount", Number(v))} />
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <p className="text-xs text-slate-500">Description</p>
                  <div className="mt-0.5">
                    <InlineEditField
                      value={(invoiceRaw.description as string | null) ?? ""}
                      type="textarea"
                      placeholder="Add a description"
                      onSave={(v) => saveField("description", v)}
                    />
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Recipient details */}
            <SectionCard title="Recipient Details">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                  {recipient.charAt(0)}
                </div>
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-slate-900">{recipient}</p>
                  <p className="text-slate-500">tenant@example.com</p>
                  <p className="text-slate-500">14 Birchwood Road, London, E1 7PL</p>
                </div>
              </div>
            </SectionCard>

            {/* Payment progress */}
            <SectionCard title="Payment Progress">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">£{amountPaid.toLocaleString("en-GB")} paid of £{total.toLocaleString("en-GB")}</span>
                  <span className={cn("font-semibold", paidPct === 100 ? "text-emerald-600" : "text-amber-600")}>{paidPct}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", paidPct === 100 ? "bg-emerald-500" : "bg-amber-400")}
                    style={{ width: `${paidPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Outstanding: £{outstanding.toLocaleString("en-GB")}</span>
                  <span>{inv.status === "paid" ? "Fully paid" : `Due: ${inv.due_date}`}</span>
                </div>
              </div>
            </SectionCard>

            {/* Status timeline */}
            <SectionCard title="Status Timeline">
              {auditRows.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No audit events recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {auditRows.map((ev) => (
                    <div key={ev.id} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{ev.action}</p>
                        <p className="text-xs text-slate-400">{ev.ts} · {ev.user}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        )

      case "Line Items":
        return (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {lineItems.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">No line items recorded. Add line items when editing the invoice.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {["Description", "Qty", "Unit Price", "Tax %", "Line Total"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((li, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="px-4 py-3 font-medium text-slate-800">{li.description}</td>
                      <td className="px-4 py-3 text-slate-600">{li.quantity}</td>
                      <td className="px-4 py-3 text-slate-600">£{li.unit_price.toLocaleString("en-GB")}</td>
                      <td className="px-4 py-3 text-slate-600">{li.tax_rate}%</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">£{(li.quantity * li.unit_price * (1 + li.tax_rate / 100)).toLocaleString("en-GB")}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-slate-200">
                  <tr className="bg-slate-50">
                    <td colSpan={4} className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right">Subtotal</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-700">£{subtotal.toLocaleString("en-GB")}</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td colSpan={4} className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right">Tax</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-700">£{taxTotal.toLocaleString("en-GB")}</td>
                  </tr>
                  <tr className="bg-slate-50 border-t border-slate-200">
                    <td colSpan={4} className="px-4 py-3 text-sm font-bold text-slate-900 text-right">Total</td>
                    <td className="px-4 py-3 text-base font-bold text-slate-900">£{total.toLocaleString("en-GB")}</td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        )

      case "Payments":
        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => showToast("Record Payment — full payment recording requires invoices module extension")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              >
                <CreditCard className="w-4 h-4" /> Record Payment
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {["Date", "Method", "Amount", "Reference", "Recorded By"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.length > 0 ? (
                    payments.map((p) => (
                      <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-slate-700">{p.date ? p.date.slice(0, 10) : "—"}</td>
                        <td className="px-4 py-3 text-slate-700">{p.method ?? "—"}</td>
                        <td className="px-4 py-3 font-semibold text-emerald-600">£{p.amount.toLocaleString("en-GB")}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.reference ?? "—"}</td>
                        <td className="px-4 py-3 text-slate-500">{p.recorded_by ?? "—"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 text-sm">No payments recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )

      case "Linked Records":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
              <div className="flex items-center gap-2 text-slate-500">
                <Building2 className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">Property</span>
              </div>
              {property !== "—" && property !== "All Properties" ? (
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{property}</p>
                  <Link href="#" className="text-xs text-blue-600 hover:underline mt-0.5 inline-flex items-center gap-1">
                    View Property <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-slate-400">Not linked</p>
              )}
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
              <div className="flex items-center gap-2 text-slate-500">
                <Link2 className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">Tenancy</span>
              </div>
              <p className="text-sm text-slate-400">Not linked</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
              <div className="flex items-center gap-2 text-slate-500">
                <User className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">Contact</span>
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">{recipient}</p>
                <Link href="#" className="text-xs text-blue-600 hover:underline mt-0.5 inline-flex items-center gap-1">
                  View Contact <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        )

      case "Documents":
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {["Document", "Type", "Uploaded", "Actions"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="px-4 py-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-red-400" />
                      <span className="font-medium text-slate-800">{invoiceNumber}.pdf</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">PDF Invoice</td>
                    <td className="px-4 py-3 text-slate-500">{inv.issue_date}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => showToast("PDF download requires document service — coming soon")}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >Download</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center gap-3 text-center bg-slate-50">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                <Upload className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Drag & drop files here</p>
                <p className="text-xs text-slate-400 mt-0.5">PDF, JPG, PNG up to 10MB</p>
              </div>
              <button
                onClick={() => showToast("File upload requires storage integration — coming soon")}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >Browse Files</button>
            </div>
          </div>
        )

      case "Email":
        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => showToast("Resend Invoice requires email configuration — coming soon")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-slate-400" /> Resend Invoice
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="divide-y divide-slate-100">
                {auditRows.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm">No email history available.</div>
                ) : auditRows.map((ev) => (
                  <div key={ev.id} className="flex items-start gap-4 px-5 py-3.5">
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                      ev.action.includes("sent") ? "bg-blue-100" : ev.action.includes("open") ? "bg-emerald-100" : "bg-slate-100"
                    )}>
                      {ev.action.includes("sent")
                        ? <div style={{ color: "#2563EB" }}><Mail className="w-3.5 h-3.5" /></div>
                        : ev.action.includes("open")
                        ? <div style={{ color: "#059669" }}><Eye className="w-3.5 h-3.5" /></div>
                        : <div style={{ color: "#475569" }}><CheckCircle2 className="w-3.5 h-3.5" /></div>}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 capitalize">{ev.action}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{ev.detail}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{ev.ts}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case "Activity":
        return (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {auditRows.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">No activity recorded yet.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {auditRows.map((ev) => (
                  <div key={ev.id} className="flex items-start gap-4 px-5 py-3.5">
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Activity className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{ev.action}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{ev.ts} · {ev.user}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      case "Audit":
        return (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {auditRows.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">No audit log entries yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {["Timestamp", "User", "Action", "Detail"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {auditRows.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{row.ts}</td>
                      <td className="px-4 py-3 text-xs text-slate-700">{row.user}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-xs text-slate-600 font-mono">{row.action}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{row.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )

      default:
        return null
    }
  }

  /* ---------------------------------------------------------------- */
  /* Right rail                                                         */
  /* ---------------------------------------------------------------- */
  function RightRail() {
    return (
      <div className="space-y-4">
        {/* Quick actions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Quick Actions</p>
          {(inv.status === "draft" || (inv.status as string) === "planned") && (
            <button
              onClick={async () => {
                try {
                  await updateStatus.mutateAsync({ id: inv.id, status: "sent" })
                  showToast("Invoice marked as Sent")
                } catch (e: unknown) {
                  showToast((e as { code?: string })?.code === "42P01" ? "Invoices table not provisioned yet" : "Could not update status")
                }
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              <Send className="w-4 h-4" /> Send Invoice
            </button>
          )}
          {((inv.status as string) === "due" || inv.status === "overdue" || inv.status === "sent") && (
            <button
              onClick={async () => {
                try {
                  await updateStatus.mutateAsync({ id: inv.id, status: "paid", paid_at: new Date().toISOString(), paid_amount: inv.amount })
                  showToast("Invoice marked as Paid")
                } catch (e: unknown) {
                  showToast((e as { code?: string })?.code === "42P01" ? "Invoices table not provisioned yet" : "Could not mark as paid")
                }
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" /> Mark as Paid
            </button>
          )}
          <button
            onClick={() => showToast("Stripe payment link requires Stripe integration — coming soon")}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-violet-200 bg-violet-50 text-violet-700 text-sm font-semibold hover:bg-violet-100 transition-colors"
          >
            <div style={{ color: "#7C3AED" }}><Sparkles className="w-4 h-4" /></div> Create Stripe Link
          </button>
          <button
            onClick={() => showToast("PDF generation requires document service — coming soon")}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4 text-slate-400" /> Export PDF
          </button>
        </div>

        {/* Invoice info */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Invoice Info</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 text-xs">Created by</span>
              <span className="text-xs font-medium text-slate-700">Admin</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 text-xs">Created</span>
              <span className="text-xs font-medium text-slate-700">{inv.issue_date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 text-xs">Last updated</span>
              <span className="text-xs font-medium text-slate-700">{inv.updated_at ? inv.updated_at.slice(0, 10) : inv.issue_date}</span>
            </div>
          </div>
        </div>

        {/* Related */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Related</p>
          <Link href="#" className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors">
            <Building2 className="w-3.5 h-3.5" /> {property}
          </Link>
          <Link href="#" className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors">
            <User className="w-3.5 h-3.5" /> {recipient}
          </Link>
          <Link href="#" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
            <Link2 className="w-3.5 h-3.5" /> View Tenancy
          </Link>
        </div>

        {/* AI insight */}
        <div className="bg-violet-50 rounded-2xl border border-violet-200 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div style={{ color: "#7C3AED" }}><Sparkles className="w-4 h-4" /></div>
            <p className="text-xs font-bold text-violet-700">AI Insight</p>
          </div>
          <p className="text-xs text-violet-600 leading-relaxed">
            {inv.status === "paid"
              ? `This invoice was paid on time. ${recipient !== "—" ? recipient : "The recipient"} has a good payment record — consider offering direct debit.`
              : inv.status === "overdue"
              ? "This invoice is overdue. Consider sending a reminder and offering a Stripe payment link for faster resolution."
              : "No issues detected. This invoice looks healthy."}
          </p>
          <button
            onClick={() => showToast("AI insights coming soon — Propvora AI module in development")}
            className="w-full text-center text-xs font-semibold text-violet-700 bg-violet-100 hover:bg-violet-200 rounded-lg py-2 transition-colors"
          >
            Ask AI about this invoice
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm shadow-xl max-w-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-5">
        <Link href="/app/money/invoices" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Invoices
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-sm font-medium text-slate-900">{invoiceNumber}</span>
      </div>

      {/* Hero card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
        <div className="flex flex-col lg:flex-row gap-5 justify-between">
          {/* Left */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm font-bold text-slate-500">{invoiceNumber}</span>
                  <InvoiceStatusChip status={inv.status} />
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{invoiceType.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                {recipient.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">{recipient}</p>
                <p className="text-xs text-slate-400">{property}</p>
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900">£{inv.amount.toLocaleString("en-GB")}</p>
              <p className="text-xs text-slate-400 mt-0.5">Due {inv.due_date}</p>
            </div>
          </div>
          {/* Right actions */}
          <div className="flex flex-wrap gap-2 items-start">
            <Link
              href={`/app/money/invoices/${inv.id}/edit`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Link>
            {(inv.status === "draft" || (inv.status as string) === "planned") && (
              <button
                onClick={async () => {
                  try {
                    await updateStatus.mutateAsync({ id: inv.id, status: "sent" })
                    showToast("Invoice marked as Sent")
                  } catch (e: unknown) {
                    showToast((e as { code?: string })?.code === "42P01" ? "Invoices table not provisioned yet" : "Could not update status")
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Send className="w-3.5 h-3.5" /> Send Invoice
              </button>
            )}
            <button
              onClick={() => showToast("PDF generation requires document service — coming soon")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" /> Generate PDF
            </button>
            <button
              onClick={() => showToast("Stripe payment link requires Stripe integration — coming soon")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-violet-200 bg-violet-50 text-violet-700 text-sm font-semibold hover:bg-violet-100 transition-colors"
            >
              <div style={{ color: "#7C3AED" }}><Sparkles className="w-3.5 h-3.5" /></div> Stripe Link
            </button>
            {inv.status !== "paid" && inv.status !== "cancelled" && (
              <button
                onClick={async () => {
                  try {
                    await updateStatus.mutateAsync({ id: inv.id, status: "paid", paid_at: new Date().toISOString(), paid_amount: inv.amount })
                    showToast("Invoice marked as Paid")
                  } catch (e: unknown) {
                    showToast((e as { code?: string })?.code === "42P01" ? "Invoices table not provisioned yet" : "Could not mark as paid")
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Mark as Paid
              </button>
            )}
            {(inv.status as string) !== "disputed" && inv.status !== "cancelled" && inv.status !== "paid" && (
              <button
                onClick={async () => {
                  try {
                    await updateStatus.mutateAsync({ id: inv.id, status: "overdue" })
                    showToast("Invoice flagged as overdue / disputed")
                  } catch (e: unknown) {
                    showToast((e as { code?: string })?.code === "42P01" ? "Invoices table not provisioned yet" : "Could not update status")
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 bg-white text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5" /> Flag Issue
              </button>
            )}
            <button
              onClick={async () => {
                try {
                  await updateStatus.mutateAsync({ id: inv.id, status: "cancelled" })
                  showToast("Invoice cancelled")
                } catch (e: unknown) {
                  showToast((e as { code?: string })?.code === "42P01" ? "Invoices table not provisioned yet" : "Could not cancel invoice")
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" /> Cancel
            </button>
            <ConfirmDialog
              title="Delete invoice?"
              description="This permanently removes the invoice record. This cannot be undone."
              confirmLabel="Delete"
              onConfirm={deleteInvoice}
            >
              {(open) => (
                <ActionMenu
                  items={[
                    { label: "View / Edit", icon: Pencil, onClick: () => router.push(`/app/money/invoices/${inv.id}/edit`) },
                    { label: "Generate PDF", icon: Download, onClick: () => showToast("PDF generation requires document service — coming soon") },
                    { label: "Delete Invoice", icon: XCircle, onClick: open, variant: "danger" },
                  ]}
                />
              )}
            </ConfirmDialog>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        <KpiCard label="Subtotal" value={`£${subtotal.toLocaleString("en-GB")}`} colour="text-slate-900" />
        <KpiCard label="Tax" value={`£${taxTotal.toLocaleString("en-GB")}`} colour="text-slate-700" />
        <KpiCard label="Total" value={`£${total.toLocaleString("en-GB")}`} colour="text-slate-900" />
        <KpiCard label="Amount Paid" value={`£${amountPaid.toLocaleString("en-GB")}`} colour="text-emerald-600" />
        <KpiCard label="Outstanding" value={`£${outstanding.toLocaleString("en-GB")}`} colour={outstanding > 0 ? "text-red-600" : "text-emerald-600"} />
      </div>

      {/* Main layout: tabs + right rail */}
      <div className="flex gap-6 items-start">
        {/* Tab area */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Tab nav */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="border-b border-slate-200 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="flex">
                {TABS.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-3 text-[13px] font-medium whitespace-nowrap border-b-2 -mb-px transition-all",
                      activeTab === tab
                        ? "border-[#2563EB] text-[#2563EB]"
                        : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-5">
              <TabContent />
            </div>
          </div>
        </div>

        {/* Right rail */}
        <aside className="w-[280px] shrink-0 sticky top-6">
          <RightRail />
        </aside>
      </div>
    </div>
  )
}
