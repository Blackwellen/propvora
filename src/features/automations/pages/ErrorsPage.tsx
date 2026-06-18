"use client"

import { useMemo, useState } from "react"
import { useSectionRouter } from "@/components/sections/SectionBasePath"
import { AlertTriangle, BellOff, Bug, Clock, Download, RefreshCw, Settings } from "lucide-react"
import AutomationsModuleShell from "../components/AutomationsModuleShell"
import AutomationsKpiCard from "../components/AutomationsKpiCard"
import AutomationsDataTable, { type DataColumn } from "../components/AutomationsDataTable"
import { AutomationsRiskBadge, AutomationsStatusBadge } from "../components/AutomationsBadges"
import { Btn, Card, useToast } from "../components/primitives"
import { useAutomationErrors } from "../data/hooks"
import type { ErrorRow } from "../data/types"

const TABS = [
  { id: "queue", label: "Error queue", count: 48 },
  { id: "incidents", label: "Incidents", count: 7 },
  { id: "muted", label: "Muted", count: 5 },
  { id: "resolved", label: "Resolved", count: 186 },
  { id: "all", label: "All errors" },
]

const STATUS_LABEL: Record<ErrorRow["status"], { label: string; status: string }> = {
  active: { label: "Active", status: "active" },
  needs_config: { label: "Needs config", status: "review" },
  resolved: { label: "Resolved", status: "resolved" },
}

export default function ErrorsPage() {
  const router = useSectionRouter()
  const toast = useToast()
  const { data: errors, loading } = useAutomationErrors()
  const [tab, setTab] = useState("queue")
  const [page, setPage] = useState(1)
  const [active, setActive] = useState<ErrorRow>(errors[0])
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

  const actions = (
    <>
      <Btn icon={RefreshCw} onClick={() => toast("Retrying failed runs…")}>Retry failed runs</Btn>
      <Btn icon={Download} onClick={() => toast("Exporting errors…")}>Export errors</Btn>
      <Btn icon={Settings} onClick={() => toast("Alert settings")}>Alert settings</Btn>
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
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <AutomationsKpiCard label="Open errors" value={48} trend="12%" icon={Bug} tone="red" />
        <AutomationsKpiCard label="Critical incidents" value={7} trend="75%" icon={AlertTriangle} tone="red" />
        <AutomationsKpiCard label="Muted alerts" value={5} trend="17%" trendDir="down" icon={BellOff} tone="slate" />
        <AutomationsKpiCard label="Retries pending" value={23} trend="5" icon={RefreshCw} tone="amber" />
        <AutomationsKpiCard label="Mean time to resolution" value="1h 42m" sub="-18m vs last week" icon={Clock} tone="violet" />
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
        <button onClick={() => toast("Refreshed")} className="ml-auto grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"><RefreshCw className="h-4 w-4" /></button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
        <div>
          {loading ? (
            <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
          ) : (
            <AutomationsDataTable
              columns={columns}
              rows={errors}
              selectable
              selectedIds={selected}
              onToggleRow={(id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))}
              onToggleAll={(c) => setSelected(c ? errors.map((r) => r.id) : [])}
              page={page}
              pageSize={8}
              total={48}
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
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50/60 p-3 text-red-800">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>This error is affecting automated payments and needs prompt attention.</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Stat label="Severity" value={active.severity} />
                    <Stat label="Status" value={STATUS_LABEL[active.status].label} />
                    <Stat label="First seen" value={active.firstSeen} />
                    <Stat label="Latest seen" value={active.latestSeen} />
                    <Stat label="Retry count" value={`${active.retryCount}`} />
                    <Stat label="Owner" value={active.owner} />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase text-slate-400">Error source</div>
                    <pre className="mt-1.5 overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">{`POST https://api.stripe.com/v1/charges\nError: ETIMEDOUT\nTrace ID: trc_${active.ref.toLowerCase()}`}</pre>
                    <button onClick={() => toast("Full stack trace")} className="mt-1.5 text-xs font-semibold text-blue-600 hover:underline">Show full stack trace</button>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3">
                    <div className="text-[11px] font-semibold uppercase text-slate-400">Failed step</div>
                    <p className="mt-1 text-slate-700">Step 4 of 6</p>
                    <button onClick={() => router.push("/property-manager/automations/runs-logs")} className="text-xs font-semibold text-blue-600 hover:underline">View step logs</button>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                  <div className="text-[11px] font-semibold uppercase text-emerald-700">Safe retry guidance</div>
                  <ul className="mt-2 space-y-1 text-emerald-900">
                    <li>Safe to retry: {active.safeToRetry ? "Yes" : "No"}</li>
                    <li>No side effects on retry</li>
                    <li>Retries remaining: {active.retriesRemaining}</li>
                  </ul>
                  <Btn variant="emerald" className="mt-3" disabled={!active.safeToRetry} onClick={() => toast("Retrying this error…")}>Retry this error</Btn>
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
