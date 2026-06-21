"use client"

import React, { useMemo, useState } from "react"
import {
  ChevronRight,
  FileText,
  Plus,
  Eye,
  Download,
  Shield,
  X,
  CheckCircle2,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { Badge } from "@/components/ui/Badge"
import { AccountingKpiCard } from "@/features/accounting/components"
import { useClientAccounts } from "@/features/accounting/hooks"
import { useWorkspace } from "@/providers/AuthProvider"
import { createClient } from "@/lib/supabase/client"
import { isMissingTable, fmtGBP, toCsv, downloadCsv, writeAudit } from "@/features/accounting/ledger"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import { ResponsiveTable, type MobileCardMapping } from "@/components/mobile/ResponsiveTable"

type ClientAccount = ReturnType<typeof useClientAccounts>["data"][number]

const HEALTH_STYLES: Record<string, string> = {
  "Excellent": "bg-[#ECFDF5] text-[#059669]",
  "Good": "bg-[#EFF6FF] text-[#2563EB]",
  "Fair": "bg-[#FFFBEB] text-[#d97706]",
  "Needs Attention": "bg-[#FFF7ED] text-[#ea580c]",
}

export default function ClientAccountsPage() {
  const { workspace } = useWorkspace()
  const { data: accounts, loading, refetch } = useClientAccounts()
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  function showToast(m: string) { setToastMsg(m); setTimeout(() => setToastMsg(null), 3500) }
  const [search, setSearch] = useState("")
  const [showDrawer, setShowDrawer] = useState(false)

  // Disbursement form
  const [dClient, setDClient] = useState("")
  const [dPayee, setDPayee] = useState("")
  const [dAmount, setDAmount] = useState("")
  const [dCategory, setDCategory] = useState("Repairs & Maintenance")
  const [dDate, setDDate] = useState(new Date().toISOString().slice(0, 10))
  const [dNote, setDNote] = useState("")
  const [saving, setSaving] = useState(false)
  const [drawerError, setDrawerError] = useState<string | null>(null)

  const totalHeld = useMemo(() => accounts.reduce((s, a) => s + a.balance, 0), [accounts])
  const filtered = accounts.filter(
    (a) => !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.code.toLowerCase().includes(search.toLowerCase())
  )

  function openDrawer() {
    setDClient(accounts[0]?.id ?? "")
    setDPayee(""); setDAmount(""); setDNote(""); setDrawerError(null)
    setShowDrawer(true)
  }

  function exportLedger() {
    if (accounts.length === 0) { showToast("Nothing to export"); return }
    const csv = toCsv(
      ["Client", "Code", "Balance", "Ringfenced", "Health"],
      accounts.map((a) => [a.name, a.code, a.balance.toFixed(2), a.ringfenced ? "Yes" : "No", a.health])
    )
    downloadCsv(`client-accounts-${new Date().toISOString().slice(0, 10)}.csv`, csv)
    showToast("Client ledger exported")
  }

  async function submitDisbursement() {
    setDrawerError(null)
    if (!workspace?.id) { setDrawerError("No active workspace."); return }
    if (!dClient) { setDrawerError("Select a client account."); return }
    if (!dPayee.trim()) { setDrawerError("Enter a payee."); return }
    const amount = parseFloat(dAmount)
    if (!amount || amount <= 0) { setDrawerError("Enter a valid amount."); return }
    const client = accounts.find((a) => a.id === dClient)
    if (client && amount > client.balance) {
      setDrawerError(`Amount exceeds the ringfenced balance (${fmtGBP(client.balance)}).`); return
    }
    setSaving(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("accounting_client_disbursements")
        .insert({
          workspace_id: workspace.id,
          client_account_id: dClient,
          payee: dPayee.trim(),
          amount,
          category: dCategory,
          disbursement_date: dDate,
          approval_status: "pending",
          notes: dNote || null,
        })
        .select("id")
        .single()
      if (error) {
        if (isMissingTable(error)) { setDrawerError("Disbursements table not provisioned yet."); return }
        throw error
      }
      await writeAudit(workspace.id, "client_disbursement", (data as { id: string }).id, "submitted", null, {
        client_account_id: dClient, amount, payee: dPayee.trim(),
      })
      showToast("Disbursement submitted for approval")
      setShowDrawer(false)
      refetch()
    } catch {
      setDrawerError("Could not submit disbursement.")
    } finally {
      setSaving(false)
    }
  }

  const cardMapping: MobileCardMapping<ClientAccount> = {
    getKey: (a) => a.id,
    title: (a) => a.name,
    subtitle: (a) => a.code,
    leading: (a) => (
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: a.color }}>
        {a.initials}
      </div>
    ),
    badge: (a) => <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-semibold", HEALTH_STYLES[a.health] ?? "bg-slate-100 text-slate-600")}>{a.health}</span>,
    fields: [
      { label: "Balance", render: (a) => <span className="font-bold tabular-nums">{fmtGBP(a.balance)}</span> },
      { label: "Ringfenced", render: (a) => a.ringfenced ? <span className="text-[#10B981] font-medium">Ringfenced</span> : "Not ringfenced" },
    ],
    actions: (a) => (
      <ActionMenu
        items={[
          { label: "View Account", icon: Eye, onClick: () => showToast(`${a.name} · ${fmtGBP(a.balance)}`) },
          { label: "New Disbursement", icon: Plus, onClick: () => { setDClient(a.id); openDrawer() } },
        ]}
      />
    ),
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6">
      <MobileTopBar
        title="Client Accounts"
        subtitle="Accounting"
        primaryAction={accounts.length > 0 ? { label: "New disbursement", icon: Plus, onClick: openDrawer } : undefined}
        overflowActions={accounts.length > 0 ? [{ label: "Export ledger", icon: FileText, onClick: exportLedger }] : undefined}
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
            <span>Client Accounts</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" size="md">Client Accounts</Badge>
            <h1 className="text-2xl font-bold text-slate-900">Client Accounts</h1>
          </div>
          <p className="text-sm text-slate-500">Client money held on behalf of landlords — ringfenced and audited.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" leftIcon={<FileText className="w-3.5 h-3.5" />} onClick={exportLedger} disabled={accounts.length === 0}>Export Ledger</Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={openDrawer} disabled={accounts.length === 0}>
            New Disbursement
          </Button>
        </div>
      </div>

      {/* Compliance Banner */}
      <div className="flex items-center justify-between gap-4 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl px-5 py-4">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-[#059669] shrink-0" />
          <p className="text-sm text-[#065F46]">
            <span className="font-semibold">Client money is held separately.</span>{" "}
            Ringfenced client funds are kept distinct from company operating funds, in line with client money protection requirements.
          </p>
        </div>
        <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#10B981] text-white whitespace-nowrap shrink-0">
          Ringfenced
        </span>
      </div>

      {/* KPI Row — live */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <AccountingKpiCard label="Client Money Held" value={fmtGBP(totalHeld)} subtitle="Total ringfenced funds" />
        <AccountingKpiCard label="Client Accounts" value={String(accounts.length)} subtitle="Across all portfolios" trendNeutral />
        <AccountingKpiCard label="Ringfenced" value={String(accounts.filter((a) => a.ringfenced).length)} subtitle="Protected accounts" trendNeutral />
        <AccountingKpiCard label="Need Attention" value={String(accounts.filter((a) => a.health === "Needs Attention").length)} subtitle="Health flags" trendNeutral />
      </div>

      {/* Client Account Register */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Client Account Register</h3>
            <p className="text-xs text-slate-500 mt-0.5">All ringfenced client money accounts</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients..."
              className="h-8 px-3 rounded-lg border border-[#E2E8F0] text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 w-48"
            />
            <ActionMenu
              items={[
                { label: "Export client ledger (CSV)", icon: Download, onClick: exportLedger },
                { label: "New disbursement", icon: Plus, onClick: openDrawer },
              ]}
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading client accounts…</div>
        ) : accounts.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#2563EB]" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No client accounts yet</p>
            <p className="text-xs text-slate-500 max-w-sm">
              Client (landlord) money accounts will appear here once created. Balances and disbursements are live and audited.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">No clients match your search.</div>
        ) : (
          <ResponsiveTable rows={filtered} mobile={cardMapping} className="p-3">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-[#E2E8F0]">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Client / Landlord</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-40">Account Balance</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-44">Ringfenced</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-36">Account Health</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((account, idx) => (
                  <tr key={account.id} className={cn("border-b border-[#E2E8F0] hover:bg-slate-50/50 transition-colors", idx === filtered.length - 1 && "border-0")}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: account.color }}>
                          {account.initials}
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-slate-900">{account.name}</p>
                          <p className="text-[11px] text-slate-500">{account.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-[13px] font-bold text-slate-900">{fmtGBP(account.balance)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      {account.ringfenced ? (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                          <span className="text-[12px] text-[#10B981] font-medium">Ringfenced</span>
                        </div>
                      ) : (
                        <span className="text-[12px] text-slate-500">Not ringfenced</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-semibold", HEALTH_STYLES[account.health] ?? "bg-slate-100 text-slate-600")}>
                        {account.health}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <ActionMenu
                        items={[
                          { label: "View Account", icon: Eye, onClick: () => showToast(`${account.name} · ${fmtGBP(account.balance)}`) },
                          { label: "New Disbursement", icon: Plus, onClick: () => { setDClient(account.id); openDrawer() } },
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

      {/* Disbursement Drawer */}
      {showDrawer && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm" onClick={() => setShowDrawer(false)} />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-[480px] bg-white border-l border-[#E2E8F0] shadow-2xl z-50 flex flex-col">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">New Disbursement</h2>
              <button onClick={() => setShowDrawer(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Client / Landlord <span className="text-[#EF4444]">*</span></label>
                <select
                  value={dClient}
                  onChange={(e) => setDClient(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 appearance-none"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.code}) — {fmtGBP(a.balance)}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Payee <span className="text-[#EF4444]">*</span></label>
                <input
                  type="text"
                  value={dPayee}
                  onChange={(e) => setDPayee(e.target.value)}
                  placeholder="e.g. Wickes Building Supplies Ltd"
                  className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Amount <span className="text-[#EF4444]">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">£</span>
                    <input
                      type="number" min="0" step="0.01"
                      value={dAmount}
                      onChange={(e) => setDAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full h-9 pl-7 pr-3 rounded-lg border border-[#E2E8F0] text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Disbursement Date</label>
                  <input
                    type="date"
                    value={dDate}
                    onChange={(e) => setDDate(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Reason / Category <span className="text-[#EF4444]">*</span></label>
                <select
                  value={dCategory}
                  onChange={(e) => setDCategory(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 appearance-none"
                >
                  <option>Repairs &amp; Maintenance</option>
                  <option>Management Fees</option>
                  <option>Utilities</option>
                  <option>Insurance</option>
                  <option>Professional Fees</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Supporting Note</label>
                <textarea
                  value={dNote}
                  onChange={(e) => setDNote(e.target.value)}
                  rows={3}
                  placeholder="Optional context for the approver…"
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 resize-none"
                />
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-lg bg-amber-50 border border-amber-100">
                <span className="text-amber-500 text-lg leading-none">⚠</span>
                <p className="text-xs text-amber-700 leading-relaxed">
                  This disbursement is submitted with status <span className="font-semibold">Pending Approval</span> and recorded in the audit trail.
                </p>
              </div>

              {drawerError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-xs text-red-700">{drawerError}</div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[#E2E8F0] flex items-center gap-3">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowDrawer(false)}>Cancel</Button>
              <Button variant="primary" size="sm" className="flex-1" onClick={submitDisbursement} disabled={saving}>
                {saving ? "Submitting…" : "Submit for Approval"}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
