"use client"

import React, { useState } from "react"
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  FileText,
  AlertTriangle,
  Target,
  Plus,
  CheckCircle,
  RefreshCw,
  Home,
  Receipt,
  ArrowRight,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { CashflowBars } from "@/features/finance/components/sections/CashflowBars"
import { ActivityRowIcon } from "@/features/finance/components/sections/ActivityRowIcon"
import { MoneyTabNav } from "@/components/money"
import MoneyKpiCard from "@/components/money/MoneyKpiCard"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { SectionHeader } from "@/components/layout/SectionHeader"
import { useWorkspace } from "@/providers/AuthProvider"
import { useMoneyOverview, useMoneyActivity } from "@/hooks/useMoneyData"
import type { MoneyActivityRow } from "@/hooks/useMoneyData"
import Link from "next/link"
import { AddIncomeModal } from "@/features/finance/components/sections/AddIncomeModal"
import { CashflowSnapshotCard } from "@/features/finance/components/sections/CashflowSnapshotCard"
import { ReceivablesPayablesCard } from "@/features/finance/components/sections/ReceivablesPayablesCard"
import { RecentFinancialActivityCard } from "@/features/finance/components/sections/RecentFinancialActivityCard"
import { AttentionRequiredCard } from "@/features/finance/components/sections/AttentionRequiredCard"
import type { AttentionItem } from "@/features/finance/components/sections/AttentionRequiredCard"
import { MoneySectionsNav, AccountingLinkCard } from "@/features/finance/components/sections/MoneySectionsNav"
import { fmtGBP } from "@/features/finance/components/sections/MoneyFormatUtils"

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MoneyOverviewPage() {
  const { workspace } = useWorkspace()
  const { data: overview, isLoading, error } = useMoneyOverview(workspace?.id)
  const { data: activity } = useMoneyActivity(workspace?.id, { limit: 6 })
  const [showAddModal, setShowAddModal] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  function showToast(msg: string) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 4000)
  }

  const incomeReceived = overview?.income.totalReceived ?? 0
  const expensesPaid = overview?.expenses.totalPaid ?? 0
  const netCashflow = incomeReceived - expensesPaid
  const outstanding = overview?.invoices.totalOutstanding ?? 0
  const arrearsTotal = overview?.arrears.totalArrears ?? 0
  const openCases = overview?.arrears.openCases ?? 0

  // Attention items derived from live overview
  const attentionItems: AttentionItem[] = overview
    ? [
        overview.invoices.overdue > 0 && {
          id: "att-inv",
          icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
          iconBg: "bg-red-50",
          title: "Overdue invoices",
          subtitle: "Receivables past due",
          amount: fmtGBP(overview.invoices.overdue),
          href: "/property-manager/money/invoices",
        },
        overview.arrears.totalArrears > 0 && {
          id: "att-arr",
          icon: <Home className="w-4 h-4 text-amber-600" />,
          iconBg: "bg-amber-50",
          title: "Rent arrears",
          subtitle: `${overview.arrears.openCases} open case${overview.arrears.openCases === 1 ? "" : "s"}`,
          amount: fmtGBP(overview.arrears.totalArrears),
          href: "/property-manager/money/arrears",
        },
        overview.bills.awaitingReview > 0 && {
          id: "att-bill",
          icon: <Receipt className="w-4 h-4 text-blue-600" />,
          iconBg: "bg-blue-50",
          title: "Bills awaiting review",
          subtitle: `${overview.bills.awaitingReview} pending approval`,
          href: "/property-manager/money/bills",
        },
        overview.deposits.disputed > 0 && {
          id: "att-dep",
          icon: <RefreshCw className="w-4 h-4 text-violet-600" />,
          iconBg: "bg-violet-50",
          title: "Disputed deposits",
          subtitle: "Action required",
          amount: fmtGBP(overview.deposits.disputed),
          href: "/property-manager/money/deposits",
        },
      ].filter(Boolean) as AttentionItem[]
    : []

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm shadow-xl max-w-sm">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
      {showAddModal && <AddIncomeModal onClose={() => setShowAddModal(false)} workspaceId={workspace?.id} onSaved={() => showToast("Income saved successfully")} />}

      <MobileTopBar
        title="Money"
        subtitle="Financial control centre"
        primaryAction={{ label: "Add Income", icon: Plus, onClick: () => setShowAddModal(true) }}
        overflowActions={[
          { label: "Create Invoice", icon: FileText, href: "/property-manager/money/invoices/new" },
          { label: "Add Bill", icon: Receipt, href: "/property-manager/money/bills/new" },
        ]}
      />

      <DashboardContainer className="py-6 flex flex-col gap-6">
        {/* Desktop section header — mobile uses MobileTopBar above */}
        <div className="hidden md:block">
        <SectionHeader
          title="Money"
          subtitle="Financial control centre for income, expenses, receivables, payables and cashflow."
          actions={
            <>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Income
              </button>
              <Link href="/property-manager/money/invoices/new" className="inline-flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors">
                <FileText className="w-4 h-4" /> Create Invoice
              </Link>
              <Link href="/property-manager/money/bills/new" className="inline-flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors">
                <Receipt className="w-4 h-4" /> Add Bill
              </Link>
            </>
          }
          tabs={<MoneyTabNav />}
        />
        </div>

        {/* Mobile section nav — kept visible below md (MoneyTabNav scrolls) */}
        <div className="md:hidden -mx-6">
          <MoneyTabNav />
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error instanceof Error ? error.message : "Could not load financial data."}
          </div>
        )}

        {/* KPI Row — all live */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <MoneyKpiCard
            label="Income Received"
            value={fmtGBP(incomeReceived)}
            trendUp
            icon={<TrendingUp className="w-5 h-5" />}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            href="/property-manager/money/income"
          />
          <MoneyKpiCard
            label="Expenses Paid"
            value={fmtGBP(expensesPaid)}
            trendUp={false}
            icon={<TrendingDown className="w-5 h-5" />}
            iconBg="bg-red-50"
            iconColor="text-red-500"
            href="/property-manager/money/expenses"
          />
          <MoneyKpiCard
            label="Net Cashflow"
            value={fmtGBP(netCashflow)}
            trendUp={netCashflow >= 0}
            icon={<BarChart3 className="w-5 h-5" />}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <MoneyKpiCard
            label="Outstanding Invoices"
            value={fmtGBP(outstanding)}
            subtitle="receivable"
            icon={<FileText className="w-5 h-5" />}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
            href="/property-manager/money/invoices"
          />
          <MoneyKpiCard
            label="Arrears Exposure"
            value={fmtGBP(arrearsTotal)}
            subtitle={`${openCases} active case${openCases === 1 ? "" : "s"}`}
            icon={<AlertTriangle className="w-5 h-5" />}
            iconBg="bg-orange-50"
            iconColor="text-orange-600"
            alert={openCases > 0 ? String(openCases) : undefined}
            alertColor="bg-orange-100 text-orange-700"
            href="/property-manager/money/arrears"
          />
          <MoneyKpiCard
            label="Collection Rate"
            value={`${overview?.invoices.collectionRate ?? 0}%`}
            subtitle="invoices collected"
            icon={<Target className="w-5 h-5" />}
            iconBg="bg-violet-50"
            iconColor="text-violet-600"
          />
        </div>

        {/* 2-col layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* LEFT */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">

            {/* Cashflow this period */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Cashflow Snapshot</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Received income vs paid expenses</p>
                </div>
                <ActionMenu
                  items={[
                    { label: "View Income", icon: TrendingUp, onClick: () => { window.location.href = "/property-manager/money/income" } },
                    { label: "View Expenses", icon: TrendingDown, onClick: () => { window.location.href = "/property-manager/money/expenses" } },
                    { label: "Open Accounting Ledger", icon: BarChart3, onClick: () => { window.location.href = "/property-manager/accounting" } },
                  ]}
                />
              </div>

              {incomeReceived === 0 && expensesPaid === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                  <BarChart3 className="w-10 h-10 text-slate-200" />
                  <p className="text-sm font-medium text-slate-500">No cashflow recorded yet</p>
                  <p className="text-xs text-slate-500">Add income and log expenses to see your cashflow here.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  <CashflowBars income={incomeReceived} expenses={expensesPaid} />
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <span className="text-xs text-slate-500">Net cashflow</span>
                    <span className={cn("text-base font-bold", netCashflow >= 0 ? "text-emerald-600" : "text-red-500")}>
                      {fmtGBP(netCashflow)}
                    </span>
                  </div>
                </div>
              )}

              <p className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
                For full ledgers, journals and reports, see{" "}
                <Link href="/property-manager/accounting" className="text-[#2563EB] font-medium hover:underline">Accounting</Link>.
              </p>
            </div>

            {/* Receivables vs Payables — live */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Receivables vs Payables</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Where cash is coming from and going to</p>
                </div>
                <ActionMenu
                  items={[
                    { label: "View Invoices", icon: FileText, onClick: () => { window.location.href = "/property-manager/money/invoices" } },
                    { label: "View Bills", icon: Receipt, onClick: () => { window.location.href = "/property-manager/money/bills" } },
                  ]}
                />
              </div>

              <div className="flex flex-col gap-6">
                {/* Receivables */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-slate-700 tracking-wide uppercase">
                      Receivables (Outstanding Invoices)
                    </span>
                    <span className="text-sm font-bold text-slate-900">{fmtGBP(outstanding)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="text-amber-600 font-medium">{fmtGBP(overview?.invoices.dueThisWeek ?? 0)}</span> due this week ·{" "}
                    <span className="text-red-500 font-medium">{fmtGBP(overview?.invoices.overdue ?? 0)}</span> overdue
                  </div>
                </div>

                {/* Payables */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-slate-700 tracking-wide uppercase">
                      Payables (Supplier Pay Queue)
                    </span>
                    <span className="text-sm font-bold text-slate-900">{fmtGBP(overview?.bills.supplierPaymentQueue ?? 0)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="font-medium text-slate-700">{overview?.bills.awaitingReview ?? 0}</span> awaiting review ·{" "}
                    <span className="font-medium text-slate-700">{overview?.bills.approvedToPay ?? 0}</span> approved to pay
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Financial Activity — live */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Recent Financial Activity</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Latest events across Money</p>
                </div>
                <Link href="/property-manager/money/activity" className="text-xs font-medium text-[#2563EB] hover:underline flex items-center gap-1">
                  View all activity <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              {activity && activity.length > 0 ? (
                <div className="flex flex-col divide-y divide-slate-100">
                  {activity.map((row: MoneyActivityRow) => (
                    <div key={row.id} className="flex items-center gap-4 py-3">
                      <ActivityRowIcon eventType={row.event_type} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{row.description}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{row.entity_type.replace(/_/g, " ")}</p>
                      </div>
                      <span className="text-[11px] text-slate-500 shrink-0">
                        {row.created_at ? new Date(row.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                  <FileText className="w-10 h-10 text-slate-200" />
                  <p className="text-sm font-medium text-slate-500">No activity yet</p>
                  <p className="text-xs text-slate-500">Financial events will appear here as you add records.</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div className="w-full lg:w-80 xl:w-96 shrink-0 flex flex-col gap-4">

            {/* Attention Required — live */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900">Attention Required</h3>
                {attentionItems.length > 0 && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                    {attentionItems.length} item{attentionItems.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>
              {attentionItems.length > 0 ? (
                <div className="flex flex-col gap-0.5">
                  {attentionItems.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", item.iconBg)}>
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">{item.title}</p>
                        <p className="text-[11px] text-slate-500 truncate">{item.subtitle}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {item.amount && <span className="text-xs font-bold text-slate-900">{item.amount}</span>}
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                  <CheckCircle className="w-8 h-8 text-emerald-200" />
                  <p className="text-xs font-medium text-slate-500">{isLoading ? "Loading…" : "All clear — nothing needs attention"}</p>
                </div>
              )}
            </div>

            {/* Section quick links */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Money Sections</h3>
              <div className="flex flex-col gap-1">
                {[
                  { label: "Income", href: "/property-manager/money/income", icon: <TrendingUp className="w-4 h-4 text-emerald-600" /> },
                  { label: "Expenses", href: "/property-manager/money/expenses", icon: <TrendingDown className="w-4 h-4 text-red-500" /> },
                  { label: "Invoices", href: "/property-manager/money/invoices", icon: <FileText className="w-4 h-4 text-blue-600" /> },
                  { label: "Bills & Supplier Pay", href: "/property-manager/money/bills", icon: <Receipt className="w-4 h-4 text-amber-600" /> },
                  { label: "Arrears", href: "/property-manager/money/arrears", icon: <AlertTriangle className="w-4 h-4 text-orange-600" /> },
                  { label: "Deposits", href: "/property-manager/money/deposits", icon: <Home className="w-4 h-4 text-violet-600" /> },
                ].map((s) => (
                  <Link
                    key={s.href}
                    href={s.href}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">{s.icon}</div>
                    <span className="text-sm font-medium text-slate-700 flex-1">{s.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Accounting link */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-1">Accounting</h3>
              <p className="text-xs text-slate-500 mb-3">Ledger, journals, P&amp;L and tax reporting live in Accounting.</p>
              <Link href="/property-manager/accounting" className="text-xs font-medium text-[#2563EB] hover:underline flex items-center gap-1">
                Open Accounting <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </DashboardContainer>
    </div>
  )
}
