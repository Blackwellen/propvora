"use client"

import { useMemo, useState } from "react"
import { useSectionRouter } from "@/components/sections/SectionBasePath"
import { Activity, CheckCircle2, Clock, Download, Play, Plus, XCircle } from "lucide-react"
import AutomationsModuleShell from "../components/AutomationsModuleShell"
import AutomationsKpiCard from "../components/AutomationsKpiCard"
import AutomationsDataTable, { type DataColumn } from "../components/AutomationsDataTable"
import { AutomationsStatusBadge } from "../components/AutomationsBadges"
import { Btn, Card, CardHeader, useToast } from "../components/primitives"
import { useAutomationRunsLogs } from "../data/hooks"
import type { RunRow } from "../data/types"

export default function RunsLogsPage() {
  const router = useSectionRouter()
  const toast = useToast()
  const { data: runs, loading } = useAutomationRunsLogs()
  const [page, setPage] = useState(1)
  const [active, setActive] = useState<RunRow>(runs[0])
  const [detailTab, setDetailTab] = useState<"steps" | "payload" | "outputs" | "approvals" | "audit">("steps")

  const columns: DataColumn<RunRow>[] = useMemo(
    () => [
      { key: "ref", header: "Run ID", render: (r) => <span className="font-mono text-xs text-slate-600">{r.ref}</span> },
      { key: "automation", header: "Automation", render: (r) => <span className="font-medium text-slate-800">{r.automation}</span> },
      { key: "trigger", header: "Trigger", render: (r) => <span className="text-slate-500">{r.triggerEvent}</span> },
      { key: "status", header: "Status", render: (r) => <AutomationsStatusBadge status={r.status} /> },
      { key: "started", header: "Started", render: (r) => <span className="text-slate-500">{r.startedAt}</span> },
      { key: "duration", header: "Duration", render: (r) => <span className="text-slate-500">{r.duration}</span> },
      { key: "outputs", header: "Outputs", render: (r) => <span className="text-slate-600">{r.outputs}</span> },
      { key: "approvals", header: "Approvals", render: (r) => <span className="text-slate-600">{r.approvals}</span> },
      {
        key: "by", header: "Initiated by", render: (r) => (
          <span className="inline-flex items-center gap-1.5">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-slate-100 text-[9px] font-semibold text-slate-500">{r.initiatedBy.split(" ").map((p) => p[0]).join("")}</span>
            <span className="text-xs text-slate-500">{r.initiatedKind}</span>
          </span>
        ),
      },
    ],
    [],
  )

  const actions = (
    <>
      <Btn icon={Download} onClick={() => toast("Exporting logs…")}>Export logs</Btn>
      <Btn icon={Play} onClick={() => toast("Run preview — simulates without side effects")}>Run preview</Btn>
      <Btn onClick={() => toast("Opening monitoring")}>Open monitoring</Btn>
      <Btn icon={Plus} variant="primary" onClick={() => router.push("/property-manager/automations/canvas")}>New automation</Btn>
    </>
  )

  return (
    <AutomationsModuleShell
      title="Automations"
      subtitle="Review-first portfolio automation that proposes safe, reversible next steps."
      icon={Activity}
      actions={actions}
    >
      {(() => {
        const total = runs.length
        const failed = runs.filter((r) => r.status === "failed").length
        const succeeded = runs.filter((r) => r.status === "success").length
        const successRate = total > 0 ? `${Math.round((succeeded / total) * 100)}%` : "—"
        return (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <AutomationsKpiCard label="Total runs" value={total} icon={Activity} tone="blue" />
            <AutomationsKpiCard label="Success rate" value={successRate} icon={CheckCircle2} tone="emerald" />
            <AutomationsKpiCard label="Failed runs" value={failed} icon={XCircle} tone="red" />
            <AutomationsKpiCard label="Logged runs" value={total} icon={Clock} tone="violet" />
          </div>
        )
      })()}

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1fr_320px]">
        <div>
          <Card>
            <CardHeader title="Recent runs" />
            {loading ? (
              <div className="h-64 animate-pulse bg-slate-100" />
            ) : (
              <AutomationsDataTable
                columns={columns}
                rows={runs}
                page={page}
                pageSize={10}
                total={runs.length}
                onPageChange={setPage}
                onRowClick={(r) => setActive(r)}
                activeRowId={active?.id}
              />
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Queue backlog" />
            <div className="p-3 space-y-1.5 text-sm">
              {([
                ["Failed runs", runs.filter((r) => r.status === "failed").length],
                ["Skipped runs", runs.filter((r) => r.status === "skipped").length],
                ["Successful runs", runs.filter((r) => r.status === "success").length],
              ] as [string, number][]).map(([l, v]) => (
                <div key={l} className="flex justify-between"><span className="text-slate-600">{l}</span><span className="font-medium text-slate-900">{v}</span></div>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader title="Run history" />
            <div className="p-4 text-xs text-slate-400">
              Run-volume and error trends appear here once your automations have execution history.
            </div>
          </Card>
        </div>
      </div>

      {/* Selected run detail */}
      {active && (
        <Card className="mt-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-slate-700">{active.ref}</span>
              <AutomationsStatusBadge status={active.status} />
            </div>
            <div className="flex gap-1">
              {(["steps", "payload", "outputs", "approvals", "audit"] as const).map((t) => (
                <button key={t} onClick={() => setDetailTab(t)} className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${detailTab === t ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-50"}`}>
                  {t === "steps" ? "Run steps" : t === "payload" ? "Payload summary" : t === "outputs" ? "Outputs (0)" : t === "approvals" ? "Approvals (0)" : "Audit trail"}
                </button>
              ))}
            </div>
          </div>
          <div className="p-4">
            {detailTab === "steps" && (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-200 text-left text-[11px] uppercase text-slate-400"><th className="py-2">Step</th><th>Status</th><th>Duration</th><th>Started</th><th>Details</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {(active.steps ?? [{ step: "Run completed", status: active.status, duration: active.duration, startedAt: active.startedAt, details: "—" }]).map((s, i) => (
                    <tr key={i}>
                      <td className="py-2.5 text-slate-700">{s.step}</td>
                      <td><AutomationsStatusBadge status={s.status} /></td>
                      <td className="text-slate-500">{s.duration}</td>
                      <td className="text-slate-500">{s.startedAt}</td>
                      <td className="text-slate-500">{s.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {detailTab === "payload" && (
              <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">{JSON.stringify({ run: active.ref, automation: active.automation, trigger: active.triggerEvent, context: { workspace_id: "ws_demo", records: 12 } }, null, 2)}</pre>
            )}
            {detailTab === "outputs" && <div className="py-8 text-center text-sm text-slate-400">No outputs produced for this run.</div>}
            {detailTab === "approvals" && <div className="py-8 text-center text-sm text-slate-400">No approvals created for this run.</div>}
            {detailTab === "audit" && (
              <ol className="space-y-3 border-l border-slate-200 pl-4 text-sm">
                <li><span className="text-slate-700">Run started</span> <span className="text-slate-400">· {active.startedAt}</span></li>
                <li><span className="text-slate-700">Steps executed</span> <span className="text-slate-400">· system</span></li>
                <li><span className="text-slate-700">Run {active.status}</span> <span className="text-slate-400">· {active.duration}</span></li>
              </ol>
            )}
          </div>
        </Card>
      )}
    </AutomationsModuleShell>
  )
}
