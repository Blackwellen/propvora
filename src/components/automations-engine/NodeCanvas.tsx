"use client"

// Automation Engine — the FULL node/edge canvas builder.
//
// Capabilities: node library (grouped, searchable) + click-to-add / drag-onto-
// canvas, draggable nodes, edge drawing (click source port → click target),
// auto-layout, minimap, undo/redo, fullscreen, a node inspector with tabs
// (Config / Inputs / Outputs / JSON / Test / Runs / Docs), a read-only graph
// JSON editor, and a compile/validate panel. Saving persists a new version via
// /api/automations/nodes; publishing requires a clean compile. NOTHING runs from
// here — publish only marks the graph active; the executor runs it later under
// all the normal gates + approval safety.

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Search, Plus, Trash2, Undo2, Redo2, Maximize2, Minimize2, Save, CheckCircle2,
  AlertTriangle, X, Wand2, Layout, Link2, ShieldAlert, FileJson, FlaskConical,
  History, BookOpen, Sliders, ArrowRightLeft,
} from "lucide-react"
import type { RegistryNode, CompileResultDTO } from "./api"
import { loadRegistry, saveGraph } from "./api"

// ── Local graph model (client) ───────────────────────────────────────────────
interface GNode {
  node_key: string
  node_type: string
  label: string
  category: string
  risk: string
  config: Record<string, unknown>
  pos_x: number
  pos_y: number
}
interface GEdge { source_key: string; target_key: string; branch_label: string | null }
interface Graph { nodes: GNode[]; edges: GEdge[] }

const CATEGORY_COLOR: Record<string, string> = {
  trigger: "from-[var(--brand)] to-[var(--brand)]",
  condition: "from-amber-500 to-amber-600",
  branch: "from-amber-500 to-orange-600",
  delay: "from-slate-400 to-slate-500",
  lookup: "from-teal-500 to-teal-600",
  ai: "from-violet-500 to-fuchsia-600",
  action: "from-emerald-500 to-emerald-600",
  communication: "from-sky-500 to-sky-600",
  payment: "from-rose-500 to-rose-600",
  approval: "from-indigo-500 to-indigo-600",
  legal: "from-rose-600 to-red-700",
  integration: "from-cyan-500 to-cyan-600",
  webhook: "from-cyan-600 to-[var(--brand-strong)]",
  utility: "from-slate-500 to-slate-600",
  error: "from-orange-500 to-red-600",
  end: "from-slate-700 to-slate-900",
}
const RISK_RING: Record<string, string> = {
  low: "ring-emerald-200", medium: "ring-amber-200", high: "ring-orange-300", critical: "ring-rose-300", restricted: "ring-slate-900",
}

let keyCounter = 0
function freshKey(type: string): string {
  keyCounter += 1
  return `${type.split(".").pop()}_${Date.now().toString(36)}${keyCounter}`
}

export default function NodeCanvas({
  workspaceId,
  definitionId,
  definitionName,
  initialGraph,
}: {
  workspaceId?: string
  definitionId: string
  definitionName: string
  initialGraph?: Graph
}) {
  const [registry, setRegistry] = useState<RegistryNode[]>([])
  const [graph, setGraph] = useState<Graph>(initialGraph ?? { nodes: [], edges: [] })
  const [selected, setSelected] = useState<string | null>(null)
  const [linkFrom, setLinkFrom] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [fullscreen, setFullscreen] = useState(false)
  const [compile, setCompile] = useState<CompileResultDTO | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [inspectorTab, setInspectorTab] = useState<"config" | "inputs" | "outputs" | "json" | "test" | "runs" | "docs">("config")

  // Undo/redo stacks (graph snapshots).
  const past = useRef<Graph[]>([])
  const future = useRef<Graph[]>([])

  const dragRef = useRef<{ key: string; offX: number; offY: number } | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadRegistry(workspaceId).then((r) => { if (r.ok) setRegistry(r.registry) }).catch(() => {})
  }, [workspaceId])

  function flash(m: string) { setToast(m); setTimeout(() => setToast(null), 3000) }

  const commit = useCallback((next: Graph) => {
    past.current.push(graph)
    if (past.current.length > 50) past.current.shift()
    future.current = []
    setGraph(next)
    setCompile(null)
  }, [graph])

  function undo() {
    const prev = past.current.pop()
    if (!prev) return
    future.current.push(graph)
    setGraph(prev)
  }
  function redo() {
    const nxt = future.current.pop()
    if (!nxt) return
    past.current.push(graph)
    setGraph(nxt)
  }

  function addNode(def: RegistryNode) {
    const key = freshKey(def.type)
    const n: GNode = {
      node_key: key, node_type: def.type, label: def.label, category: def.category, risk: def.risk,
      config: Object.fromEntries((def.config ?? []).filter((f) => f.default != null).map((f) => [f.key, f.default])),
      pos_x: 120 + (graph.nodes.length % 5) * 60, pos_y: 100 + (graph.nodes.length % 5) * 50,
    }
    commit({ nodes: [...graph.nodes, n], edges: graph.edges })
    setSelected(key)
  }

  function removeNode(key: string) {
    commit({
      nodes: graph.nodes.filter((n) => n.node_key !== key),
      edges: graph.edges.filter((e) => e.source_key !== key && e.target_key !== key),
    })
    if (selected === key) setSelected(null)
  }

  function patchNode(key: string, patch: Partial<GNode>) {
    commit({ nodes: graph.nodes.map((n) => (n.node_key === key ? { ...n, ...patch } : n)), edges: graph.edges })
  }
  function patchConfig(key: string, ckey: string, value: unknown) {
    commit({ nodes: graph.nodes.map((n) => (n.node_key === key ? { ...n, config: { ...n.config, [ckey]: value } } : n)), edges: graph.edges })
  }

  function startLink(key: string) {
    if (linkFrom && linkFrom !== key) {
      // complete an edge
      if (!graph.edges.some((e) => e.source_key === linkFrom && e.target_key === key)) {
        commit({ nodes: graph.nodes, edges: [...graph.edges, { source_key: linkFrom, target_key: key, branch_label: null }] })
      }
      setLinkFrom(null)
    } else {
      setLinkFrom(key)
    }
  }
  function removeEdge(i: number) {
    commit({ nodes: graph.nodes, edges: graph.edges.filter((_, idx) => idx !== i) })
  }

  function autoLayout() {
    // Simple layered layout: triggers left, ends right, others by BFS depth.
    const depth = new Map<string, number>()
    const triggers = graph.nodes.filter((n) => n.category === "trigger")
    const adj = new Map<string, string[]>()
    for (const e of graph.edges) { adj.set(e.source_key, [...(adj.get(e.source_key) ?? []), e.target_key]) }
    const q = triggers.map((t) => { depth.set(t.node_key, 0); return t.node_key })
    while (q.length) {
      const u = q.shift()!
      for (const v of adj.get(u) ?? []) if (!depth.has(v)) { depth.set(v, (depth.get(u) ?? 0) + 1); q.push(v) }
    }
    const byDepth = new Map<number, string[]>()
    for (const n of graph.nodes) { const d = depth.get(n.node_key) ?? 0; byDepth.set(d, [...(byDepth.get(d) ?? []), n.node_key]) }
    const next = graph.nodes.map((n) => {
      const d = depth.get(n.node_key) ?? 0
      const col = byDepth.get(d) ?? []
      const row = col.indexOf(n.node_key)
      return { ...n, pos_x: 60 + d * 240, pos_y: 60 + row * 150 }
    })
    commit({ nodes: next, edges: graph.edges })
    flash("Auto-laid out the graph.")
  }

  // Drag nodes.
  function onMouseDownNode(e: React.MouseEvent, n: GNode) {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    dragRef.current = { key: n.node_key, offX: e.clientX - rect.left - n.pos_x, offY: e.clientY - rect.top - n.pos_y }
  }
  useEffect(() => {
    function move(e: MouseEvent) {
      const d = dragRef.current
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!d || !rect) return
      const x = Math.max(0, e.clientX - rect.left - d.offX)
      const y = Math.max(0, e.clientY - rect.top - d.offY)
      setGraph((g) => ({ ...g, nodes: g.nodes.map((n) => (n.node_key === d.key ? { ...n, pos_x: x, pos_y: y } : n)) }))
    }
    function up() { if (dragRef.current) { dragRef.current = null } }
    window.addEventListener("mousemove", move)
    window.addEventListener("mouseup", up)
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up) }
  }, [])

  async function persist(publish: boolean) {
    setBusy(publish ? "publish" : "save")
    try {
      const res = await saveGraph({
        workspaceId, definitionId,
        nodes: graph.nodes.map((n) => ({ node_key: n.node_key, node_type: n.node_type, label: n.label, config: n.config, pos_x: n.pos_x, pos_y: n.pos_y })),
        edges: graph.edges,
        publish,
      })
      if (res.compile) setCompile(res.compile)
      if (res.ok && res.published) flash("Published — active for runs (under all gates + approvals).")
      else if (res.ok) flash("Saved a new version.")
      else flash(res.error ?? "Fix validation errors before publishing.")
    } catch {
      flash("Couldn't save the graph.")
    } finally {
      setBusy(null)
    }
  }

  const grouped = useMemo(() => {
    const filtered = registry.filter((n) => !search || `${n.label} ${n.type} ${n.group}`.toLowerCase().includes(search.toLowerCase()))
    const map = new Map<string, RegistryNode[]>()
    for (const n of filtered) map.set(n.group, [...(map.get(n.group) ?? []), n])
    return Array.from(map.entries())
  }, [registry, search])

  const selectedNode = graph.nodes.find((n) => n.node_key === selected) ?? null
  const selectedDef = selectedNode ? registry.find((r) => r.type === selectedNode.node_type) ?? null : null

  const errorCount = compile?.issues.filter((i) => i.level === "error").length ?? 0
  const warnCount = compile?.issues.filter((i) => i.level === "warning").length ?? 0

  return (
    <div className={fullscreen ? "fixed inset-0 z-50 flex flex-col bg-white p-4" : "space-y-4"}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-slate-900">{definitionName || "Untitled automation"}</h2>
          <p className="text-xs text-slate-500">Visual node graph · {graph.nodes.length} nodes · {graph.edges.length} edges</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <ToolBtn onClick={undo} icon={Undo2} label="Undo" disabled={past.current.length === 0} />
          <ToolBtn onClick={redo} icon={Redo2} label="Redo" disabled={future.current.length === 0} />
          <ToolBtn onClick={autoLayout} icon={Layout} label="Auto-layout" />
          <ToolBtn onClick={() => setFullscreen((f) => !f)} icon={fullscreen ? Minimize2 : Maximize2} label={fullscreen ? "Exit" : "Fullscreen"} />
          <button onClick={() => persist(false)} disabled={busy === "save"} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60">
            <Save className="h-4 w-4" /> {busy === "save" ? "Saving…" : "Save draft"}
          </button>
          <button onClick={() => persist(true)} disabled={busy === "publish"} className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-[var(--brand-strong)] disabled:opacity-60">
            <CheckCircle2 className="h-4 w-4" /> {busy === "publish" ? "Publishing…" : "Validate & publish"}
          </button>
        </div>
      </div>

      {/* Compile banner */}
      {compile && (
        <div className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs ${compile.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
          {compile.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
          <div>
            <span className="font-semibold">{compile.ok ? "Valid graph." : `${errorCount} error(s)${warnCount ? `, ${warnCount} warning(s)` : ""}.`}</span>
            {compile.plan?.hasApprovalGate && <span className="ml-1">Includes an approval gate — high-risk steps require human approval.</span>}
            {compile.issues.length > 0 && (
              <ul className="mt-1 space-y-0.5">
                {compile.issues.map((iss, i) => <li key={i} className={iss.level === "error" ? "text-rose-700" : "text-amber-700"}>• {iss.message}</li>)}
              </ul>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[210px_minmax(0,1fr)_320px]">
        {/* Node library */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search nodes…" className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-2 text-sm" />
          </div>
          <div className="max-h-[460px] space-y-3 overflow-y-auto pr-1">
            {grouped.map(([group, nodes]) => (
              <div key={group}>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{group}</p>
                <div className="space-y-1">
                  {nodes.map((n) => (
                    <button key={n.type} onClick={() => addNode(n)} title={n.description}
                      className="group flex w-full items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5 text-left text-xs hover:border-[var(--color-brand-100)] hover:bg-[var(--brand-soft)]">
                      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded bg-gradient-to-br text-white ${CATEGORY_COLOR[n.category] ?? "from-slate-400 to-slate-500"}`}><Plus className="h-3 w-3" /></span>
                      <span className="min-w-0 flex-1 truncate font-medium text-slate-700">{n.label}</span>
                      {(n.requiresApproval || n.blockedFromAutoRun) && <ShieldAlert className="h-3 w-3 shrink-0 text-rose-500" />}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="relative">
          <div ref={canvasRef}
            className="relative h-[520px] overflow-hidden rounded-2xl border border-slate-200 bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.18)_1px,transparent_0)] [background-size:22px_22px]"
            onClick={() => { setSelected(null); setLinkFrom(null) }}>
            {/* Edges */}
            <svg className="pointer-events-none absolute inset-0 h-full w-full">
              {graph.edges.map((e, i) => {
                const s = graph.nodes.find((n) => n.node_key === e.source_key)
                const t = graph.nodes.find((n) => n.node_key === e.target_key)
                if (!s || !t) return null
                const x1 = s.pos_x + 80, y1 = s.pos_y + 26, x2 = t.pos_x, y2 = t.pos_y + 26
                return (
                  <g key={i}>
                    <path d={`M ${x1} ${y1} C ${x1 + 60} ${y1}, ${x2 - 60} ${y2}, ${x2} ${y2}`} fill="none" stroke="#94a3b8" strokeWidth={1.8} markerEnd="url(#arrow)" />
                  </g>
                )
              })}
              <defs>
                <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#94a3b8" /></marker>
              </defs>
            </svg>

            {/* Nodes */}
            {graph.nodes.map((n) => (
              <div key={n.node_key}
                onMouseDown={(e) => { e.stopPropagation(); onMouseDownNode(e, n) }}
                onClick={(e) => { e.stopPropagation(); setSelected(n.node_key) }}
                style={{ left: n.pos_x, top: n.pos_y }}
                className={`absolute w-40 cursor-move rounded-xl border bg-white p-2.5 shadow-[0_2px_10px_rgba(15,23,42,0.08)] transition ${selected === n.node_key ? `border-transparent ring-2 ${RISK_RING[n.risk] ?? "ring-[var(--color-brand-100)]"}` : "border-slate-200"} ${linkFrom === n.node_key ? "ring-2 ring-[var(--color-brand-400)]" : ""}`}>
                <div className="flex items-center gap-1.5">
                  <span className={`grid h-5 w-5 place-items-center rounded bg-gradient-to-br text-[9px] font-bold text-white ${CATEGORY_COLOR[n.category] ?? "from-slate-400 to-slate-500"}`}>{n.category[0]?.toUpperCase()}</span>
                  <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-slate-800">{n.label}</span>
                  <button onClick={(e) => { e.stopPropagation(); removeNode(n.node_key) }} aria-label="Remove" className="grid h-5 w-5 place-items-center rounded text-slate-300 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3 w-3" /></button>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="truncate text-[9px] font-mono text-slate-400">{n.node_type}</span>
                  <button onClick={(e) => { e.stopPropagation(); startLink(n.node_key) }} title="Connect" className={`grid h-5 w-5 place-items-center rounded ${linkFrom === n.node_key ? "bg-[var(--color-brand-100)] text-[var(--brand)]" : "text-slate-400 hover:bg-slate-100"}`}><Link2 className="h-3 w-3" /></button>
                </div>
              </div>
            ))}

            {graph.nodes.length === 0 && (
              <div className="absolute inset-0 grid place-items-center text-center">
                <div>
                  <Wand2 className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-sm font-medium text-slate-500">Add nodes from the library to start building.</p>
                  <p className="text-xs text-slate-400">Click a node, then use the link button to connect them.</p>
                </div>
              </div>
            )}

            {linkFrom && <div className="absolute left-2 top-2 rounded-md bg-[var(--brand)] px-2 py-1 text-[10px] font-medium text-white">Click a target node to connect…</div>}
          </div>

          {/* Minimap */}
          <div className="pointer-events-none absolute bottom-2 right-2 h-20 w-32 overflow-hidden rounded-lg border border-slate-200 bg-white/90 shadow-sm">
            <svg viewBox="0 0 600 560" className="h-full w-full">
              {graph.edges.map((e, i) => {
                const s = graph.nodes.find((n) => n.node_key === e.source_key); const t = graph.nodes.find((n) => n.node_key === e.target_key)
                if (!s || !t) return null
                return <line key={i} x1={s.pos_x} y1={s.pos_y} x2={t.pos_x} y2={t.pos_y} stroke="#cbd5e1" strokeWidth={3} />
              })}
              {graph.nodes.map((n) => <rect key={n.node_key} x={n.pos_x} y={n.pos_y} width={40} height={24} rx={4} className="fill-slate-400" />)}
            </svg>
          </div>

          {/* Edge list (deletable) */}
          {graph.edges.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {graph.edges.map((e, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[10px] text-slate-600">
                  {e.source_key.split("_")[0]} <ArrowRightLeft className="h-3 w-3" /> {e.target_key.split("_")[0]}
                  <button onClick={() => removeEdge(i)} aria-label="Remove edge" className="ml-0.5 text-slate-400 hover:text-red-600"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Inspector */}
        <div className="rounded-2xl border border-slate-200 bg-white">
          {!selectedNode ? (
            <div className="grid h-full min-h-[300px] place-items-center p-6 text-center">
              <div>
                <Sliders className="mx-auto h-7 w-7 text-slate-300" />
                <p className="mt-2 text-sm font-medium text-slate-500">Select a node to inspect it.</p>
              </div>
            </div>
          ) : (
            <NodeInspector
              node={selectedNode}
              def={selectedDef}
              tab={inspectorTab}
              onTab={setInspectorTab}
              onPatch={(p) => patchNode(selectedNode.node_key, p)}
              onPatchConfig={(k, v) => patchConfig(selectedNode.node_key, k, v)}
            />
          )}
        </div>
      </div>

      {toast && <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg">{toast}</div>}
    </div>
  )
}

function ToolBtn({ onClick, icon: Icon, label, disabled }: { onClick: () => void; icon: React.ElementType; label: string; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} title={label} aria-label={label}
      className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40">
      <Icon className="h-4 w-4" />
    </button>
  )
}

function NodeInspector({
  node, def, tab, onTab, onPatch, onPatchConfig,
}: {
  node: GNode
  def: RegistryNode | null
  tab: "config" | "inputs" | "outputs" | "json" | "test" | "runs" | "docs"
  onTab: (t: "config" | "inputs" | "outputs" | "json" | "test" | "runs" | "docs") => void
  onPatch: (p: Partial<GNode>) => void
  onPatchConfig: (k: string, v: unknown) => void
}) {
  const tabs: Array<{ id: typeof tab; label: string; icon: React.ElementType }> = [
    { id: "config", label: "Config", icon: Sliders },
    { id: "inputs", label: "Inputs", icon: ArrowRightLeft },
    { id: "outputs", label: "Outputs", icon: ArrowRightLeft },
    { id: "json", label: "JSON", icon: FileJson },
    { id: "test", label: "Test", icon: FlaskConical },
    { id: "runs", label: "Runs", icon: History },
    { id: "docs", label: "Docs", icon: BookOpen },
  ]
  const gated = def && (def.requiresApproval || def.blockedFromAutoRun)
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-100 p-3">
        <div className="flex items-center gap-2">
          <span className={`grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br text-[10px] font-bold text-white ${CATEGORY_COLOR[node.category] ?? "from-slate-400 to-slate-500"}`}>{node.category[0]?.toUpperCase()}</span>
          <div className="min-w-0">
            <input value={node.label} onChange={(e) => onPatch({ label: e.target.value })} className="w-full truncate border-0 p-0 text-sm font-semibold text-slate-900 focus:ring-0" />
            <p className="truncate text-[10px] font-mono text-slate-400">{node.node_type}</p>
          </div>
        </div>
        {gated && (
          <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-[11px] text-rose-700">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {def?.blockedFromAutoRun ? "Blocked from auto-run — requires a manual, audited action." : "Requires human approval before it runs."}
          </div>
        )}
      </div>
      <div className="flex gap-0.5 overflow-x-auto border-b border-slate-100 px-2 pt-1.5">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => onTab(t.id)} className={`flex items-center gap-1 whitespace-nowrap border-b-2 px-2 py-1.5 text-[11px] font-medium ${tab === t.id ? "border-[var(--brand)] text-[var(--brand)]" : "border-transparent text-slate-400 hover:text-slate-700"}`}>
            <t.icon className="h-3 w-3" /> {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-3 text-xs">
        {tab === "config" && (
          (def?.config ?? []).length === 0 ? <p className="text-slate-400">This node has no configuration.</p> : (
            <div className="space-y-3">
              {(def?.config ?? []).map((f) => (
                <div key={f.key}>
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">{f.label}{f.required && <span className="text-rose-500"> *</span>}</label>
                  {f.kind === "textarea" ? (
                    <textarea rows={2} value={String(node.config[f.key] ?? "")} onChange={(e) => onPatchConfig(f.key, e.target.value)} className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs" />
                  ) : f.kind === "select" ? (
                    <select value={String(node.config[f.key] ?? "")} onChange={(e) => onPatchConfig(f.key, e.target.value)} className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs">
                      <option value="">—</option>
                      {(f.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : f.kind === "boolean" ? (
                    <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(node.config[f.key])} onChange={(e) => onPatchConfig(f.key, e.target.checked)} className="h-4 w-4 rounded border-slate-300" /> <span className="text-slate-600">Enabled</span></label>
                  ) : (
                    <input type={f.kind === "number" ? "number" : "text"} value={String(node.config[f.key] ?? "")} onChange={(e) => onPatchConfig(f.key, f.kind === "number" ? Number(e.target.value) : e.target.value)} className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs" />
                  )}
                  {f.help && <p className="mt-0.5 text-[10px] text-slate-400">{f.help}</p>}
                  {f.supportsTokens && <p className="mt-0.5 text-[10px] text-slate-400">Tokens: {"{{summary}}"} + trigger facts.</p>}
                </div>
              ))}
            </div>
          )
        )}
        {tab === "inputs" && <p className="text-slate-500">This node reads the run context (matched record, facts, prior node outputs). Trigger nodes seed the context; downstream nodes receive it.</p>}
        {tab === "outputs" && <p className="text-slate-500">{def?.category === "action" || def?.category === "communication" ? "Produces a created record id (task/notification/draft) into the run output." : def?.category === "approval" || def?.category === "payment" || def?.category === "legal" ? "Produces an approval object the run waits on — never an automatic side-effect." : "Routes the run context to downstream nodes."}</p>}
        {tab === "json" && (
          <pre className="overflow-x-auto rounded-lg bg-slate-900 p-2.5 text-[10px] leading-relaxed text-slate-100">{JSON.stringify(node, null, 2)}</pre>
        )}
        {tab === "test" && <p className="text-slate-500">Use the Dry-run panel below the canvas to preview the whole graph against live data without side-effects. Live sends, payments, and legal actions are blocked in a dry run.</p>}
        {tab === "runs" && <p className="text-slate-500">Per-node run history appears here once this version has executed. See Runs &amp; Logs for the full timeline.</p>}
        {tab === "docs" && <p className="text-slate-500">{def?.description ?? "No description."} Plan: {def?.plan}. Risk: {def?.risk}. Scope: {def?.scope}.</p>}
      </div>
    </div>
  )
}
