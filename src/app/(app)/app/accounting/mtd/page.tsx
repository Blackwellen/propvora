"use client"

import React, { useEffect, useState } from "react"
import {
  ChevronRight,
  Shield,
  CheckCircle2,
  Lock,
  PlugZap,
  Info,
  Calendar,
  FileText,
  TrendingUp,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { AccountingKpiCard } from "@/features/accounting/components"
import { useWorkspace } from "@/providers/AuthProvider"
import { createClient } from "@/lib/supabase/client"
import { isMissingTable } from "@/features/accounting/ledger"
import { computeMtd, fmtGBP, fmtDate, type MtdComputation, type MtdPeriod } from "./obligations"

// Real HMRC MTD requires live OAuth against the HMRC sandbox/production APIs.
// The submission path is gated behind a feature flag AND a real connection row;
// until a genuine HMRC connection exists we never fabricate a submission or an
// obligation status returned by HMRC. The figures below are computed locally
// from the workspace's own ledger so a landlord can *prepare* their quarter.
const MTD_ENABLED = process.env.NEXT_PUBLIC_MTD_ENABLED === "true"

interface MtdConnection {
  connected_status: string
  utr_id: string | null
  agent_id: string | null
  last_synced_at: string | null
}

interface MtdSubmission {
  id: string
  period_label: string
  submitted_at: string | null
  hmrc_reference: string | null
  status: string
}

function periodStatusChip(status: MtdPeriod["status"]) {
  switch (status) {
    case "current": return { label: "In progress", cls: "bg-blue-50 text-blue-600" }
    case "open": return { label: "Ready to file", cls: "bg-amber-50 text-amber-600" }
    case "overdue": return { label: "Overdue", cls: "bg-red-50 text-red-600" }
    default: return { label: "Upcoming", cls: "bg-slate-100 text-slate-500" }
  }
}

export default function MtdPage() {
  const { workspace } = useWorkspace()
  const [connection, setConnection] = useState<MtdConnection | null>(null)
  const [submissions, setSubmissions] = useState<MtdSubmission[]>([])
  const [mtd, setMtd] = useState<MtdComputation | null>(null)
  const [loading, setLoading] = useState(true)
  const [computing, setComputing] = useState(true)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  function showToast(m: string) { setToastMsg(m); setTimeout(() => setToastMsg(null), 3500) }

  // Load the (optional) HMRC connection + any real submission history.
  useEffect(() => {
    if (!workspace?.id) { setLoading(false); return }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const supabase = createClient()
      try {
        const { data, error } = await supabase
          .from("accounting_mtd_connections")
          .select("connected_status, utr_id, agent_id, last_synced_at")
          .eq("workspace_id", workspace.id)
          .maybeSingle()
        if (!cancelled) {
          if (error && !isMissingTable(error)) throw error
          setConnection((data as MtdConnection) ?? null)
        }
      } catch {
        if (!cancelled) setConnection(null)
      }
      // Submission history (real rows only; empty until a true submission exists).
      try {
        const { data, error } = await supabase
          .from("accounting_mtd_submissions")
          .select("id, period_label, submitted_at, hmrc_reference, status")
          .eq("workspace_id", workspace.id)
          .order("submitted_at", { ascending: false })
        if (!cancelled && !error) setSubmissions((data as MtdSubmission[]) ?? [])
      } catch { /* table may not exist — no history */ }
      if (!cancelled) setLoading(false)
    })()
    return () => { cancelled = true }
  }, [workspace?.id])

  // Compute quarterly obligations from the live ledger.
  useEffect(() => {
    if (!workspace?.id) { setComputing(false); return }
    let cancelled = false
    ;(async () => {
      setComputing(true)
      try {
        const result = await computeMtd(workspace.id)
        if (!cancelled) setMtd(result)
      } catch {
        if (!cancelled) setMtd(null)
      } finally {
        if (!cancelled) setComputing(false)
      }
    })()
    return () => { cancelled = true }
  }, [workspace?.id])

  const isConnected = MTD_ENABLED && connection?.connected_status === "connected"

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm shadow-xl max-w-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Accounting</span>
            <ChevronRight className="w-3 h-3" />
            <span>Making Tax Digital</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="outline" size="md">05 · Making Tax Digital</Badge>
            <h1 className="text-2xl font-bold text-slate-900">Making Tax Digital</h1>
          </div>
          <p className="text-sm text-slate-500">
            MTD for Income Tax (ITSA){mtd ? ` · Tax year ${mtd.taxYearLabel}` : ""}. Quarterly figures are computed from your ledger; submission requires an HMRC connection.
          </p>
        </div>
        {isConnected ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#059669] shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" /> Connected
          </span>
        ) : (
          <Button
            variant={MTD_ENABLED ? "primary" : "secondary"}
            size="sm"
            leftIcon={MTD_ENABLED ? <Shield className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            disabled={!MTD_ENABLED}
            onClick={() => MTD_ENABLED && showToast("HMRC authorisation flow starts here once configured")}
            className="shrink-0"
          >
            {MTD_ENABLED ? "Connect HMRC" : "HMRC connection required"}
          </Button>
        )}
      </div>

      {/* Connection state */}
      {loading ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-8 text-center text-sm text-slate-400">
          Checking HMRC connection…
        </div>
      ) : isConnected ? (
        <div className="flex items-center justify-between gap-4 bg-white border border-[#E2E8F0] rounded-xl px-5 py-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#006A4E] flex items-center justify-center text-white text-xs font-bold shrink-0">HM</div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">Connected to HMRC</span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[10px] font-bold text-[#059669]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" /> Live
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {connection?.utr_id ? `UTR: ${connection.utr_id} · ` : ""}
                {connection?.agent_id ? `Agent: ${connection.agent_id} · ` : ""}
                {connection?.last_synced_at ? `Last synced: ${new Date(connection.last_synced_at).toLocaleString("en-GB")}` : "Awaiting first sync"}
              </p>
            </div>
          </div>
        </div>
      ) : (
        // ── Honest "not connected" readiness banner ─────────────────────────
        <div className="flex flex-col sm:flex-row items-start gap-4 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm px-5 py-5">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
            {MTD_ENABLED ? <PlugZap className="w-5 h-5 text-[#2563EB]" /> : <Lock className="w-5 h-5 text-slate-400" />}
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-slate-900">Not connected to HMRC</h2>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              {MTD_ENABLED
                ? "Authorise Propvora with HMRC to retrieve your live obligations and submit quarterly updates. Until then, the quarters below are prepared from your own ledger and cannot be filed."
                : "HMRC submission requires a live OAuth connection that is not yet configured for this environment. The quarters below are prepared from your own ledger so you can review your figures — no obligations or submissions are simulated."}
            </p>
          </div>
        </div>
      )}

      {/* KPI Row — computed from live ledger (real) + honest connection state */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AccountingKpiCard label="Income (year to date)" value={mtd ? fmtGBP(mtd.totalIncome) : "—"} subtitle={mtd ? `Tax year ${mtd.taxYearLabel}` : "Computing…"} trendNeutral />
        <AccountingKpiCard label="Expenses (year to date)" value={mtd ? fmtGBP(mtd.totalExpenses) : "—"} subtitle="From your ledger" trendNeutral />
        <AccountingKpiCard label="Net taxable" value={mtd ? fmtGBP(mtd.totalNet) : "—"} subtitle="Income − expenses" trendNeutral />
        <AccountingKpiCard label="Submissions filed" value={isConnected ? String(submissions.length) : "0"} subtitle={isConnected ? "Sent to HMRC" : "Connect to file"} trendNeutral />
      </div>

      {/* Quarterly obligations — computed locally, file gated on connection */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-900">Quarterly obligations{mtd ? ` · ${mtd.taxYearLabel}` : ""}</h3>
          </div>
          <span className="text-[11px] text-slate-400">Standard MTD ITSA periods</span>
        </div>

        {computing ? (
          <div className="p-8 text-center text-sm text-slate-400">Computing quarterly figures from your ledger…</div>
        ) : !mtd ? (
          <div className="p-8 text-center text-sm text-slate-400">Quarterly figures are unavailable.</div>
        ) : (
          <>
            {mtd.noData && (
              <div className="mx-5 mt-4 flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-100">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  No income or expense records were found for this tax year yet. Quarter totals will populate as you raise invoices and log expenses.
                </p>
              </div>
            )}
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-[#E2E8F0]">
                    {["Period", "Income", "Expenses", "Net", "Update due", "Status", ""].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mtd.periods.map((p) => {
                    const chip = periodStatusChip(p.status)
                    const canFile = isConnected && (p.status === "open" || p.status === "overdue")
                    return (
                      <tr key={p.key} className="border-b border-slate-100 last:border-0">
                        <td className="px-5 py-3.5 font-medium text-slate-800">{p.label}</td>
                        <td className="px-5 py-3.5 text-slate-700">{fmtGBP(p.income)}</td>
                        <td className="px-5 py-3.5 text-slate-700">{fmtGBP(p.expenses)}</td>
                        <td className="px-5 py-3.5 font-semibold text-slate-900">{fmtGBP(p.net)}</td>
                        <td className="px-5 py-3.5 text-slate-500">{fmtDate(p.dueDate)}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${chip.cls}`}>{chip.label}</span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            disabled={!canFile}
                            onClick={() => canFile && showToast("Submitting to HMRC requires the live connection — figures are ready to file")}
                            title={isConnected ? "" : "Connect HMRC to submit this period"}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8] disabled:text-slate-300 disabled:cursor-not-allowed"
                          >
                            {isConnected ? "File update" : "Connect to file"}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {mtd.periods.map((p) => {
                const chip = periodStatusChip(p.status)
                const canFile = isConnected && (p.status === "open" || p.status === "overdue")
                return (
                  <div key={p.key} className="px-5 py-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-800">{p.label}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${chip.cls}`}>{chip.label}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div><p className="text-slate-400">Income</p><p className="font-medium text-slate-700">{fmtGBP(p.income)}</p></div>
                      <div><p className="text-slate-400">Expenses</p><p className="font-medium text-slate-700">{fmtGBP(p.expenses)}</p></div>
                      <div><p className="text-slate-400">Net</p><p className="font-semibold text-slate-900">{fmtGBP(p.net)}</p></div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <p className="text-[11px] text-slate-400">Due {fmtDate(p.dueDate)}</p>
                      <button
                        disabled={!canFile}
                        onClick={() => canFile && showToast("Submitting to HMRC requires the live connection — figures are ready to file")}
                        className="text-xs font-semibold text-[#2563EB] disabled:text-slate-300 disabled:cursor-not-allowed"
                      >
                        {isConnected ? "File update" : "Connect to file"}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Submission history — real rows only */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-[#E2E8F0]">
          <FileText className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-900">Submission history</h3>
        </div>
        {submissions.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <FileText className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-500 font-medium">No submissions yet</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Filed quarterly updates and their HMRC acknowledgement references will appear here once you connect and submit.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-[#E2E8F0]">
                {["Period", "Submitted", "HMRC reference", "Status"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-5 py-3.5 font-medium text-slate-800">{s.period_label}</td>
                  <td className="px-5 py-3.5 text-slate-600">{s.submitted_at ? fmtDate(s.submitted_at) : "—"}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{s.hmrc_reference ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600">{s.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* What connecting unlocks + cross-link to live reports */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm px-5 py-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-900">What connecting HMRC unlocks</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "Live obligations", desc: "Periods and deadlines pulled directly from HMRC — never simulated." },
            { title: "Submit updates", desc: "The quarterly income & expense figures above, filed to HMRC for ITSA." },
            { title: "Acknowledgement refs", desc: "Real receipt references returned by HMRC, stored in your history." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-[#E2E8F0] p-4">
              <p className="text-sm font-semibold text-slate-800">{f.title}</p>
              <p className="text-xs text-slate-500 mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-start gap-2.5 p-3 rounded-lg bg-blue-50 border border-blue-100">
          <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            Need a full breakdown before filing? Use the live{" "}
            <a href="/app/accounting/reports" className="font-semibold underline">Financial Reports</a>{" "}
            (P&amp;L computed from your ledger).
          </p>
        </div>
      </div>
    </div>
  )
}
