"use client"

import React, { useState } from "react"
import {
  Plus, Download, Search, FileText, Calendar, AlertTriangle, CheckCircle,
  BarChart2,
  Trash2, SlidersHorizontal,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MoneyTabNav, MoneyKpiCard, MoneyPageHeader } from "@/components/money"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import MobilePageHeader from "@/components/mobile/MobilePageHeader"
import { ResponsiveTable, type MobileCardMapping } from "@/components/mobile/ResponsiveTable"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { useWorkspace } from "@/providers/AuthProvider"
import { useMoneyInvoices, useUpdateInvoiceStatus, useMoneyInvoicesSummary } from "@/hooks/useMoneyData"
import type { MoneyInvoiceRow } from "@/hooks/useMoneyData"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"
import { Eye, CreditCard } from "lucide-react"

// ─── CSV export helper ────────────────────────────────────────────────────────

function downloadCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return
  const headers = Object.keys(data[0])
  const rows = data.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// ─── Types ────────────────────────────────────────────────────────────────────

type InvoiceStatus = "draft" | "sent" | "due_soon" | "overdue" | "paid"
type InvoiceType = "Rent" | "Service Charge" | "Deposit" | "Maintenance" | "Other"

interface Invoice {
  id: string
  invoiceNumber: string
  poRef: string
  recipientName: string
  recipientEmail: string
  recipientInitials: string
  recipientAvatarBg: string
  propertyAddress: string
  propertyCity: string
  type: InvoiceType
  amount: number
  issueDate: string
  dueDate: string
  dueDateLabel: string
  status: InvoiceStatus
}

type StatusFilter = "all" | "draft" | "sent" | "due_soon" | "overdue" | "paid"

// ─── Donut ────────────────────────────────────────────────────────────────────

interface DonutSegment {
  label: string
  count: number
  percent: number
  color: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return `£${amount.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const _gbp0 = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 })
function fmtCurrency0(amount: number): string {
  return _gbp0.format(Number.isFinite(amount) ? amount : 0)
}

function statusConfig(status: InvoiceStatus): { label: string; className: string } {
  switch (status) {
    case "draft":    return { label: "Draft",    className: "bg-slate-100 text-slate-600" }
    case "sent":     return { label: "Sent",     className: "bg-blue-100 text-blue-700" }
    case "due_soon": return { label: "Due Soon", className: "bg-amber-100 text-amber-700" }
    case "overdue":  return { label: "Overdue",  className: "bg-red-100 text-red-700" }
    case "paid":     return { label: "Paid",     className: "bg-emerald-100 text-emerald-700" }
  }
}

function typeBadgeClass(type: InvoiceType): string {
  switch (type) {
    case "Rent":           return "bg-emerald-100 text-emerald-700"
    case "Service Charge": return "bg-blue-100 text-blue-700"
    case "Deposit":        return "bg-violet-100 text-violet-700"
    case "Maintenance":    return "bg-amber-100 text-amber-700"
    case "Other":          return "bg-slate-100 text-slate-600"
  }
}

// ─── SVG Donut ────────────────────────────────────────────────────────────────

function InvoiceDonut({ segments }: { segments: DonutSegment[] }) {
  const total = segments.reduce((s, d) => s + d.count, 0)
  const r = 54
  const cx = 70
  const cy = 70
  const circumference = 2 * Math.PI * r
  let accumulated = 0

  if (total === 0) {
    return <p className="text-xs text-slate-500 text-center py-8">No invoices to chart yet.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-center">
        <div className="relative" style={{ width: 140, height: 140 }}>
          <svg width={140} height={140} viewBox="0 0 140 140">
            {segments.map((seg) => {
              const dashLen = (seg.percent / 100) * circumference - 1.5
              const dashOffset = -(accumulated / 100) * circumference
              accumulated += seg.percent
              return (
                <circle
                  key={seg.label}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={12}
                  strokeDasharray={`${dashLen} ${circumference - dashLen}`}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${cx} ${cy})`}
                />
              )
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-slate-900">{total}</span>
            <span className="text-[10px] text-slate-500 font-medium">Total</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: seg.color }} />
              <span className="text-slate-600">{seg.label}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-900">{seg.count}</span>
              <span className="text-slate-400">({seg.percent}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InvoicesPage() {
  const { workspace } = useWorkspace()
  const router = useRouter()
  const { data: liveInvoices, isLoading: invoicesLoading, error: invoicesError } = useMoneyInvoices(workspace?.id)
  const { data: summary } = useMoneyInvoicesSummary(workspace?.id)
  const updateStatus = useUpdateInvoiceStatus(workspace?.id)
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set())
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  function showToast(m: string) { setToastMsg(m); setTimeout(() => setToastMsg(null), 3500) }

  async function deleteInvoice(id: string) {
    const isLive = !!liveInvoices && liveInvoices.some((r) => r.id === id)
    if (isLive) {
      const supabase = createClient()
      try {
        const { error } = await supabase.from("invoices").delete().eq("id", id).eq("workspace_id", workspace?.id ?? "")
        if (error && error.code !== "42P01") throw error
      } catch { showToast("Could not delete invoice"); return }
    }
    setHiddenIds((p) => new Set(p).add(id))
    showToast("Invoice deleted")
  }

  async function markInvoicePaid(id: string, amount: number) {
    const isLive = !!liveInvoices && liveInvoices.some((r) => r.id === id)
    if (!isLive) { showToast("Sample invoice — actions persist once saved"); return }
    try {
      await updateStatus.mutateAsync({ id, status: "paid", paid_at: new Date().toISOString(), paid_amount: amount })
      showToast("Invoice marked as Paid")
    } catch (e: unknown) {
      showToast((e as { code?: string })?.code === "42P01" ? "Invoices table not provisioned yet" : "Could not update status")
    }
  }

  // Map live invoices — NO mock fallback (honest empty state)
  const INVOICES_LIVE: Invoice[] = React.useMemo(() => {
    if (!liveInvoices) return []
    return liveInvoices.map((r: MoneyInvoiceRow): Invoice => ({
      id: r.id,
      invoiceNumber: `INV-${r.id.slice(0, 8).toUpperCase()}`,
      poRef: r.tenancy_id ?? "—",
      recipientName: r.contact_name ?? (r.contact_id ? `Contact ${r.contact_id.slice(0, 6)}` : "—"),
      recipientEmail: "—",
      recipientInitials: r.contact_name ? r.contact_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : "?",
      recipientAvatarBg: "bg-blue-500",
      propertyAddress: r.property_address ?? (r.property_id ? `Property ${r.property_id.slice(0, 6)}` : "—"),
      propertyCity: "—",
      type: (r.invoice_type === "rent" ? "Rent" : r.invoice_type === "service_charge" ? "Service Charge" : r.invoice_type === "deposit" ? "Deposit" : "Other") as InvoiceType,
      amount: r.amount ?? 0,
      issueDate: r.issue_date ? new Date(r.issue_date).toLocaleDateString("en-GB") : "—",
      dueDate: r.due_date ? new Date(r.due_date).toLocaleDateString("en-GB") : "—",
      dueDateLabel: "",
      status: (r.status === "void" || r.status === "cancelled" ? "draft" : r.status === "draft" || r.status === "sent" || r.status === "paid" || r.status === "overdue" ? r.status : "sent") as InvoiceStatus,
    }))
  }, [liveInvoices])

  // Live status tab counts
  const statusCounts = React.useMemo(() => {
    const c: Record<string, number> = { all: INVOICES_LIVE.length, draft: 0, sent: 0, due_soon: 0, overdue: 0, paid: 0 }
    for (const inv of INVOICES_LIVE) c[inv.status] = (c[inv.status] ?? 0) + 1
    return c
  }, [INVOICES_LIVE])

  const STATUS_TABS: { key: StatusFilter; label: string; color?: string }[] = [
    { key: "all", label: "All" },
    { key: "draft", label: "Draft" },
    { key: "sent", label: "Sent" },
    { key: "due_soon", label: "Due Soon", color: "amber" },
    { key: "overdue", label: "Overdue", color: "red" },
    { key: "paid", label: "Paid" },
  ]

  // Live donut segments
  const donutSegments: DonutSegment[] = React.useMemo(() => {
    const defs: { key: string; label: string; color: string }[] = [
      { key: "paid", label: "Paid", color: "#10B981" },
      { key: "sent", label: "Sent", color: "#3B82F6" },
      { key: "overdue", label: "Overdue", color: "#EF4444" },
      { key: "due_soon", label: "Due Soon", color: "#F59E0B" },
      { key: "draft", label: "Draft", color: "#94A3B8" },
    ]
    const total = INVOICES_LIVE.length || 1
    return defs
      .map((d) => ({ label: d.label, color: d.color, count: statusCounts[d.key] ?? 0, percent: Math.round(((statusCounts[d.key] ?? 0) / total) * 100) }))
      .filter((d) => d.count > 0)
  }, [INVOICES_LIVE.length, statusCounts])

  const filtered = INVOICES_LIVE.filter((inv) => {
    if (hiddenIds.has(inv.id)) return false
    if (activeStatus !== "all" && inv.status !== activeStatus) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.recipientName.toLowerCase().includes(q) ||
        inv.propertyAddress.toLowerCase().includes(q)
      )
    }
    return true
  })

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map((i) => i.id)))
    }
  }

  function handleExportCSV() {
    downloadCSV(
      filtered.map(inv => ({
        invoice_number: inv.invoiceNumber,
        recipient: inv.recipientName,
        property: inv.propertyAddress,
        type: inv.type,
        amount: inv.amount,
        issue_date: inv.issueDate,
        due_date: inv.dueDate,
        status: inv.status,
      })),
      "invoices-export.csv"
    )
  }

  // Row → card mapping for the mobile card list (mirrors the desktop table).
  const invoiceCardMapping: MobileCardMapping<Invoice> = {
    getKey: (inv) => inv.id,
    title: (inv) => inv.invoiceNumber,
    subtitle: (inv) => inv.recipientName,
    badge: (inv) => {
      const sc = statusConfig(inv.status)
      return <span className={cn("inline-flex text-[10.5px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap", sc.className)}>{sc.label}</span>
    },
    fields: [
      { label: "Amount", render: (inv) => formatCurrency(inv.amount) },
      { label: "Type", render: (inv) => inv.type },
      { label: "Property", render: (inv) => inv.propertyAddress },
      { label: "Due", render: (inv) => inv.dueDate },
    ],
    onRowClick: (inv) => router.push(`/property-manager/money/invoices/${inv.id}`),
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <MobileTopBar
        title="Invoices"
        subtitle={`${filtered.length} invoice${filtered.length === 1 ? "" : "s"}`}
        primaryAction={{ label: "New Invoice", icon: Plus, href: "/property-manager/money/invoices/new" }}
        overflowActions={[{ label: "Export CSV", icon: Download, onClick: handleExportCSV }]}
      />
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm shadow-xl max-w-sm">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
      <MoneyTabNav />

      <DashboardContainer className="py-6 flex flex-col gap-6">
        {/* Header */}
        <div className="hidden md:block">
        <MoneyPageHeader
          breadcrumb="Invoices"
          title="Invoices"
          subtitle="Create, manage and track all customer invoices in one place."
          actions={
            <>
              <Link href="/property-manager/money/invoices/new">
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
                  <Plus className="w-4 h-4" />
                  New Invoice
                </button>
              </Link>
              <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </>
          }
        />
        </div>

        {/* Mobile header — search (desktop search field gated below) */}
        <MobilePageHeader hideTitle
          title="Invoices"
          count={`${filtered.length} invoice${filtered.length === 1 ? "" : "s"}`}
          search={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search invoices…"
        />

        {/* Error banner */}
        {invoicesError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {invoicesError instanceof Error ? invoicesError.message : "Something went wrong. Please try again."}
          </div>
        )}

        {/* KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <MoneyKpiCard
            label="Total Outstanding"
            value={fmtCurrency0(summary?.totalOutstanding ?? 0)}
            icon={<FileText className="w-5 h-5" />}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <MoneyKpiCard
            label="Due This Week"
            value={fmtCurrency0(summary?.dueThisWeek ?? 0)}
            icon={<Calendar className="w-5 h-5" />}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
          />
          <MoneyKpiCard
            label="Overdue"
            value={fmtCurrency0(summary?.overdue ?? 0)}
            alert={statusCounts.overdue > 0 ? String(statusCounts.overdue) : undefined}
            alertColor="bg-red-100 text-red-700"
            icon={<AlertTriangle className="w-5 h-5" />}
            iconBg="bg-red-50"
            iconColor="text-red-600"
          />
          <MoneyKpiCard
            label="Paid This Month"
            value={fmtCurrency0(summary?.paidThisMonth ?? 0)}
            icon={<CheckCircle className="w-5 h-5" />}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
          <MoneyKpiCard
            label="Collection Rate"
            value={`${summary?.collectionRate ?? 0}%`}
            icon={<BarChart2 className="w-5 h-5" />}
            iconBg="bg-violet-50"
            iconColor="text-violet-600"
          />
        </div>

        {/* Main Layout */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* LEFT */}
          <div className="flex-1 min-w-0 w-full flex flex-col gap-4">
            {/* Status chips */}
            <div className="flex items-center gap-2 flex-wrap">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveStatus(tab.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium border transition-all",
                    activeStatus === tab.key
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      "text-[11px] font-semibold px-1.5 py-0.5 rounded-full",
                      activeStatus === tab.key
                        ? "bg-white/20 text-white"
                        : tab.color === "amber"
                        ? "bg-amber-100 text-amber-700"
                        : tab.color === "red"
                        ? "bg-red-100 text-red-700"
                        : "bg-slate-100 text-slate-600"
                    )}
                  >
                    {statusCounts[tab.key] ?? 0}
                  </span>
                </button>
              ))}
              <button className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium text-slate-600 bg-white border border-slate-200 hover:border-slate-300 transition-all">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters
              </button>
            </div>

            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search invoices by #, recipient or property..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
              />
            </div>

            {/* Table */}
            <ResponsiveTable
              rows={filtered}
              mobile={invoiceCardMapping}
              emptyState={
                !invoicesLoading && filtered.length === 0 ? (
                  <div className="md:hidden bg-white rounded-2xl border border-slate-100 shadow-sm p-10 flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-600">No invoices yet</p>
                    <p className="text-xs text-slate-500">Get started by adding your first invoice.</p>
                  </div>
                ) : undefined
              }
            >
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="pl-4 pr-2 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={
                            selectedIds.size === filtered.length &&
                            filtered.length > 0
                          }
                          onChange={toggleAll}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        Invoice #
                      </th>
                      <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        Recipient
                      </th>
                      <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        Property
                      </th>
                      <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        Type
                      </th>
                      <th className="px-3 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        Amount
                      </th>
                      <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        <span className="flex items-center gap-1">
                          Issue Date
                          <span className="text-blue-500">↑</span>
                        </span>
                      </th>
                      <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        Due Date
                      </th>
                      <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        Status
                      </th>
                      <th className="px-3 py-3 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {invoicesLoading ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <tr key={i} className="border-b border-slate-50 animate-pulse">
                          <td className="pl-4 pr-2 py-3.5"><div className="w-4 h-4 rounded bg-slate-200" /></td>
                          <td className="px-3 py-3.5"><div className="h-3 bg-slate-200 rounded w-28 mb-1" /><div className="h-2.5 bg-slate-100 rounded w-16" /></td>
                          <td className="px-3 py-3.5"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-slate-200 shrink-0" /><div className="h-3 bg-slate-200 rounded w-24" /></div></td>
                          <td className="px-3 py-3.5"><div className="h-3 bg-slate-200 rounded w-32" /></td>
                          <td className="px-3 py-3.5"><div className="h-5 bg-slate-100 rounded-full w-20" /></td>
                          <td className="px-3 py-3.5 text-right"><div className="h-3 bg-slate-200 rounded w-14 ml-auto" /></td>
                          <td className="px-3 py-3.5"><div className="h-3 bg-slate-100 rounded w-20" /></td>
                          <td className="px-3 py-3.5"><div className="h-3 bg-slate-100 rounded w-20" /></td>
                          <td className="px-3 py-3.5"><div className="h-5 bg-slate-100 rounded-full w-16" /></td>
                          <td className="px-3 py-3.5" />
                        </tr>
                      ))
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={10}>
                          <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                              <FileText className="w-6 h-6 text-slate-400" />
                            </div>
                            <p className="text-sm font-medium text-slate-600">No invoices yet</p>
                            <p className="text-xs text-slate-500">Get started by adding your first invoice.</p>
                          </div>
                        </td>
                      </tr>
                    ) : filtered.map((inv, idx) => {
                      const { label: statusLabel, className: statusClass } =
                        statusConfig(inv.status)
                      return (
                        <tr
                          key={inv.id}
                          className={cn(
                            "border-b border-slate-50 hover:bg-slate-50/60 transition-colors",
                            idx === filtered.length - 1 && "border-0"
                          )}
                        >
                          <td className="pl-4 pr-2 py-3.5">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(inv.id)}
                              onChange={() => toggleSelect(inv.id)}
                              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-3 py-3.5">
                            <Link href={`/property-manager/money/invoices/${inv.id}`} className="text-blue-600 font-semibold hover:underline text-[13px]">
                              {inv.invoiceNumber}
                            </Link>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {inv.poRef}
                            </div>
                          </td>
                          <td className="px-3 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={cn(
                                  "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0",
                                  inv.recipientAvatarBg
                                )}
                              >
                                {inv.recipientInitials}
                              </div>
                              <div>
                                <div className="text-[13px] font-medium text-slate-900">
                                  {inv.recipientName}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  {inv.recipientEmail}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3.5">
                            <div className="text-[13px] text-slate-900 leading-tight">
                              {inv.propertyAddress}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {inv.propertyCity}
                            </div>
                          </td>
                          <td className="px-3 py-3.5">
                            <span
                              className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold",
                                typeBadgeClass(inv.type)
                              )}
                            >
                              {inv.type}
                            </span>
                          </td>
                          <td className="px-3 py-3.5 text-right">
                            <span className="text-[13px] font-semibold text-slate-900">
                              {formatCurrency(inv.amount)}
                            </span>
                          </td>
                          <td className="px-3 py-3.5 text-[13px] text-slate-600 whitespace-nowrap">
                            {inv.issueDate}
                          </td>
                          <td className="px-3 py-3.5">
                            <div className="text-[13px] text-slate-600 whitespace-nowrap">
                              {inv.dueDate}
                            </div>
                            {inv.dueDateLabel && (
                              <div
                                className={cn(
                                  "text-[11px] font-medium mt-0.5",
                                  inv.status === "overdue"
                                    ? "text-red-500"
                                    : inv.status === "due_soon"
                                    ? "text-amber-600"
                                    : "text-slate-400"
                                )}
                              >
                                {inv.dueDateLabel}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3.5">
                            <span
                              className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold",
                                statusClass
                              )}
                            >
                              {statusLabel}
                            </span>
                          </td>
                          <td className="px-3 py-3.5">
                            <ConfirmDialog
                              title="Delete invoice?"
                              description={`Remove ${inv.invoiceNumber}? This cannot be undone.`}
                              confirmLabel="Delete"
                              onConfirm={() => deleteInvoice(inv.id)}
                            >
                              {(open) => (
                                <ActionMenu
                                  items={[
                                    { label: "View", icon: Eye, onClick: () => router.push(`/property-manager/money/invoices/${inv.id}`) },
                                    { label: "Mark as Paid", icon: CreditCard, onClick: () => markInvoicePaid(inv.id, inv.amount), disabled: inv.status === "paid" },
                                    { label: "Export Row (CSV)", icon: Download, onClick: () => downloadCSV([inv as unknown as Record<string, unknown>], `${inv.invoiceNumber}.csv`) },
                                    { label: "Delete", icon: Trash2, onClick: open, variant: "danger" },
                                  ]}
                                />
                              )}
                            </ConfirmDialog>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Count */}
              {filtered.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                  <span className="text-[13px] text-slate-500">
                    Showing {filtered.length} invoice{filtered.length === 1 ? "" : "s"}
                  </span>
                </div>
              )}
            </div>
            </ResponsiveTable>
          </div>

          {/* RIGHT Sidebar */}
          <div className="w-full lg:w-72 shrink-0 flex flex-col gap-4 lg:sticky lg:top-6">
            {/* Collections Summary */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[13px] font-semibold text-slate-900">
                  Collections Summary
                </h3>
                <button className="text-[12px] text-blue-600 font-medium hover:underline">
                  MTD &gt;
                </button>
              </div>
              <div className="flex flex-col gap-2.5">
                {(
                  [
                    { label: "Outstanding", value: fmtCurrency0(summary?.totalOutstanding ?? 0), color: "text-slate-900" },
                    { label: "Due This Week", value: fmtCurrency0(summary?.dueThisWeek ?? 0), color: "text-amber-600" },
                    { label: "Paid This Month", value: fmtCurrency0(summary?.paidThisMonth ?? 0), color: "text-emerald-600" },
                    { label: "Overdue", value: fmtCurrency0(summary?.overdue ?? 0), color: "text-red-600" },
                  ] as { label: string; value: string; color: string }[]
                ).map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-[12px] text-slate-500">{row.label}</span>
                    <span className={cn("text-[13px] font-semibold", row.color)}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
              <Link href="/property-manager/accounting" className="mt-4 inline-block text-[12px] text-blue-600 font-medium hover:underline">
                View in Accounting &gt;
              </Link>
            </div>

            {/* Donut — live */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="text-[13px] font-semibold text-slate-900 mb-4">
                Invoice Status
              </h3>
              <InvoiceDonut segments={donutSegments} />
            </div>

            {/* Recent Paid — live */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[13px] font-semibold text-slate-900">
                  Recently Paid
                </h3>
              </div>
              {(() => {
                const paid = (liveInvoices ?? [])
                  .filter((r) => r.status === "paid")
                  .sort((a, b) => new Date(b.paid_at ?? b.updated_at).getTime() - new Date(a.paid_at ?? a.updated_at).getTime())
                  .slice(0, 4)
                if (paid.length === 0) {
                  return <p className="text-[12px] text-slate-500 text-center py-4">No payments recorded yet.</p>
                }
                return (
                  <div className="flex flex-col gap-3">
                    {paid.map((p) => (
                      <div key={p.id} className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-medium text-slate-900 truncate">
                            INV-{p.id.slice(0, 8).toUpperCase()}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {p.paid_at ? new Date(p.paid_at).toLocaleDateString("en-GB") : "—"}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[12px] font-semibold text-emerald-600">
                            {formatCurrency(p.paid_amount ?? p.amount ?? 0)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      </DashboardContainer>
    </div>
  )
}
