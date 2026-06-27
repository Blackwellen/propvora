"use client"

import React, { useState } from "react"
import { Activity, AlertTriangle, ShieldAlert, Boxes, Gauge, Cpu } from "lucide-react"
import NodeRegistryTable from "./NodeRegistryTable"

type Row = Record<string, unknown>

const STATUS_TONE: Record<string, string> = {
  succeeded: "bg-emerald-50 text-emerald-700", failed: "bg-rose-50 text-rose-700",
  running: "bg-[var(--brand-soft)] text-[var(--brand)]", queued: "bg-slate-100 text-slate-500",
  skipped: "bg-slate-100 text-slate-500", dry_run: "bg-violet-50 text-violet-700",
}

export default function AdminAutomationsClient({
  overview, runs, errors, abuse, registry, limits,
}: {
  overview: { definitions: number; activeDefinitions: number; runsTotal: number; runsFailed: number; approvalsPending: number; errorsOpen: number; killSwitchedNodes: number }
  runs: Row[]; errors: Row[]; abuse: Array<{ workspace_id: string; runs: number; failed: number }>
  registry: Row[]; limits: Row[]
}) {
  const [tab, setTab] = useState<"overview" | "runs" | "errors" | "abuse" | "registry" | "limits">("overview")
  const tabs = [
    { id: "overview", label: "Overview", icon: Gauge },
    { id: "runs", label: "Runs", icon: Activity },
    { id: "errors", label: "Errors", icon: AlertTriangle },
    { id: "abuse", label: "Abuse signals", icon: ShieldAlert },
    { id: "registry", label: "Node registry", icon: Cpu },
    { id: "limits", label: "Plan limits", icon: Boxes },
  ] as const

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium ${tab === t.id ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {[
            ["Definitions", overview.definitions],
            ["Active", overview.activeDefinitions],
            ["Runs total", overview.runsTotal],
            ["Runs failed", overview.runsFailed],
            ["Approvals pending", overview.approvalsPending],
            ["Errors open", overview.errorsOpen],
            ["Killed nodes", overview.killSwitchedNodes],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-medium text-slate-500">{label}</div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">{String(value)}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "runs" && (
        <Table cols={["Run", "Workspace", "Status", "When", "Error"]} rows={runs.map((r) => [
          shortId(r.id), shortId(r.workspace_id),
          <span key="s" className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_TONE[String(r.status)] ?? "bg-slate-100 text-slate-500"}`}>{String(r.status)}{r.is_dry_run ? " · dry" : ""}</span>,
          fmt(r.created_at), <span key="e" className="text-rose-600">{r.error ? String(r.error).slice(0, 60) : "—"}</span>,
        ])} empty="No runs recorded." />
      )}

      {tab === "errors" && (
        <Table cols={["Severity", "Message", "Node", "Workspace", "When", "Resolved"]} rows={errors.map((e) => [
          <span key="sev" className="capitalize">{String(e.severity)}</span>, String(e.message).slice(0, 70),
          e.node_type ? <span key="nt" className="font-mono text-[11px]">{String(e.node_type)}</span> : "—",
          shortId(e.workspace_id), fmt(e.created_at), e.resolved ? "Yes" : "No",
        ])} empty="No errors recorded." />
      )}

      {tab === "abuse" && (
        <Table cols={["Workspace", "Runs (recent)", "Failed", "Failure rate"]} rows={abuse.map((a) => [
          shortId(a.workspace_id), a.runs, a.failed,
          <span key="r" className={a.runs > 0 && a.failed / a.runs > 0.3 ? "font-semibold text-rose-600" : "text-slate-600"}>{a.runs > 0 ? `${Math.round((a.failed / a.runs) * 100)}%` : "0%"}</span>,
        ])} empty="No run volume to analyse yet." />
      )}

      {tab === "registry" && <NodeRegistryTable initial={registry as never} />}

      {tab === "limits" && (
        <Table cols={["Plan", "Active", "Runs/mo", "Nodes", "Webhooks", "Retention", "Canvas", "AI", "NL"]} rows={limits.map((l) => [
          String(l.plan), String(l.max_active), Number(l.max_runs_month).toLocaleString(), String(l.max_nodes), String(l.max_webhooks),
          `${l.retention_days}d`, String(l.canvas_access), String(l.ai_access), String(l.nl_access),
        ])} empty="No plan limits configured." />
      )}
    </div>
  )
}

function Table({ cols, rows, empty }: { cols: string[]; rows: React.ReactNode[][]; empty: string }) {
  if (rows.length === 0) return <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center text-sm text-slate-400">{empty}</div>
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500"><tr>{cols.map((c) => <th key={c} className="px-4 py-3">{c}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r, i) => <tr key={i}>{r.map((cell, j) => <td key={j} className="px-4 py-2.5 text-slate-700">{cell}</td>)}</tr>)}
          </tbody>
        </table>
      </div>
    </div>
  )
}
function shortId(v: unknown) { const s = String(v ?? ""); return <span className="font-mono text-[11px] text-slate-500">{s.slice(0, 8)}</span> }
function fmt(v: unknown) { try { return <span className="text-xs text-slate-500">{new Date(String(v)).toLocaleString()}</span> } catch { return "—" } }
