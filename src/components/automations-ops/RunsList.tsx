"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { History, ChevronRight, Filter, Play, Beaker } from "lucide-react"
import { useWorkspace } from "@/providers/AuthProvider"
import { ResponsiveTable } from "@/components/mobile"
import { RunStatusPill, relativeTime, absoluteTime, OpsEmptyState, OpsSkeleton, UpgradeNotice } from "./ui"

export interface RunRow {
  id: string
  workspace_id: string
  definition_id: string | null
  status: string
  trigger_context: Record<string, unknown>
  started_at: string | null
  finished_at: string | null
  error: string | null
  is_dry_run: boolean
  created_at: string
}

const STATUS_FILTERS: { id: string; label: string }[] = [
  { id: "all", label: "All" },
  { id: "succeeded", label: "Succeeded" },
  { id: "failed", label: "Failed" },
  { id: "skipped", label: "Skipped" },
  { id: "dry_run", label: "Dry run" },
  { id: "queued", label: "Queued" },
  { id: "running", label: "Running" },
]

function triggerSource(run: RunRow): string {
  const src = run.trigger_context?.source
  if (typeof src === "string" && src) return src
  return run.is_dry_run ? "preview" : "manual"
}

export default function RunsList() {
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id
  const router = useRouter()

  const [runs, setRuns] = useState<RunRow[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<string>("all")
  const [error, setError] = useState<string | null>(null)
  const [upgrade, setUpgrade] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      setUpgrade(null)
      try {
        const params = new URLSearchParams()
        if (workspaceId) params.set("workspaceId", workspaceId)
        const res = await fetch(`/api/automations/runs?${params.toString()}`, { cache: "no-store" })
        const json = await res.json()
        if (cancelled) return
        if (res.status === 402) { setUpgrade(json.error ?? "Automation isn't on your plan."); setRuns([]); return }
        if (!res.ok) { setError(json.error ?? "Couldn't load run history."); setRuns([]); return }
        setRuns(Array.isArray(json.runs) ? json.runs : [])
      } catch {
        if (!cancelled) setError("Couldn't load run history.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [workspaceId])

  const filtered = useMemo(
    () => (status === "all" ? runs : runs.filter((r) => r.status === status)),
    [runs, status],
  )

  const counts = useMemo(() => {
    const c = { total: runs.length, succeeded: 0, failed: 0, dry_run: 0 }
    for (const r of runs) {
      if (r.status === "succeeded") c.succeeded++
      else if (r.status === "failed") c.failed++
      else if (r.status === "dry_run") c.dry_run++
    }
    return c
  }, [runs])

  if (upgrade) return <UpgradeNotice message={upgrade} />

  return (
    <div className="space-y-5">
      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Total runs" value={counts.total} icon={History} tone="slate" />
        <Kpi label="Succeeded" value={counts.succeeded} icon={Play} tone="emerald" />
        <Kpi label="Failed" value={counts.failed} icon={Play} tone="red" />
        <Kpi label="Dry runs" value={counts.dry_run} icon={Beaker} tone="violet" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="h-4 w-4 shrink-0 text-slate-400" />
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setStatus(f.id)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              status === f.id
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50/60 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <OpsSkeleton rows={4} />
      ) : filtered.length === 0 ? (
        <OpsEmptyState
          icon={History}
          title={runs.length === 0 ? "No runs yet" : "No runs match this filter"}
          body={
            runs.length === 0
              ? "When an automation runs — manually, on a schedule, or via an inbound webhook — its outcome is recorded here."
              : "Try a different status filter to see more of your run history."
          }
        />
      ) : (
        <ResponsiveTable
          rows={filtered}
          mobile={{
            getKey: (r) => r.id,
            title: (r) => <span className="font-semibold text-slate-900">{triggerSource(r)} run</span>,
            subtitle: (r) => <span className="text-xs text-slate-500">{absoluteTime(r.created_at)}</span>,
            badge: (r) => <RunStatusPill status={r.status} />,
            onRowClick: (r) => router.push(`/property-manager/automations/runs/${r.id}`),
            fields: [
              { label: "Started", render: (r) => relativeTime(r.started_at) },
              { label: "Finished", render: (r) => relativeTime(r.finished_at) },
              { label: "Error", render: (r) => (r.error ? <span className="text-red-600">{r.error}</span> : "—"), hideWhenEmpty: false },
            ],
          }}
        >
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-left text-xs font-semibold uppercase text-slate-400">
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Started</th>
                  <th className="px-4 py-3">Finished</th>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => router.push(`/property-manager/automations/runs/${r.id}`)}
                    className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                  >
                    <td className="px-4 py-3"><RunStatusPill status={r.status} /></td>
                    <td className="px-4 py-3 capitalize text-slate-700">{triggerSource(r)}</td>
                    <td className="px-4 py-3 text-slate-500">{relativeTime(r.started_at)}</td>
                    <td className="px-4 py-3 text-slate-500">{relativeTime(r.finished_at)}</td>
                    <td className="px-4 py-3 text-slate-500" title={absoluteTime(r.created_at)}>{relativeTime(r.created_at)}</td>
                    <td className="px-4 py-3 text-right"><ChevronRight className="ml-auto h-4 w-4 text-slate-300" /></td>
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

function Kpi({ label, value, icon: Icon, tone }: { label: string; value: number; icon: React.ElementType; tone: "slate" | "emerald" | "red" | "violet" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-500",
    emerald: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
    violet: "bg-violet-50 text-violet-600",
  }
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <span className={`grid h-7 w-7 place-items-center rounded-lg ${tones[tone]}`}><Icon className="h-3.5 w-3.5" /></span>
      </div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  )
}
