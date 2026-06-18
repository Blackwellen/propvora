"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useSectionRouter, useSectionLink } from "@/components/sections/SectionBasePath"
import { ChevronDown, ChevronRight, Download, Plus, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { AccountingKpiCard } from "@/features/accounting/components"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"
import { useLedgerAccounts, useTrialBalance, useLedgerRole } from "@/lib/accounting/hooks"
import { formatPence, toCsv, downloadCsv } from "@/lib/accounting"
import type { LedgerAccountType } from "@/lib/accounting/types"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import { ResponsiveTable, type MobileCardMapping } from "@/components/mobile/ResponsiveTable"

type LedgerAccount = ReturnType<typeof useLedgerAccounts>["data"][number]

const TYPE_ORDER: LedgerAccountType[] = ["asset", "liability", "equity", "income", "expense"]
const TYPE_LABEL: Record<LedgerAccountType, string> = {
  asset: "Assets", liability: "Liabilities", equity: "Equity", income: "Income", expense: "Expenses",
}
const TYPE_STYLES: Record<LedgerAccountType, { border: string; bg: string; text: string; chip: string }> = {
  asset: { border: "border-blue-500", bg: "bg-blue-50", text: "text-blue-700", chip: "bg-blue-100 text-blue-700" },
  liability: { border: "border-red-500", bg: "bg-red-50", text: "text-red-700", chip: "bg-red-100 text-red-700" },
  equity: { border: "border-violet-500", bg: "bg-violet-50", text: "text-violet-700", chip: "bg-violet-100 text-violet-700" },
  income: { border: "border-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700", chip: "bg-emerald-100 text-emerald-700" },
  expense: { border: "border-amber-500", bg: "bg-amber-50", text: "text-amber-700", chip: "bg-amber-100 text-amber-700" },
}

export default function ChartOfAccountsPage() {
  const router = useSectionRouter()
  const sectionLink = useSectionLink()
  const { workspace } = useWorkspace()
  const { data: accounts, loading, refetch } = useLedgerAccounts()
  const { data: tb } = useTrialBalance()
  const { canPost } = useLedgerRole()
  const [search, setSearch] = useState("")
  const [seeding, setSeeding] = useState(false)

  // Balance per account (natural orientation) from the trial balance rows.
  const balanceByAccount = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of tb?.rows ?? []) {
      const natural = r.normal_side === "debit" ? r.debit_pence - r.credit_pence : r.credit_pence - r.debit_pence
      m.set(r.account_id, natural)
    }
    return m
  }, [tb])

  const kpis = useMemo(() => {
    const sum = (t: LedgerAccountType) =>
      accounts.filter((a) => a.type === t).reduce((s, a) => s + (balanceByAccount.get(a.id) ?? 0), 0)
    const income = sum("income"), expense = sum("expense")
    return { assets: sum("asset"), liabilities: sum("liability"), income, expense, net: income - expense }
  }, [accounts, balanceByAccount])

  const groups = useMemo(() => {
    const filtered = accounts.filter(
      (a) => !search || a.code.includes(search) || a.name.toLowerCase().includes(search.toLowerCase())
    )
    return TYPE_ORDER.map((type) => ({ type, accounts: filtered.filter((a) => a.type === type) })).filter(
      (g) => g.accounts.length > 0
    )
  }, [accounts, search])

  async function seedChart() {
    if (!workspace?.id) return
    setSeeding(true)
    try {
      const supabase = createClient()
      await supabase.rpc("seed_ledger_chart_of_accounts", { p_workspace: workspace.id })
      await refetch()
    } finally {
      setSeeding(false)
    }
  }

  function exportCsv() {
    const csv = toCsv(
      ["Code", "Name", "Type", "Normal Side", "Balance"],
      accounts.map((a) => [a.code, a.name, a.type, a.normal_side, formatPence(balanceByAccount.get(a.id) ?? 0)])
    )
    downloadCsv(`chart-of-accounts-${new Date().toISOString().slice(0, 10)}.csv`, csv)
  }

  return (
    <div className="space-y-6">
      <MobileTopBar
        title="Chart of Accounts"
        subtitle="General Ledger"
        primaryAction={
          canPost && accounts.length === 0
            ? { label: "Seed default chart", icon: Plus, onClick: seedChart }
            : undefined
        }
        overflowActions={accounts.length > 0 ? [{ label: "Export CSV", icon: Download, onClick: exportCsv }] : undefined}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <AccountingKpiCard label="Total Assets" value={formatPence(kpis.assets)} subtitle="From posted ledger" />
        <AccountingKpiCard label="Total Liabilities" value={formatPence(kpis.liabilities)} subtitle="From posted ledger" />
        <AccountingKpiCard label="Income" value={formatPence(kpis.income)} subtitle="Period to date" />
        <AccountingKpiCard label="Expenses" value={formatPence(kpis.expense)} subtitle="Period to date" />
        <AccountingKpiCard label="Net Profit" value={formatPence(kpis.net)} subtitle="Income − Expenses" />
      </div>

      <div className="flex items-center justify-between gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by code or name..."
          className="h-9 w-full md:w-72 px-3 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
        />
        <div className="hidden md:flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />} onClick={exportCsv} disabled={accounts.length === 0}>
            Export
          </Button>
          {canPost && accounts.length === 0 && (
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={seedChart} loading={seeding}>
              Seed Default Chart
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-12 flex items-center justify-center text-slate-500 text-sm">
          Loading chart of accounts…
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-12 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
            <Plus className="w-5 h-5 text-[#2563EB]" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No accounts yet</p>
          <p className="text-xs text-slate-500 max-w-sm">
            Seed the default UK property chart of accounts to start posting. Balances are computed live from posted journal entries.
          </p>
          {canPost ? (
            <Button variant="primary" size="sm" onClick={seedChart} loading={seeding} leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Seed Default Chart
            </Button>
          ) : (
            <p className="text-xs text-slate-500 flex items-center gap-1"><Lock className="w-3 h-3" /> Ask a finance-capable member to set this up.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <AccountTypeSection key={g.type} type={g.type} accounts={g.accounts} balanceByAccount={balanceByAccount} />
          ))}
        </div>
      )}
    </div>
  )
}

function AccountTypeSection({
  type, accounts, balanceByAccount,
}: {
  type: LedgerAccountType
  accounts: ReturnType<typeof useLedgerAccounts>["data"]
  balanceByAccount: Map<string, number>
}) {
  const router = useSectionRouter()
  const sectionLink = useSectionLink()
  const [open, setOpen] = useState(true)
  const s = TYPE_STYLES[type]
  const total = accounts.reduce((sum, a) => sum + (balanceByAccount.get(a.id) ?? 0), 0)

  const cardMapping: MobileCardMapping<LedgerAccount> = {
    getKey: (a) => a.id,
    title: (a) => a.name,
    subtitle: (a) => a.code,
    badge: (a) => a.is_system ? <span className="text-[10px] text-slate-500">system</span> : null,
    fields: [
      { label: "Normal Side", render: (a) => <span className="capitalize">{a.normal_side}</span> },
      {
        label: "Balance",
        render: (a) => (
          <span className={cn("font-bold tabular-nums", (balanceByAccount.get(a.id) ?? 0) < 0 ? "text-red-600" : "text-slate-900")}>
            {formatPence(balanceByAccount.get(a.id) ?? 0)}
          </span>
        ),
      },
    ],
    onRowClick: (a) => router.push(`/app/accounting/ledger/accounts/${a.id}`),
  }

  return (
    <div className={cn("bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden border-l-4", s.border)}>
      <button onClick={() => setOpen((v) => !v)} className={cn("w-full flex items-center justify-between px-5 py-3.5 text-left hover:opacity-90", s.bg)}>
        <div className="flex items-center gap-3">
          <span className={cn("text-sm font-bold", s.text)}>{TYPE_LABEL[type]}</span>
          <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-semibold", s.chip)}>{accounts.length} accounts</span>
          <span className={cn("text-xs font-medium", s.text)}>{formatPence(total)}</span>
        </div>
        {open ? <ChevronDown className={cn("w-4 h-4", s.text)} /> : <ChevronRight className={cn("w-4 h-4", s.text)} />}
      </button>
      {open && (
        <ResponsiveTable rows={accounts} mobile={cardMapping} className="p-3">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-[#E2E8F0]">
                <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-24">Code</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Account Name</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-28">Normal Side</th>
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-40">Balance</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a, idx) => (
                <tr key={a.id} className={cn("border-b border-[#E2E8F0] hover:bg-slate-50/60 transition-colors", idx === accounts.length - 1 && "border-0")}>
                  <td className="px-5 py-3"><span className="font-mono text-[13px] font-semibold text-slate-700">{a.code}</span></td>
                  <td className="px-4 py-3">
                    <Link href={sectionLink(`/app/accounting/ledger/accounts/${a.id}`)} className="text-[13px] font-medium text-slate-900 hover:text-[#2563EB]">
                      {a.name}
                    </Link>
                    {a.is_system && <span className="ml-2 text-[10px] text-slate-500">system</span>}
                  </td>
                  <td className="px-4 py-3"><span className="text-[11px] font-medium text-slate-500 capitalize">{a.normal_side}</span></td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn("text-[13px] font-bold", (balanceByAccount.get(a.id) ?? 0) < 0 ? "text-red-600" : "text-slate-900")}>
                      {formatPence(balanceByAccount.get(a.id) ?? 0)}
                    </span>
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
