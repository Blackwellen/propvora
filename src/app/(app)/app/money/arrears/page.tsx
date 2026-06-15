"use client"

import React, { useState } from "react"
import {
  Plus, Download, Search, AlertTriangle, FolderOpen, Phone, Calendar,
  CheckCircle, ChevronDown, X, FileText,
  Mail, MessageSquare, LayoutGrid, List,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MoneyTabNav, MoneyKpiCard, MoneyPageHeader } from "@/components/money"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import MobilePageHeader from "@/components/mobile/MobilePageHeader"
import { ResponsiveTable, type MobileCardMapping } from "@/components/mobile/ResponsiveTable"
import { DashboardContainer } from "@/components/layout/PageContainer"
import Link from "next/link"
import { useWorkspace } from "@/providers/AuthProvider"
import { useMoneyArrears, useMoneyArrearsSummary } from "@/hooks/useMoneyData"
import { createClient } from "@/lib/supabase/client"
import type { MoneyArrearsRow } from "@/hooks/useMoneyData"

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

type RiskLevel = "HIGH_RISK" | "AT_RISK" | "MEDIUM_RISK"
type ViewMode = "card" | "list"
type ChaseTab = "email" | "sms" | "whatsapp"

interface ArrearCase {
  id: string
  initials: string
  avatarBg: string
  tenantName: string
  tenantEmail: string
  tenantPhone: string
  riskLevel: RiskLevel
  propertyName: string
  propertyAddress: string
  invoiceRef: string
  invoiceLabel: string
  dueDate: string
  amountOutstanding: number
  daysOverdue: number
  lastChased: string
  lastChaseMethod: string
  nextChase: string
  nextChaseUrgency: "red" | "amber" | "green"
  priority: string
}

interface HighRiskCase {
  rank: number
  initials: string
  avatarBg: string
  name: string
  property: string
  daysOverdue: number
  amount: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return `£${amount.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

const _gbp0 = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 })
function fmtGBP(amount: number): string { return _gbp0.format(Number.isFinite(amount) ? amount : 0) }

function riskConfig(level: RiskLevel): {
  label: string
  badgeClass: string
  borderClass: string
  chaseClass: string
} {
  switch (level) {
    case "HIGH_RISK":
      return {
        label: "HIGH RISK",
        badgeClass: "bg-red-100 text-red-700",
        borderClass: "border-l-red-500",
        chaseClass: "bg-red-600 hover:bg-red-700 text-white",
      }
    case "AT_RISK":
      return {
        label: "AT RISK",
        badgeClass: "bg-amber-100 text-amber-700",
        borderClass: "border-l-amber-500",
        chaseClass: "bg-amber-500 hover:bg-amber-600 text-white",
      }
    case "MEDIUM_RISK":
      return {
        label: "MEDIUM RISK",
        badgeClass: "bg-amber-50 text-amber-600",
        borderClass: "border-l-amber-400",
        chaseClass: "bg-amber-500 hover:bg-amber-600 text-white",
      }
  }
}

// ─── Chase Drawer ─────────────────────────────────────────────────────────────

function ChaseDrawer({
  arrearCase,
  onClose,
  onSend,
}: {
  arrearCase: ArrearCase
  onClose: () => void
  onSend: (c: ArrearCase) => void
}) {
  const [activeTab, setActiveTab] = useState<ChaseTab>("email")
  const [message, setMessage] = useState(
    `Dear ${arrearCase.tenantName},\n\nWe are writing to remind you that your account has an outstanding balance of ${formatCurrency(arrearCase.amountOutstanding)} which was due on ${arrearCase.dueDate} (${arrearCase.daysOverdue} days overdue).\n\nPlease arrange payment at your earliest convenience. If you are experiencing financial difficulties, please contact us to discuss a payment plan.\n\nKind regards,\nPropvora Property Management`
  )

  const tabs: { key: ChaseTab; label: string; icon: React.ReactNode }[] = [
    { key: "email",    label: "Email",    icon: <Mail className="w-3.5 h-3.5" /> },
    { key: "sms",      label: "SMS",      icon: <MessageSquare className="w-3.5 h-3.5" /> },
    { key: "whatsapp", label: "WhatsApp", icon: <MessageSquare className="w-3.5 h-3.5" /> },
  ]

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-full max-w-[420px] bg-white shadow-2xl flex flex-col h-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Chase Arrears</h2>
          <button aria-label="Close"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {/* Contact Info */}
          <div className="bg-slate-50 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0",
                  arrearCase.avatarBg
                )}
              >
                {arrearCase.initials}
              </div>
              <div>
                <div className="text-[14px] font-semibold text-slate-900">
                  {arrearCase.tenantName}
                </div>
                <div className="text-[12px] text-slate-500">Tenant</div>
              </div>
            </div>
            <div className="flex flex-col gap-1 text-[12px] text-slate-600 mt-1">
              <span>{arrearCase.tenantPhone}</span>
              <span>{arrearCase.tenantEmail}</span>
            </div>
          </div>

          {/* Arrears Summary */}
          <div className="flex gap-3">
            <div className="flex-1 bg-red-50 rounded-xl p-3.5 text-center">
              <div className="text-xl font-bold text-red-600">
                {formatCurrency(arrearCase.amountOutstanding)}
              </div>
              <div className="text-[11px] text-red-500 font-medium mt-0.5">
                Amount Outstanding
              </div>
            </div>
            <div className="flex-1 bg-red-50 rounded-xl p-3.5 text-center">
              <div className="text-xl font-bold text-red-600">
                {arrearCase.daysOverdue}
              </div>
              <div className="text-[11px] text-red-500 font-medium mt-0.5">
                Days Overdue
              </div>
            </div>
          </div>

          {/* Channel Tabs */}
          <div>
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 mb-3">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex items-center gap-1.5 flex-1 justify-center px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all",
                    activeTab === tab.key
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Message Template
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={10}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button aria-label="Close"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { onSend(arrearCase); onClose() }}
            className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
          >
            Mark Chased
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Arrears Card ─────────────────────────────────────────────────────────────

function ArrearCard({
  arrearCase,
  onChase,
  onRecordPayment,
}: {
  arrearCase: ArrearCase
  onChase: (c: ArrearCase) => void
  onRecordPayment: (c: ArrearCase) => void
}) {
  const risk = riskConfig(arrearCase.riskLevel)

  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-slate-100 shadow-sm border-l-4 overflow-hidden",
        risk.borderClass
      )}
    >
      <div className="p-5">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Left: Tenant Info */}
          <div className="w-full md:w-48 shrink-0 flex flex-col gap-2">
            <div className="flex items-start gap-2.5">
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0",
                  arrearCase.avatarBg
                )}
              >
                {arrearCase.initials}
              </div>
              <div>
                <div className="text-[13px] font-semibold text-slate-900 leading-tight">
                  {arrearCase.tenantName}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {arrearCase.tenantEmail}
                </div>
                <div className="text-[11px] text-slate-500">
                  {arrearCase.tenantPhone}
                </div>
              </div>
            </div>
            <span
              className={cn(
                "self-start text-[10px] font-bold px-2 py-0.5 rounded-full",
                risk.badgeClass
              )}
            >
              {risk.label}
            </span>
          </div>

          {/* Center: Property + Invoice */}
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            <div className="w-full h-16 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
              <div className="text-[11px] text-slate-500 font-medium px-3 text-center leading-tight">
                {arrearCase.propertyName}
              </div>
            </div>
            <div className="text-[12px] text-slate-600 leading-tight">
              {arrearCase.propertyAddress}
            </div>
            <div className="text-[11px] text-slate-500">
              {arrearCase.invoiceRef} · {arrearCase.invoiceLabel} · Due{" "}
              {arrearCase.dueDate}
            </div>
            <div className="mt-1 flex items-center gap-4">
              <div>
                <div className="text-[11px] text-slate-500 uppercase tracking-wide font-semibold">
                  Amount Outstanding
                </div>
                <div className="text-lg font-bold text-red-600">
                  {formatCurrency(arrearCase.amountOutstanding)}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500 uppercase tracking-wide font-semibold">
                  Days Overdue
                </div>
                <div className="text-lg font-bold text-red-600">
                  {arrearCase.daysOverdue} days
                </div>
              </div>
            </div>
          </div>

          {/* Right: Chase Info + Actions */}
          <div className="w-full md:w-44 shrink-0 flex flex-col gap-2">
            <div className="flex flex-col gap-0.5">
              <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">
                Last Chased
              </div>
              <div className="text-[12px] text-slate-700">
                {arrearCase.lastChased} ({arrearCase.lastChaseMethod})
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">
                Next Chase
              </div>
              <div
                className={cn(
                  "text-[12px] font-semibold flex items-center gap-1",
                  arrearCase.nextChaseUrgency === "red"
                    ? "text-red-600"
                    : arrearCase.nextChaseUrgency === "amber"
                    ? "text-amber-600"
                    : "text-emerald-600"
                )}
              >
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    arrearCase.nextChaseUrgency === "red"
                      ? "bg-red-500"
                      : arrearCase.nextChaseUrgency === "amber"
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  )}
                />
                {arrearCase.nextChase}
              </div>
            </div>
            <div className="text-[11px] text-slate-500">{arrearCase.priority}</div>

            <div className="flex flex-col gap-1.5 mt-1">
              <button
                onClick={() => onChase(arrearCase)}
                className={cn(
                  "w-full px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors",
                  risk.chaseClass
                )}
              >
                Chase Now
              </button>
              <button
                onClick={() => onRecordPayment(arrearCase)}
                className="w-full px-3 py-1.5 rounded-lg text-[12px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Record Payment
              </button>
              <div className="flex gap-1">
                <Link href="/app/money/invoices" className="flex-1 px-2 py-1.5 rounded-lg text-[11px] font-medium text-slate-500 bg-slate-50 hover:bg-slate-100 flex items-center justify-center gap-1 transition-colors">
                  <FileText className="w-3 h-3" /> Invoice
                </Link>
                <Link href="/app/contacts" className="flex-1 px-2 py-1.5 rounded-lg text-[11px] font-medium text-slate-500 bg-slate-50 hover:bg-slate-100 flex items-center justify-center gap-1 transition-colors">
                  <Phone className="w-3 h-3" /> Contact
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ArrearsPage() {
  const { workspace } = useWorkspace()
  const { data: liveArrears, isLoading } = useMoneyArrears(workspace?.id)
  const { data: summary } = useMoneyArrearsSummary(workspace?.id)
  const [viewMode, setViewMode] = useState<ViewMode>("card")
  const [searchQuery, setSearchQuery] = useState("")
  const [drawerCase, setDrawerCase] = useState<ArrearCase | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  function showToast(msg: string) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

  const totalArrears = summary?.totalArrears ?? 0

  async function markChased(c: ArrearCase) {
    const isLive = !!liveArrears && liveArrears.some((r) => r.id === c.id)
    if (!isLive) { showToast("Sample case — actions persist once saved"); return }
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from("arrears_records")
        .update({ last_chased_at: new Date().toISOString(), status: "chasing" })
        .eq("id", c.id).eq("workspace_id", workspace?.id ?? "")
      if (error && error.code !== "42P01") throw error
      showToast(error?.code === "42P01" ? "Arrears table not provisioned yet" : `Chase logged for ${c.tenantName}`)
    } catch { showToast("Could not log chase") }
  }

  async function recordPayment(c: ArrearCase) {
    const isLive = !!liveArrears && liveArrears.some((r) => r.id === c.id)
    if (!isLive) { showToast("Sample case — actions persist once saved"); return }
    const raw = window.prompt(`Record payment received from ${c.tenantName} (£):`, "")
    if (raw === null) return
    const amt = parseFloat(raw)
    if (isNaN(amt) || amt <= 0) { showToast("Enter a valid amount greater than 0"); return }
    const row = liveArrears!.find((r) => r.id === c.id)
    const amountDue = row?.amount_owed ?? 0
    const newPaid = (row?.amount_paid ?? 0) + amt
    const fullyPaid = newPaid >= amountDue
    const newOutstanding = Math.max(0, amountDue - newPaid)
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from("arrears_records")
        .update({ amount_paid: newPaid, amount_outstanding: newOutstanding, status: fullyPaid ? "resolved" : "chasing" })
        .eq("id", c.id).eq("workspace_id", workspace?.id ?? "")
      if (error && error.code !== "42P01") throw error
      showToast(error?.code === "42P01" ? "Arrears table not provisioned yet" : fullyPaid ? "Payment recorded — case resolved" : "Payment recorded")
    } catch { showToast("Could not record payment") }
  }

  // Map live data to ArrearCase display format — NO mock fallback (honest empty state)
  const ARREAR_CASES_LIVE: ArrearCase[] = React.useMemo(() => {
    if (!liveArrears) return []
    return liveArrears.map((r: MoneyArrearsRow): ArrearCase => ({
      id: r.id,
      initials: "—",
      avatarBg: "bg-slate-400",
      tenantName: r.tenant_id ?? "—",
      tenantEmail: "—",
      tenantPhone: "—",
      riskLevel: r.severity === "critical" || r.severity === "high" ? "HIGH_RISK" : r.severity === "medium" ? "AT_RISK" : "MEDIUM_RISK",
      propertyName: r.property_id ?? "—",
      propertyAddress: r.property_id ?? "—",
      invoiceRef: r.id.slice(0, 8).toUpperCase(),
      invoiceLabel: r.notes ?? "Arrears",
      dueDate: r.created_at ? new Date(r.created_at).toLocaleDateString("en-GB") : "—",
      amountOutstanding: (r.amount_owed ?? 0) - (r.amount_paid ?? 0),
      daysOverdue: Math.floor((Date.now() - new Date(r.created_at).getTime()) / 86400000),
      lastChased: r.last_chased_at ? new Date(r.last_chased_at).toLocaleDateString("en-GB") : "—",
      lastChaseMethod: "Email",
      nextChase: "—",
      nextChaseUrgency: "amber",
      priority: "Medium priority",
    }))
  }, [liveArrears])

  const filtered = ARREAR_CASES_LIVE.filter((c) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      c.tenantName.toLowerCase().includes(q) ||
      c.propertyAddress.toLowerCase().includes(q) ||
      c.invoiceRef.toLowerCase().includes(q)
    )
  })

  const highRiskCases: HighRiskCase[] = React.useMemo(() => {
    return ARREAR_CASES_LIVE
      .filter((c) => c.riskLevel === "HIGH_RISK")
      .sort((a, b) => b.daysOverdue - a.daysOverdue)
      .slice(0, 3)
      .map((c, i): HighRiskCase => ({
        rank: i + 1,
        initials: c.initials,
        avatarBg: c.avatarBg,
        name: c.tenantName,
        property: c.propertyName,
        daysOverdue: c.daysOverdue,
        amount: c.amountOutstanding,
      }))
  }, [ARREAR_CASES_LIVE])

  function handleExportCSV() {
    downloadCSV(
      filtered.map(c => ({
        tenant: c.tenantName,
        property: c.propertyAddress,
        invoice: c.invoiceRef,
        amount_outstanding: c.amountOutstanding,
        days_overdue: c.daysOverdue,
        risk: c.riskLevel,
        last_chased: c.lastChased,
      })),
      "arrears-export.csv"
    )
  }

  // Row → card mapping for the mobile list view (mirrors the desktop list table).
  const arrearCardMapping: MobileCardMapping<ArrearCase> = {
    getKey: (c) => c.id,
    title: (c) => c.tenantName,
    subtitle: (c) => c.propertyAddress,
    badge: (c) => {
      const risk = riskConfig(c.riskLevel)
      return <span className={cn("inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap", risk.badgeClass)}>{risk.label}</span>
    },
    fields: [
      { label: "Outstanding", render: (c) => formatCurrency(c.amountOutstanding) },
      { label: "Days Overdue", render: (c) => `${c.daysOverdue}d` },
      { label: "Next Chase", render: (c) => c.nextChase },
      { label: "Last Chased", render: (c) => c.lastChased },
    ],
    actions: (c) => (
      <button
        onClick={() => setDrawerCase(c)}
        className={cn("px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors", riskConfig(c.riskLevel).chaseClass)}
      >
        Chase
      </button>
    ),
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <MobileTopBar
        title="Arrears"
        subtitle={`${filtered.length} case${filtered.length === 1 ? "" : "s"}`}
        primaryAction={{ label: "Create Invoice", icon: Plus, href: "/app/money/invoices/new" }}
        overflowActions={[
          { label: "Rent Chase", icon: Phone, href: "/app/money/rent-chase" },
          { label: "Export CSV", icon: Download, onClick: handleExportCSV },
        ]}
      />
      <MoneyTabNav />

      <DashboardContainer className="px-6 py-6 flex flex-col gap-6">
        {/* Header */}
        <div className="hidden md:block">
        <MoneyPageHeader
          breadcrumb="Arrears"
          title="Arrears"
          subtitle="Monitor, chase and resolve overdue balances with speed and precision."
          actions={
            <>
              <Link href="/app/money/invoices/new" className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap">
                <Plus className="w-4 h-4" />
                Create Invoice
              </Link>
              <Link href="/app/money/rent-chase" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm whitespace-nowrap">
                Rent Chase
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
        <MobilePageHeader
          title="Arrears"
          count={`${filtered.length} case${filtered.length === 1 ? "" : "s"}`}
          search={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search arrears…"
        />

        {/* KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <MoneyKpiCard
            label="Total Arrears"
            value={fmtGBP(totalArrears)}
            icon={<AlertTriangle className="w-5 h-5" />}
            iconBg="bg-red-50"
            iconColor="text-red-600"
          />
          <MoneyKpiCard
            label="Open Cases"
            value={summary?.openCases ?? 0}
            icon={<FolderOpen className="w-5 h-5" />}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
          />
          <MoneyKpiCard
            label="Being Chased"
            value={summary?.beingChased ?? 0}
            icon={<Phone className="w-5 h-5" />}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <MoneyKpiCard
            label="On Payment Plans"
            value={summary?.onPaymentPlans ?? 0}
            icon={<Calendar className="w-5 h-5" />}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
          <MoneyKpiCard
            label="Resolved This Month"
            value={summary?.resolvedThisMonth ?? 0}
            icon={<CheckCircle className="w-5 h-5" />}
            iconBg="bg-violet-50"
            iconColor="text-violet-600"
          />
        </div>

        {/* Main Layout */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* LEFT */}
          <div className="flex-1 min-w-0 w-full flex flex-col gap-4">
            {/* Filters */}
            <div className="hidden md:flex items-center gap-2 flex-wrap">
              {[
                "Status: All Statuses",
                "Property: All Properties",
                "Severity: All Severities",
                "Amount: Any Amount",
              ].map((f) => (
                <button
                  key={f}
                  className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-all whitespace-nowrap"
                >
                  {f} <ChevronDown className="w-3 h-3 opacity-60" />
                </button>
              ))}
              <button className="px-3 py-1.5 text-[12px] font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-all">
                More Filters
              </button>
              <button className="text-[12px] font-medium text-blue-600 hover:text-blue-800 transition-colors px-2">
                Clear
              </button>
            </div>

            {/* Sort + Count + View Toggle */}
            <div className="flex items-center justify-between">
              <div className="hidden md:flex items-center gap-2 text-[13px] text-slate-500">
                <span className="font-medium text-slate-700">{filtered.length} arrears case{filtered.length === 1 ? "" : "s"}</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("card")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all",
                    viewMode === "card"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  Card View
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all",
                    viewMode === "list"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <List className="w-3.5 h-3.5" />
                  List View
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by tenant, property or invoice..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
              />
            </div>

            {/* Card View */}
            {viewMode === "card" && (
              <div className="flex flex-col gap-3">
                {filtered.map((c) => (
                  <ArrearCard
                    key={c.id}
                    arrearCase={c}
                    onChase={setDrawerCase}
                    onRecordPayment={recordPayment}
                  />
                ))}
                {!isLoading && filtered.length === 0 && (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 text-center flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-emerald-500" />
                    </div>
                    <p className="text-sm font-medium text-slate-600">No arrears cases</p>
                    <p className="text-xs text-slate-500">Overdue balances will appear here when tenants fall behind.</p>
                  </div>
                )}
              </div>
            )}

            {/* List View */}
            {viewMode === "list" && (
              <ResponsiveTable
                rows={filtered}
                mobile={arrearCardMapping}
                emptyState={
                  !isLoading && filtered.length === 0 ? (
                    <div className="md:hidden bg-white rounded-2xl border border-slate-100 shadow-sm py-16 text-center flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-emerald-500" />
                      </div>
                      <p className="text-sm font-medium text-slate-600">No arrears cases</p>
                      <p className="text-xs text-slate-500">Overdue balances will appear here when tenants fall behind.</p>
                    </div>
                  ) : undefined
                }
              >
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                          Tenant
                        </th>
                        <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                          Property
                        </th>
                        <th className="px-3 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                          Outstanding
                        </th>
                        <th className="px-3 py-3 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                          Days Overdue
                        </th>
                        <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                          Risk
                        </th>
                        <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                          Next Chase
                        </th>
                        <th className="px-3 py-3 w-24" />
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((c, idx) => {
                        const risk = riskConfig(c.riskLevel)
                        return (
                          <tr
                            key={c.id}
                            className={cn(
                              "border-b border-slate-50 hover:bg-slate-50/60 transition-colors",
                              idx === filtered.length - 1 && "border-0"
                            )}
                          >
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={cn(
                                    "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0",
                                    c.avatarBg
                                  )}
                                >
                                  {c.initials}
                                </div>
                                <div>
                                  <div className="text-[13px] font-medium text-slate-900">
                                    {c.tenantName}
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    {c.tenantEmail}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3.5 text-[12px] text-slate-600 max-w-[160px] truncate">
                              {c.propertyAddress}
                            </td>
                            <td className="px-3 py-3.5 text-right">
                              <span className="text-[13px] font-bold text-red-600">
                                {formatCurrency(c.amountOutstanding)}
                              </span>
                            </td>
                            <td className="px-3 py-3.5 text-center">
                              <span className="text-[13px] font-semibold text-red-600">
                                {c.daysOverdue}d
                              </span>
                            </td>
                            <td className="px-3 py-3.5">
                              <span
                                className={cn(
                                  "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold",
                                  risk.badgeClass
                                )}
                              >
                                {risk.label}
                              </span>
                            </td>
                            <td className="px-3 py-3.5 text-[12px] text-slate-600">
                              {c.nextChase}
                            </td>
                            <td className="px-3 py-3.5">
                              <button
                                onClick={() => setDrawerCase(c)}
                                className={cn(
                                  "px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors",
                                  risk.chaseClass
                                )}
                              >
                                Chase
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              </ResponsiveTable>
            )}

            {/* Count */}
            {filtered.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-slate-500">
                  Showing {filtered.length} case{filtered.length === 1 ? "" : "s"}
                </span>
              </div>
            )}
          </div>

          {/* RIGHT Sidebar */}
          <div className="w-full lg:w-72 shrink-0 flex flex-col gap-4 lg:sticky lg:top-6">
            {/* Arrears Exposure — live */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="text-[13px] font-semibold text-slate-900 mb-2">Arrears Exposure</h3>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalArrears)}</p>
              <p className="text-[12px] text-slate-500 mt-0.5">Total outstanding across all open cases</p>
              <div className="mt-4 flex flex-col gap-2">
                {[
                  { label: "Open", value: summary?.openCases ?? 0, dot: "bg-amber-500" },
                  { label: "Being chased", value: summary?.beingChased ?? 0, dot: "bg-blue-500" },
                  { label: "Payment plans", value: summary?.onPaymentPlans ?? 0, dot: "bg-emerald-500" },
                ].map((r) => (
                  <div key={r.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full", r.dot)} />
                      <span className="text-[12px] text-slate-500">{r.label}</span>
                    </div>
                    <span className="text-[12px] font-semibold text-slate-900">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* High-Risk Cases — live */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-[13px] font-semibold text-slate-900">High-Risk Cases</h3>
                </div>
              </div>
              {highRiskCases.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {highRiskCases.map((c) => (
                    <div key={c.rank} className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-[11px] font-bold text-slate-500 flex items-center justify-center shrink-0">
                        {c.rank}
                      </span>
                      <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0", c.avatarBg)}>
                        {c.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-medium text-slate-900 truncate">{c.name}</div>
                        <div className="text-[11px] text-slate-500 truncate">{c.property}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[12px] font-bold text-red-600">{formatCurrency(c.amount)}</div>
                        <div className="text-[10px] text-slate-500">{c.daysOverdue}d</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-slate-500 text-center py-4">No high-risk cases.</p>
              )}
            </div>
          </div>
        </div>
      </DashboardContainer>

      {/* Chase Drawer */}
      {drawerCase && (
        <ChaseDrawer
          arrearCase={drawerCase}
          onClose={() => setDrawerCase(null)}
          onSend={markChased}
        />
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-xl text-sm font-medium">
          {toastMsg}
          <button onClick={() => setToastMsg(null)} className="ml-2 text-slate-400 hover:text-white">×</button>
        </div>
      )}
    </div>
  )
}
