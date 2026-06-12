"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ChevronRight,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Download,
  Edit2,
  History,
  Trash2,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"
import { InlineEditField } from "@/components/portfolio/InlineEditField"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"
import {
  fetchAccountLines,
  fmtGBP,
  writeAudit,
  isMissingTable,
  toCsv,
  downloadCsv,
} from "@/features/accounting/ledger"

// ---------------------------------------------------------------------------
// Fallback metadata used only until the live account row resolves
// ---------------------------------------------------------------------------

const ACCOUNT = {
  code: "—",
  name: "Account",
  type: "Assets",
  subcategory: "",
  currency: "GBP",
  scope: "",
  status: "Active",
  created: "—",
}

interface LedgerTx {
  date: string
  reference: string
  description: string
  debit: number | null
  credit: number | null
  balance: number
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function KpiCard({
  label,
  value,
  sub,
  trend,
}: {
  label: string
  value: string
  sub: string
  trend: "up" | "down" | null
}) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 flex-1 min-w-0">
      <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-900 leading-tight">{value}</p>
      {sub && (
        <div className="flex items-center gap-1 mt-1.5">
          {trend === "up" && <TrendingUp className="w-3.5 h-3.5 text-[#10B981]" />}
          {trend === "down" && <TrendingDown className="w-3.5 h-3.5 text-[#EF4444]" />}
          <p
            className={cn(
              "text-xs",
              trend === "up" && "text-[#10B981]",
              trend === "down" && "text-[#EF4444]",
              trend === null && "text-slate-500"
            )}
          >
            {sub}
          </p>
        </div>
      )}
    </div>
  )
}

function BalanceTrendSvg({ data }: { data: number[] }) {
  const width = 240
  const height = 80
  const padX = 8
  const padY = 8
  if (data.length < 2) {
    return (
      <div className="h-20 flex items-center justify-center text-xs text-slate-400">
        Not enough activity to chart
      </div>
    )
  }
  const minVal = Math.min(...data)
  const maxVal = Math.max(...data)
  const range = maxVal - minVal || 1

  const points = data.map((v, i) => {
    const x = padX + (i / (data.length - 1)) * (width - padX * 2)
    const y = padY + (1 - (v - minVal) / range) * (height - padY * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  const polylinePoints = points.join(" ")

  // area fill path
  const firstX = padX
  const lastX = padX + (width - padX * 2)
  const bottomY = height - padY
  const areaPath = `M${firstX},${bottomY} ${points.map((p) => `L${p}`).join(" ")} L${lastX.toFixed(1)},${bottomY} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-20" preserveAspectRatio="none">
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#trendFill)" />
      <polyline
        points={polylinePoints}
        fill="none"
        stroke="#2563EB"
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface LiveAccount {
  id: string
  code: string
  name: string
  account_type: string
  subcategory: string
  currency: string
  property_scope: string
  status: string
  created: string
  opening_balance: number
  normal_balance: "debit" | "credit"
}

export default function AccountDetailPage({
  params,
}: {
  params: Promise<{ accountId: string }>
}) {
  const { accountId } = React.use(params)
  const router = useRouter()
  const { workspace } = useWorkspace()

  // Start with fallback metadata; replace with the live row when found (enables inline editing)
  const [account, setAccount] = useState<LiveAccount>({
    id: accountId,
    code: ACCOUNT.code,
    name: ACCOUNT.name,
    account_type: ACCOUNT.type,
    subcategory: ACCOUNT.subcategory,
    currency: ACCOUNT.currency,
    property_scope: ACCOUNT.scope,
    status: ACCOUNT.status,
    created: ACCOUNT.created,
    opening_balance: 0,
    normal_balance: "debit",
  })
  const [isLive, setIsLive] = useState(false)
  const [txns, setTxns] = useState<LedgerTx[]>([])
  const [txLoading, setTxLoading] = useState(true)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  function showToast(m: string) { setToastMsg(m); setTimeout(() => setToastMsg(null), 3500) }

  useEffect(() => {
    if (!accountId || !workspace?.id) return
    const supabase = createClient();
    (async () => {
      try {
        const { data, error } = await supabase
          .from("accounting_accounts")
          .select("*")
          .eq("id", accountId)
          .eq("workspace_id", workspace.id)
          .maybeSingle()
        if (error) return // 42P01 or not found — keep seed, editing disabled
        if (data) {
          const r = data as Record<string, unknown>
          setAccount({
            id: r.id as string,
            code: (r.code as string) ?? ACCOUNT.code,
            name: (r.name as string) ?? ACCOUNT.name,
            account_type: (r.account_type as string) ?? ACCOUNT.type,
            subcategory: (r.subcategory as string) ?? ACCOUNT.subcategory,
            currency: (r.currency as string) ?? ACCOUNT.currency,
            property_scope: (r.property_scope as string) ?? ACCOUNT.scope,
            status: (r.status as string) ?? ACCOUNT.status,
            created: (r.created_at as string)?.slice(0, 10) ?? ACCOUNT.created,
            opening_balance: Number(r.opening_balance ?? 0),
            normal_balance: ((r.normal_balance as string) ?? "debit") as "debit" | "credit",
          })
          setIsLive(true)
        }
      } catch { /* keep fallback metadata */ }
    })()
  }, [accountId, workspace?.id])

  // Live account statement — lines for this account, with a running balance
  // computed from the posted ledger (no fabricated figures).
  useEffect(() => {
    if (!accountId || !workspace?.id) { setTxLoading(false); return }
    let cancelled = false
    ;(async () => {
      setTxLoading(true)
      try {
        const lines = await fetchAccountLines(workspace.id, accountId, 100)
        if (cancelled) return
        // Oldest → newest to accumulate the running balance, then display newest first.
        const oldestFirst = [...lines].filter((l) => l.is_posted).reverse()
        let running = account.opening_balance
        const withBalance: LedgerTx[] = oldestFirst.map((l) => {
          const net = l.debit - l.credit
          running += account.normal_balance === "credit" ? -net : net
          return {
            date: l.entry_date,
            reference: l.entry_number ?? l.journal_entry_id.slice(0, 8),
            description: l.description ?? l.entry_description,
            debit: l.debit > 0 ? l.debit : null,
            credit: l.credit > 0 ? l.credit : null,
            balance: running,
          }
        })
        setTxns(withBalance.reverse())
      } catch {
        if (!cancelled) setTxns([])
      } finally {
        if (!cancelled) setTxLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [accountId, workspace?.id, account.opening_balance, account.normal_balance])

  // Derived KPIs from the live statement.
  const currentBalance = txns.length > 0 ? txns[0].balance : account.opening_balance
  const mtdMovement = (() => {
    const now = new Date()
    const monthStr = now.toISOString().slice(0, 7)
    return txns
      .filter((t) => t.date.slice(0, 7) === monthStr)
      .reduce((s, t) => {
        const net = (t.debit ?? 0) - (t.credit ?? 0)
        return s + (account.normal_balance === "credit" ? -net : net)
      }, 0)
  })()
  const lastTxn = txns[0]
  // Trend = running balances oldest→newest for the sparkline.
  const trendData = [...txns].reverse().map((t) => t.balance)

  function exportStatement() {
    if (txns.length === 0) { showToast("No posted transactions to export"); return }
    const csv = toCsv(
      ["Date", "Reference", "Description", "Debit", "Credit", "Balance"],
      txns.map((t) => [
        t.date, t.reference, t.description,
        t.debit != null ? t.debit.toFixed(2) : "",
        t.credit != null ? t.credit.toFixed(2) : "",
        t.balance.toFixed(2),
      ])
    )
    downloadCsv(`statement-${account.code}-${new Date().toISOString().slice(0, 10)}.csv`, csv)
    showToast("Statement exported")
  }

  async function saveField(field: string, value: string | number) {
    const supabase = createClient()
    const { error } = await supabase
      .from("accounting_accounts")
      .update({ [field]: value })
      .eq("id", account.id)
      .eq("workspace_id", workspace?.id ?? "")
    if (error) {
      if (isMissingTable(error)) { showToast("Accounts table not provisioned yet"); return }
      throw error
    }
    setAccount((p) => ({ ...p, [field]: value }))
    if (workspace?.id) {
      await writeAudit(workspace.id, "account", account.id, "updated", null, { [field]: value })
    }
  }

  async function deleteAccount() {
    if (!isLive) { router.push("/app/accounting/accounts/overview"); return }
    const supabase = createClient()
    try {
      const { error } = await supabase.from("accounting_accounts").delete().eq("id", account.id).eq("workspace_id", workspace?.id ?? "")
      if (error && !isMissingTable(error)) throw error
      if (workspace?.id) await writeAudit(workspace.id, "account", account.id, "deleted", null, { code: account.code })
      router.push("/app/accounting/accounts/overview")
    } catch { showToast("Could not delete account") }
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm shadow-xl max-w-sm">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
        <Link href="/app/accounting" className="hover:text-slate-600 transition-colors">
          Accounting
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link
          href="/app/accounting/accounts/overview"
          className="hover:text-slate-600 transition-colors"
        >
          Accounts
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-500 font-medium">{account.name}</span>
      </div>

      {/* Page header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <Link href="/app/accounting/accounts/overview">
            <Button variant="outline" size="icon-sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="default" size="md" className="font-mono text-xs">
                {account.code}
              </Badge>
              <h1 className="text-2xl font-bold text-slate-900">{account.name}</h1>
              <Badge variant="success" dot size="md">
                {account.status}
              </Badge>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {account.account_type} · {account.subcategory} · {account.currency}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
            onClick={() => showToast(isLive ? "Click any field below to edit it inline" : "This is a sample account — editing is disabled")}
          >
            Edit
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />} onClick={exportStatement} disabled={txns.length === 0}>
            Export
          </Button>
          <ConfirmDialog
            title="Delete account?"
            description="This permanently removes the ledger account. This cannot be undone."
            confirmLabel="Delete"
            onConfirm={deleteAccount}
          >
            {(open) => (
              <ActionMenu
                items={[
                  { label: "View All Transactions", icon: ChevronRight, onClick: () => router.push("/app/accounting/accounts/journal-ledger") },
                  { label: "Export Statement (CSV)", icon: Download, onClick: exportStatement },
                  { label: account.status === "Active" ? "Deactivate Account" : "Activate Account", icon: History, onClick: () => isLive ? saveField("status", account.status === "Active" ? "Inactive" : "Active").then(() => showToast("Status updated")).catch(() => showToast("Could not update")) : showToast("Sample account — actions persist once saved") },
                  { label: "Delete Account", icon: Trash2, onClick: open, variant: "danger" },
                ]}
              />
            )}
          </ConfirmDialog>
        </div>
      </div>

      {/* KPI cards row — live from the ledger */}
      <div className="flex gap-4 mb-6">
        <KpiCard
          label="Current Balance"
          value={fmtGBP(currentBalance)}
          sub={`Opening ${fmtGBP(account.opening_balance)}`}
          trend={null}
        />
        <KpiCard
          label="MTD Movement"
          value={`${mtdMovement >= 0 ? "+" : ""}${fmtGBP(mtdMovement)}`}
          sub="This calendar month"
          trend={mtdMovement > 0 ? "up" : mtdMovement < 0 ? "down" : null}
        />
        <KpiCard
          label="Posted Lines"
          value={String(txns.length)}
          sub="On this account"
          trend={null}
        />
        <KpiCard
          label="Last Transaction"
          value={lastTxn ? lastTxn.date : "—"}
          sub={lastTxn ? lastTxn.description : "No activity yet"}
          trend={null}
        />
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6 items-start">
        {/* Left column */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Account Activity */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
              <h2 className="text-sm font-semibold text-slate-900">Account Activity</h2>
              <span className="text-xs text-slate-500">Posted journal lines</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-[#E2E8F0]">
                    {["Date", "Reference", "Description", "Debit", "Credit", "Balance"].map(
                      (col) => (
                        <th
                          key={col}
                          className={cn(
                            "px-4 py-2.5 text-left font-semibold text-slate-500 whitespace-nowrap",
                            (col === "Debit" || col === "Credit" || col === "Balance") &&
                              "text-right"
                          )}
                        >
                          {col}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {txLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                        Loading account activity…
                      </td>
                    </tr>
                  ) : txns.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center">
                        <p className="text-sm font-medium text-slate-600">No posted transactions yet</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Activity appears here once journal entries touching this account are posted.
                        </p>
                        <Link
                          href="/app/accounting/accounts/journal-ledger"
                          className="inline-block mt-3 text-xs font-medium text-[#2563EB] hover:underline"
                        >
                          Go to Journal Ledger →
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    txns.map((tx, idx) => (
                      <tr
                        key={tx.reference + idx}
                        className={cn(
                          "border-b border-[#E2E8F0] last:border-0 hover:bg-slate-50 transition-colors",
                          idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                        )}
                      >
                        <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{tx.date}</td>
                        <td className="px-4 py-2.5 text-[#2563EB] font-mono whitespace-nowrap">
                          {tx.reference}
                        </td>
                        <td className="px-4 py-2.5 text-slate-700">{tx.description}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-[#EF4444] whitespace-nowrap">
                          {tx.debit != null ? fmtGBP(tx.debit) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-[#10B981] whitespace-nowrap">
                          {tx.credit != null ? fmtGBP(tx.credit) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                          {fmtGBP(tx.balance)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Account Details */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Account Details</h2>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-3">
              {([
                { label: "Code", field: "code", type: "text" as const },
                { label: "Name", field: "name", type: "text" as const },
                { label: "Type", field: "account_type", type: "select" as const, options: ["Assets", "Liabilities", "Equity", "Income", "Expenses"] },
                { label: "Subcategory", field: "subcategory", type: "text" as const },
                { label: "Currency", field: "currency", type: "select" as const, options: ["GBP", "USD", "EUR"] },
                { label: "Property Scope", field: "property_scope", type: "text" as const },
                { label: "Status", field: "status", type: "select" as const, options: ["Active", "Inactive"] },
              ]).map(({ label, field, type, options }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="text-sm font-medium text-slate-900">
                    <InlineEditField
                      value={(account as unknown as Record<string, string>)[field]}
                      type={type}
                      options={options?.map((o) => ({ value: o, label: o }))}
                      disabled={!isLive}
                      displayClassName="text-sm font-medium text-slate-900"
                      onSave={(v) => saveField(field, v)}
                    />
                  </dd>
                </div>
              ))}
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-slate-500">Created</dt>
                <dd className="text-sm font-medium text-slate-900">{account.created}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Right rail */}
        <div className="w-72 shrink-0 space-y-4">
          {/* Balance Trend — running balance across posted lines */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">Balance Trend</h3>
              <span className="text-xs text-slate-400">Running balance</span>
            </div>
            <BalanceTrendSvg data={trendData} />
            {trendData.length >= 2 && (
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-slate-400">{txns[txns.length - 1]?.date}</span>
                <span className="text-xs text-slate-400">{txns[0]?.date}</span>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                onClick={() => showToast(isLive ? "Click any field in Account Details to edit it inline" : "This is a sample account — editing is disabled")}
              >
                Edit Account
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                leftIcon={<ChevronRight className="w-3.5 h-3.5" />}
                onClick={() => router.push("/app/accounting/accounts/journal-ledger")}
              >
                View All Transactions
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                leftIcon={<Download className="w-3.5 h-3.5" />}
                onClick={exportStatement}
                disabled={txns.length === 0}
              >
                Export Statement
              </Button>
              <Button
                variant="destructive-soft"
                size="sm"
                className="w-full justify-start"
                onClick={() => isLive ? saveField("status", account.status === "Active" ? "Inactive" : "Active").then(() => showToast("Status updated")).catch(() => showToast("Could not update")) : showToast("Sample account — actions persist once saved")}
              >
                {account.status === "Active" ? "Deactivate Account" : "Activate Account"}
              </Button>
            </div>
          </div>

          {/* Account Summary */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Account Summary</h3>
            <dl className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Opening Balance</dt>
                <dd className="font-semibold text-slate-900">{fmtGBP(account.opening_balance)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Current Balance</dt>
                <dd className="font-semibold text-slate-900">{fmtGBP(currentBalance)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Normal Balance</dt>
                <dd className="font-medium text-slate-700 capitalize">{account.normal_balance}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Posted Lines</dt>
                <dd className="font-medium text-slate-700">{txns.length}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
