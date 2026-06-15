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
  X,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MoneyTabNav } from "@/components/money"
import MoneyKpiCard from "@/components/money/MoneyKpiCard"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { SectionHeader } from "@/components/layout/SectionHeader"
import { useWorkspace } from "@/providers/AuthProvider"
import { useMoneyOverview, useCreateMoneyIncome, useMoneyActivity } from "@/hooks/useMoneyData"
import type { InsertMoneyIncome, MoneyActivityRow } from "@/hooks/useMoneyData"
import Link from "next/link"
import { ActionMenu } from "@/components/portfolio/ActionMenu"

// ─── Money formatting (Intl, no float rounding bugs) ──────────────────────────

const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
})
function fmtGBP(n: number): string {
  return gbp.format(Number.isFinite(n) ? n : 0)
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface AddIncomeForm {
  income_type: string
  amount: string
  date: string
  description: string
}

const INCOME_TYPES: string[] = [
  "Rent",
  "Service Charge",
  "Deposit Received",
  "Deposit Refund",
  "Management Fee",
  "Utility Recharge",
  "Other",
]

// ─── Add Income Modal ─────────────────────────────────────────────────────────

function AddIncomeModal({ onClose, workspaceId, onSaved }: { onClose: () => void; workspaceId: string | undefined; onSaved: () => void }) {
  const createIncome = useCreateMoneyIncome(workspaceId)
  const [form, setForm] = useState<AddIncomeForm>({
    income_type: "",
    amount: "",
    date: "",
    description: "",
  })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSave() {
    if (!form.income_type) { setFormError("Income type is required"); return }
    const amount = parseFloat(form.amount)
    if (!form.amount || isNaN(amount) || amount <= 0) { setFormError("Amount must be greater than 0"); return }
    if (!form.date) { setFormError("Date is required"); return }
    if (!workspaceId) { setFormError("Workspace not loaded"); return }
    setSaving(true)
    setFormError(null)
    try {
      const payload: InsertMoneyIncome = {
        workspace_id: workspaceId,
        income_type: form.income_type,
        amount,
        expected_date: form.date,
        received_date: null,
        status: "expected",
        description: form.description.trim() || null,
        property_id: null,
        tenant_id: null,
        tenancy_id: null,
      }
      await createIncome.mutateAsync(payload)
      onSaved()
      onClose()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save income")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Add Income</h2>
          <button aria-label="Close"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Income Type</label>
            <select
              name="income_type"
              value={form.income_type}
              onChange={handleChange}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select type…</option>
              {INCOME_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Amount (£)</label>
            <input
              name="amount"
              type="number"
              min={0}
              step="0.01"
              value={form.amount}
              onChange={handleChange}
              placeholder="0.00"
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Date</label>
            <input
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={2}
              placeholder="Optional note…"
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>
        <div className="p-6 border-t border-slate-100 space-y-2">
          {formError && <p className="text-xs text-red-600">{formError}</p>}
          <div className="flex items-center justify-end gap-2">
            <button aria-label="Close"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Income"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Activity icon ────────────────────────────────────────────────────────────

function ActivityRowIcon({ eventType }: { eventType: string }) {
  if (eventType.includes("paid") || eventType.includes("received"))
    return (
      <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
        <CheckCircle className="w-4 h-4 text-emerald-600" />
      </div>
    )
  if (eventType.includes("overdue") || eventType.includes("arrears"))
    return (
      <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
        <AlertTriangle className="w-4 h-4 text-orange-500" />
      </div>
    )
  if (eventType.includes("refund") || eventType.includes("return"))
    return (
      <div className="w-9 h-9 rounded-full bg-yellow-50 flex items-center justify-center shrink-0">
        <RefreshCw className="w-4 h-4 text-yellow-500" />
      </div>
    )
  return (
    <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
      <FileText className="w-4 h-4 text-blue-600" />
    </div>
  )
}

// ─── Simple bar chart (income vs expenses, current month) ─────────────────────

function CashflowBars({ income, expenses }: { income: number; expenses: number }) {
  const max = Math.max(income, expenses, 1)
  const rows = [
    { label: "Income", value: income, color: "bg-emerald-500", text: "text-emerald-600" },
    { label: "Expenses", value: expenses, color: "bg-red-500", text: "text-red-500" },
  ]
  return (
    <div className="flex flex-col gap-4">
      {rows.map((r) => (
        <div key={r.label} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-600">{r.label}</span>
            <span className={cn("font-semibold", r.text)}>{fmtGBP(r.value)}</span>
          </div>
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className={cn("h-full rounded-full", r.color)} style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

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
  const attentionItems = overview
    ? [
        overview.invoices.overdue > 0 && {
          id: "att-inv",
          icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
          iconBg: "bg-red-50",
          title: "Overdue invoices",
          subtitle: "Receivables past due",
          amount: fmtGBP(overview.invoices.overdue),
          href: "/app/money/invoices",
        },
        overview.arrears.totalArrears > 0 && {
          id: "att-arr",
          icon: <Home className="w-4 h-4 text-amber-600" />,
          iconBg: "bg-amber-50",
          title: "Rent arrears",
          subtitle: `${overview.arrears.openCases} open case${overview.arrears.openCases === 1 ? "" : "s"}`,
          amount: fmtGBP(overview.arrears.totalArrears),
          href: "/app/money/arrears",
        },
        overview.bills.awaitingReview > 0 && {
          id: "att-bill",
          icon: <Receipt className="w-4 h-4 text-blue-600" />,
          iconBg: "bg-blue-50",
          title: "Bills awaiting review",
          subtitle: `${overview.bills.awaitingReview} pending approval`,
          href: "/app/money/bills",
        },
        overview.deposits.disputed > 0 && {
          id: "att-dep",
          icon: <RefreshCw className="w-4 h-4 text-violet-600" />,
          iconBg: "bg-violet-50",
          title: "Disputed deposits",
          subtitle: "Action required",
          amount: fmtGBP(overview.deposits.disputed),
          href: "/app/money/deposits",
        },
      ].filter(Boolean) as {
        id: string; icon: React.ReactNode; iconBg: string; title: string; subtitle: string; amount?: string; href: string
      }[]
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
          { label: "Create Invoice", icon: FileText, href: "/app/money/invoices/new" },
          { label: "Add Bill", icon: Receipt, href: "/app/money/bills/new" },
        ]}
      />

      <DashboardContainer className="px-6 py-6 flex flex-col gap-6">
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
              <Link href="/app/money/invoices/new" className="inline-flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors">
                <FileText className="w-4 h-4" /> Create Invoice
              </Link>
              <Link href="/app/money/bills/new" className="inline-flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors">
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
            href="/app/money/income"
          />
          <MoneyKpiCard
            label="Expenses Paid"
            value={fmtGBP(expensesPaid)}
            trendUp={false}
            icon={<TrendingDown className="w-5 h-5" />}
            iconBg="bg-red-50"
            iconColor="text-red-500"
            href="/app/money/expenses"
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
            href="/app/money/invoices"
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
            href="/app/money/arrears"
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
                    { label: "View Income", icon: TrendingUp, onClick: () => { window.location.href = "/app/money/income" } },
                    { label: "View Expenses", icon: TrendingDown, onClick: () => { window.location.href = "/app/money/expenses" } },
                    { label: "Open Accounting Ledger", icon: BarChart3, onClick: () => { window.location.href = "/app/accounting" } },
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
                <Link href="/app/accounting" className="text-[#2563EB] font-medium hover:underline">Accounting</Link>.
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
                    { label: "View Invoices", icon: FileText, onClick: () => { window.location.href = "/app/money/invoices" } },
                    { label: "View Bills", icon: Receipt, onClick: () => { window.location.href = "/app/money/bills" } },
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
                <Link href="/app/money/activity" className="text-xs font-medium text-[#2563EB] hover:underline flex items-center gap-1">
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
                  { label: "Income", href: "/app/money/income", icon: <TrendingUp className="w-4 h-4 text-emerald-600" /> },
                  { label: "Expenses", href: "/app/money/expenses", icon: <TrendingDown className="w-4 h-4 text-red-500" /> },
                  { label: "Invoices", href: "/app/money/invoices", icon: <FileText className="w-4 h-4 text-blue-600" /> },
                  { label: "Bills & Supplier Pay", href: "/app/money/bills", icon: <Receipt className="w-4 h-4 text-amber-600" /> },
                  { label: "Arrears", href: "/app/money/arrears", icon: <AlertTriangle className="w-4 h-4 text-orange-600" /> },
                  { label: "Deposits", href: "/app/money/deposits", icon: <Home className="w-4 h-4 text-violet-600" /> },
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
              <Link href="/app/accounting" className="text-xs font-medium text-[#2563EB] hover:underline flex items-center gap-1">
                Open Accounting <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </DashboardContainer>
    </div>
  )
}
