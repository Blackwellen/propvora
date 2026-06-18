"use client"

import { useMemo, useState } from "react"
import { useSectionRouter } from "@/components/sections/SectionBasePath"
import { Bot, ChevronDown, Download, FileEdit, Pause, Plus, Power, Trash2, Wand2 } from "lucide-react"
import AutomationsModuleShell from "../components/AutomationsModuleShell"
import AutomationsKpiCard from "../components/AutomationsKpiCard"
import AutomationsDataTable, { type DataColumn } from "../components/AutomationsDataTable"
import { AutomationsReviewFirstBadge } from "../components/AutomationsBadges"
import AutomationsRightRail from "../components/AutomationsRightRail"
import { Btn, Card, CardHeader, Toggle, useToast } from "../components/primitives"
import { Donut } from "../components/charts"
import { useMyAutomations } from "../data/hooks"
import type { AutomationRow, Health } from "../data/types"

const HEALTH_META: Record<Health, { label: string; cls: string; bars: number }> = {
  excellent: { label: "Excellent", cls: "text-emerald-600", bars: 4 },
  good: { label: "Good", cls: "text-blue-600", bars: 3 },
  fair: { label: "Fair", cls: "text-amber-600", bars: 2 },
  poor: { label: "Poor", cls: "text-red-600", bars: 1 },
  unknown: { label: "Unknown", cls: "text-slate-400", bars: 0 },
}

function HealthCell({ health }: { health: Health }) {
  const m = HEALTH_META[health]
  return (
    <span className="inline-flex items-center gap-2">
      <span className="flex items-end gap-0.5">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`w-1 rounded-sm ${i < m.bars ? m.cls.replace("text-", "bg-") : "bg-slate-200"}`} style={{ height: `${6 + i * 3}px` }} />
        ))}
      </span>
      <span className={`text-xs font-medium ${m.cls}`}>{m.label}</span>
    </span>
  )
}

export default function MyAutomationsPage() {
  const router = useSectionRouter()
  const toast = useToast()
  const { data: rows, loading } = useMyAutomations()
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<string[]>([])
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => Object.fromEntries(rows.map((r) => [r.id, r.enabled])))

  const columns: DataColumn<AutomationRow>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Automation name",
        render: (r) => (
          <div className="min-w-[200px]">
            <div className="font-medium text-slate-900">{r.name}</div>
            <div className="text-xs text-slate-400">{r.ref}</div>
          </div>
        ),
      },
      { key: "trigger", header: "Trigger", render: (r) => <span className="text-slate-600">{r.trigger}</span> },
      { key: "workflow", header: "Workflow", render: (r) => <span className="text-slate-500">{r.actionCount} actions · {r.actionsSummary}</span> },
      {
        key: "owner", header: "Owner", render: (r) => (
          <span className="grid h-6 w-6 place-items-center rounded-full bg-violet-100 text-[10px] font-semibold text-violet-700">{r.owner.split(" ").map((p) => p[0]).join("")}</span>
        ),
      },
      { key: "modules", header: "Modules", render: (r) => <div className="flex gap-1">{r.modules.map((m) => <span key={m} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{m}</span>)}</div> },
      { key: "lastRun", header: "Last run", render: (r) => <span className="text-slate-500">{r.lastRun}</span> },
      { key: "nextRun", header: "Next run", render: (r) => <span className="text-slate-500">{r.nextRun}</span> },
      { key: "health", header: "Execution health", render: (r) => <HealthCell health={r.health ?? "unknown"} /> },
      { key: "reviewFirst", header: "Review-first", render: (r) => <AutomationsReviewFirstBadge yes={r.reviewFirst} /> },
      { key: "version", header: "Version", render: (r) => <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">{r.version}</span> },
      {
        key: "enabled", header: "Enabled", render: (r) => (
          <Toggle on={enabled[r.id] ?? r.enabled} onChange={(v) => { setEnabled((s) => ({ ...s, [r.id]: v })); toast(v ? `${r.name} enabled` : `${r.name} paused`) }} />
        ),
      },
      { key: "menu", header: "", render: () => <button className="text-slate-400 hover:text-slate-700">⋯</button> },
    ],
    [enabled, toast],
  )

  function toggleRow(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }
  function toggleAll(checked: boolean) {
    setSelected(checked ? rows.map((r) => r.id) : [])
  }

  const actions = (
    <>
      <Btn icon={Wand2} variant="violet" onClick={() => router.push("/property-manager/automations/ai-builder")}>AI Builder</Btn>
      <Btn icon={ChevronDown} onClick={() => toast("Bulk actions menu")}>Bulk actions</Btn>
      <Btn icon={Download} onClick={() => toast("Exporting automations…")}>Export</Btn>
      <Btn icon={Plus} variant="primary" onClick={() => router.push("/property-manager/automations/canvas")}>New automation</Btn>
    </>
  )

  return (
    <AutomationsModuleShell
      title="My Automations"
      subtitle="Manage, monitor and optimise your portfolio automations."
      icon={Bot}
      actions={actions}
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <AutomationsKpiCard label="Live automations" value={128} trend="18%" icon={Power} tone="emerald" />
        <AutomationsKpiCard label="Paused" value={24} trend="9%" trendDir="down" icon={Pause} tone="slate" />
        <AutomationsKpiCard label="Review-first" value={36} trend="5%" icon={Bot} tone="violet" />
        <AutomationsKpiCard label="Failed" value={7} trend="22%" trendDir="down" icon={Trash2} tone="red" />
        <AutomationsKpiCard label="Draft" value={15} trend="7%" icon={FileEdit} tone="blue" />
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input placeholder="Search…" className="w-48 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
        {["Status", "Owner", "Module", "Frequency", "Last run", "Category"].map((f) => (
          <span key={f} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">{f}: All</span>
        ))}
        <button onClick={() => setSelected([])} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">Clear</button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-5 xl:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {loading ? (
            <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
          ) : (
            <AutomationsDataTable
              columns={columns}
              rows={rows}
              selectable
              selectedIds={selected}
              onToggleRow={toggleRow}
              onToggleAll={toggleAll}
              page={page}
              pageSize={8}
              total={128}
              onPageChange={setPage}
            />
          )}

          {selected.length > 0 && (
            <div className="sticky bottom-4 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-lg">
              <span className="text-sm font-medium text-slate-700">{selected.length} selected</span>
              <div className="ml-auto flex gap-2">
                <Btn variant="outline" onClick={() => toast(`Enabled ${selected.length}`)}>Enable</Btn>
                <Btn variant="outline" onClick={() => toast(`Disabled ${selected.length}`)}>Disable</Btn>
                <Btn variant="outline" onClick={() => toast(`Paused ${selected.length}`)}>Pause</Btn>
                <Btn variant="outline" onClick={() => toast("Moved to draft")}>Move to draft</Btn>
                <Btn variant="danger" onClick={() => { toast(`Deleted ${selected.length}`); setSelected([]) }}>Delete</Btn>
              </div>
            </div>
          )}
        </div>

        <AutomationsRightRail>
          <Card>
            <CardHeader title="Automation health" />
            <div className="flex items-center gap-4 p-4">
              <Donut
                size={130}
                centerLabel="128"
                centerSub="total"
                slices={[
                  { label: "Excellent", value: 68, color: "#10b981" },
                  { label: "Good", value: 32, color: "#3b82f6" },
                  { label: "Fair", value: 14, color: "#f59e0b" },
                  { label: "Poor", value: 7, color: "#ef4444" },
                  { label: "Unknown", value: 7, color: "#cbd5e1" },
                ]}
              />
              <div className="space-y-1 text-xs">
                {[["Excellent", 68, "bg-emerald-500"], ["Good", 32, "bg-blue-500"], ["Fair", 14, "bg-amber-500"], ["Poor", 7, "bg-red-500"], ["Unknown", 7, "bg-slate-300"]].map(([l, v, c]) => (
                  <div key={l as string} className="flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${c}`} /><span className="text-slate-600">{l}</span><span className="ml-auto font-medium text-slate-800">{v}</span></div>
                ))}
              </div>
            </div>
          </Card>
          <Card>
            <CardHeader title="Top performers" />
            <div className="p-3 space-y-1">
              {[["Rent overdue → draft chase", "99.2%"], ["Lead enquiry → auto response", "99.0%"], ["New maintenance → triage", "98.4%"]].map(([n, p]) => (
                <div key={n} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50"><span className="text-slate-700">{n}</span><span className="font-medium text-emerald-600">{p}</span></div>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader title="Needs review (18)" action={<button onClick={() => router.push("/property-manager/automations/approvals")} className="text-xs font-medium text-blue-600 hover:underline">Open</button>} />
            <div className="p-3 space-y-1">
              {["Supplier invoice → coding check", "Arrears threshold → alert", "Job completion → invoice"].map((n) => (
                <button key={n} onClick={() => router.push("/property-manager/automations/approvals")} className="block w-full rounded-lg px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50">{n}</button>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader title="Automation usage" />
            <div className="p-4">
              <div className="flex items-baseline justify-between text-sm"><span className="font-semibold text-slate-900">24,391</span><span className="text-slate-400">/ 50,000</span></div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-500" style={{ width: "48.8%" }} /></div>
              <div className="mt-1 text-xs text-slate-400">48.8% of monthly executions used</div>
            </div>
          </Card>
        </AutomationsRightRail>
      </div>
    </AutomationsModuleShell>
  )
}
