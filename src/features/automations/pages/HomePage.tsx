"use client"

import { useMemo, useState } from "react"
import { useSectionRouter } from "@/components/sections/SectionBasePath"
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  History,
  LayoutTemplate,
  Play,
  Plus,
  Sparkles,
  TrendingUp,
  Wand2,
  Workflow,
  Zap,
} from "lucide-react"
import AutomationsModuleShell from "../components/AutomationsModuleShell"
import AutomationsKpiCard from "../components/AutomationsKpiCard"
import AutomationsDataTable, { type DataColumn } from "../components/AutomationsDataTable"
import { AutomationsStatusBadge, AutomationsReviewFirstBadge, AutomationsRiskBadge } from "../components/AutomationsBadges"
import AutomationsRightRail from "../components/AutomationsRightRail"
import { Btn, Card, CardHeader, Modal, Toggle, useToast } from "../components/primitives"
import { useAutomationsHome } from "../data/hooks"
import { setAutomationEnabled } from "@/lib/automation/toggle"
import type { AutomationRow } from "../data/types"

type SubTab = "automations" | "inbox" | "activity" | "templates"

export default function HomePage({
  hiddenTabs,
  canvasEnabled = false,
}: {
  /** Tab labels to hide from the Automations tab strip (feature-flag gating). */
  hiddenTabs?: string[]
  /** Whether the canvasLite flag is ON — controls Canvas shortcut button visibility. */
  canvasEnabled?: boolean
}) {
  const router = useSectionRouter()
  const toast = useToast()
  const { automations, reviewQueue, activity } = useAutomationsHome()
  const [tab, setTab] = useState<SubTab>("automations")
  const [page, setPage] = useState(1)
  const [newOpen, setNewOpen] = useState(false)
  const [running, setRunning] = useState(false)

  // Manual "Run now" — evaluates this workspace's enabled automations through the
  // real engine (enqueue → drain). Idempotent server-side, so a double-click can't
  // duplicate runs. Refreshes the list so new runs/queue counts appear immediately.
  async function runNow() {
    if (running) return
    setRunning(true)
    try {
      const res = await fetch("/api/automations/run-now", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean; error?: string; upgrade?: boolean; executed?: number; enqueued?: number
      }
      if (!res.ok || !json.ok) {
        toast(json.upgrade ? "Automations aren't available on your current plan." : json.error || "Couldn't run automations right now.")
        return
      }
      const ran = (json.executed ?? 0) + (json.enqueued ?? 0)
      toast(ran > 0 ? `Ran automations — ${json.executed ?? 0} executed, ${json.enqueued ?? 0} queued for review.` : "No automations were due to run.")
      automations.reload()
    } catch {
      toast("Couldn't run automations right now. Please try again.")
    } finally {
      setRunning(false)
    }
  }
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    () => Object.fromEntries(automations.data.map((a) => [a.id, a.enabled])),
  )

  const rows = automations.data

  const columns: DataColumn<AutomationRow>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Automation",
        render: (r) => (
          <div className="min-w-[220px]">
            <div className="font-medium text-slate-900">{r.name}</div>
            <div className="text-xs text-slate-400">{r.ref}</div>
          </div>
        ),
      },
      { key: "category", header: "Category", render: (r) => <span className="text-slate-600">{r.category}</span> },
      { key: "trigger", header: "Trigger", render: (r) => <span className="text-slate-600">{r.trigger}</span> },
      { key: "actions", header: "Actions", render: (r) => <span className="text-slate-500">{r.actionsSummary}</span> },
      { key: "status", header: "Status", render: (r) => <AutomationsStatusBadge status={r.status} /> },
      { key: "lastChecked", header: "Last checked", render: (r) => <span className="text-slate-500">{r.lastChecked}</span> },
      {
        key: "owner",
        header: "Owner",
        render: (r) => (
          <span className="inline-flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-violet-100 text-[10px] font-semibold text-violet-700">
              {(r.owner ?? "").split(" ").filter(Boolean).map((p) => p[0]).join("")}
            </span>
            <span className="text-slate-600">{r.owner}</span>
          </span>
        ),
      },
      {
        key: "modules",
        header: "Modules",
        render: (r) => (
          <div className="flex flex-wrap gap-1">
            {r.modules.map((m) => (
              <span key={m} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                {m}
              </span>
            ))}
          </div>
        ),
      },
      { key: "frequency", header: "Frequency", render: (r) => <span className="text-slate-500">{r.frequency}</span> },
      { key: "reviewFirst", header: "Review-first", render: (r) => <AutomationsReviewFirstBadge yes={r.reviewFirst} /> },
      {
        key: "enabled",
        header: "Enabled",
        render: (r) => (
          <Toggle
            on={enabled[r.id] ?? r.enabled}
            onChange={async (v) => {
              setEnabled((s) => ({ ...s, [r.id]: v }))
              const res = await setAutomationEnabled(r.id, v)
              if (!res.ok) {
                setEnabled((s) => ({ ...s, [r.id]: !v }))
                toast("Couldn’t update — please try again.")
              } else {
                toast(v ? `${r.name} enabled` : `${r.name} paused`)
              }
            }}
            label="Enabled"
          />
        ),
      },
    ],
    [enabled, toast],
  )

  const actions = (
    <>
      <Btn icon={Play} onClick={() => void runNow()} disabled={running}>
        {running ? "Running…" : "Run now"}
      </Btn>
      <Btn icon={Wand2} variant="violet" onClick={() => router.push("/property-manager/automations/ai-builder")}>
        AI Builder
      </Btn>
      {canvasEnabled && (
        <Btn icon={LayoutTemplate} onClick={() => router.push("/property-manager/automations/canvas")}>
          Canvas
        </Btn>
      )}
      <Btn icon={Plus} variant="primary" onClick={() => setNewOpen(true)}>
        New automation
      </Btn>
    </>
  )

  const subTabs: { id: SubTab; label: string; badge?: number }[] = [
    { id: "automations", label: "Automations" },
    { id: "inbox", label: "Review inbox", badge: reviewQueue.length },
    { id: "activity", label: "Activity" },
    { id: "templates", label: "Templates" },
  ]

  return (
    <AutomationsModuleShell
      title="Automations"
      subtitle="Review-first portfolio automation that proposes safe, reversible next steps."
      icon={Workflow}
      actions={actions}
      showSafetyBanner
      hiddenTabs={hiddenTabs}
    >
      {/* KPI row — derives from loaded automations (honest 0 when empty) */}
      {(() => {
        const activeCount = rows.filter((r) => r.status === "live" && r.enabled).length
        const pausedCount = rows.filter((r) => r.status === "paused" || !r.enabled).length
        const reviewFirstCount = rows.filter((r) => r.reviewFirst).length
        return (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <AutomationsKpiCard label="Active automations" value={activeCount} icon={Zap} tone="blue" />
            <AutomationsKpiCard label="Pending review" value={reviewQueue.length} sub={reviewQueue.length > 0 ? "Requires your approval" : undefined} icon={AlertCircle} tone="amber" />
            <AutomationsKpiCard label="Paused" value={pausedCount} icon={History} tone="slate" />
            <AutomationsKpiCard label="Review-first" value={reviewFirstCount} icon={CheckCircle2} tone="emerald" />
          </div>
        )
      })()}

      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[1fr_340px]">
        {/* Main column */}
        <div className="space-y-4">
          <div className="flex items-center gap-1 border-b border-slate-200">
            {subTabs.map((s) => (
              <button
                key={s.id}
                onClick={() => setTab(s.id)}
                className={`border-b-2 px-3.5 py-2.5 text-sm transition ${tab === s.id ? "border-blue-600 font-semibold text-blue-700" : "border-transparent font-medium text-slate-500 hover:text-slate-800"}`}
              >
                {s.label}
                {s.badge ? <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">{s.badge}</span> : null}
              </button>
            ))}
          </div>

          {tab === "automations" && (
            <AutomationsDataTable
              columns={columns}
              rows={rows}
              page={page}
              pageSize={5}
              total={rows.length}
              onPageChange={setPage}
            />
          )}

          {tab === "inbox" && (
            <Card className="p-4">
              <div className="space-y-2">
                {reviewQueue.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => router.push("/property-manager/automations/approvals")}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3.5 py-3 text-left hover:bg-slate-50"
                  >
                    <span className="text-sm font-medium text-slate-800">{q.title}</span>
                    <span className="flex items-center gap-2">
                      <AutomationsRiskBadge level={q.risk} />
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </span>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {tab === "activity" && (
            <Card className="p-2">
              {activity.map((a) => (
                <button
                  key={a.id}
                  onClick={() => router.push("/property-manager/automations/runs-logs")}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-slate-50"
                >
                  <Activity className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="flex-1 text-sm text-slate-700">{a.text}</span>
                  <span className="text-xs text-slate-400">{a.at}</span>
                </button>
              ))}
            </Card>
          )}

          {tab === "templates" && (
            <Card className="p-6 text-center text-sm text-slate-500">
              <Btn variant="primary" icon={LayoutTemplate} className="mx-auto" onClick={() => router.push("/property-manager/automations/recipes")}>
                Browse template library
              </Btn>
            </Card>
          )}
        </div>

        {/* Right rail */}
        <AutomationsRightRail>
          <Card>
            <CardHeader title={`Review queue (${reviewQueue.length})`} />
            <div className="space-y-1 p-2">
              {reviewQueue.map((q) => (
                <button
                  key={q.id}
                  onClick={() => router.push("/property-manager/automations/approvals")}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left hover:bg-slate-50"
                >
                  <span className="text-sm text-slate-700">{q.title}</span>
                  <AutomationsRiskBadge level={q.risk} />
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Performance snapshot" />
            <div className="p-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-lg font-semibold text-slate-900">{rows.length}</div>
                  <div className="text-[11px] text-slate-400">Automations</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-emerald-600">{rows.filter((r) => r.status === "live" && r.enabled).length}</div>
                  <div className="text-[11px] text-slate-400">Live</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-slate-500">{rows.filter((r) => r.status === "paused" || !r.enabled).length}</div>
                  <div className="text-[11px] text-slate-400">Paused</div>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-slate-400">Run success rate appears here once your automations start executing.</p>
            </div>
          </Card>

          <Card className="border-violet-200 bg-violet-50/40">
            <div className="flex items-start gap-2.5 p-4">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
              <div>
                <h3 className="text-sm font-semibold text-violet-900">Build with AI</h3>
                <p className="mt-1 text-xs text-violet-800">Describe what you want to automate and the AI Builder will draft a review-first automation for you.</p>
                <button onClick={() => router.push("/property-manager/automations/ai-builder")} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-violet-700 hover:underline">
                  Open AI Builder <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </Card>
        </AutomationsRightRail>
      </div>

      {/* Recent activity strip */}
      <Card className="mt-5">
        <CardHeader title="Recent activity" action={<TrendingUp className="h-4 w-4 text-slate-400" />} />
        <div className="divide-y divide-slate-100">
          {activity.map((a) => (
            <button key={a.id} onClick={() => router.push("/property-manager/automations/runs-logs")} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-slate-500">
                <Activity className="h-3.5 w-3.5" />
              </span>
              <span className="flex-1 text-sm text-slate-700">{a.text}</span>
              <span className="text-xs text-slate-400">{a.at}</span>
            </button>
          ))}
        </div>
      </Card>

      <Modal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="New automation"
        footer={
          <>
            <Btn variant="outline" onClick={() => setNewOpen(false)}>Cancel</Btn>
            {canvasEnabled && (
              <Btn variant="primary" onClick={() => { setNewOpen(false); router.push("/property-manager/automations/canvas") }}>Open canvas</Btn>
            )}
          </>
        }
      >
        {canvasEnabled
          ? "Start from a blank canvas, a recipe, or describe it in the AI Builder. This opens the Canvas Builder where your automation is saved as a review-first draft."
          : "Start from a recipe template or describe it in the AI Builder. Canvas Builder is not enabled on your current plan."}
      </Modal>
    </AutomationsModuleShell>
  )
}
