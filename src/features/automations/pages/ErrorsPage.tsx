"use client"

import { useEffect, useMemo, useState } from "react"
import { useSectionRouter } from "@/components/sections/SectionBasePath"
import { AlertTriangle, BellOff, Bug, CheckCircle2, Clock, Download, RefreshCw, Settings } from "lucide-react"
import AutomationsModuleShell from "../components/AutomationsModuleShell"
import AutomationsKpiCard from "../components/AutomationsKpiCard"
import AutomationsDataTable, { type DataColumn } from "../components/AutomationsDataTable"
import { AutomationsRiskBadge, AutomationsStatusBadge } from "../components/AutomationsBadges"
import { Btn, Card, useToast } from "../components/primitives"
import { useAutomationErrors } from "../data/hooks"
import { resolveAutomationError } from "@/lib/automation/error-actions"
import type { ErrorRow } from "../data/types"

function exportErrorsCsv(rows: ErrorRow[]) {
  const header = ["Ref", "Title", "Message", "Automation", "Severity", "Status", "First seen", "Latest seen", "Retries"]
  const csv = [
    header.join(","),
    ...rows.map((r) => [
      r.ref,
      `"${(r.title ?? "").replace(/"/g, '""')}"`,
      `"${(r.subtitle ?? "").replace(/"/g, '""')}"`,
      `"${(r.automation ?? "").replace(/"/g, '""')}"`,
      r.severity,
      r.status,
      r.firstSeen,
      r.latestSeen,
      r.retryCount,
    ].join(",")),
  ].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `automation-errors-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const STATUS_LABEL: Record<ErrorRow["status"], { label: string; status: string }> = {
  active: { label: "Active", status: "active" },
  needs_config: { label: "Needs config", status: "review" },
  resolved: { label: "Resolved", status: "resolved" },
}

export default function ErrorsPage() {
  const router = useSectionRouter()
  const toast = useToast()
  const { data: errors, loading, reload } = useAutomationErrors()
  const [tab, setTab] = useState("queue")
  const [page, setPage] = useState(1)
  const [active, setActive] = useState<ErrorRow | undefined>(undefined)
  const [resolving, setResolving] = useState(false)

  // Default the detail panel to the first error once data loads (useState init
  // runs before the async fetch resolves, so it can't capture the first row).
  useEffect(() => {
    setActive((cur) => cur ?? errors[0])
  }, [errors])

  async function markResolved(id: string) {
    if (resolving) return
    setResolving(true)
    try {
      const res = await resolveAutomationError(id)
      if (!res.ok) { toast(res.error || "Couldn't resolve this error."); return }
      toast("Error marked resolved")
      setActive(undefined)
      reload()
    } finally {
      setResolving(false)
    }
  }

  const openCount = errors.filter((e) => e.status === "active").length
  const needsConfig = errors.filter((e) => e.status === "needs_config").length
  const resolvedCount = errors.filter((e) => e.status === "resolved").length
  const TABS = [
    { id: "queue", label: "Error queue", count: openCount },
    { id: "needs_config", label: "Needs config", count: needsConfig },
    { id: "resolved", label: "Resolved", count: resolvedCount },
    { id: "all", label: "All errors", count: errors.length },
  ]
  const [detailTab, setDetailTab] = useState<"details" | "remediation">("details")
  const [selected, setSelected] = useState<string[]>([])

  const columns: DataColumn<ErrorRow>[] = useMemo(
    () => [
      {
        key: "issue", header: "Issue", render: (r) => (
          <div className="min-w-[200px]"><div className="font-medium text-slate-900">{r.title}</div><div className="text-xs text-slate-400">{r.subtitle}</div></div>
        ),
      },
      { key: "automation", header: "Affected automation", render: (r) => <span className="text-slate-600">{r.automation} <span className="text-slate-400">{r.automationRef}</span></span> },
      { key: "severity", header: "Severity", render: (r) => <AutomationsRiskBadge level={r.severity} /> },
      { key: "first", header: "First seen", render: (r) => <span className="text-slate-500">{r.firstSeen}</span> },
      { key: "latest", header: "Latest seen", render: (r) => <span className="text-slate-500">{r.latestSeen}</span> },
      { key: "record", header: "Impacted record", render: (r) => <span className="font-mono text-xs text-slate-500">{r.impactedRecord}</span> },
      { key: "retry", header: "Retries", render: (r) => <span className="text-slate-600">{r.retryCount}</span> },
      { key: "owner", header: "Owner", render: (r) => <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">{r.owner.split(" ").map((p) => p[0]).join("")}</span> },
      { key: "status", header: "Status", render: (r) => <AutomationsStatusBadge status={STATUS_LABEL[r.status].status} label={STATUS_LABEL[r.status].label} /> },
      { key: "menu", header: "", render: () => <button className="text-slate-400">⋯</button> },
    ],
    [],
  )

  const filteredErrors = useMemo(() => {
    if (tab === "all") return errors
    if (tab === "queue") return errors.filter((e) => e.status === "active")
    return errors.filter((e) => e.status === tab)
  }, [errors, tab])

  const actions = (
    <>
      <Btn icon={RefreshCw} onClick={() => reload()}>Refresh</Btn>
      <Btn icon={Download} disabled={errors.length === 0} onClick={() => exportErrorsCsv(errors)}>Export errors</Btn>
      <Btn icon={Settings} onClick={() => router.push("/property-manager/workspace-settings/automations")}>Alert settings</Btn>
    </>
  )

  return (
    <AutomationsModuleShell
      title="Errors"
      subtitle="Monitor, triage and resolve automation errors to keep your operations running smoothly."
      icon={AlertTriangle}
      iconTone="red"
      actions={actions}
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <AutomationsKpiCard label="Open errors" value={openCount} icon={Bug} tone="red" />
        <AutomationsKpiCard label="Critical" value={errors.filter((e) => e.severity === "critical").length} icon={AlertTriangle} tone="red" />
        <AutomationsKpiCard label="Needs config" value={needsConfig} icon={BellOff} tone="slate" />
        <AutomationsKpiCard label="Resolved" value={resolvedCount} icon={Clock} tone="violet" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`border-b-2 px-3.5 py-2.5 text-sm transition ${tab === t.id ? "border-blue-600 font-semibold text-blue-700" : "border-transparent font-medium text-slate-500 hover:text-slate-800"}`}>
            {t.label}{t.count != null && <span className="ml-1 text-slate-400">{t.count}</span>}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input placeholder="Search…" className="w-44 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
        {["Critical", "Active", "Resolved", "Needs config", "External integration", "More filters"].map((f) => (
          <span key={f} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">{f}</span>
        ))}
        <button aria-label="Refresh errors" onClick={() => reload()} className="ml-auto grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"><RefreshCw className="h-4 w-4" /></button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
        <div>
          {loading ? (
            <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
          ) : (
            <AutomationsDataTable
              columns={columns}
              rows={filteredErrors}
              selectable
              selectedIds={selected}
              onToggleRow={(id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))}
              onToggleAll={(c) => setSelected(c ? filteredErrors.map((r) => r.id) : [])}
              page={page}
              pageSize={8}
              total={filteredErrors.length}
              onPageChange={setPage}
              onRowClick={(r) => setActive(r)}
              activeRowId={active?.id}
            />
          )}
        </div>

        {active && (
          <Card>
            <div className="border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2"><h3 className="text-sm font-semibold text-slate-900">{active.title}</h3><AutomationsStatusBadge status="active" /></div>
              <div className="mt-0.5 text-xs text-slate-400">Occurred {active.firstSeen} · ID: {active.ref}</div>
              <div className="mt-2 flex gap-1">
                {(["details", "remediation"] as const).map((t) => (
                  <button key={t} onClick={() => setDetailTab(t)} className={`rounded-lg px-3 py-1 text-xs font-medium capitalize ${detailTab === t ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-50"}`}>{t}</button>
                ))}
              </div>
            </div>
            <div className="space-y-4 p-4 text-sm">
              {detailTab === "details" ? (
                <>
                  {active.severity === "critical" && (
                    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50/60 p-3 text-red-800">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>This is a critical error and needs prompt attention.</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <Stat label="Severity" value={active.severity} />
                    <Stat label="Status" value={STATUS_LABEL[active.status].label} />
                    <Stat label="First seen" value={active.firstSeen} />
                    <Stat label="Latest seen" value={active.latestSeen} />
                    <Stat label="Retry count" value={`${active.retryCount}`} />
                    <Stat label="Automation" value={active.automationRef} />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase text-slate-400">Error message</div>
                    <pre className="mt-1.5 overflow-x-auto whitespace-pre-wrap rounded-lg bg-slate-900 p-3 text-xs text-slate-100">{active.subtitle || active.title || "No error detail recorded."}</pre>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3">
                    <div className="text-[11px] font-semibold uppercase text-slate-400">Run logs</div>
                    <button onClick={() => router.push("/property-manager/automations/runs-logs")} className="mt-1 text-xs font-semibold text-blue-600 hover:underline">View step logs for the affected run</button>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                  <div className="text-[11px] font-semibold uppercase text-emerald-700">Resolve this error</div>
                  <p className="mt-2 text-emerald-900">
                    Once you&apos;ve fixed the underlying cause (or confirmed it no longer applies), mark this error resolved to clear it from the active queue. The next scheduled run re-evaluates the trigger automatically.
                  </p>
                  <Btn variant="emerald" icon={CheckCircle2} className="mt-3" disabled={active.status === "resolved" || resolving} onClick={() => void markResolved(active.id)}>
                    {active.status === "resolved" ? "Resolved" : resolving ? "Resolving…" : "Mark as resolved"}
                  </Btn>
                </div>
              )}
              <div className="rounded-xl border border-slate-200 p-3">
                <div className="text-[11px] font-semibold uppercase text-slate-400">Linked automation</div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-slate-700">{active.automation} <span className="text-slate-400">{active.automationRef}</span></span>
                  <button onClick={() => router.push("/property-manager/automations/my-automations")} className="text-xs font-semibold text-blue-600 hover:underline">View automation</button>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </AutomationsModuleShell>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-0.5 text-sm font-medium capitalize text-slate-800">{value}</div>
    </div>
  )
}
