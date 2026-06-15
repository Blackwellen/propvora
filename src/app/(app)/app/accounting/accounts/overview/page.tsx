"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Download,
  Clock,
  Edit2,
  CheckCircle2,
  Circle,
} from "lucide-react"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import {
  AccountingKpiCard,
  AccountingDonutCard,
  AccountingFilterBar,
  AccountingStatusBadge,
} from "@/features/accounting/components"
import { useAccountsOverview, type AccountOverviewRow } from "@/features/accounting/hooks"
import { toCsv, downloadCsv, writeAudit, isMissingTable } from "@/features/accounting/ledger"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import { ResponsiveTable, type MobileCardMapping } from "@/components/mobile/ResponsiveTable"

// ─── Types ────────────────────────────────────────────────────────────────────

type AccountType = "Assets" | "Liabilities" | "Equity" | "Income" | "Expenses"

const TYPE_ORDER: AccountType[] = ["Assets", "Liabilities", "Equity", "Income", "Expenses"]

const TYPE_STYLES: Record<
  AccountType,
  {
    borderColor: string
    headerBg: string
    textColor: string
    badgeBg: string
  }
> = {
  Assets: {
    borderColor: "border-blue-500",
    headerBg: "bg-blue-50",
    textColor: "text-blue-700",
    badgeBg: "bg-blue-100 text-blue-700",
  },
  Liabilities: {
    borderColor: "border-red-500",
    headerBg: "bg-red-50",
    textColor: "text-red-700",
    badgeBg: "bg-red-100 text-red-700",
  },
  Equity: {
    borderColor: "border-violet-500",
    headerBg: "bg-violet-50",
    textColor: "text-violet-700",
    badgeBg: "bg-violet-100 text-violet-700",
  },
  Income: {
    borderColor: "border-emerald-500",
    headerBg: "bg-emerald-50",
    textColor: "text-emerald-700",
    badgeBg: "bg-emerald-100 text-emerald-700",
  },
  Expenses: {
    borderColor: "border-amber-500",
    headerBg: "bg-amber-50",
    textColor: "text-amber-700",
    badgeBg: "bg-amber-100 text-amber-700",
  },
}

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
  }).format(n)
}

// ─── Account Group Accordion ──────────────────────────────────────────────────

function AccountGroupSection({
  type,
  accounts,
  router,
  onToggleStatus,
}: {
  type: AccountType
  accounts: AccountOverviewRow[]
  router: ReturnType<typeof useRouter>
  onToggleStatus: (acct: AccountOverviewRow) => void
}) {
  const [open, setOpen] = useState(true)
  const styles = TYPE_STYLES[type]
  const totalBalance = accounts.reduce((s, a) => s + (a.current_balance ?? 0), 0)

  const cardMapping: MobileCardMapping<AccountOverviewRow> = {
    getKey: (a) => a.id,
    title: (a) => a.name,
    subtitle: (a) => a.code,
    badge: (a) => <AccountingStatusBadge status={a.status as "Active" | "Inactive"} />,
    fields: [
      { label: "Type", render: (a) => <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full", styles.badgeBg)}>{a.account_type}</span> },
      { label: "Subcategory", render: (a) => a.subcategory },
      { label: "Opening", render: (a) => <span className="tabular-nums">{fmtCurrency(a.opening_balance)}</span> },
      {
        label: "Current",
        render: (a) => <span className={cn("font-bold tabular-nums", a.current_balance < 0 ? "text-red-600" : "text-slate-900")}>{fmtCurrency(a.current_balance)}</span>,
      },
      { label: "Mapped To", render: (a) => a.property_scope ?? "—", hideWhenEmpty: true },
    ],
    actions: (a) => (
      <ActionMenu
        items={[
          { label: "Edit", icon: Edit2, onClick: () => router.push(`/app/accounting/accounts/${a.id}`) },
          { label: "View Transactions", icon: ChevronRight, onClick: () => router.push(`/app/accounting/accounts/${a.id}`) },
          { label: a.status === "Active" ? "Deactivate" : "Activate", icon: Edit2, onClick: () => onToggleStatus(a) },
        ]}
      />
    ),
  }

  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden border-l-4",
        styles.borderColor
      )}
    >
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors hover:opacity-90",
          styles.headerBg
        )}
      >
        <div className="flex items-center gap-3">
          <span className={cn("text-sm font-bold", styles.textColor)}>{type}</span>
          <span
            className={cn(
              "px-2.5 py-0.5 rounded-full text-[11px] font-semibold",
              styles.badgeBg
            )}
          >
            {accounts.length} accounts
          </span>
          <span className={cn("text-xs font-medium", styles.textColor)}>
            {fmtCurrency(totalBalance)}
          </span>
        </div>
        {open ? (
          <ChevronDown className={cn("w-4 h-4", styles.textColor)} />
        ) : (
          <ChevronRight className={cn("w-4 h-4", styles.textColor)} />
        )}
      </button>

      {/* Table */}
      {open && (
        <ResponsiveTable rows={accounts} mobile={cardMapping} className="p-3">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-[#E2E8F0]">
                <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-20">
                  Code
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  Account Name
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-24">
                  Type
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-36">
                  Subcategory
                </th>
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-36">
                  Opening Balance
                </th>
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-36">
                  Current Balance
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-36">
                  Mapped To
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-20">
                  Status
                </th>
                <th className="px-4 py-2.5 w-12" />
              </tr>
            </thead>
            <tbody>
              {accounts.map((acct, idx) => (
                <tr
                  key={acct.id}
                  className={cn(
                    "border-b border-[#E2E8F0] hover:bg-slate-50/60 transition-colors",
                    idx === accounts.length - 1 && "border-0"
                  )}
                >
                  <td className="px-5 py-3">
                    <span className="font-mono text-[13px] font-semibold text-slate-700">
                      {acct.code}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[13px] font-medium text-slate-900">{acct.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                        styles.badgeBg
                      )}
                    >
                      {acct.account_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-slate-500">{acct.subcategory}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-[13px] text-slate-500 font-medium">
                      {fmtCurrency(acct.opening_balance)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={cn(
                        "text-[13px] font-bold",
                        acct.current_balance < 0 ? "text-red-600" : "text-slate-900"
                      )}
                    >
                      {fmtCurrency(acct.current_balance)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-slate-500">
                    {acct.property_scope ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <AccountingStatusBadge status={acct.status as "Active" | "Inactive"} />
                  </td>
                  <td className="px-4 py-3 relative">
                    <ActionMenu
                      items={[
                        { label: "Edit", icon: Edit2, onClick: () => router.push(`/app/accounting/accounts/${acct.id}`) },
                        { label: "View Transactions", icon: ChevronRight, onClick: () => router.push(`/app/accounting/accounts/${acct.id}`) },
                        { label: acct.status === "Active" ? "Deactivate" : "Activate", icon: Edit2, onClick: () => onToggleStatus(acct) },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </ResponsiveTable>
      )}
    </div>
  )
}

const TYPE_COLORS: Record<AccountType, string> = {
  Assets: "#2563EB",
  Liabilities: "#EF4444",
  Equity: "#7C3AED",
  Income: "#10B981",
  Expenses: "#F59E0B",
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AccountsOverviewPage() {
  const { data: accounts, loading, refetch } = useAccountsOverview()
  const { workspace } = useWorkspace()
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  function showToast(m: string) { setToastMsg(m); setTimeout(() => setToastMsg(null), 3500) }

  // Live KPIs derived from the chart of accounts (balances from the ledger).
  const kpis = useMemo(() => {
    const sumType = (t: AccountType) =>
      accounts.filter((a) => a.account_type === t).reduce((s, a) => s + a.current_balance, 0)
    const totalAssets = sumType("Assets")
    const totalLiabilities = sumType("Liabilities")
    const income = sumType("Income")
    const expenses = sumType("Expenses")
    return { totalAssets, totalLiabilities, income, expenses, netProfit: income - expenses }
  }, [accounts])

  // Live account-type distribution for the donut.
  const distribution = useMemo(() => {
    return TYPE_ORDER.map((t) => {
      const count = accounts.filter((a) => a.account_type === t).length
      return { label: t, value: count, color: TYPE_COLORS[t], count }
    }).filter((s) => s.value > 0)
  }, [accounts])

  async function toggleStatus(acct: AccountOverviewRow) {
    if (!workspace?.id) return
    const next = acct.status === "Active" ? "Inactive" : "Active"
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("accounting_accounts")
        .update({ status: next })
        .eq("id", acct.id)
        .eq("workspace_id", workspace.id)
      if (error) {
        if (isMissingTable(error)) { showToast("Accounts table not provisioned yet"); return }
        throw error
      }
      await writeAudit(workspace.id, "account", acct.id, next === "Active" ? "activated" : "deactivated", null, { code: acct.code })
      showToast(`${acct.name} set to ${next}`)
      refetch()
    } catch {
      showToast("Could not update account status")
    }
  }

  function exportCsv() {
    const csv = toCsv(
      ["Code", "Name", "Type", "Subcategory", "Opening Balance", "Current Balance", "Scope", "Status"],
      accounts.map((a) => [
        a.code, a.name, a.account_type, a.subcategory,
        a.opening_balance.toFixed(2), a.current_balance.toFixed(2),
        a.property_scope, a.status,
      ])
    )
    downloadCsv(`chart-of-accounts-${new Date().toISOString().slice(0, 10)}.csv`, csv)
    showToast("Chart of accounts exported")
  }

  const filteredGroups = useMemo(() => {
    const filtered = accounts.filter((a) => {
      const matchSearch =
        !search ||
        a.code.toLowerCase().includes(search.toLowerCase()) ||
        a.name.toLowerCase().includes(search.toLowerCase())
      const matchType = !typeFilter || a.account_type === typeFilter
      const matchStatus = !statusFilter || a.status === statusFilter
      return matchSearch && matchType && matchStatus
    })

    return TYPE_ORDER.map((type) => ({
      type,
      accounts: filtered.filter((a) => a.account_type === type),
    })).filter((g) => g.accounts.length > 0)
  }, [accounts, search, typeFilter, statusFilter])

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm shadow-xl max-w-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
      <MobileTopBar
        title="Accounts Overview"
        subtitle="Accounting"
        primaryAction={{ label: "New account", icon: Plus, href: "/app/accounting/accounts/new" }}
        overflowActions={accounts.length > 0 ? [{ label: "Export CSV", icon: Download, onClick: exportCsv }] : undefined}
      />

      {/* Page Header */}
      <div className="hidden md:flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Accounting</span>
            <ChevronRight className="w-3 h-3" />
            <span>Accounts Overview</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" size="md">
              01 · Accounts Overview
            </Badge>
            <h1 className="text-2xl font-bold text-slate-900">Accounts Overview</h1>
          </div>
          <p className="text-sm text-slate-500">
            Central summary of your chart of accounts and key financial positions.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={exportCsv}
            disabled={accounts.length === 0}
          >
            Export
          </Button>
          <Button
            variant="primary"
            size="sm"
            asChild
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            <Link href="/app/accounting/accounts/new">New Account</Link>
          </Button>
        </div>
      </div>

      {/* KPI Row — all values computed live from the ledger */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <AccountingKpiCard label="Total Assets" value={fmtCurrency(kpis.totalAssets)} subtitle="From posted ledger" />
        <AccountingKpiCard label="Total Liabilities" value={fmtCurrency(kpis.totalLiabilities)} subtitle="From posted ledger" />
        <AccountingKpiCard label="Income" value={fmtCurrency(kpis.income)} subtitle="Period to date" />
        <AccountingKpiCard label="Expenses" value={fmtCurrency(kpis.expenses)} subtitle="Period to date" />
        <AccountingKpiCard label="Net Profit" value={fmtCurrency(kpis.netProfit)} subtitle="Income − Expenses" />
        {distribution.length > 0 ? (
          <AccountingDonutCard
            title="Account Type Distribution"
            segments={distribution}
            centerValue={String(accounts.length)}
            centerLabel="Accounts"
            size={90}
          />
        ) : (
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 flex items-center justify-center">
            <p className="text-xs text-slate-500 text-center">No accounts yet</p>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <AccountingFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search accounts by code or name..."
        filters={[
          {
            key: "type",
            placeholder: "All Account Types",
            value: typeFilter,
            onChange: setTypeFilter,
            options: [
              { label: "Assets", value: "Assets" },
              { label: "Liabilities", value: "Liabilities" },
              { label: "Equity", value: "Equity" },
              { label: "Income", value: "Income" },
              { label: "Expenses", value: "Expenses" },
            ],
          },
          {
            key: "status",
            placeholder: "All Statuses",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: "Active", value: "Active" },
              { label: "Inactive", value: "Inactive" },
            ],
          },
          {
            key: "view",
            placeholder: "My Views: Active Accounts",
            value: "",
            onChange: () => {},
            options: [],
          },
        ]}
        onReset={() => {
          setSearch("")
          setTypeFilter("")
          setStatusFilter("")
        }}
        rightActions={
          <>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={exportCsv}
              disabled={accounts.length === 0}
            >
              Export
            </Button>
            <Button
              variant="primary"
              size="sm"
              asChild
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              <Link href="/app/accounting/accounts/new">New Account</Link>
            </Button>
          </>
        }
      />

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left — Grouped Table */}
        <div className="flex-1 min-w-0 w-full space-y-4">
          {loading ? (
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-12 flex items-center justify-center">
              <div className="flex items-center gap-2 text-slate-400">
                <div className="w-4 h-4 border-2 border-slate-300 border-t-[#2563EB] rounded-full animate-spin" />
                <span className="text-sm">Loading accounts...</span>
              </div>
            </div>
          ) : accounts.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-12 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                <Plus className="w-5 h-5 text-[#2563EB]" />
              </div>
              <p className="text-sm font-semibold text-slate-700">No accounts yet</p>
              <p className="text-xs text-slate-500 max-w-xs">
                Your chart of accounts is empty. Create your first account to start
                building the ledger — balances are computed live from posted journal entries.
              </p>
              <Button variant="primary" size="sm" asChild leftIcon={<Plus className="w-3.5 h-3.5" />}>
                <Link href="/app/accounting/accounts/new">Create First Account</Link>
              </Button>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-12 flex flex-col items-center justify-center gap-3">
              <p className="text-sm font-medium text-slate-600">No accounts match your filters</p>
              <p className="text-xs text-slate-500">Try adjusting your search or filters.</p>
            </div>
          ) : (
            filteredGroups.map((group) => (
              <AccountGroupSection
                key={group.type}
                type={group.type}
                accounts={group.accounts}
                router={router}
                onToggleStatus={toggleStatus}
              />
            ))
          )}
        </div>

        {/* Right Rail — live summaries */}
        <aside className="w-full lg:w-80 shrink-0 lg:sticky lg:top-6 space-y-4">
          {/* Balances by Type */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-900">Balances by Type</h3>
            </div>
            {accounts.length === 0 ? (
              <p className="text-xs text-slate-500">No accounts yet.</p>
            ) : (
              <div className="space-y-3">
                {TYPE_ORDER.map((t) => {
                  const group = accounts.filter((a) => a.account_type === t)
                  if (group.length === 0) return null
                  const total = group.reduce((s, a) => s + a.current_balance, 0)
                  return (
                    <div key={t} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_COLORS[t] }} />
                        <span className="text-xs text-slate-600">{t}</span>
                        <span className="text-[10px] text-slate-500">({group.length})</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-900">{fmtCurrency(total)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Status summary */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Account Status</h3>
            <div className="space-y-2.5">
              {([
                { label: "Active accounts", value: accounts.filter((a) => a.status === "Active").length, icon: CheckCircle2, color: "text-[#10B981]" },
                { label: "Inactive accounts", value: accounts.filter((a) => a.status === "Inactive").length, icon: Circle, color: "text-slate-300" },
              ]).map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <item.icon className={cn("w-4 h-4 shrink-0", item.color)} />
                    <span className="text-xs text-slate-700">{item.label}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4" asChild>
              <Link href="/app/accounting/accounts/new">New Account</Link>
            </Button>
          </div>

          {/* Donut Chart — live */}
          {distribution.length > 0 && (
            <AccountingDonutCard
              title="Account Distribution"
              segments={distribution}
              centerValue={String(accounts.length)}
              centerLabel="Total"
              size={80}
            />
          )}
        </aside>
      </div>
    </div>
  )
}
