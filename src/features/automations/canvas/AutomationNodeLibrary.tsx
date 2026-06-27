"use client"

// Left panel: searchable, categorised node library. Click a node to add it to
// the canvas (click-to-add, like n8n/Zapier). Every registry group is reachable
// via the category pills + search.

import React, { useMemo, useState } from "react"
import {
  Search, ChevronDown, ChevronRight, Plus,
  Zap, GitBranch, Play, ShieldCheck, MessageSquare, Flag,
  Clock, Sparkles, Lock, Scale, Plug, Wrench, AlertTriangle, Split, Webhook,
} from "lucide-react"
import {
  AUTOMATION_NODE_REGISTRY,
  NODE_GROUP_ORDER,
  groupToCategory,
  type AutomationNodeGroup,
  type AutomationNodeDefinition,
} from "@/lib/automation/node-registry"
import type { CanvasFlowNodeData } from "./types"
import type { Node } from "@xyflow/react"

// ── Category filter pills ─────────────────────────────────────────────────────
// Every registry group must appear in at least one pill, or those nodes become
// unreachable when a filter is active. "Legal" was previously omitted entirely.
const FILTER_PILLS = [
  { id: "all",   label: "All" },
  { id: "core",  label: "Core",  groups: ["Trigger", "Condition", "Branch", "Delay"] },
  { id: "ops",   label: "Ops",   groups: ["Action", "Approval", "Legal"] },
  { id: "comm",  label: "Comm",  groups: ["Communication"] },
  { id: "fin",   label: "Fin",   groups: ["Payment"] },
  { id: "ai",    label: "AI",    groups: ["AI"] },
  { id: "utils", label: "Utils", groups: ["Utility", "Error", "End", "Lookup", "Integration", "Webhook/API"] },
] as const

type FilterId = (typeof FILTER_PILLS)[number]["id"]

const GROUP_ICON: Partial<Record<AutomationNodeGroup, React.ElementType>> = {
  Trigger: Zap,
  Condition: GitBranch,
  Branch: Split,
  Delay: Clock,
  Lookup: Search,
  AI: Sparkles,
  Action: Play,
  Communication: MessageSquare,
  Payment: Lock,
  Approval: ShieldCheck,
  Legal: Scale,
  Integration: Plug,
  "Webhook/API": Webhook,
  Utility: Wrench,
  Error: AlertTriangle,
  End: Flag,
}

const GROUP_BG: Partial<Record<AutomationNodeGroup, string>> = {
  Trigger: "bg-emerald-100 text-emerald-700",
  Condition: "bg-amber-100 text-amber-700",
  Branch: "bg-orange-100 text-orange-700",
  Delay: "bg-sky-100 text-sky-700",
  Lookup: "bg-cyan-100 text-cyan-700",
  AI: "bg-violet-100 text-violet-700",
  Action: "bg-blue-100 text-blue-700",
  Communication: "bg-indigo-100 text-indigo-700",
  Payment: "bg-red-100 text-red-700",
  Approval: "bg-violet-100 text-violet-700",
  Legal: "bg-rose-100 text-rose-700",
  Integration: "bg-fuchsia-100 text-fuchsia-700",
  "Webhook/API": "bg-purple-100 text-purple-700",
  Utility: "bg-slate-100 text-slate-700",
  Error: "bg-rose-100 text-rose-700",
  End: "bg-slate-100 text-slate-700",
}

function buildNodeData(def: AutomationNodeDefinition): CanvasFlowNodeData {
  return {
    nodeKey: `${def.type}-${Date.now()}`,
    nodeType: def.type,
    category: groupToCategory(def.group),
    label: def.label,
    description: def.description,
    config: {},
    validationStatus: "unchecked",
    requiresApproval: def.requiresApproval ?? false,
    risk: def.risk,
  }
}

interface Props {
  onAddNode: (node: Node<CanvasFlowNodeData>) => void
}

export function AutomationNodeLibrary({ onAddNode }: Props) {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<FilterId>("all")
  const [collapsed, setCollapsed] = useState<Set<AutomationNodeGroup>>(new Set())

  const toggleGroup = (g: AutomationNodeGroup) =>
    setCollapsed((s) => {
      const n = new Set(s)
      n.has(g) ? n.delete(g) : n.add(g)
      return n
    })

  // Compute which groups to show based on filter
  const allowedGroups: AutomationNodeGroup[] | null = useMemo(() => {
    if (filter === "all") return null
    const pill = FILTER_PILLS.find((p) => p.id === filter)
    return (pill && "groups" in pill ? ([...pill.groups] as AutomationNodeGroup[]) : null)
  }, [filter])

  // Group + filter nodes
  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase()
    return NODE_GROUP_ORDER.flatMap((group) => {
      if (allowedGroups && !allowedGroups.includes(group)) return []
      const nodes = AUTOMATION_NODE_REGISTRY.filter(
        (n) =>
          n.group === group &&
          (!q || n.label.toLowerCase().includes(q) || n.description.toLowerCase().includes(q))
      )
      if (!nodes.length) return []
      return [{ group, nodes }]
    })
  }, [search, allowedGroups])

  function handleAddNode(def: AutomationNodeDefinition) {
    const data = buildNodeData(def)
    const node: Node<CanvasFlowNodeData> = {
      id: data.nodeKey,
      type: "automationNode",
      position: { x: 200 + Math.random() * 200, y: 200 + Math.random() * 200 },
      data,
    }
    onAddNode(node)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_4px_rgba(15,23,42,0.05)]">
      {/* Header */}
      <div className="border-b border-slate-100 px-3 pt-3 pb-2">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Node Library
        </p>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search nodes…"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
          />
        </div>
        {/* Category pills */}
        <div className="mt-2 flex flex-wrap gap-1">
          {FILTER_PILLS.map((pill) => (
            <button
              key={pill.id}
              onClick={() => setFilter(pill.id)}
              className={[
                "rounded-full px-2 py-0.5 text-[10px] font-semibold transition",
                filter === pill.id
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              ].join(" ")}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Node list */}
      <div className="flex-1 overflow-y-auto pb-4">
        {grouped.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Search className="h-8 w-8 text-slate-300" />
            <p className="text-sm font-medium text-slate-400">No nodes found</p>
            <button onClick={() => setSearch("")} className="text-xs text-blue-500 underline">Clear search</button>
          </div>
        )}

        {grouped.map(({ group, nodes }) => {
          const Icon = GROUP_ICON[group] ?? Play
          const iconCls = GROUP_BG[group] ?? "bg-slate-100 text-slate-700"
          const isCollapsed = collapsed.has(group)

          return (
            <div key={group} className="border-b border-slate-100 last:border-b-0">
              {/* Group header */}
              <button
                onClick={() => toggleGroup(group)}
                className="flex w-full items-center gap-2 px-3 py-2 hover:bg-slate-50 transition"
              >
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ${iconCls}`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="flex-1 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                  {group}
                </span>
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                  {nodes.length}
                </span>
                {isCollapsed ? (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                )}
              </button>

              {/* Node items */}
              {!isCollapsed && (
                <div className="pb-1">
                  {nodes.map((def) => (
                    <NodeItem key={def.type} def={def} onAdd={() => handleAddNode(def)} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function NodeItem({
  def,
  onAdd,
}: {
  def: AutomationNodeDefinition
  onAdd: () => void
}) {
  const riskColor =
    def.risk === "critical" || def.risk === "restricted"
      ? "bg-red-50 border-red-200"
      : def.risk === "high"
      ? "bg-orange-50 border-orange-200"
      : ""

  return (
    <button
      onClick={onAdd}
      title={`Add ${def.label}`}
      className={[
        "group flex w-full cursor-pointer items-start gap-2 border-b border-slate-50 px-3 py-2 text-left transition hover:bg-blue-50 last:border-b-0",
        riskColor,
      ].join(" ")}
    >
      <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded text-slate-300 group-hover:bg-blue-100 group-hover:text-blue-600 transition">
        <Plus className="h-3 w-3" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-medium text-slate-800">{def.label}</p>
        <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-400">{def.description}</p>
        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-500">
            {def.plan}
          </span>
          {(def.requiresApproval || def.blockedFromAutoRun) && (
            <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-medium text-violet-600">
              {def.blockedFromAutoRun ? "gated" : "review"}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
