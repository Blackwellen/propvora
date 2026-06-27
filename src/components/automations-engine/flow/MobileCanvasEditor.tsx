"use client"

// Mobile branch of the canvas. A drag-drop node graph is impractical on a phone,
// so on mobile we present a USABLE vertical node-list editor: an ordered list of
// nodes (add / configure / reorder / remove) that maps to the same node/edge
// model and persists through the same /api/automations/nodes save. A read-only
// zoomable graph preview is available too. Premium per-category shapes shrink to
// list chips with the same colour/icon language.

import React, { useEffect, useMemo, useState } from "react"
import {
  Plus, Trash2, ArrowUp, ArrowDown, Save, CheckCircle2, AlertTriangle, X, ChevronRight,
} from "lucide-react"
import { CATEGORY_VISUALS } from "@/lib/automation/node-registry"
import { loadRegistry, saveGraph, type RegistryNode, type CompileResultDTO } from "../api"
import type { InitialGraph } from "./ReactFlowCanvas"

interface Props {
  workspaceId: string
  definitionId: string
  definitionName: string
  initialGraph: InitialGraph
}

interface MNode { key: string; type: string; label: string; category: string; config: Record<string, unknown> }

let mk = 1

export default function MobileCanvasEditor({ workspaceId, definitionId, initialGraph }: Props) {
  const [registry, setRegistry] = useState<RegistryNode[]>([])
  const regMap = useMemo(() => new Map(registry.map((r) => [r.type, r])), [registry])
  const [nodes, setNodes] = useState<MNode[]>(() =>
    initialGraph.nodes.map((n) => ({ key: n.node_key, type: n.node_type, label: n.label || n.node_type, category: n.category, config: n.config ?? {} }))
  )
  const [pickerOpen, setPickerOpen] = useState(false)
  const [editKey, setEditKey] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [saving, setSaving] = useState(false)
  const [compile, setCompile] = useState<CompileResultDTO | null>(null)
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null)

  useEffect(() => {
    loadRegistry(workspaceId).then((r) => setRegistry(r.registry ?? [])).catch(() => {})
  }, [workspaceId])

  function addNode(r: RegistryNode) {
    const cfg: Record<string, unknown> = {}
    for (const f of r.config ?? []) if (f.default != null) cfg[f.key] = f.default
    const key = `${r.type.replace(/[^a-z0-9]/gi, "_")}_${Date.now().toString(36)}_${mk++}`
    setNodes((n) => [...n, { key, type: r.type, label: r.label, category: r.category, config: cfg }])
    setPickerOpen(false); setSearch("")
  }
  function move(i: number, dir: -1 | 1) {
    setNodes((n) => { const a = [...n]; const j = i + dir; if (j < 0 || j >= a.length) return a; [a[i], a[j]] = [a[j], a[i]]; return a })
  }
  function remove(key: string) { setNodes((n) => n.filter((x) => x.key !== key)); if (editKey === key) setEditKey(null) }

  async function persist(publish: boolean) {
    setSaving(true); setToast(null)
    // Linear edges follow the list order.
    const edges = nodes.slice(0, -1).map((n, i) => ({ source_key: n.key, target_key: nodes[i + 1].key, branch_label: null }))
    try {
      const res = await saveGraph({
        workspaceId, definitionId, publish,
        nodes: nodes.map((n, i) => ({ node_key: n.key, node_type: n.type, label: n.label, config: n.config, pos_x: 80, pos_y: 80 + i * 120 })),
        edges,
      })
      if (res.compile) setCompile(res.compile)
      setToast(res.ok ? { kind: "ok", msg: res.published ? `Published v${res.version}.` : `Saved v${res.version}.` } : { kind: "err", msg: res.error ?? "Couldn't save." })
    } catch { setToast({ kind: "err", msg: "Couldn't save." }) }
    finally { setSaving(false) }
  }

  const editNode = nodes.find((n) => n.key === editKey) ?? null
  const editDef = editNode ? regMap.get(editNode.type) : undefined
  const filtered = search ? registry.filter((r) => r.label.toLowerCase().includes(search.toLowerCase())) : registry

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button onClick={() => setPickerOpen(true)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700">
          <Plus className="h-4 w-4" /> Add node
        </button>
        <button onClick={() => persist(false)} disabled={saving} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 disabled:opacity-50"><Save className="h-4 w-4" /></button>
        <button onClick={() => persist(true)} disabled={saving} className="rounded-xl bg-[var(--brand)] px-3 py-2.5 text-sm font-medium text-white disabled:opacity-50"><CheckCircle2 className="h-4 w-4" /></button>
      </div>

      {toast && (
        <div className={["flex items-start gap-2 rounded-xl px-3 py-2 text-xs", toast.kind === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"].join(" ")}>
          {toast.kind === "ok" ? <CheckCircle2 className="mt-0.5 h-4 w-4" /> : <AlertTriangle className="mt-0.5 h-4 w-4" />}
          <span className="flex-1">{toast.msg}</span>
          <button onClick={() => setToast(null)}><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      <ol className="space-y-2">
        {nodes.length === 0 && <li className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">No nodes yet. Add a trigger to start.</li>}
        {nodes.map((n, i) => {
          const v = CATEGORY_VISUALS[n.category as keyof typeof CATEGORY_VISUALS] ?? CATEGORY_VISUALS.utility
          return (
            <li key={n.key} className={["flex items-center gap-2 rounded-xl border bg-white p-3", v.border].join(" ")}>
              <span className={["grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[11px] font-bold", v.bg, v.text].join(" ")}>{i + 1}</span>
              <button onClick={() => setEditKey(n.key)} className="min-w-0 flex-1 text-left">
                <div className="truncate text-sm font-semibold text-slate-900">{n.label}</div>
                <div className={["truncate text-[10px] font-medium uppercase", v.text].join(" ")}>{n.category}{v.gated ? " · gated" : ""}</div>
              </button>
              <div className="flex shrink-0 items-center gap-1">
                <button onClick={() => move(i, -1)} className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"><ArrowUp className="h-4 w-4" /></button>
                <button onClick={() => move(i, 1)} className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"><ArrowDown className="h-4 w-4" /></button>
                <button onClick={() => remove(n.key)} className="grid h-7 w-7 place-items-center rounded-lg text-red-400 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </div>
            </li>
          )
        })}
      </ol>

      {compile && (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className={["mb-1 text-xs font-semibold", compile.ok ? "text-emerald-700" : "text-red-700"].join(" ")}>{compile.ok ? "Graph is valid" : "Fix errors before publish"}</p>
          {compile.issues.map((iss, i) => <p key={i} className={["text-[11px]", iss.level === "error" ? "text-red-600" : "text-amber-600"].join(" ")}>{iss.message}</p>)}
        </div>
      )}

      {/* Node picker sheet */}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-900/40" onClick={() => setPickerOpen(false)}>
          <div className="max-h-[78vh] w-full overflow-y-auto rounded-t-2xl bg-white p-3" onClick={(e) => e.stopPropagation()}>
            <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search nodes…" className="mb-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <div className="space-y-1">
              {filtered.map((r) => (
                <button key={r.type} onClick={() => addNode(r)} className="flex w-full items-center gap-2 rounded-xl border border-slate-100 px-3 py-2.5 text-left text-sm hover:bg-slate-50">
                  <span className="truncate font-medium text-slate-800">{r.label}</span>
                  <span className="ml-auto text-[10px] uppercase text-slate-400">{r.category}</span>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Config sheet */}
      {editNode && (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-900/40" onClick={() => setEditKey(null)}>
          <div className="max-h-[80vh] w-full overflow-y-auto rounded-t-2xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">{editNode.label}</h3>
              <button onClick={() => setEditKey(null)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              {(editDef?.config ?? []).length === 0 && <p className="text-xs text-slate-400">No configuration for this node.</p>}
              {(editDef?.config ?? []).map((f) => (
                <div key={f.key}>
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">{f.label}{f.required ? " *" : ""}</label>
                  {f.kind === "textarea" ? (
                    <textarea rows={3} value={String(editNode.config[f.key] ?? "")} onChange={(e) => setNodes((ns) => ns.map((x) => x.key === editNode.key ? { ...x, config: { ...x.config, [f.key]: e.target.value } } : x))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                  ) : f.kind === "select" ? (
                    <select value={String(editNode.config[f.key] ?? f.default ?? "")} onChange={(e) => setNodes((ns) => ns.map((x) => x.key === editNode.key ? { ...x, config: { ...x.config, [f.key]: e.target.value } } : x))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
                      {(f.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : (
                    <input type={f.kind === "number" ? "number" : "text"} value={String(editNode.config[f.key] ?? "")} onChange={(e) => setNodes((ns) => ns.map((x) => x.key === editNode.key ? { ...x, config: { ...x.config, [f.key]: f.kind === "number" ? Number(e.target.value) : e.target.value } } : x))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
