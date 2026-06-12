"use client"

import React, { useEffect, useState } from "react"
import {
  ChevronRight,
  Shield,
  CheckCircle2,
  Lock,
  PlugZap,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { AccountingKpiCard } from "@/features/accounting/components"
import { useWorkspace } from "@/providers/AuthProvider"
import { createClient } from "@/lib/supabase/client"
import { isMissingTable } from "@/features/accounting/ledger"

// Real HMRC MTD requires live OAuth against the HMRC sandbox/production APIs,
// which is out of scope for this release. The integration is gated behind a
// feature flag and surfaces an HONEST "not connected" readiness state — we never
// fabricate VAT submissions or obligations.
const MTD_ENABLED = process.env.NEXT_PUBLIC_MTD_ENABLED === "true"

interface MtdConnection {
  connected_status: string
  utr_id: string | null
  agent_id: string | null
  last_synced_at: string | null
}

export default function MtdPage() {
  const { workspace } = useWorkspace()
  const [connection, setConnection] = useState<MtdConnection | null>(null)
  const [loading, setLoading] = useState(true)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  function showToast(m: string) { setToastMsg(m); setTimeout(() => setToastMsg(null), 3500) }

  useEffect(() => {
    if (!workspace?.id) { setLoading(false); return }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("accounting_mtd_connections")
          .select("connected_status, utr_id, agent_id, last_synced_at")
          .eq("workspace_id", workspace.id)
          .maybeSingle()
        if (cancelled) return
        if (error) {
          if (!isMissingTable(error)) throw error
          setConnection(null)
        } else {
          setConnection((data as MtdConnection) ?? null)
        }
      } catch {
        if (!cancelled) setConnection(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [workspace?.id])

  // Honest connection state: connected only if the flag is on AND a real
  // connection row reports "connected".
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
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Accounting</span>
            <ChevronRight className="w-3 h-3" />
            <span>Making Tax Digital</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" size="md">05 · Making Tax Digital</Badge>
            <h1 className="text-2xl font-bold text-slate-900">Making Tax Digital</h1>
          </div>
          <p className="text-sm text-slate-500">Connect to HMRC for MTD when the integration is enabled. No submissions are simulated.</p>
        </div>
      </div>

      {/* Connection state */}
      {loading ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-12 text-center text-sm text-slate-400">
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
        // ── Honest "not connected" readiness state ──────────────────────────
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-8 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
              {MTD_ENABLED ? <PlugZap className="w-6 h-6 text-[#2563EB]" /> : <Lock className="w-6 h-6 text-slate-400" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Not connected to HMRC</h2>
              <p className="text-sm text-slate-500 mt-1 max-w-lg">
                {MTD_ENABLED
                  ? "Connect your business to HMRC via Making Tax Digital to manage quarterly obligations. You'll be redirected to HMRC to authorise access."
                  : "The HMRC Making Tax Digital integration is not yet enabled for this environment. It requires live HMRC OAuth, so no obligations, returns or VAT figures are shown until a real connection is established."}
              </p>
            </div>
            {MTD_ENABLED ? (
              <Button variant="primary" size="sm" leftIcon={<Shield className="w-3.5 h-3.5" />} onClick={() => showToast("HMRC authorisation flow starts here once configured")}>
                Connect HMRC
              </Button>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
                <Lock className="w-3.5 h-3.5" /> Coming soon — feature flagged off
              </span>
            )}
          </div>

          {/* Readiness checklist — what MTD will provide, honestly labelled */}
          <div className="border-t border-[#E2E8F0] px-6 py-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">What connecting unlocks</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: "Quarterly obligations", desc: "Pulled live from HMRC — never simulated." },
                { title: "Submit returns", desc: "Income & expense totals from your ledger, submitted to HMRC." },
                { title: "Acknowledgement refs", desc: "Real receipt references returned by HMRC on submission." },
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
                Until HMRC is connected, prepare your figures using the live{" "}
                <a href="/app/accounting/reports" className="font-semibold underline">Financial Reports</a>{" "}
                (P&amp;L computed from your ledger).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Row — honest placeholders (no fabricated tax figures) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AccountingKpiCard label="Connection" value={isConnected ? "Connected" : "Not connected"} subtitle="MTD for Income Tax" trendNeutral />
        <AccountingKpiCard label="Obligations" value={isConnected ? "Live from HMRC" : "—"} subtitle={isConnected ? "Synced" : "Connect to view"} trendNeutral />
        <AccountingKpiCard label="Returns Submitted" value={isConnected ? "Live from HMRC" : "—"} subtitle={isConnected ? "Synced" : "Connect to view"} trendNeutral />
        <AccountingKpiCard label="Integration" value={MTD_ENABLED ? "Enabled" : "Disabled"} subtitle="Feature flag" trendNeutral />
      </div>
    </div>
  )
}
