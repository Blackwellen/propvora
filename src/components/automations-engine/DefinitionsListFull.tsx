"use client"

// Full definitions list for the operator automations hub.
// Shows automation_definitions rows with:
//   - Name, trigger type icon, last run timestamp, run count, enabled toggle
//   - Status badge: active / paused / draft
//   - "New automation" CTA → /property-manager/automations/canvas
//   - Inline run history per definition (automation_v2_runs)
// Data comes from /api/automations/definitions (GET + PATCH enable toggle).
// No mock data — all reads/writes go through the real API.

import React, { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  Zap, LayoutTemplate, Plus, Power, ChevronRight, History, Clock,
  CheckCircle2, XCircle, AlertCircle, Loader2, BarChart2, Eye,
  Bell, Shield, Wrench, CalendarCheck, FileText, AlertTriangle, MessageSquare,
  RefreshCw,
} from "lucide-react"
import { useWorkspace } from "@/providers/AuthProvider"

// ── Types ─────────────────────────────────────────────────────────────────────
interface DefinitionRow {
  id: string
  name: string
  enabled: boolean
  version: number
  source: string
  trigger: { type?: string; kind?: string } | null
  conditions: unknown
  actions: unknown
  created_at: string
  updated_at: string
  run_count?: number
  last_run_at?: string | null
  status?: "active" | "paused" | "draft"
}

interface RunRow {
  id: string
  definition_id: string | null
  status: string
  trigger_context: Record<string, unknown>
  started_at: string | null
  finished_at: string | null
  error: string | null
  is_dry_run: boolean
  created_at: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function relativeTime(ts: string | null | undefined): string {
  if (!ts) return "—"
  const diff = Date.now() - new Date(ts).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function absoluteTime(ts: string | null | undefined): string {
  if (!ts) return "—"
  return new Date(ts).toLocaleString()
}

function derivedStatus(def: DefinitionRow): "active" | "paused" | "draft" {
  if (def.status) return def.status
  if (!def.enabled) return "paused"
  if (def.version === 0) return "draft"
  return "active"
}

const TRIGGER_ICONS: Record<string, React.ElementType> = {
  rent_due: Bell,
  rent_overdue: Bell,
  cert_expiry: Shield,
  compliance_due_soon: Shield,
  compliance_overdue: Shield,
  maintenance_created: Wrench,
  job_completed: Wrench,
  booking_confirmed: CalendarCheck,
  tenancy_ending: Clock,
  portal_message: MessageSquare,
  invoice_overdue: AlertTriangle,
  default: Zap,
}

function triggerIcon(triggerType?: string): React.ElementType {
  if (!triggerType) return Zap
  for (const [key, Icon] of Object.entries(TRIGGER_ICONS)) {
    if (triggerType.includes(key)) return Icon
  }
  return Zap
}

function triggerLabel(triggerType?: string): string {
  if (!triggerType) return "No trigger"
  return triggerType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function StatusBadge({ status }: { status: "active" | "paused" | "draft" }) {
  const styles = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    paused: "bg-amber-50 text-amber-700 border-amber-200",
    draft: "bg-slate-100 text-slate-500 border-slate-200",
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${styles[status]}`}>
      {status === "active" && <CheckCircle2 className="h-2.5 w-2.5" />}
      {status === "paused" && <Power className="h-2.5 w-2.5" />}
      {status === "draft" && <FileText className="h-2.5 w-2.5" />}
      {status}
    </span>
  )
}

function RunStatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    succeeded: "bg-emerald-50 text-emerald-700",
    failed: "bg-red-50 text-red-600",
    running: "bg-[var(--brand-soft)] text-[var(--brand)]",
    queued: "bg-slate-100 text-slate-500",
    skipped: "bg-slate-100 text-slate-400",
    dry_run: "bg-violet-50 text-violet-600",
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${map[status] ?? "bg-slate-100 text-slate-500"}`}>
      {status === "succeeded" && <CheckCircle2 className="h-3 w-3" />}
      {status === "failed" && <XCircle className="h-3 w-3" />}
      {status === "running" && <Loader2 className="h-3 w-3 animate-spin" />}
      {status}
    </span>
  )
}

// ── Run history panel for a single definition ──────────────────────────────
function RunHistoryPanel({ definitionId, workspaceId }: { definitionId: string; workspaceId?: string }) {
  const [runs, setRuns] = useState<RunRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        params.set("definitionId", definitionId)
        if (workspaceId) params.set("workspaceId", workspaceId)
        const res = await fetch(`/api/automations/runs?${params.toString()}`, { cache: "no-store" })
        const json = await res.json()
        if (cancelled) return
        if (!res.ok) { setError(json.error ?? "Couldn't load runs."); return }
        setRuns(Array.isArray(json.runs) ? json.runs.slice(0, 50) : [])
      } catch {
        if (!cancelled) setError("Couldn't load runs.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [definitionId, workspaceId])

  if (loading) return (
    <div className="space-y-1.5 px-4 pb-3 pt-2">
      {[0, 1, 2].map((i) => <div key={i} className="h-9 animate-pulse rounded-lg bg-slate-100" />)}
    </div>
  )
  if (error) return <div className="px-4 pb-3 pt-2 text-xs text-red-600">{error}</div>
  if (runs.length === 0) return (
    <div className="flex items-center gap-2 px-4 pb-3 pt-2 text-xs text-slate-400">
      <History className="h-4 w-4" /> No runs recorded yet for this automation.
    </div>
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60 text-left">
            <th className="px-4 py-2 font-semibold text-slate-400 uppercase text-[10px]">Status</th>
            <th className="px-4 py-2 font-semibold text-slate-400 uppercase text-[10px]">Started</th>
            <th className="px-4 py-2 font-semibold text-slate-400 uppercase text-[10px]">Completed</th>
            <th className="px-4 py-2 font-semibold text-slate-400 uppercase text-[10px]">Trigger event</th>
            <th className="px-4 py-2 font-semibold text-slate-400 uppercase text-[10px]">Actions taken</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {runs.map((r) => {
            const triggerEvent = (r.trigger_context?.source as string) ?? (r.is_dry_run ? "preview" : "manual")
            const actionsSummary = (r.trigger_context?.actions_taken as string) ?? (r.is_dry_run ? "Dry run — no actions" : "—")
            return (
              <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                <td className="px-4 py-2"><RunStatusPill status={r.status} /></td>
                <td className="px-4 py-2 text-slate-500" title={absoluteTime(r.started_at)}>{relativeTime(r.started_at)}</td>
                <td className="px-4 py-2 text-slate-500" title={absoluteTime(r.finished_at)}>{relativeTime(r.finished_at)}</td>
                <td className="px-4 py-2 capitalize text-slate-600">{triggerEvent}</td>
                <td className="px-4 py-2 text-slate-500 max-w-[200px] truncate">{r.error ? <span className="text-red-600">{r.error}</span> : actionsSummary}</td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/property-manager/automations/runs/${r.id}`} className="text-[var(--brand)] hover:text-[var(--brand)]">
                    <Eye className="h-3.5 w-3.5" />
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export default function DefinitionsListFull() {
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id

  const [defs, setDefs] = useState<DefinitionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedTab, setExpandedTab] = useState<"details" | "runs">("details")

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (workspaceId) params.set("workspaceId", workspaceId)
      const res = await fetch(`/api/automations/definitions?${params.toString()}`, { cache: "no-store" })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? "Couldn't load automations."); return }
      setDefs(Array.isArray(json.definitions) ? json.definitions : [])
    } catch {
      setError("Couldn't load automations.")
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => { void load() }, [load])

  async function toggleEnabled(def: DefinitionRow) {
    setToggling(def.id)
    try {
      const params = new URLSearchParams()
      if (workspaceId) params.set("workspaceId", workspaceId)
      const res = await fetch(`/api/automations/definitions/${def.id}?${params.toString()}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          definition: {
            ...def,
            enabled: !def.enabled,
            trigger: def.trigger ?? {},
            conditions: def.conditions ?? {},
            actions: def.actions ?? [],
          },
        }),
      })
      if (res.ok) {
        setDefs((prev) => prev.map((d) => d.id === def.id ? { ...d, enabled: !d.enabled } : d))
      }
    } finally {
      setToggling(null)
    }
  }

  function toggleExpand(id: string, tab: "details" | "runs" = "details") {
    if (expandedId === id && expandedTab === tab) {
      setExpandedId(null)
    } else {
      setExpandedId(id)
      setExpandedTab(tab)
    }
  }

  if (loading) return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}
    </div>
  )

  if (error) return (
    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50/60 px-4 py-3 text-sm text-red-700">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
      <button onClick={() => void load()} className="ml-auto text-xs underline">Retry</button>
    </div>
  )

  if (defs.length === 0) return (
    <div className="grid place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-white text-slate-400 shadow-sm">
        <Zap className="h-5 w-5" />
      </span>
      <h3 className="mt-3 text-sm font-semibold text-slate-800">No automations yet</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        Build your first automation with the canvas builder or load one of the templates.
      </p>
      <div className="mt-4 flex items-center gap-2">
        <Link
          href="/property-manager/automations/canvas"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-3.5 py-2 text-sm font-medium text-white hover:bg-[var(--brand-strong)]"
        >
          <Plus className="h-4 w-4" /> New automation
        </Link>
        <Link
          href="/property-manager/automations/recipes"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <LayoutTemplate className="h-4 w-4" /> Browse templates
        </Link>
      </div>
    </div>
  )

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-800">{defs.length} automation{defs.length !== 1 ? "s" : ""}</span>
        <div className="flex items-center gap-2">
          <button onClick={() => void load()} title="Refresh" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <Link
            href="/property-manager/automations/canvas"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-[var(--brand-strong)]"
          >
            <Plus className="h-3.5 w-3.5" /> New automation
          </Link>
        </div>
      </div>

      {/* Definition rows */}
      {defs.map((def) => {
        const TriggerIcon = triggerIcon(def.trigger?.type)
        const status = derivedStatus(def)
        const isExpanded = expandedId === def.id
        const runCount = def.run_count ?? 0
        const lastRun = def.last_run_at

        return (
          <div key={def.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            {/* Main row */}
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
              {/* Icon + info */}
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${status === "active" ? "bg-[var(--brand-soft)] text-[var(--brand)]" : status === "paused" ? "bg-amber-50 text-amber-500" : "bg-slate-100 text-slate-400"}`}>
                  <TriggerIcon className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-semibold text-slate-900">{def.name}</span>
                    <StatusBadge status={status} />
                    {def.source === "canvas" && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-600">
                        <LayoutTemplate className="h-2.5 w-2.5" /> Canvas
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {triggerLabel(def.trigger?.type)}
                    </span>
                    <span className="flex items-center gap-1">
                      <BarChart2 className="h-3 w-3" />
                      {runCount} run{runCount !== 1 ? "s" : ""}
                    </span>
                    {lastRun && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Last run {relativeTime(lastRun)}
                      </span>
                    )}
                    <span>v{def.version}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                {/* Run history */}
                <button
                  onClick={() => toggleExpand(def.id, "runs")}
                  title="Run history"
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${isExpanded && expandedTab === "runs" ? "border-[var(--color-brand-100)] bg-[var(--brand-soft)] text-[var(--brand)]" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}
                >
                  <History className="h-3.5 w-3.5" /> Runs
                </button>
                {/* Canvas link */}
                <Link
                  href={`/property-manager/automations/canvas/${def.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  <LayoutTemplate className="h-3.5 w-3.5" /> Edit
                </Link>
                {/* Enable toggle */}
                <button
                  onClick={() => void toggleEnabled(def)}
                  disabled={toggling === def.id}
                  title={def.enabled ? "Pause automation" : "Enable automation"}
                  className={`inline-flex min-h-[32px] items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition disabled:opacity-50 ${def.enabled ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}
                >
                  {toggling === def.id
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Power className="h-3.5 w-3.5" />
                  }
                  {def.enabled ? "On" : "Off"}
                </button>
                <button
                  onClick={() => toggleExpand(def.id, "details")}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50"
                >
                  <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                </button>
              </div>
            </div>

            {/* Expanded panel */}
            {isExpanded && (
              <div className="border-t border-slate-100">
                {/* Tab strip */}
                <div className="flex gap-1 border-b border-slate-100 bg-slate-50/60 px-4 py-1.5">
                  <button
                    onClick={() => setExpandedTab("details")}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${expandedTab === "details" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setExpandedTab("runs")}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${expandedTab === "runs" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    Run history
                  </button>
                </div>

                {expandedTab === "details" && (
                  <div className="grid gap-3 px-4 py-3 text-xs sm:grid-cols-3">
                    <div>
                      <div className="text-[10px] font-semibold uppercase text-slate-400">Trigger</div>
                      <div className="mt-0.5 text-slate-700">{triggerLabel(def.trigger?.type)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold uppercase text-slate-400">Source</div>
                      <div className="mt-0.5 capitalize text-slate-700">{def.source}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold uppercase text-slate-400">Version</div>
                      <div className="mt-0.5 text-slate-700">v{def.version}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold uppercase text-slate-400">Created</div>
                      <div className="mt-0.5 text-slate-700">{absoluteTime(def.created_at)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold uppercase text-slate-400">Last updated</div>
                      <div className="mt-0.5 text-slate-700">{absoluteTime(def.updated_at)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold uppercase text-slate-400">Run count</div>
                      <div className="mt-0.5 text-slate-700">{runCount}</div>
                    </div>
                  </div>
                )}

                {expandedTab === "runs" && (
                  <RunHistoryPanel definitionId={def.id} workspaceId={workspaceId} />
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
