"use client"

// Quick-add node popover — shown when clicking "+" on the canvas.

import React, { useRef, useState } from "react"
import { Search, Plus, X } from "lucide-react"
import {
  AUTOMATION_NODE_REGISTRY,
  NODE_GROUP_ORDER,
  groupToCategory,
} from "@/lib/automation/node-registry"
import type { AutomationNodeDefinition } from "@/lib/automation/node-registry"
import type { CanvasFlowNodeData } from "./types"
import type { Node } from "@xyflow/react"

interface Props {
  position?: { x: number; y: number }
  onAddNode: (node: Node<CanvasFlowNodeData>) => void
  onClose: () => void
}

export function AddNodePopover({ position, onAddNode, onClose }: Props) {
  const [search, setSearch] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const q = search.trim().toLowerCase()
  const filtered = q
    ? AUTOMATION_NODE_REGISTRY.filter(
        (n) => n.label.toLowerCase().includes(q) || n.description.toLowerCase().includes(q)
      )
    : null

  function addDef(def: AutomationNodeDefinition) {
    const key = `${def.type}-${Date.now()}`
    const node: Node<CanvasFlowNodeData> = {
      id: key,
      type: "automationNode",
      position: position ?? { x: 300, y: 300 },
      data: {
        nodeKey: key,
        nodeType: def.type,
        category: groupToCategory(def.group),
        label: def.label,
        description: def.description,
        config: {},
        validationStatus: "unchecked",
        requiresApproval: def.requiresApproval ?? false,
        risk: def.risk,
      },
    }
    onAddNode(node)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-[360px] rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.15)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-bold text-slate-900">Add node</span>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative px-4 pt-3 pb-2">
          <Search className="absolute left-7 top-1/2 h-3.5 w-3.5 -translate-y-0.5 text-slate-400" />
          <input
            ref={inputRef}
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search all nodes…"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
          />
        </div>

        {/* Results */}
        <div className="max-h-[340px] overflow-y-auto px-2 pb-3">
          {filtered ? (
            filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No nodes found for "{search}"</p>
            ) : (
              filtered.map((def) => (
                <NodeRow key={def.type} def={def} onAdd={() => addDef(def)} />
              ))
            )
          ) : (
            NODE_GROUP_ORDER.flatMap((group) => {
              const nodes = AUTOMATION_NODE_REGISTRY.filter((n) => n.group === group)
              if (!nodes.length) return []
              return [
                <div key={group}>
                  <p className="mt-2 mb-1 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {group}
                  </p>
                  {nodes.slice(0, 3).map((def) => (
                    <NodeRow key={def.type} def={def} onAdd={() => addDef(def)} />
                  ))}
                </div>,
              ]
            })
          )}
        </div>
      </div>
    </div>
  )
}

function NodeRow({ def, onAdd }: { def: AutomationNodeDefinition; onAdd: () => void }) {
  return (
    <button
      onClick={onAdd}
      className="flex w-full items-start gap-2.5 rounded-xl px-2 py-2 text-left hover:bg-blue-50 transition"
    >
      <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100">
        <Plus className="h-3.5 w-3.5 text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-slate-800 truncate">{def.label}</p>
        <p className="text-[11px] text-slate-500 line-clamp-1">{def.description}</p>
      </div>
      {def.requiresApproval && (
        <span className="shrink-0 rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-medium text-violet-600">review</span>
      )}
    </button>
  )
}
