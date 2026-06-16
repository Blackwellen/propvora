"use client"

// Supplier-workspace Automations — full rebuild.
// Lists automation_definitions scoped to this supplier workspace with:
//   - Enable toggle (PATCH to /api/supplier/automations)
//   - Status badge: active / paused / draft
//   - Run history tab (reads /api/automations/runs?definitionId=...)
// Supplier-relevant triggers: lead_received, job_assigned, job_completed,
//   job_overdue, review_received. Actions: send_message, create_invoice_draft,
//   update_job_status, notify_team.
// NO mock data — everything comes from the real API.

import React, { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  Workflow,
  Sparkles,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  Power,
  History,
  ChevronRight,
  Plus,
  Eye,
  Clock,
  BarChart2,
  XCircle,
  Inbox,
  Wrench,
  FileText,
  Star,
  Bell,
  RefreshCw,
  Layers,
} from "lucide-react"
import { MobileTopBar } from "@/components/mobile"
import { SupplierPageHeader, SupplierCard, SupplierEmptyState } from "@/components/supplier-workspace/ui"

// ── Types ─────────────────────────────────────────────────────────────────────
interface RecipeDTO {
  slug: string
  name: string
  description: string
  domain: string
  minPlan: string
  recommended: boolean
  nodeCount: number
}

interface DefDTO {
  id: string
  name: string
  enabled: boolean
  trigger?: { type?: string }
  version?: number
  source?: string
  run_count?: number
  last_run_at?: string | null
  created_at?: string
  updated_at?: string
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

// ── Helpers ───────────────────────────────────────────────────────────────────
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

const SUPPLIER_TRIGGER_ICONS: Record<string, React.ElementType> = {
  lead_received: Inbox,
  job_assigned: Wrench,
  job_completed: CheckCircle2,
  job_overdue: AlertTriangle,
  review_received: Star,
}

function triggerIcon(triggerType?: string): React.ElementType {
  if (!triggerType) return Workflow
  for (const [key, Icon] of Object.entries(SUPPLIER_TRIGGER_ICONS)) {
    if (triggerType.includes(key)) return Icon
  }
  return Workflow
}

function triggerLabel(triggerType?: string): string {
  if (!triggerType) return "No trigger"
  const labels: Record<string, string> = {
    lead_received: "Lead received",
    job_assigned: "Job assigned",
    job_completed: "Job completed",
    job_overdue: "Job overdue",
    review_received: "Review received",
    work_task_created: "Task created",
    record_created: "Record created",
  }
  const normalized = triggerType.replace(/\./g, "_")
  return labels[normalized] ?? triggerType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function derivedStatus(def: DefDTO): "active" | "paused" | "draft" {
  if (!def.enabled) return "paused"
  if ((def.version ?? 0) === 0) return "draft"
  return "active"
}

function StatusBadge({ status }: { status: "active" | "paused" | "draft" }) {
  const styles: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    paused: "bg-amber-100 text-amber-700",
    draft: "bg-slate-100 text-slate-500",
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${styles[status]}`}
    >
      {status}
    </span>
  )
}

function RunStatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    succeeded: "bg-emerald-50 text-emerald-700",
    failed: "bg-red-50 text-red-600",
    running: "bg-blue-50 text-blue-600",
    queued: "bg-slate-100 text-slate-500",
    skipped: "bg-slate-100 text-slate-400",
    dry_run: "bg-violet-50 text-violet-600",
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${map[status] ?? "bg-slate-100 text-slate-500"}`}
    >
      {status === "succeeded" && <CheckCircle2 className="h-3 w-3" />}
      {status === "failed" && <XCircle className="h-3 w-3" />}
      {status === "running" && <Loader2 className="h-3 w-3 animate-spin" />}
      {status}
    </span>
  )
}

// ── Supplier template highlights ──────────────────────────────────────────────
const SUPPLIER_TEMPLATE_HIGHLIGHTS = [
  {
    slug: "lead-acknowledgement",
    name: "Lead received → acknowledge",
    description: "Auto-send an acknowledgement when a new lead arrives.",
    icon: Inbox,
    trigger: "lead_received",
    action: "send_message",
  },
  {
    slug: "job-assigned-notify",
    name: "Job assigned → notify team",
    description: "Notify your team when a job is assigned to your supplier account.",
    icon: Bell,
    trigger: "job_assigned",
    action: "notify_team",
  },
  {
    slug: "job-completed-invoice",
    name: "Job completed → invoice draft",
    description: "Auto-create an invoice draft when you mark a job complete.",
    icon: FileText,
    trigger: "job_completed",
    action: "create_invoice_draft",
  },
  {
    slug: "job-overdue-escalate",
    name: "Job overdue → escalate",
    description: "Alert your account owner when a job passes its due date.",
    icon: AlertTriangle,
    trigger: "job_overdue",
    action: "notify_team",
  },
  {
    slug: "review-received-thank",
    name: "Review received → thank customer",
    description: "Auto-send a thank-you message when a customer leaves a review.",
    icon: Star,
    trigger: "review_received",
    action: "send_message",
  },
]

// ── Run history for a single definition ───────────────────────────────────────
function RunHistoryPanel({ definitionId }: { definitionId: string }) {
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
        const res = await fetch(`/api/automations/runs?${params.toString()}`, { cache: "no-store" })
        const json = await res.json()
        if (cancelled) return
        if (!res.ok) {
          setError(json.error ?? "Couldn't load runs.")
          return
        }
        setRuns(Array.isArray(json.runs) ? json.runs.slice(0, 30) : [])
      } catch {
        if (!cancelled) setError("Couldn't load runs.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [definitionId])

  if (loading)
    return (
      <div className="space-y-1.5 px-4 pb-3 pt-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-9 animate-pulse rounded-lg bg-slate-100" />
        ))}
      </div>
    )
  if (error) return <div className="px-4 pb-3 pt-2 text-xs text-red-600">{error}</div>
  if (runs.length === 0)
    return (
      <div className="flex items-center gap-2 px-4 pb-3 pt-2 text-xs text-slate-400">
        <History className="h-4 w-4" /> No runs recorded yet.
      </div>
    )

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60 text-left">
            <th className="px-4 py-2 text-[10px] font-semibold uppercase text-slate-400">Status</th>
            <th className="px-4 py-2 text-[10px] font-semibold uppercase text-slate-400">Started</th>
            <th className="px-4 py-2 text-[10px] font-semibold uppercase text-slate-400">Completed</th>
            <th className="px-4 py-2 text-[10px] font-semibold uppercase text-slate-400">Trigger event</th>
            <th className="px-4 py-2 text-[10px] font-semibold uppercase text-slate-400">Actions taken</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {runs.map((r) => {
            const triggerEvent =
              (r.trigger_context?.source as string) ?? (r.is_dry_run ? "preview" : "manual")
            return (
              <tr key={r.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2">
                  <RunStatusPill status={r.status} />
                </td>
                <td className="px-4 py-2 text-slate-500" title={absoluteTime(r.started_at)}>
                  {relativeTime(r.started_at)}
                </td>
                <td className="px-4 py-2 text-slate-500" title={absoluteTime(r.finished_at)}>
                  {relativeTime(r.finished_at)}
                </td>
                <td className="px-4 py-2 capitalize text-slate-600">{triggerEvent}</td>
                <td className="max-w-[180px] truncate px-4 py-2 text-slate-500">
                  {r.error ? (
                    <span className="text-red-600">{r.error}</span>
                  ) : r.is_dry_run ? (
                    "Dry run — no actions"
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  <Link
                    href={`/supplier/automations/runs/${r.id}`}
                    className="text-teal-500 hover:text-teal-700"
                  >
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

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SupplierAutomationsPage() {
  const [recipes, setRecipes] = useState<RecipeDTO[]>([])
  const [defs, setDefs] = useState<DefDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [installing, setInstalling] = useState<string | null>(null)
  const [installed, setInstalled] = useState<Set<string>>(new Set())
  const [toggling, setToggling] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedTab, setExpandedTab] = useState<"details" | "runs">("details")
  const [showRecipes, setShowRecipes] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/supplier/automations", {
        headers: { "Content-Type": "application/json" },
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        setErr(json.error ?? "Couldn't load automations.")
        return
      }
      setRecipes(json.recipes ?? [])
      setDefs(json.definitions ?? [])
    } catch {
      setErr("Couldn't load automations.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function install(slug: string) {
    setInstalling(slug)
    try {
      const res = await fetch("/api/supplier/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      })
      const json = await res.json()
      if (res.ok && json.ok) {
        setInstalled((s) => new Set(s).add(slug))
        void load()
      } else {
        setErr(json.error ?? "Couldn't install the recipe.")
      }
    } catch {
      setErr("Couldn't install the recipe.")
    } finally {
      setInstalling(null)
    }
  }

  async function toggleEnabled(def: DefDTO) {
    setToggling(def.id)
    try {
      const res = await fetch("/api/supplier/automations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ definitionId: def.id, enabled: !def.enabled }),
      })
      if (res.ok) {
        setDefs((prev) =>
          prev.map((d) => (d.id === def.id ? { ...d, enabled: !d.enabled } : d)),
        )
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

  return (
    <div className="space-y-5">
      <MobileTopBar title="Automations" subtitle="Save time on routine work" />
      <SupplierPageHeader
        title="Automations"
        subtitle="Review-first automations for your supplier workspace. Install disabled — nothing runs until you enable it."
      />

      {/* Review-first banner */}
      <div className="flex items-start gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2.5 text-[12px] text-teal-800">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        Automations are review-first. Anything involving messages, invoices, or status changes
        requires your approval before it runs.
      </div>

      {err && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {err}
          <button
            onClick={() => {
              setErr(null)
              void load()
            }}
            className="ml-auto underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── My automations ─────────────────────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Your automations</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void load()}
              title="Refresh"
              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setShowRecipes((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${showRecipes ? "border-teal-300 bg-teal-50 text-teal-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
            >
              <Layers className="h-3.5 w-3.5" /> Templates
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : defs.length === 0 ? (
          <SupplierEmptyState
            icon={Workflow}
            title="No automations yet"
            description="Install a template below to get started. It installs as a disabled draft — nothing runs until you enable it."
          />
        ) : (
          <div className="space-y-3">
            {defs.map((def) => {
              const TriggerIcon = triggerIcon(def.trigger?.type)
              const status = derivedStatus(def)
              const isExpanded = expandedId === def.id
              const runCount = def.run_count ?? 0
              const lastRun = def.last_run_at

              return (
                <div
                  key={def.id}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
                >
                  <SupplierCard>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <span
                          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${status === "active" ? "bg-teal-50 text-teal-600" : status === "paused" ? "bg-amber-50 text-amber-500" : "bg-slate-100 text-slate-400"}`}
                        >
                          <TriggerIcon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate text-sm font-semibold text-slate-900">
                              {def.name ?? "Automation"}
                            </span>
                            <StatusBadge status={status} />
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                            <span>{triggerLabel(def.trigger?.type)}</span>
                            <span className="flex items-center gap-1">
                              <BarChart2 className="h-3 w-3" />
                              {runCount} run{runCount !== 1 ? "s" : ""}
                            </span>
                            {lastRun && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Last {relativeTime(lastRun)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => toggleExpand(def.id, "runs")}
                          title="Run history"
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${isExpanded && expandedTab === "runs" ? "border-teal-200 bg-teal-50 text-teal-700" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}
                        >
                          <History className="h-3.5 w-3.5" /> Runs
                        </button>
                        <button
                          onClick={() => void toggleEnabled(def)}
                          disabled={toggling === def.id}
                          className={`inline-flex min-h-[32px] items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition disabled:opacity-50 ${def.enabled ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-500"}`}
                        >
                          {toggling === def.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Power className="h-3.5 w-3.5" />
                          )}
                          {def.enabled ? "On" : "Off"}
                        </button>
                        <button
                          onClick={() => toggleExpand(def.id, "details")}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50"
                        >
                          <ChevronRight
                            className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                          />
                        </button>
                      </div>
                    </div>
                  </SupplierCard>

                  {isExpanded && (
                    <div className="border-t border-slate-100">
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
                            <div className="text-[10px] font-semibold uppercase text-slate-400">
                              Trigger
                            </div>
                            <div className="mt-0.5 text-slate-700">{triggerLabel(def.trigger?.type)}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-semibold uppercase text-slate-400">
                              Source
                            </div>
                            <div className="mt-0.5 capitalize text-slate-700">
                              {def.source ?? "template"}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-semibold uppercase text-slate-400">
                              Version
                            </div>
                            <div className="mt-0.5 text-slate-700">v{def.version ?? 1}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-semibold uppercase text-slate-400">
                              Created
                            </div>
                            <div className="mt-0.5 text-slate-700">{absoluteTime(def.created_at)}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-semibold uppercase text-slate-400">
                              Last updated
                            </div>
                            <div className="mt-0.5 text-slate-700">{absoluteTime(def.updated_at)}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-semibold uppercase text-slate-400">
                              Run count
                            </div>
                            <div className="mt-0.5 text-slate-700">{runCount}</div>
                          </div>
                        </div>
                      )}

                      {expandedTab === "runs" && <RunHistoryPanel definitionId={def.id} />}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Templates gallery ──────────────────────────────────────────────── */}
      {showRecipes && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">
            Supplier automation templates
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SUPPLIER_TEMPLATE_HIGHLIGHTS.map((t) => {
              const Icon = t.icon
              const done = installed.has(t.slug)
              return (
                <div
                  key={t.slug}
                  className="flex flex-col rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-teal-50 text-teal-600">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-semibold text-slate-900">{t.name}</span>
                  </div>
                  <p className="flex-1 text-[12px] leading-relaxed text-slate-500">{t.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5">
                        {triggerLabel(t.trigger)}
                      </span>
                      <ChevronRight className="h-3 w-3" />
                      <span className="rounded bg-slate-100 px-1.5 py-0.5">
                        {t.action.replace(/_/g, " ")}
                      </span>
                    </div>
                    <button
                      onClick={() => void install(t.slug)}
                      disabled={installing === t.slug || done}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${done ? "bg-emerald-50 text-emerald-700" : "bg-slate-900 text-white hover:bg-slate-800"}`}
                    >
                      {installing === t.slug ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : done ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                      {done ? "Installed" : installing === t.slug ? "Installing…" : "Install"}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Additional recipes from API */}
          {recipes.filter((r) => !SUPPLIER_TEMPLATE_HIGHLIGHTS.some((t) => t.slug === r.slug))
            .length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 text-xs font-semibold uppercase text-slate-400">
                More supplier recipes
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {recipes
                  .filter((r) => !SUPPLIER_TEMPLATE_HIGHLIGHTS.some((t) => t.slug === r.slug))
                  .map((r) => {
                    const done = installed.has(r.slug)
                    return (
                      <div
                        key={r.slug}
                        className="flex flex-col rounded-xl border border-slate-200 bg-white p-4"
                      >
                        <div className="mb-1 flex items-center gap-2">
                          <span className="grid h-7 w-7 place-items-center rounded-lg bg-violet-50 text-violet-600">
                            <Sparkles className="h-4 w-4" />
                          </span>
                          {r.recommended && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-semibold uppercase text-emerald-700">
                              Recommended
                            </span>
                          )}
                          <span className="ml-auto text-[10px] uppercase text-slate-400">
                            {r.domain}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-slate-900">{r.name}</div>
                        <p className="mt-1 flex-1 text-[12px] leading-relaxed text-slate-500">
                          {r.description}
                        </p>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">
                            {r.nodeCount} steps &middot; {r.minPlan}+
                          </span>
                          <button
                            onClick={() => void install(r.slug)}
                            disabled={installing === r.slug || done}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${done ? "bg-emerald-50 text-emerald-700" : "bg-slate-900 text-white hover:bg-slate-800"}`}
                          >
                            {installing === r.slug ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : done ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : null}
                            {done ? "Installed" : installing === r.slug ? "Installing…" : "Install"}
                          </button>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {!loading && recipes.length === 0 && (
            <p className="text-sm text-slate-400">No additional supplier recipes available.</p>
          )}
        </section>
      )}
    </div>
  )
}
