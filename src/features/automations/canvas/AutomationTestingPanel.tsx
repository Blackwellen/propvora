"use client"

// Bottom testing panel: Dry-run / Execution Steps / Validation / Logs / Outputs.

import React, { useState } from "react"
import type { Node, Edge } from "@xyflow/react"
import {
  Play, ChevronDown, ChevronUp, CheckCircle, XCircle,
  AlertCircle, Clock, List, FileText, BarChart3, Loader2,
} from "lucide-react"
import type { CanvasFlowNodeData, TestingTab } from "./types"
import type { DryRunResult } from "../hooks/useAutomationDryRun"
import type { ValidationSummary } from "../hooks/useAutomationValidation"

const TABS: Array<{ id: TestingTab; label: string; icon: React.ElementType }> = [
  { id: "dryrun",     label: "Dry-run Preview",  icon: Play },
  { id: "steps",      label: "Execution Steps",  icon: List },
  { id: "validation", label: "Validation",       icon: CheckCircle },
  { id: "logs",       label: "Logs",             icon: FileText },
  { id: "outputs",    label: "Outputs",          icon: BarChart3 },
]

const DEFAULT_TEST_EVENT = JSON.stringify(
  {
    trigger_type: "compliance.expiring",
    within_days: 14,
    summary: "Gas Safety Certificate — 14 Maple Street",
    record_id: "rec_test_001",
    workspace_id: "preview_only",
  },
  null,
  2
)

interface Props {
  nodes: Node<CanvasFlowNodeData>[]
  edges: Edge[]
  dryRunResult: DryRunResult | null
  dryRunRunning: boolean
  dryRunError: string | null
  validation: ValidationSummary
  onRunDryRun: (testEvent: Record<string, unknown>) => void
  collapsed: boolean
  onToggleCollapse: () => void
}

function StatusIcon({ status }: { status: string }) {
  if (status === "pass" || status === "passed") return <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
  if (status === "skip" || status === "partial") return <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
  if (status === "error" || status === "failed") return <XCircle className="h-3.5 w-3.5 text-red-500" />
  if (status === "pending") return <Clock className="h-3.5 w-3.5 text-violet-500" />
  return <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-300" />
}

// ── Dry-run preview tab ───────────────────────────────────────────────────────
function DryRunPreviewTab({
  nodes,
  dryRunResult,
  dryRunRunning,
  dryRunError,
  onRunDryRun,
}: {
  nodes: Node<CanvasFlowNodeData>[]
  dryRunResult: DryRunResult | null
  dryRunRunning: boolean
  dryRunError: string | null
  onRunDryRun: (event: Record<string, unknown>) => void
}) {
  const [testEvent, setTestEvent] = useState(DEFAULT_TEST_EVENT)
  const [jsonError, setJsonError] = useState<string | null>(null)

  function handleRun() {
    setJsonError(null)
    try {
      const parsed = JSON.parse(testEvent)
      onRunDryRun(parsed)
    } catch {
      setJsonError("Invalid JSON — please fix the test event payload.")
    }
  }

  // Trigger selector
  const triggerNode = nodes.find((n) => n.data.category === "trigger")

  return (
    <div className="flex h-full gap-4">
      {/* Left: test event editor */}
      <div className="flex w-[340px] shrink-0 flex-col gap-2">
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Test event
          </label>
          {triggerNode && (
            <p className="mb-1.5 text-[11px] text-slate-400">
              Trigger: <strong className="text-slate-600">{triggerNode.data.label}</strong>
            </p>
          )}
        </div>
        <textarea
          value={testEvent}
          onChange={(e) => setTestEvent(e.target.value)}
          rows={8}
          spellCheck={false}
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-900 p-3 font-mono text-[11px] leading-relaxed text-emerald-300 focus:border-[var(--color-brand-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-100)]"
        />
        {jsonError && (
          <p className="text-[11px] text-red-500">{jsonError}</p>
        )}
        <button
          onClick={handleRun}
          disabled={dryRunRunning || nodes.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-strong)] disabled:opacity-60 transition"
        >
          {dryRunRunning ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Running…</>
          ) : (
            <><Play className="h-4 w-4" /> Run dry-run</>
          )}
        </button>
        <p className="text-center text-[10px] text-slate-400">
          Read-only simulation — no real records are affected
        </p>
      </div>

      {/* Right: results */}
      <div className="flex-1 overflow-y-auto">
        {dryRunError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700">
            {dryRunError}
          </div>
        )}
        {!dryRunResult && !dryRunError && !dryRunRunning && (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <Play className="mx-auto mb-2 h-8 w-8 text-slate-300" />
              <p className="text-sm text-slate-400">Configure a test event and run the dry-run</p>
            </div>
          </div>
        )}
        {dryRunResult && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <StatusIcon status={dryRunResult.status} />
              <span className="text-sm font-semibold text-slate-800 capitalize">
                {dryRunResult.status.replace("_", " ")}
              </span>
              <span className="ml-auto text-[11px] text-slate-400">
                {dryRunResult.durationMs}ms · {dryRunResult.steps.length} steps
              </span>
            </div>
            <div className="space-y-2">
              {dryRunResult.steps.map((step) => (
                <div
                  key={step.index}
                  className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5"
                >
                  <StatusIcon status={step.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-slate-800 truncate">{step.nodeLabel}</p>
                    <p className="text-[11px] text-slate-500">{step.nodeType}</p>
                  </div>
                  <span className="shrink-0 text-[11px] tabular-nums text-slate-400">{step.duration_ms}ms</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Execution Steps tab ───────────────────────────────────────────────────────
function ExecutionStepsTab({ dryRunResult }: { dryRunResult: DryRunResult | null }) {
  if (!dryRunResult) {
    return <p className="text-[12px] text-slate-400 text-center py-6">Run a dry-run to see execution steps.</p>
  }
  return (
    <div className="overflow-auto">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-3 py-2 text-left font-semibold text-slate-600">#</th>
            <th className="px-3 py-2 text-left font-semibold text-slate-600">Step</th>
            <th className="px-3 py-2 text-left font-semibold text-slate-600">Type</th>
            <th className="px-3 py-2 text-left font-semibold text-slate-600">Status</th>
            <th className="px-3 py-2 text-left font-semibold text-slate-600">Duration</th>
            <th className="px-3 py-2 text-left font-semibold text-slate-600">Action</th>
          </tr>
        </thead>
        <tbody>
          {dryRunResult.steps.map((step) => (
            <tr key={step.index} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-3 py-2 text-slate-400 tabular-nums">{step.index + 1}</td>
              <td className="px-3 py-2 font-medium text-slate-800">{step.nodeLabel}</td>
              <td className="px-3 py-2 text-slate-500 font-mono text-[11px]">{step.nodeType}</td>
              <td className="px-3 py-2">
                <span className="inline-flex items-center gap-1">
                  <StatusIcon status={step.status} />
                  <span className="capitalize">{step.status}</span>
                </span>
              </td>
              <td className="px-3 py-2 tabular-nums text-slate-500">{step.duration_ms}ms</td>
              <td className="px-3 py-2">
                <span className="text-[10px] text-slate-400 font-mono">
                  {Object.keys(step.output)[0] ?? "—"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Validation tab ────────────────────────────────────────────────────────────
function ValidationTab({ validation }: { validation: ValidationSummary }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <StatusIcon status={validation.allValid ? "pass" : "error"} />
        <span className="text-sm font-semibold text-slate-800">
          {validation.allValid ? "All nodes valid" : `${validation.errorCount} error${validation.errorCount !== 1 ? "s" : ""} found`}
        </span>
        {!validation.hasTrigger && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-600">No trigger</span>
        )}
        {!validation.hasAction && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-600">No action</span>
        )}
      </div>
      <div className="space-y-1.5">
        {validation.results.map((r) => (
          <div
            key={r.nodeId}
            className={[
              "flex items-start gap-2.5 rounded-xl border px-3 py-2.5",
              r.valid ? "border-slate-100 bg-slate-50" : "border-red-100 bg-red-50",
            ].join(" ")}
          >
            <StatusIcon status={r.valid ? "pass" : "error"} />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-slate-800">{r.label}</p>
              {r.errors.length > 0 && (
                <ul className="mt-1 space-y-0.5">
                  {r.errors.map((e, i) => (
                    <li key={i} className="text-[11px] text-red-600">{e}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
        {validation.results.length === 0 && (
          <p className="text-[12px] text-slate-400 text-center py-4">Add nodes to validate the flow.</p>
        )}
      </div>
    </div>
  )
}

// ── Logs tab ──────────────────────────────────────────────────────────────────
function LogsTab({ dryRunResult }: { dryRunResult: DryRunResult | null }) {
  if (!dryRunResult) {
    return <p className="text-[12px] text-slate-400 text-center py-6">No logs yet — run a dry-run first.</p>
  }
  const now = new Date()
  return (
    <div className="space-y-1.5 font-mono text-[11px]">
      <div className="text-slate-500">[{now.toISOString()}] Dry-run started</div>
      {dryRunResult.steps.map((step) => (
        <div
          key={step.index}
          className={step.status === "error" ? "text-red-500" : step.status === "skip" ? "text-amber-500" : "text-slate-600"}
        >
          [{now.toISOString()}] Step {step.index + 1} — {step.nodeLabel} → {step.status} ({step.duration_ms}ms)
        </div>
      ))}
      <div className="text-emerald-600">[{now.toISOString()}] Dry-run completed — status: {dryRunResult.status}</div>
    </div>
  )
}

// ── Outputs tab ───────────────────────────────────────────────────────────────
function OutputsTab({ dryRunResult }: { dryRunResult: DryRunResult | null }) {
  if (!dryRunResult) {
    return <p className="text-[12px] text-slate-400 text-center py-6">Run a dry-run to see expected outputs.</p>
  }
  const actionSteps = dryRunResult.steps.filter((s) =>
    ["pass"].includes(s.status)
  )
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-800">
        <strong>Review-first:</strong> All outputs require human approval before they take effect. Nothing runs automatically.
      </div>
      <div className="space-y-2">
        {actionSteps.map((step) => (
          <div key={step.index} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
            <p className="text-[12px] font-semibold text-slate-800">{step.nodeLabel}</p>
            <pre className="mt-1 overflow-auto text-[10px] text-slate-500 whitespace-pre-wrap">
              {JSON.stringify(step.output, null, 2)}
            </pre>
          </div>
        ))}
        {actionSteps.length === 0 && (
          <p className="text-[12px] text-slate-400">No passing steps to show outputs for.</p>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function AutomationTestingPanel({
  nodes,
  edges,
  dryRunResult,
  dryRunRunning,
  dryRunError,
  validation,
  onRunDryRun,
  collapsed,
  onToggleCollapse,
}: Props) {
  const [activeTab, setActiveTab] = useState<TestingTab>("dryrun")

  return (
    <div className={[
      "flex shrink-0 flex-col border-t border-slate-200 bg-white transition-all duration-200",
      collapsed ? "h-[44px]" : "h-[260px]",
    ].join(" ")}>
      {/* Tab bar + collapse toggle */}
      <div className="flex shrink-0 items-center border-b border-slate-100 px-3">
        <div className="flex flex-1 gap-0.5 overflow-x-auto py-1">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id && !collapsed
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (collapsed) onToggleCollapse()
                  setActiveTab(tab.id)
                }}
                className={[
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition",
                  active
                    ? "bg-[var(--brand-soft)] text-[var(--brand)]"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
                ].join(" ")}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
                {tab.id === "validation" && !validation.allValid && (
                  <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
                    {validation.errorCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <button
          onClick={onToggleCollapse}
          className="ml-2 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 transition"
          title={collapsed ? "Expand panel" : "Collapse panel"}
        >
          {collapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="flex-1 overflow-hidden px-4 py-3">
          {activeTab === "dryrun" && (
            <DryRunPreviewTab
              nodes={nodes}
              dryRunResult={dryRunResult}
              dryRunRunning={dryRunRunning}
              dryRunError={dryRunError}
              onRunDryRun={onRunDryRun}
            />
          )}
          {activeTab === "steps" && (
            <ExecutionStepsTab dryRunResult={dryRunResult} />
          )}
          {activeTab === "validation" && (
            <ValidationTab validation={validation} />
          )}
          {activeTab === "logs" && (
            <LogsTab dryRunResult={dryRunResult} />
          )}
          {activeTab === "outputs" && (
            <OutputsTab dryRunResult={dryRunResult} />
          )}
        </div>
      )}
    </div>
  )
}
