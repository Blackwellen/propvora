"use client"

// Automation Engine — the REACT FLOW drag-drop canvas.
//
// Real drag-and-drop nodes + connectable edges (@xyflow/react), premium per-
// category shapes, minimap, pan/zoom, snap-to-grid, fullscreen/enlarge,
// undo/redo, node duplicate/delete, edge labels, and a run-path highlight.
// A node inspector with tabs (Config / Inputs / Outputs / JSON / Test / Runs /
// Docs) — the JSON tab is a view+edit surface (editable for admins, validated
// on apply). Persistence reuses /api/automations/nodes (saveGraph): a save
// creates a new version; publish requires a clean compile. NOTHING runs here.

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ReactFlow, ReactFlowProvider, Background, BackgroundVariant, Controls, MiniMap,
  addEdge, applyNodeChanges, applyEdgeChanges, useReactFlow,
  type Node, type Edge, type Connection, type NodeChange, type EdgeChange,
  MarkerType,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import {
  Search, Plus, Trash2, Copy, Undo2, Redo2, Maximize2, Minimize2, Save,
  CheckCircle2, AlertTriangle, X, FlaskConical, Layout, FileJson, ShieldAlert,
  Download, Upload, Layers, Bell, Shield, Wrench, CalendarCheck, FileText, Clock,
  MessageSquare, ChevronRight,
} from "lucide-react"
import { FlowNode, type FlowNodeData } from "./FlowNode"
import { loadRegistry, saveGraph, type RegistryNode, type CompileResultDTO } from "../api"

const nodeTypes = { propvora: FlowNode }

// ── Canvas templates for the advanced node-graph canvas ───────────────────────
interface CanvasNodeTemplate {
  node_type: string; label: string; pos_x: number; pos_y: number; config: Record<string, unknown>
}
interface CanvasEdgeTemplate { source_key: string; target_key: string; branch_label: string | null }
interface CanvasTemplate {
  id: string
  name: string
  description: string
  icon: React.ElementType
  nodes: CanvasNodeTemplate[]
  edges: CanvasEdgeTemplate[]
}

const ADV_TEMPLATES: CanvasTemplate[] = [
  {
    id: "rent-due-reminder",
    name: "Rent due reminder",
    description: "3 days before rent is due → email/SMS tenant.",
    icon: Bell,
    nodes: [
      { node_type: "rent.overdue", label: "Rent overdue trigger", pos_x: 80, pos_y: 120, config: { min_days_overdue: -3 } },
      { node_type: "comms.send_email", label: "Send rent reminder email", pos_x: 320, pos_y: 120, config: { subject: "Reminder: Rent due soon", body: "Your rent is due in 3 days." } },
    ],
    edges: [{ source_key: "rent.overdue_0", target_key: "comms.send_email_1", branch_label: null }],
  },
  {
    id: "cert-expiry-alert",
    name: "Certificate expiry alert",
    description: "30 days before a cert expires → notify operator.",
    icon: Shield,
    nodes: [
      { node_type: "compliance.due_soon", label: "Compliance due soon", pos_x: 80, pos_y: 120, config: { within_days: 30 } },
      { node_type: "notify.create_notification", label: "Notify operator", pos_x: 320, pos_y: 120, config: { title: "Certificate expiring: {{summary}}", severity: "warning" } },
    ],
    edges: [{ source_key: "compliance.due_soon_0", target_key: "notify.create_notification_1", branch_label: null }],
  },
  {
    id: "new-maintenance-request",
    name: "New maintenance request",
    description: "On job created → assign supplier + notify.",
    icon: Wrench,
    nodes: [
      { node_type: "work.task_created", label: "Maintenance created", pos_x: 80, pos_y: 120, config: {} },
      { node_type: "work.assign_supplier", label: "Assign supplier", pos_x: 320, pos_y: 80, config: {} },
      { node_type: "notify.create_notification", label: "Notify team", pos_x: 320, pos_y: 200, config: { title: "New maintenance: {{summary}}", severity: "info" } },
    ],
    edges: [
      { source_key: "work.task_created_0", target_key: "work.assign_supplier_1", branch_label: null },
      { source_key: "work.task_created_0", target_key: "notify.create_notification_2", branch_label: null },
    ],
  },
  {
    id: "booking-confirmed-welcome",
    name: "Booking confirmed",
    description: "On booking confirmed → guest welcome email.",
    icon: CalendarCheck,
    nodes: [
      { node_type: "booking.confirmed", label: "Booking confirmed", pos_x: 80, pos_y: 120, config: {} },
      { node_type: "comms.send_email", label: "Welcome email", pos_x: 320, pos_y: 120, config: { subject: "Your booking is confirmed", body: "Welcome! Your booking has been confirmed." } },
    ],
    edges: [{ source_key: "booking.confirmed_0", target_key: "comms.send_email_1", branch_label: null }],
  },
  {
    id: "job-completed-invoice",
    name: "Job completed → invoice",
    description: "On job completed → create invoice draft.",
    icon: FileText,
    nodes: [
      { node_type: "work.task_created", label: "Job completed", pos_x: 80, pos_y: 120, config: { status: "completed" } },
      { node_type: "finance.create_invoice", label: "Create invoice draft", pos_x: 320, pos_y: 120, config: {} },
    ],
    edges: [{ source_key: "work.task_created_0", target_key: "finance.create_invoice_1", branch_label: null }],
  },
  {
    id: "lease-ending-renewal",
    name: "Lease ending soon",
    description: "60 days before tenancy ends → notify + start renewal.",
    icon: Clock,
    nodes: [
      { node_type: "portfolio.tenancy_ending", label: "Tenancy ending (60d)", pos_x: 80, pos_y: 120, config: { within_days: 60 } },
      { node_type: "notify.create_notification", label: "Notify agent", pos_x: 320, pos_y: 80, config: { title: "Tenancy ending: {{summary}}", severity: "warning" } },
      { node_type: "work.task_created", label: "Create renewal task", pos_x: 320, pos_y: 200, config: { title: "Start renewal process: {{summary}}" } },
    ],
    edges: [
      { source_key: "portfolio.tenancy_ending_0", target_key: "notify.create_notification_1", branch_label: null },
      { source_key: "portfolio.tenancy_ending_0", target_key: "work.task_created_2", branch_label: null },
    ],
  },
  {
    id: "supplier-job-overdue",
    name: "Supplier job overdue",
    description: "Past due_date, not completed → escalate.",
    icon: AlertTriangle,
    nodes: [
      { node_type: "work.task_overdue", label: "Job overdue", pos_x: 80, pos_y: 120, config: {} },
      { node_type: "notify.create_notification", label: "Escalate alert", pos_x: 320, pos_y: 120, config: { title: "Job overdue: {{summary}}", severity: "critical" } },
    ],
    edges: [{ source_key: "work.task_overdue_0", target_key: "notify.create_notification_1", branch_label: null }],
  },
  {
    id: "new-portal-message",
    name: "New portal message",
    description: "On portal message received → notify workspace member.",
    icon: MessageSquare,
    nodes: [
      { node_type: "record.created", label: "Portal message received", pos_x: 80, pos_y: 120, config: { entity: "portal_messages" } },
      { node_type: "notify.create_notification", label: "Notify member", pos_x: 320, pos_y: 120, config: { title: "New portal message: {{summary}}", severity: "info" } },
    ],
    edges: [{ source_key: "record.created_0", target_key: "notify.create_notification_1", branch_label: null }],
  },
]

interface InitNode {
  node_key: string; node_type: string; label: string; category: string
  risk: string; config: Record<string, unknown>; pos_x: number; pos_y: number
}
interface InitEdge { source_key: string; target_key: string; branch_label: string | null }
export interface InitialGraph { nodes: InitNode[]; edges: InitEdge[] }

interface Props {
  workspaceId: string
  definitionId: string
  definitionName: string
  initialGraph: InitialGraph
  /** Admins may edit the raw JSON; normal users get a read-only JSON view. */
  canEditJson?: boolean
}

type PNode = Node<FlowNodeData>

let keyCounter = 1
function nextKey(type: string) {
  return `${type.replace(/[^a-z0-9]/gi, "_")}_${Date.now().toString(36)}_${keyCounter++}`
}

function toFlowNodes(g: InitialGraph, reg: Map<string, RegistryNode>): PNode[] {
  return g.nodes.map((n) => {
    const def = reg.get(n.node_type)
    return {
      id: n.node_key,
      type: "propvora",
      position: { x: n.pos_x || 0, y: n.pos_y || 0 },
      data: {
        label: n.label || def?.label || n.node_type,
        nodeType: n.node_type,
        category: (def?.category ?? n.category) as FlowNodeData["category"],
        requiresApproval: Boolean(def?.requiresApproval),
        blocked: Boolean(def?.blockedFromAutoRun),
        risk: n.risk,
        config: n.config,
      } as FlowNodeData & { config: Record<string, unknown> },
    }
  })
}
function toFlowEdges(g: InitialGraph): Edge[] {
  return g.edges.map((e, i) => ({
    id: `e_${e.source_key}_${e.target_key}_${i}`,
    source: e.source_key,
    target: e.target_key,
    label: e.branch_label ?? undefined,
    markerEnd: { type: MarkerType.ArrowClosed },
    animated: false,
  }))
}

function CanvasInner({ workspaceId, definitionId, definitionName, initialGraph, canEditJson = false }: Props) {
  const rf = useReactFlow()
  const [registry, setRegistry] = useState<RegistryNode[]>([])
  const regMap = useMemo(() => new Map(registry.map((r) => [r.type, r])), [registry])

  const [nodes, setNodes] = useState<PNode[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [configs, setConfigs] = useState<Record<string, Record<string, unknown>>>(() =>
    Object.fromEntries(initialGraph.nodes.map((n) => [n.node_key, n.config ?? {}]))
  )

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [paletteOpen, setPaletteOpen] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [snap, setSnap] = useState(true)
  const [saving, setSaving] = useState(false)
  const [compile, setCompile] = useState<CompileResultDTO | null>(null)
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)

  // Undo/redo stacks (graph snapshots).
  const undoStack = useRef<Array<{ nodes: PNode[]; edges: Edge[]; configs: Record<string, Record<string, unknown>> }>>([])
  const redoStack = useRef<typeof undoStack.current>([])

  // Load registry + hydrate the graph once.
  useEffect(() => {
    let alive = true
    loadRegistry(workspaceId).then((res) => {
      if (!alive) return
      const reg = res.registry ?? []
      setRegistry(reg)
      const m = new Map(reg.map((r) => [r.type, r]))
      setNodes(toFlowNodes(initialGraph, m))
      setEdges(toFlowEdges(initialGraph))
    }).catch(() => setToast({ kind: "err", msg: "Couldn't load the node library." }))
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  function snapshot() {
    undoStack.current.push({ nodes: structuredClone(nodes), edges: structuredClone(edges), configs: structuredClone(configs) })
    if (undoStack.current.length > 50) undoStack.current.shift()
    redoStack.current = []
  }
  function undo() {
    const prev = undoStack.current.pop()
    if (!prev) return
    redoStack.current.push({ nodes: structuredClone(nodes), edges: structuredClone(edges), configs: structuredClone(configs) })
    setNodes(prev.nodes); setEdges(prev.edges); setConfigs(prev.configs)
  }
  function redo() {
    const next = redoStack.current.pop()
    if (!next) return
    undoStack.current.push({ nodes: structuredClone(nodes), edges: structuredClone(edges), configs: structuredClone(configs) })
    setNodes(next.nodes); setEdges(next.edges); setConfigs(next.configs)
  }

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds) as PNode[])
  }, [])
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds))
  }, [])
  const onConnect = useCallback((conn: Connection) => {
    snapshot()
    setEdges((eds) => addEdge({ ...conn, markerEnd: { type: MarkerType.ArrowClosed } }, eds))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, configs])

  function addNode(reg: RegistryNode) {
    snapshot()
    const id = nextKey(reg.type)
    const center = rf.screenToFlowPosition
      ? rf.screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
      : { x: 240 + Math.random() * 120, y: 160 + Math.random() * 120 }
    const node: PNode = {
      id, type: "propvora",
      position: { x: Math.round(center.x), y: Math.round(center.y) },
      data: {
        label: reg.label, nodeType: reg.type, category: reg.category as FlowNodeData["category"],
        requiresApproval: Boolean(reg.requiresApproval), blocked: Boolean(reg.blockedFromAutoRun), risk: reg.risk,
      },
    }
    const cfg: Record<string, unknown> = {}
    for (const f of reg.config ?? []) if (f.default != null) cfg[f.key] = f.default
    setNodes((n) => [...n, node])
    setConfigs((c) => ({ ...c, [id]: cfg }))
    setSelectedId(id)
  }

  function duplicateNode(id: string) {
    const src = nodes.find((n) => n.id === id)
    if (!src) return
    snapshot()
    const newId = nextKey(src.data.nodeType)
    setNodes((n) => [...n, { ...src, id: newId, position: { x: src.position.x + 40, y: src.position.y + 40 }, selected: false }])
    setConfigs((c) => ({ ...c, [newId]: structuredClone(c[id] ?? {}) }))
    setSelectedId(newId)
  }
  function deleteNode(id: string) {
    snapshot()
    setNodes((n) => n.filter((x) => x.id !== id))
    setEdges((e) => e.filter((x) => x.source !== id && x.target !== id))
    setConfigs((c) => { const n = { ...c }; delete n[id]; return n })
    if (selectedId === id) setSelectedId(null)
  }

  // Mark config errors on nodes (required fields missing) for the red ring.
  const decoratedNodes = useMemo(() => nodes.map((n) => {
    const def = regMap.get(n.data.nodeType)
    const cfg = configs[n.id] ?? {}
    const missing = (def?.config ?? []).some((f) => f.required && (cfg[f.key] == null || String(cfg[f.key]).trim() === ""))
    return { ...n, data: { ...n.data, hasConfigError: missing } }
  }), [nodes, configs, regMap])

  // JSON export: dumps the current graph as a downloadable file
  function exportGraph() {
    const payload = {
      definitionName,
      nodes: nodes.map((n) => ({
        node_key: n.id, node_type: n.data.nodeType, label: n.data.label,
        config: configs[n.id] ?? {}, pos_x: Math.round(n.position.x), pos_y: Math.round(n.position.y),
      })),
      edges: edges.map((e) => ({ source_key: e.source, target_key: e.target, branch_label: (e.label as string) ?? null })),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${definitionName.trim().replace(/\s+/g, "-").toLowerCase() || "automation"}-graph.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // JSON import: loads a previously exported graph JSON
  function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result ?? ""))
        if (parsed && Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
          snapshot()
          const initGraph: InitialGraph = { nodes: parsed.nodes, edges: parsed.edges }
          setNodes(toFlowNodes(initGraph, regMap))
          setEdges(toFlowEdges(initGraph))
          setConfigs(Object.fromEntries((parsed.nodes as InitNode[]).map((n) => [n.node_key, n.config ?? {}])))
          setToast({ kind: "ok", msg: "Graph imported successfully. Save to persist." })
        } else {
          setToast({ kind: "err", msg: "Invalid graph file — expected {nodes, edges}." })
        }
      } catch {
        setToast({ kind: "err", msg: "Couldn't parse the JSON file." })
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  // Load a template: replaces current graph with template nodes/edges
  function loadTemplate(tmpl: CanvasTemplate) {
    snapshot()
    let counter = 0
    const keyMap = new Map<string, string>()
    const newNodes: PNode[] = tmpl.nodes.map((tn) => {
      const rawKey = `${tn.node_type}_${counter++}`
      const id = nextKey(tn.node_type)
      keyMap.set(rawKey, id)
      const def = regMap.get(tn.node_type)
      return {
        id, type: "propvora",
        position: { x: tn.pos_x, y: tn.pos_y },
        data: {
          label: tn.label || def?.label || tn.node_type,
          nodeType: tn.node_type,
          category: (def?.category ?? "action") as FlowNodeData["category"],
          requiresApproval: Boolean(def?.requiresApproval),
          blocked: Boolean(def?.blockedFromAutoRun),
          risk: def?.risk ?? "low",
        },
      } as PNode
    })
    const newEdges: Edge[] = tmpl.edges.map((te, i) => {
      const srcKey = keyMap.get(te.source_key) ?? te.source_key
      const tgtKey = keyMap.get(te.target_key) ?? te.target_key
      return {
        id: `te_${i}`,
        source: srcKey,
        target: tgtKey,
        label: te.branch_label ?? undefined,
        markerEnd: { type: MarkerType.ArrowClosed },
        animated: false,
      }
    })
    const newConfigs: Record<string, Record<string, unknown>> = {}
    tmpl.nodes.forEach((tn, idx) => {
      const id = newNodes[idx]?.id
      if (id) newConfigs[id] = tn.config ?? {}
    })
    setNodes(newNodes)
    setEdges(newEdges)
    setConfigs(newConfigs)
    setSelectedId(null)
    setShowTemplates(false)
    setToast({ kind: "ok", msg: `Loaded template "${tmpl.name}". Save to persist.` })
  }

  async function persist(publish: boolean) {
    setSaving(true); setToast(null)
    try {
      const payload = {
        workspaceId, definitionId, publish,
        nodes: nodes.map((n) => ({
          node_key: n.id, node_type: n.data.nodeType, label: n.data.label,
          config: configs[n.id] ?? {}, pos_x: Math.round(n.position.x), pos_y: Math.round(n.position.y),
        })),
        edges: edges.map((e) => ({ source_key: e.source, target_key: e.target, branch_label: (e.label as string) ?? null })),
      }
      const res = await saveGraph(payload)
      if (res.compile) setCompile(res.compile)
      if (res.ok && res.published) setToast({ kind: "ok", msg: `Published v${res.version}. The graph is now the active version.` })
      else if (res.ok) setToast({ kind: "ok", msg: `Saved v${res.version} (draft).` })
      else setToast({ kind: "err", msg: res.error ?? "Couldn't save the graph." })
    } catch {
      setToast({ kind: "err", msg: "Couldn't save the graph." })
    } finally {
      setSaving(false)
    }
  }

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = q ? registry.filter((r) => r.label.toLowerCase().includes(q) || r.type.includes(q) || r.category.includes(q)) : registry
    const map = new Map<string, RegistryNode[]>()
    for (const r of list) { if (!map.has(r.group)) map.set(r.group, []); map.get(r.group)!.push(r) }
    return [...map.entries()]
  }, [registry, search])

  const selectedNode = nodes.find((n) => n.id === selectedId) ?? null
  const errCount = compile?.issues.filter((i) => i.level === "error").length ?? 0

  return (
    <div className={fullscreen ? "fixed inset-0 z-[60] flex flex-col bg-white" : "rounded-2xl border border-slate-200 bg-white shadow-sm"}>
      {/* Hidden import input */}
      <input ref={importRef} type="file" accept=".json,application/json" className="hidden" onChange={onImportFile} />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-3 py-2.5">
        <button onClick={() => setPaletteOpen((v) => !v)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
          <Plus className="h-3.5 w-3.5" /> Nodes
        </button>
        {/* Templates toggle */}
        <button
          onClick={() => setShowTemplates((v) => !v)}
          title="Templates"
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${showTemplates ? "border-violet-300 bg-violet-50 text-violet-700" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
        >
          <Layers className="h-3.5 w-3.5" /> Templates
        </button>
        <div className="flex items-center gap-1">
          <ToolBtn title="Undo" onClick={undo} icon={Undo2} />
          <ToolBtn title="Redo" onClick={redo} icon={Redo2} />
          <ToolBtn title={`Snap to grid: ${snap ? "on" : "off"}`} onClick={() => setSnap((v) => !v)} icon={Layout} active={snap} />
          <ToolBtn title="Fit view" onClick={() => rf.fitView({ padding: 0.2 })} icon={Search} />
        </div>
        <div className="mx-1 hidden text-[11px] text-slate-400 sm:block">{nodes.length} nodes · {edges.length} edges</div>
        <div className="ml-auto flex items-center gap-2">
          {/* JSON import */}
          <button onClick={() => importRef.current?.click()} title="Import JSON graph" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
            <Upload className="h-3.5 w-3.5" /> Import
          </button>
          {/* JSON export */}
          <button onClick={exportGraph} title="Export graph as JSON" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          <button onClick={() => persist(false)} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            <Save className="h-3.5 w-3.5" /> Save draft
          </button>
          <button onClick={() => persist(true)} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-[var(--brand-strong)] disabled:opacity-50">
            <CheckCircle2 className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Validate & publish"}
          </button>
          <ToolBtn title={fullscreen ? "Exit fullscreen" : "Fullscreen"} onClick={() => setFullscreen((v) => !v)} icon={fullscreen ? Minimize2 : Maximize2} />
        </div>
      </div>

      {/* Templates panel */}
      {showTemplates && (
        <div className="border-b border-slate-200 bg-slate-50 px-3 py-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Canvas templates — click to load</span>
            <button onClick={() => setShowTemplates(false)} className="grid h-6 w-6 place-items-center rounded text-slate-400 hover:bg-slate-200"><X className="h-3.5 w-3.5" /></button>
          </div>
          <div className="flex flex-wrap gap-2">
            {ADV_TEMPLATES.map((t) => {
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  onClick={() => loadTemplate(t)}
                  title={t.description}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-violet-300 hover:bg-violet-50 transition"
                >
                  <Icon className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                  {t.name}
                  <ChevronRight className="h-3 w-3 text-slate-300" />
                </button>
              )
            })}
          </div>
        </div>
      )}

      {toast && (
        <div className={["flex items-start gap-2 px-3 py-2 text-xs", toast.kind === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"].join(" ")}>
          {toast.kind === "ok" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
          <span className="flex-1">{toast.msg}</span>
          <button onClick={() => setToast(null)}><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      <div className="flex flex-1" style={{ height: fullscreen ? "auto" : 560 }}>
        {/* Palette */}
        {paletteOpen && (
          <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200">
            <div className="border-b border-slate-100 p-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search 85+ nodes…" className="w-full rounded-lg border border-slate-200 py-1.5 pl-8 pr-2 text-xs focus:border-[var(--color-brand-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-400)]/30" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {grouped.map(([group, items]) => (
                <div key={group} className="mb-3">
                  <div className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{group}</div>
                  <div className="space-y-1">
                    {items.map((r) => (
                      <button key={r.type} onClick={() => addNode(r)} title={r.description}
                        className="flex w-full items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-left text-xs text-slate-700 hover:border-slate-200 hover:bg-slate-50">
                        <span className="truncate font-medium">{r.label}</span>
                        {r.blockedFromAutoRun && <ShieldAlert className="ml-auto h-3 w-3 shrink-0 text-red-500" />}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {grouped.length === 0 && <p className="px-1 text-xs text-slate-400">No nodes match.</p>}
            </div>
          </aside>
        )}

        {/* Canvas */}
        <div className="relative flex-1">
          <ReactFlow
            nodes={decoratedNodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, n) => setSelectedId(n.id)}
            onPaneClick={() => setSelectedId(null)}
            snapToGrid={snap}
            snapGrid={[16, 16]}
            fitView
            proOptions={{ hideAttribution: true }}
            defaultEdgeOptions={{ markerEnd: { type: MarkerType.ArrowClosed } }}
          >
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e2e8f0" />
            <Controls showInteractive={false} />
            <MiniMap zoomable pannable className="!bottom-2 !right-2" nodeColor={() => "#94a3b8"} />
          </ReactFlow>
        </div>

        {/* Inspector */}
        {selectedNode && (
          <Inspector
            node={selectedNode}
            def={regMap.get(selectedNode.data.nodeType)}
            config={configs[selectedNode.id] ?? {}}
            canEditJson={canEditJson}
            onConfig={(cfg) => { snapshot(); setConfigs((c) => ({ ...c, [selectedNode.id]: cfg })) }}
            onDuplicate={() => duplicateNode(selectedNode.id)}
            onDelete={() => deleteNode(selectedNode.id)}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>

      {/* Compile / validation footer */}
      {compile && (
        <div className="border-t border-slate-200 px-3 py-2.5">
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold">
            {compile.ok ? <span className="text-emerald-700">Graph is valid</span> : <span className="text-red-700">{errCount} error(s) — fix before publish</span>}
            {compile.plan?.hasApprovalGate && <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-medium text-teal-700">Has approval gate</span>}
          </div>
          <ul className="space-y-0.5">
            {compile.issues.map((iss, i) => (
              <li key={i} className={["text-[11px]", iss.level === "error" ? "text-red-600" : "text-amber-600"].join(" ")}>
                {iss.level === "error" ? "✕" : "!"} {iss.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function ToolBtn({ title, onClick, icon: Icon, active }: { title: string; onClick: () => void; icon: React.ComponentType<{ className?: string }>; active?: boolean }) {
  return (
    <button title={title} onClick={onClick} className={["grid h-8 w-8 place-items-center rounded-lg border transition", active ? "border-[var(--color-brand-300)] bg-[var(--brand-soft)] text-[var(--brand)]" : "border-slate-200 text-slate-500 hover:bg-slate-50"].join(" ")}>
      <Icon className="h-4 w-4" />
    </button>
  )
}

// ── Inspector with tabs (Config / Inputs / Outputs / JSON / Test / Runs / Docs) ─
type Tab = "config" | "inputs" | "outputs" | "json" | "test" | "runs" | "docs"

function Inspector({ node, def, config, canEditJson, onConfig, onDuplicate, onDelete, onClose }: {
  node: PNode; def?: RegistryNode; config: Record<string, unknown>; canEditJson: boolean
  onConfig: (cfg: Record<string, unknown>) => void
  onDuplicate: () => void; onDelete: () => void; onClose: () => void
}) {
  const [tab, setTab] = useState<Tab>("config")
  const [jsonDraft, setJsonDraft] = useState("")
  const [jsonErr, setJsonErr] = useState<string | null>(null)

  useEffect(() => { setJsonDraft(JSON.stringify(config, null, 2)); setJsonErr(null) }, [node.id, config])

  const tabs: Array<[Tab, string]> = [
    ["config", "Config"], ["inputs", "Inputs"], ["outputs", "Outputs"],
    ["json", "JSON"], ["test", "Test"], ["runs", "Runs"], ["docs", "Docs"],
  ]

  function applyJson() {
    try {
      const parsed = JSON.parse(jsonDraft)
      if (typeof parsed !== "object" || Array.isArray(parsed) || parsed == null) throw new Error("Config must be a JSON object.")
      setJsonErr(null); onConfig(parsed as Record<string, unknown>)
    } catch (e) {
      setJsonErr(e instanceof Error ? e.message : "Invalid JSON.")
    }
  }

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-slate-200 bg-white">
      <div className="flex items-start justify-between border-b border-slate-100 p-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-900">{node.data.label}</div>
          <div className="truncate text-[11px] text-slate-400">{node.data.nodeType}</div>
        </div>
        <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-2 py-1.5">
        {tabs.map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} className={["whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-medium", tab === t ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"].join(" ")}>{label}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 text-xs">
        {tab === "config" && (
          <div className="space-y-3">
            {(def?.config ?? []).length === 0 && <p className="text-slate-400">This node has no configuration.</p>}
            {(def?.config ?? []).map((f) => (
              <div key={f.key}>
                <label className="mb-1 block text-[11px] font-medium text-slate-600">{f.label}{f.required ? " *" : ""}</label>
                {f.kind === "textarea" ? (
                  <textarea rows={3} value={String(config[f.key] ?? "")} onChange={(e) => onConfig({ ...config, [f.key]: e.target.value })} className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 focus:border-[var(--color-brand-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-400)]/30" />
                ) : f.kind === "select" ? (
                  <select value={String(config[f.key] ?? f.default ?? "")} onChange={(e) => onConfig({ ...config, [f.key]: e.target.value })} className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 focus:border-[var(--color-brand-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-400)]/30">
                    {(f.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : f.kind === "boolean" ? (
                  <input type="checkbox" checked={Boolean(config[f.key] ?? f.default)} onChange={(e) => onConfig({ ...config, [f.key]: e.target.checked })} className="h-4 w-4 rounded border-slate-300" />
                ) : (
                  <input type={f.kind === "number" ? "number" : "text"} value={String(config[f.key] ?? "")} onChange={(e) => onConfig({ ...config, [f.key]: f.kind === "number" ? Number(e.target.value) : e.target.value })} className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 focus:border-[var(--color-brand-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-400)]/30" />
                )}
                {f.help && <p className="mt-1 text-[10px] text-slate-400">{f.help}</p>}
                {f.supportsTokens && <p className="mt-1 text-[10px] text-slate-400">Tokens: {"{{summary}}"} + trigger facts.</p>}
              </div>
            ))}
          </div>
        )}

        {tab === "inputs" && (
          <div className="space-y-2 text-[11px] text-slate-600">
            <p className="font-medium text-slate-800">Inputs</p>
            <p>This node receives the run context (the matched record summary + trigger facts) and the output of upstream nodes on its path.</p>
            <ul className="list-disc pl-4 text-slate-500"><li>{"{{summary}}"} — human summary of the match</li><li>{"{{facts.*}}"} — structured trigger facts</li></ul>
          </div>
        )}
        {tab === "outputs" && (
          <div className="space-y-2 text-[11px] text-slate-600">
            <p className="font-medium text-slate-800">Outputs</p>
            <p>{node.data.category === "condition" || node.data.category === "branch" ? "Routes the run down a true/false (or matched) branch." : node.data.requiresApproval ? "Produces an approval item — never an auto side-effect." : "Produces a safe, reversible result the next node can read."}</p>
          </div>
        )}

        {tab === "json" && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500"><FileJson className="h-3.5 w-3.5" /> Node config JSON {canEditJson ? "(editable)" : "(read-only)"}</div>
            <textarea
              value={jsonDraft}
              onChange={(e) => setJsonDraft(e.target.value)}
              readOnly={!canEditJson}
              spellCheck={false}
              rows={12}
              className={["w-full rounded-lg border px-2.5 py-2 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-400)]/30", canEditJson ? "border-slate-200 focus:border-[var(--color-brand-400)]" : "border-slate-100 bg-slate-50 text-slate-500"].join(" ")}
            />
            {jsonErr && <p className="text-[11px] text-red-600">{jsonErr}</p>}
            {canEditJson && (
              <button onClick={applyJson} className="rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-slate-800">Apply JSON</button>
            )}
          </div>
        )}

        {tab === "test" && (
          <div className="space-y-2 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5 font-medium text-slate-800"><FlaskConical className="h-3.5 w-3.5" /> Test this node</div>
            <p>Validation runs on save/publish. {node.data.requiresApproval ? "This node is gated: in a real run it pauses for human approval and never executes automatically." : node.data.blocked ? "This node is blocked from auto-run entirely." : "This node maps to a safe, reversible action."}</p>
            <p className="text-slate-400">Use Validate & publish to run a full graph compile + dry run.</p>
          </div>
        )}
        {tab === "runs" && <p className="text-[11px] text-slate-400">No runs yet for this node. Once the automation is active, recent node runs (status, duration, output) appear here.</p>}
        {tab === "docs" && (
          <div className="space-y-2 text-[11px] text-slate-600">
            <p className="font-medium text-slate-800">{def?.label}</p>
            <p>{def?.description}</p>
            <dl className="grid grid-cols-2 gap-1 text-[10px] text-slate-500">
              <dt>Category</dt><dd className="text-slate-700">{def?.category}</dd>
              <dt>Risk</dt><dd className="text-slate-700">{def?.risk}</dd>
              <dt>Min plan</dt><dd className="text-slate-700">{def?.plan}</dd>
              <dt>Approval</dt><dd className="text-slate-700">{def?.requiresApproval ? "Required" : "No"}</dd>
            </dl>
          </div>
        )}
      </div>

      <div className="flex gap-2 border-t border-slate-100 p-3">
        <button onClick={onDuplicate} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50"><Copy className="h-3.5 w-3.5" /> Duplicate</button>
        <button onClick={onDelete} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1.5 text-[11px] font-medium text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
      </div>
    </aside>
  )
}

export default function ReactFlowCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  )
}
