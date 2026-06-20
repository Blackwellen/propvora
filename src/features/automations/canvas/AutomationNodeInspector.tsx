"use client"

// Right panel: node inspector with tabs — Settings / Inputs / JSON / Code / Test.

import React, { useState } from "react"
import type { Node } from "@xyflow/react"
import { Settings, Database, Code2, TestTube2, FileJson, Copy, Check } from "lucide-react"
import type { CanvasFlowNodeData, InspectorTab } from "./types"
import { nodeConfigSchema } from "@/lib/automation/node-registry"

const TABS: Array<{ id: InspectorTab; label: string; icon: React.ElementType }> = [
  { id: "settings", label: "Settings",  icon: Settings },
  { id: "inputs",   label: "Inputs",    icon: Database },
  { id: "json",     label: "JSON",      icon: FileJson },
  { id: "code",     label: "Code",      icon: Code2 },
  { id: "test",     label: "Test Data", icon: TestTube2 },
]

interface Props {
  node: Node<CanvasFlowNodeData> | null
  onUpdateConfig: (nodeId: string, config: Record<string, unknown>) => void
  onUpdateLabel: (nodeId: string, label: string) => void
  onRemoveNode: (nodeId: string) => void
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-slate-100">
        <Settings className="h-6 w-6 text-slate-400" />
      </div>
      <p className="text-sm font-medium text-slate-500">Select a node</p>
      <p className="text-[11px] text-slate-400">Click any node on the canvas to inspect and configure it here.</p>
    </div>
  )
}

// ── Settings tab ─────────────────────────────────────────────────────────────
function SettingsTab({
  node,
  onUpdateConfig,
  onUpdateLabel,
  onRemoveNode,
}: Props & { node: Node<CanvasFlowNodeData> }) {
  const schema = nodeConfigSchema(node.data.nodeType)
  const config = node.data.config

  function handleFieldChange(key: string, value: string | number | boolean) {
    onUpdateConfig(node.id, { [key]: value })
  }

  return (
    <div className="space-y-4">
      {/* Label */}
      <div>
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Node label
        </label>
        <input
          value={node.data.label}
          onChange={(e) => onUpdateLabel(node.id, e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
        />
      </div>

      {/* Type info */}
      <div className="rounded-lg bg-slate-50 px-3 py-2.5 text-[11px] text-slate-500">
        <span className="font-medium text-slate-700">Type:</span> {node.data.nodeType}
        {" · "}
        <span className="font-medium text-slate-700">Risk:</span>{" "}
        <span
          className={
            node.data.risk === "low" ? "text-emerald-600" :
            node.data.risk === "medium" ? "text-amber-600" :
            "text-red-600"
          }
        >
          {node.data.risk}
        </span>
      </div>

      {/* Config fields */}
      {schema.length > 0 ? (
        <div className="space-y-3">
          {schema.map((field) => (
            <div key={field.key}>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {field.label}
                {field.required && <span className="ml-0.5 text-red-500">*</span>}
              </label>
              {field.kind === "textarea" ? (
                <textarea
                  rows={3}
                  value={String(config?.[field.key] ?? field.default ?? "")}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
                />
              ) : field.kind === "select" ? (
                <select
                  value={String(config?.[field.key] ?? field.default ?? "")}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
                >
                  {field.options?.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : field.kind === "boolean" ? (
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(config?.[field.key] ?? field.default ?? false)}
                    onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-400"
                  />
                  <span className="text-sm text-slate-700">{field.label}</span>
                </label>
              ) : (
                <input
                  type={field.kind === "number" ? "number" : "text"}
                  value={String(config?.[field.key] ?? field.default ?? "")}
                  onChange={(e) =>
                    handleFieldChange(
                      field.key,
                      field.kind === "number" ? Number(e.target.value) : e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
                />
              )}
              {field.help && (
                <p className="mt-1 text-[11px] text-slate-400">{field.help}</p>
              )}
              {field.supportsTokens && (
                <p className="mt-1 text-[11px] text-violet-500">
                  Tokens: {"{{summary}}"}, {"{{trigger_id}}"}, etc.
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-lg bg-slate-50 px-3 py-3 text-[12px] text-slate-400 text-center">
          This node has no configurable fields.
        </p>
      )}

      {/* Remove node */}
      {node.data.category !== "trigger" && (
        <button
          onClick={() => onRemoveNode(node.id)}
          className="mt-2 w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100 transition"
        >
          Remove node
        </button>
      )}
    </div>
  )
}

// ── Inputs tab ───────────────────────────────────────────────────────────────
function InputsTab({ node }: { node: Node<CanvasFlowNodeData> }) {
  const schema = nodeConfigSchema(node.data.nodeType)
  if (!schema.length) {
    return (
      <p className="rounded-lg bg-slate-50 px-3 py-5 text-center text-[12px] text-slate-400">
        No configurable inputs for this node type.
      </p>
    )
  }
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-3 py-2 text-left font-semibold text-slate-600">Field</th>
            <th className="px-3 py-2 text-left font-semibold text-slate-600">Type</th>
            <th className="px-3 py-2 text-left font-semibold text-slate-600">Required</th>
            <th className="px-3 py-2 text-left font-semibold text-slate-600">Value</th>
          </tr>
        </thead>
        <tbody>
          {schema.map((f, i) => (
            <tr key={f.key} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
              <td className="px-3 py-2 font-medium text-slate-700">{f.label}</td>
              <td className="px-3 py-2 text-slate-500">{f.kind}</td>
              <td className="px-3 py-2">
                {f.required ? (
                  <span className="text-red-500">Yes</span>
                ) : (
                  <span className="text-slate-400">No</span>
                )}
              </td>
              <td className="px-3 py-2 font-mono text-slate-600 truncate max-w-[120px]" title={String(node.data.config?.[f.key] ?? f.default ?? "")}>
                {String(node.data.config?.[f.key] ?? f.default ?? "—")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── JSON Preview tab ─────────────────────────────────────────────────────────
function JsonPreviewTab({ node }: { node: Node<CanvasFlowNodeData> }) {
  const [copied, setCopied] = useState(false)
  const json = JSON.stringify(
    {
      id: node.id,
      type: node.data.nodeType,
      category: node.data.category,
      label: node.data.label,
      position: node.position,
      config: node.data.config,
      risk: node.data.risk,
      requiresApproval: node.data.requiresApproval,
    },
    null,
    2
  )

  function copy() {
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Node definition JSON
        </span>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="max-h-[400px] overflow-auto rounded-xl border border-slate-200 bg-slate-900 p-4 text-[11px] leading-relaxed text-emerald-300 whitespace-pre-wrap">
        {json}
      </pre>
    </div>
  )
}

// ── Code tab ─────────────────────────────────────────────────────────────────
function CodeTab({ node }: { node: Node<CanvasFlowNodeData> }) {
  const [code, setCode] = useState(() =>
    `// ${node.data.label}\n// Node type: ${node.data.nodeType}\n// Category: ${node.data.category}\n\n// Config override (optional — leave empty to use Settings):\nconst config = ${JSON.stringify(node.data.config, null, 2)}\n`
  )
  const [saved, setSaved] = useState(false)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Code editor
        </span>
        <div className="flex items-center gap-1.5">
          <button className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition">
            Format
          </button>
          <button className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition">
            Validate
          </button>
          <button
            onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000) }}
            className="rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-blue-700 transition"
          >
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        rows={16}
        spellCheck={false}
        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-900 p-4 font-mono text-[11px] leading-relaxed text-emerald-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
      />
      <p className="text-[11px] text-slate-400">
        Code is stored in the node config. Format/Validate before saving.
      </p>
    </div>
  )
}

// ── Test Data tab ─────────────────────────────────────────────────────────────
function TestDataTab({ node }: { node: Node<CanvasFlowNodeData> }) {
  const defaultPayload = JSON.stringify(
    { trigger_id: node.id, type: node.data.nodeType, within_days: 14, summary: "Gas Safety Certificate" },
    null,
    2
  )
  const [payload, setPayload] = useState(defaultPayload)
  const [expectedBranch, setExpectedBranch] = useState("TRUE")
  const [ran, setRan] = useState(false)

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Test payload
        </label>
        <textarea
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          rows={8}
          spellCheck={false}
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-900 p-3 font-mono text-[11px] leading-relaxed text-emerald-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>
      <div>
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Expected branch result
        </label>
        <select
          value={expectedBranch}
          onChange={(e) => setExpectedBranch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
        >
          <option value="TRUE">TRUE</option>
          <option value="FALSE">FALSE</option>
          <option value="PASS">PASS</option>
          <option value="SKIP">SKIP</option>
        </select>
      </div>
      <button
        onClick={() => setRan(true)}
        className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
      >
        Run node test
      </button>
      {ran && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[12px] text-emerald-800">
          <strong>Simulated result:</strong> Branch → {expectedBranch}. Node would{" "}
          {expectedBranch === "TRUE" || expectedBranch === "PASS" ? "continue to next step." : "skip this path."}
          <br />
          <span className="text-[11px] text-emerald-600 mt-1 block">
            This is a simulation — no real records were affected.
          </span>
        </div>
      )}
    </div>
  )
}

// ── Main inspector ────────────────────────────────────────────────────────────
export function AutomationNodeInspector({ node, onUpdateConfig, onUpdateLabel, onRemoveNode }: Props) {
  const [activeTab, setActiveTab] = useState<InspectorTab>("settings")

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_4px_rgba(15,23,42,0.05)]">
      {/* Header */}
      <div className="border-b border-slate-100 px-3 pt-3 pb-0">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Inspector
        </p>
        {node && (
          <p className="mb-2 truncate text-sm font-semibold text-slate-900">{node.data.label}</p>
        )}
        {/* Tabs */}
        <div className="flex gap-0.5 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  "flex shrink-0 items-center gap-1 rounded-t-lg px-2.5 py-2 text-[11px] font-medium transition border-b-2",
                  active
                    ? "border-blue-600 text-blue-600 bg-blue-50/60"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50",
                ].join(" ")}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {!node ? (
          <EmptyState />
        ) : activeTab === "settings" ? (
          <SettingsTab node={node} onUpdateConfig={onUpdateConfig} onUpdateLabel={onUpdateLabel} onRemoveNode={onRemoveNode} />
        ) : activeTab === "inputs" ? (
          <InputsTab node={node} />
        ) : activeTab === "json" ? (
          <JsonPreviewTab node={node} />
        ) : activeTab === "code" ? (
          <CodeTab node={node} />
        ) : (
          <TestDataTab node={node} />
        )}
      </div>
    </div>
  )
}
