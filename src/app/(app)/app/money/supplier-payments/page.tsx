"use client"

import React, { useState, useEffect } from "react"
import {
  Truck, AlertCircle, Plus, Download, ChevronDown, CheckCircle, CreditCard,
  Eye, X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MoneyTabNav } from "@/components/money/MoneyTabNav"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import MobilePageHeader from "@/components/mobile/MobilePageHeader"
import { ResponsiveTable, type MobileCardMapping } from "@/components/mobile/ResponsiveTable"
import { DashboardContainer, PageHeader } from "@/components/layout/PageContainer"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
type PaymentStatus = "awaiting_review" | "approved" | "scheduled_for_payment" | "paid" | "overdue"

type SupplierPayment = {
  id: string
  supplier: string
  bill: string
  property: string
  amount: number
  due_date: string
  status: PaymentStatus
  method: "bank_transfer" | "stripe" | "manual" | "cheque"
  stripe_status: "not_configured" | "pending" | "processing" | "paid" | "failed"
}

const STATUS_MAP: Record<PaymentStatus, { label: string; cls: string }> = {
  awaiting_review:       { label: "Awaiting Review",      cls: "bg-amber-50 text-amber-700 border-amber-200" },
  approved:              { label: "Approved",              cls: "bg-blue-50 text-blue-700 border-blue-200" },
  scheduled_for_payment: { label: "Scheduled",            cls: "bg-violet-50 text-violet-700 border-violet-200" },
  paid:                  { label: "Paid",                  cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  overdue:               { label: "Overdue",               cls: "bg-red-50 text-red-700 border-red-200" },
}

/* ------------------------------------------------------------------ */
/* Status chip                                                         */
/* ------------------------------------------------------------------ */
function StatusChip({ status }: { status: PaymentStatus }) {
  const { label, cls } = STATUS_MAP[status]
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border", cls)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* KPI Card                                                            */
/* ------------------------------------------------------------------ */
function KpiCard({ label, value, sub, colour }: { label: string; value: string; sub?: string; colour: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">{label}</p>
      <p className={cn("text-3xl font-bold", colour)}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function SupplierPaymentsPage() {
  const { workspace } = useWorkspace()
  const [supplierFilter, setSupplierFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [propertyFilter, setPropertyFilter] = useState("all")
  const [payments, setPayments] = useState<SupplierPayment[]>([])

  useEffect(() => {
    if (!workspace?.id) return
    const supabase = createClient()
    async function fetchPayments() {
      try {
        const { data, error } = await supabase
          .from("supplier_payments")
          .select("id, supplier_name, amount, status, due_date, paid_date, job_ref, invoice_ref")
          .eq("workspace_id", workspace!.id)
          .order("due_date", { ascending: false })
          .limit(50)
        if (error) return
        const mapped: SupplierPayment[] = (data ?? []).map((row: {
          id: string
          supplier_name: string | null
          amount: number | null
          status: string | null
          due_date: string | null
          job_ref: string | null
          invoice_ref: string | null
        }) => ({
          id: row.id,
          supplier: row.supplier_name ?? "Unknown",
          bill: row.invoice_ref ?? row.job_ref ?? "—",
          property: "—",
          amount: row.amount ?? 0,
          due_date: row.due_date ?? "",
          status: (row.status as PaymentStatus) ?? "awaiting_review",
          method: "bank_transfer" as const,
          stripe_status: "not_configured" as const,
        }))
        setPayments(mapped)
      } catch {
        // 42P01-safe: table may not exist yet
      }
    }
    fetchPayments()
  }, [workspace?.id])

  const filtered = payments.filter(p => {
    if (supplierFilter && !p.supplier.toLowerCase().includes(supplierFilter.toLowerCase())) return false
    if (statusFilter !== "all" && p.status !== statusFilter) return false
    if (propertyFilter !== "all" && p.property !== propertyFilter) return false
    return true
  })

  function approve(id: string) {
    setPayments(prev => prev.map(p => p.id === id ? { ...p, status: "approved" } : p))
  }

  function markPaid(id: string) {
    setPayments(prev => prev.map(p => p.id === id ? { ...p, status: "paid" } : p))
  }

  const pendingApprovalCount = payments.filter(p => p.status === "awaiting_review").length
  const approvedCount        = payments.filter(p => p.status === "approved").length
  const paidThisMonth        = payments.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0)
  const pendingApprovalAmt   = payments.filter(p => p.status === "awaiting_review").reduce((s, p) => s + p.amount, 0)
  const approvedAmt          = payments.filter(p => p.status === "approved").reduce((s, p) => s + p.amount, 0)

  const properties = Array.from(new Set(payments.map(p => p.property)))

  // Derive top suppliers from live payments (aggregate by supplier name, top 5 by spend)
  const topSuppliersMap: Record<string, { spend: number; bills: number }> = {}
  for (const p of payments) {
    if (!topSuppliersMap[p.supplier]) topSuppliersMap[p.supplier] = { spend: 0, bills: 0 }
    topSuppliersMap[p.supplier].spend += p.amount
    topSuppliersMap[p.supplier].bills += 1
  }
  const TOP_SUPPLIERS = Object.entries(topSuppliersMap)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 5)

  // Row → card mapping for the mobile card list (mirrors the desktop table).
  const paymentCardMapping: MobileCardMapping<SupplierPayment> = {
    getKey: (p) => p.id,
    title: (p) => p.supplier,
    subtitle: (p) => `${p.bill} · ${p.property}`,
    badge: (p) => <StatusChip status={p.status} />,
    fields: [
      { label: "Amount", render: (p) => `£${p.amount.toLocaleString("en-GB")}` },
      { label: "Due Date", render: (p) => p.due_date },
      { label: "Method", render: (p) => p.method.replace(/_/g, " ") },
    ],
    actions: (p) => (
      <div className="flex items-center gap-1.5">
        {p.status === "awaiting_review" && (
          <button onClick={() => approve(p.id)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors">
            <CheckCircle className="w-3 h-3" />Approve
          </button>
        )}
        {p.status === "approved" && (
          <button onClick={() => markPaid(p.id)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-colors">
            <CheckCircle className="w-3 h-3" />Mark Paid
          </button>
        )}
      </div>
    ),
  }

  return (
    <DashboardContainer>
      <MobileTopBar
        title="Supplier Payments"
        subtitle={`${filtered.length} payment${filtered.length === 1 ? "" : "s"}`}
        overflowActions={[{ label: "Export", icon: Download, onClick: () => {} }]}
      />
      <div className="hidden md:block">
      <PageHeader
        title="Supplier Payments"
        actions={
          <>
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors">
              <Download className="w-4 h-4" />Export
            </button>
            <div className="relative group">
              <button
                disabled
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white opacity-50 cursor-not-allowed"
                style={{ backgroundColor: "#2563EB" }}
              >
                <Plus className="w-4 h-4" />Pay Supplier
              </button>
              <div className="hidden group-hover:block absolute right-0 top-full mt-1 z-20 w-56 rounded-xl bg-slate-800 text-white text-xs px-3 py-2 shadow-lg">
                Connect Stripe in the Stripe tab to enable direct supplier payouts.
              </div>
            </div>
          </>
        }
      />
      </div>

      <MoneyTabNav />

      {/* Mobile header — search (desktop filters gated below) */}
      <MobilePageHeader
        title="Supplier Payments"
        count={`${filtered.length} payment${filtered.length === 1 ? "" : "s"}`}
        search={supplierFilter}
        onSearchChange={setSupplierFilter}
        searchPlaceholder="Search supplier…"
        className="mt-4"
      />

      {/* Amber setup banner */}
      <div className="mt-6 flex items-start gap-3 rounded-2xl bg-amber-50 border border-amber-200 p-4">
        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-800">
          <span className="font-semibold">Supplier payments via Stripe Connect are not yet configured.</span>{" "}
          Set up Stripe in the Stripe tab to enable direct supplier payouts. You can still track manual payment status.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <KpiCard label="Pending Approval"  value={`£${pendingApprovalAmt.toLocaleString("en-GB")}`} sub={`${pendingApprovalCount} bills`} colour="text-amber-600" />
        <KpiCard label="Approved to Pay"   value={`£${approvedAmt.toLocaleString("en-GB")}`}        sub={`${approvedCount} bills`}       colour="text-[#2563EB]" />
        <KpiCard label="Paid This Month"   value={`£${paidThisMonth.toLocaleString("en-GB")}`}                                            colour="text-emerald-600" />
        <KpiCard label="Stripe Payouts"    value="£0"                                                sub="Not configured"                  colour="text-violet-600" />
      </div>

      {/* Filters */}
      <div className="mt-5 hidden md:flex flex-wrap gap-3 items-center">
        <div className="relative">
          <input
            type="text"
            placeholder="Search supplier…"
            value={supplierFilter}
            onChange={e => setSupplierFilter(e.target.value)}
            className="h-9 pl-3 pr-8 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-48"
          />
          {supplierFilter && (
            <button onClick={() => setSupplierFilter("")} className="absolute right-2 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}
        </div>

        {[
          { label: "Status", value: statusFilter, onChange: setStatusFilter, options: [
            { value: "all", label: "All Statuses" },
            { value: "awaiting_review", label: "Awaiting Review" },
            { value: "approved", label: "Approved" },
            { value: "scheduled_for_payment", label: "Scheduled" },
            { value: "paid", label: "Paid" },
            { value: "overdue", label: "Overdue" },
          ]},
          { label: "Property", value: propertyFilter, onChange: setPropertyFilter, options: [
            { value: "all", label: "All Properties" },
            ...properties.map(p => ({ value: p, label: p })),
          ]},
        ].map(f => (
          <div key={f.label} className="relative">
            <select
              value={f.value}
              onChange={e => f.onChange(e.target.value)}
              className="h-9 pl-3 pr-8 rounded-xl border border-slate-200 text-sm bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        ))}
      </div>

      {/* Table + right rail layout */}
      <div className="mt-5 grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6 items-start">

        {/* Table */}
        <ResponsiveTable
          rows={filtered}
          mobile={paymentCardMapping}
          emptyState={
            filtered.length === 0 ? (
              <div className="md:hidden rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500">
                No payments match the current filters.
              </div>
            ) : undefined
          }
        >
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Supplier","Bill","Property","Amount","Due Date","Status","Method","Stripe","Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          <Truck className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                        <span className="text-xs font-semibold text-slate-800 whitespace-nowrap">{p.supplier}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-blue-600 font-medium whitespace-nowrap">{p.bill}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{p.property}</td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-800 whitespace-nowrap">£{p.amount.toLocaleString("en-GB")}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{p.due_date}</td>
                    <td className="px-4 py-3 whitespace-nowrap"><StatusChip status={p.status} /></td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap capitalize">{p.method.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                        Not set up
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {p.status === "awaiting_review" && (
                          <button
                            onClick={() => approve(p.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors whitespace-nowrap"
                          >
                            <CheckCircle className="w-3 h-3" />Approve
                          </button>
                        )}
                        {p.status === "approved" && (
                          <>
                            <button
                              disabled
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border border-violet-200 text-violet-400 opacity-50 cursor-not-allowed whitespace-nowrap"
                            >
                              <CreditCard className="w-3 h-3" />Stripe
                            </button>
                            <button
                              onClick={() => markPaid(p.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-colors whitespace-nowrap"
                            >
                              <CheckCircle className="w-3 h-3" />Mark Paid
                            </button>
                          </>
                        )}
                        <button aria-label="View payment details" className="p-1 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-500">
                      No payments match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        </ResponsiveTable>

        {/* Supplier summary cards */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-800">Top Suppliers by Spend</h2>
            </div>
            <div className="p-4 space-y-3">
              {TOP_SUPPLIERS.map((s, i) => {
                const maxSpend = TOP_SUPPLIERS[0]?.spend ?? 1
                return (
                  <div key={s.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-500 w-4">{i + 1}</span>
                        <span className="text-xs font-medium text-slate-700">{s.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-800">£{s.spend.toLocaleString("en-GB")}</span>
                        <span className="text-[10px] text-slate-500 ml-1">{s.bills} bill{s.bills !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#2563EB]"
                        style={{ width: `${Math.round((s.spend / maxSpend) * 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate-800">Payment Summary</h2>
            {[
              { label: "Total Bills Value",  value: `£${payments.reduce((s, p) => s + p.amount, 0).toLocaleString("en-GB")}`, colour: "text-slate-900" },
              { label: "Awaiting Approval",  value: `£${pendingApprovalAmt.toLocaleString("en-GB")}`,                          colour: "text-amber-600" },
              { label: "Approved to Pay",    value: `£${approvedAmt.toLocaleString("en-GB")}`,                                 colour: "text-blue-600" },
              { label: "Paid",               value: `£${paidThisMonth.toLocaleString("en-GB")}`,                               colour: "text-emerald-600" },
              { label: "Overdue",            value: `£${payments.filter(p => p.status === "overdue").reduce((s, p) => s + p.amount, 0).toLocaleString("en-GB")}`, colour: "text-red-600" },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between text-sm">
                <span className="text-slate-500">{r.label}</span>
                <span className={cn("font-semibold", r.colour)}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardContainer>
  )
}
