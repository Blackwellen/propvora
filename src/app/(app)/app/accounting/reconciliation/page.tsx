"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ChevronRight,
  Upload,
  Plus,
  RefreshCw,
  Download,
  CheckCircle2,
  Calendar,
  Banknote,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { Badge } from "@/components/ui/Badge"
import { AccountingKpiCard, AccountingDonutCard } from "@/features/accounting/components"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"
import { isMissingTable, fmtGBP, toCsv, downloadCsv } from "@/features/accounting/ledger"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import { ResponsiveTable, type MobileCardMapping } from "@/components/mobile/ResponsiveTable"

interface StatementLine {
  id: string
  date: string
  description: string
  amount: number
  matched_status: "unmatched" | "matched" | "pending_review" | "excluded"
}

const TABS = [
  { key: "all", label: "All Transactions" },
  { key: "unmatched", label: "Unmatched" },
  { key: "matched", label: "Matched" },
  { key: "pending_review", label: "Pending Review" },
  { key: "excluded", label: "Excluded" },
] as const

export default function ReconciliationPage() {
  const { workspace } = useWorkspace()
  const [lines, setLines] = useState<StatementLine[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>("all")
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  function showToast(m: string) { setToastMsg(m); setTimeout(() => setToastMsg(null), 3500) }

  async function load() {
    if (!workspace?.id) { setLines([]); setLoading(false); return }
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("accounting_bank_statement_lines")
        .select("id, transaction_date, description, amount, matched_status")
        .eq("workspace_id", workspace.id)
        .order("transaction_date", { ascending: false })
      if (error) {
        if (isMissingTable(error)) { setLines([]); return }
        throw error
      }
      setLines(
        (data ?? []).map((r: Record<string, unknown>) => ({
          id: r.id as string,
          date: r.transaction_date as string,
          description: (r.description as string) ?? "",
          amount: Number(r.amount ?? 0),
          matched_status: ((r.matched_status as string) ?? "unmatched") as StatementLine["matched_status"],
        }))
      )
    } catch {
      setLines([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [workspace?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const counts = useMemo(() => {
    const c = { all: lines.length, unmatched: 0, matched: 0, pending_review: 0, excluded: 0 }
    for (const l of lines) c[l.matched_status]++
    return c
  }, [lines])

  const filtered = activeTab === "all" ? lines : lines.filter((l) => l.matched_status === activeTab)

  const reconciledPct = lines.length > 0 ? Math.round((counts.matched / lines.length) * 100) : 0

  function exportCsv() {
    if (lines.length === 0) { showToast("Nothing to export"); return }
    const csv = toCsv(
      ["Date", "Description", "Amount", "Status"],
      lines.map((l) => [l.date, l.description, l.amount.toFixed(2), l.matched_status])
    )
    downloadCsv(`reconciliation-${new Date().toISOString().slice(0, 10)}.csv`, csv)
    showToast("Statement lines exported")
  }

  const statusStyle: Record<StatementLine["matched_status"], string> = {
    matched: "bg-[#ECFDF5] text-[#059669]",
    unmatched: "bg-[#FEF2F2] text-[#dc2626]",
    pending_review: "bg-[#FFFBEB] text-[#d97706]",
    excluded: "bg-slate-100 text-slate-500",
  }

  const cardMapping: MobileCardMapping<StatementLine> = {
    getKey: (l) => l.id,
    title: (l) => l.description || "Statement line",
    subtitle: (l) => l.date,
    badge: (l) => (
      <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize", statusStyle[l.matched_status])}>
        {l.matched_status.replace("_", " ")}
      </span>
    ),
    fields: [
      {
        label: "Amount",
        render: (l) => <span className={cn("font-semibold tabular-nums", l.amount >= 0 ? "text-[#10B981]" : "text-[#EF4444]")}>{l.amount >= 0 ? "+" : ""}{fmtGBP(l.amount)}</span>,
      },
    ],
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6">
      <MobileTopBar
        title="Reconciliation"
        subtitle="Accounting"
        primaryAction={{ label: "Create manual transaction", icon: Plus, href: "/app/accounting/reconciliation/manual-transaction/new" }}
        overflowActions={[
          { label: "Import statement", icon: Upload, href: "/app/accounting/reconciliation/manual-transaction/new" },
          { label: "Refresh", icon: RefreshCw, onClick: load },
          { label: "Export statement lines", icon: Download, onClick: exportCsv },
        ]}
      />

      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm shadow-xl max-w-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="hidden md:flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Accounting</span>
            <ChevronRight className="w-3 h-3" />
            <span>Reconciliation</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" size="md">03 · Reconciliation</Badge>
            <h1 className="text-2xl font-bold text-slate-900">Reconciliation</h1>
          </div>
          <p className="text-sm text-slate-500">Match imported bank statement lines against your books to keep records accurate.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button variant="outline" size="sm" leftIcon={<Upload className="w-3.5 h-3.5" />} asChild>
            <Link href="/app/accounting/reconciliation/manual-transaction/new">Import Statement</Link>
          </Button>
          <Button variant="primary" size="sm" asChild leftIcon={<Plus className="w-3.5 h-3.5" />}>
            <Link href="/app/accounting/reconciliation/manual-transaction/new">Create Manual Transaction</Link>
          </Button>
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="w-3.5 h-3.5" />} onClick={load}>Refresh</Button>
          <ActionMenu
            items={[
              { label: "Export statement lines (CSV)", icon: Download, onClick: exportCsv },
            ]}
          />
        </div>
      </div>

      {/* KPI Row — live */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <AccountingKpiCard label="Statement Lines" value={String(counts.all)} subtitle="Imported lines" />
        <AccountingKpiCard label="Matched" value={String(counts.matched)} subtitle={lines.length > 0 ? `${reconciledPct}% of statement` : "—"} trendNeutral />
        <AccountingKpiCard label="Pending Review" value={String(counts.pending_review)} subtitle="Needs attention" trendNeutral />
        <AccountingKpiCard label="Unmatched" value={String(counts.unmatched)} subtitle="Awaiting match" />
        <AccountingKpiCard label="Excluded" value={String(counts.excluded)} subtitle="Set aside" trendNeutral />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white rounded-xl border border-[#E2E8F0] shadow-sm px-2 py-1.5 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
              activeTab === tab.key ? "bg-[#2563EB] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
            )}
          >
            {tab.label}
            <span className={cn(
              "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
              activeTab === tab.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
            )}>
              {tab.key === "all" ? counts.all : counts[tab.key as keyof typeof counts]}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Statement lines list */}
        <div className="w-full lg:flex-1 min-w-0 bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Bank Statement Lines</h3>
            <span className="text-xs text-slate-500">{filtered.length} shown</span>
          </div>
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-sm">Loading statement lines…</div>
          ) : lines.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                <Banknote className="w-5 h-5 text-[#2563EB]" />
              </div>
              <p className="text-sm font-semibold text-slate-700">No bank statement imported yet</p>
              <p className="text-xs text-slate-500 max-w-sm">
                Import a bank statement to begin reconciliation. Lines will appear here ready to match
                against posted journal entries — nothing is fabricated.
              </p>
              <Button variant="primary" size="sm" leftIcon={<Upload className="w-3.5 h-3.5" />} asChild>
                <Link href="/app/accounting/reconciliation/manual-transaction/new">Import Statement</Link>
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">No lines in this view.</div>
          ) : (
            <ResponsiveTable rows={filtered} mobile={cardMapping} className="p-3">
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-slate-50 border-b border-[#E2E8F0]">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Description</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-32">Amount</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-36">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l, idx) => (
                  <tr key={l.id} className={cn("border-b border-[#E2E8F0] hover:bg-slate-50/50 transition-colors", idx === filtered.length - 1 && "border-0")}>
                    <td className="px-5 py-3.5 text-[13px] text-slate-600 whitespace-nowrap">{l.date}</td>
                    <td className="px-4 py-3.5 text-[13px] text-slate-800">{l.description}</td>
                    <td className={cn("px-4 py-3.5 text-right text-[13px] font-semibold whitespace-nowrap", l.amount >= 0 ? "text-[#10B981]" : "text-[#EF4444]")}>
                      {l.amount >= 0 ? "+" : ""}{fmtGBP(l.amount)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize", statusStyle[l.matched_status])}>
                        {l.matched_status.replace("_", " ")}
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

        {/* Right rail */}
        <div className="w-full lg:w-72 shrink-0 space-y-4">
          <AccountingDonutCard
            title="Reconciliation Progress"
            subtitle={lines.length > 0 ? `${reconciledPct}% matched` : "No statement yet"}
            segments={
              lines.length > 0
                ? [
                    { label: "Matched", value: counts.matched, color: "#10B981", count: counts.matched },
                    { label: "Pending Review", value: counts.pending_review, color: "#F59E0B", count: counts.pending_review },
                    { label: "Unmatched", value: counts.unmatched, color: "#EF4444", count: counts.unmatched },
                    { label: "Excluded", value: counts.excluded, color: "#94A3B8", count: counts.excluded },
                  ].filter((s) => s.value > 0)
                : [{ label: "No data", value: 1, color: "#E2E8F0", count: 0 }]
            }
            centerValue={`${reconciledPct}%`}
            centerLabel="Reconciled"
            size={100}
          />

          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">How reconciliation works</h3>
            <ol className="space-y-2.5 text-xs text-slate-600 list-decimal list-inside">
              <li>Import a bank statement (CSV).</li>
              <li>Each line is matched to a posted journal entry.</li>
              <li>Unmatched lines become manual transactions you post to the ledger.</li>
            </ol>
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              <Calendar className="w-3.5 h-3.5" />
              <span>Matches are stored and audited.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
