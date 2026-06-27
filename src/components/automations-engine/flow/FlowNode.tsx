"use client"

// A single premium canvas node for React Flow. Renders a category-specific
// SHAPE + colour + icon, source/target handles, a gated lock for payment/legal,
// an approval badge, and a run-status ring (success/fail/skipped) when the run
// path is highlighted.

import React, { memo } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import {
  Zap, GitBranch, Split, Clock, Search, Sparkles, Play, MessageSquare,
  Lock, ShieldCheck, Scale, Plug, Webhook, Wrench, AlertTriangle, Flag,
  type LucideIcon,
} from "lucide-react"
import { CATEGORY_VISUALS, type AutomationNodeCategory } from "@/lib/automation/node-registry"
import { SHAPE_STYLES, CLIPPED_SHAPES } from "./shapes"

const ICONS: Record<string, LucideIcon> = {
  Zap, GitBranch, Split, Clock, Search, Sparkles, Play, MessageSquare,
  Lock, ShieldCheck, Scale, Plug, Webhook, Wrench, AlertTriangle, Flag,
}

export interface FlowNodeData extends Record<string, unknown> {
  label: string
  nodeType: string
  category: AutomationNodeCategory
  requiresApproval: boolean
  blocked: boolean
  risk: string
  hasConfigError?: boolean
  runStatus?: "success" | "fail" | "skipped" | "pending" | null
}

const RUN_RING: Record<string, string> = {
  success: "ring-2 ring-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.18)]",
  fail: "ring-2 ring-red-400 shadow-[0_0_0_4px_rgba(248,113,113,0.18)]",
  skipped: "ring-2 ring-slate-300 opacity-70",
  pending: "ring-2 ring-amber-300",
}

function FlowNodeInner({ data, selected }: NodeProps) {
  const d = data as FlowNodeData
  const visual = CATEGORY_VISUALS[d.category] ?? CATEGORY_VISUALS.utility
  const shape = SHAPE_STYLES[visual.shape]
  const clipped = CLIPPED_SHAPES.includes(visual.shape)
  const Icon = ICONS[visual.icon] ?? Play
  const isTrigger = d.category === "trigger"
  const isEnd = d.category === "end"
  const runRing = d.runStatus ? RUN_RING[d.runStatus] : ""

  return (
    <div
      className={[
        "group relative border bg-white shadow-sm transition",
        visual.bg, visual.border,
        shape.wrap,
        selected ? "ring-2 ring-[var(--brand)] shadow-md" : "",
        runRing,
        d.hasConfigError ? "ring-2 ring-red-400" : "",
      ].join(" ")}
      style={{ ...shape.style, minWidth: shape.minWidth }}
      data-node-category={d.category}
      data-node-type={d.nodeType}
    >
      {/* Target handle (all but triggers) */}
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Left}
          className="!h-3 !w-3 !border-2 !border-white !bg-slate-400"
        />
      )}

      <div className={["flex items-center gap-2 px-3", clipped ? "py-5 justify-center text-center" : "py-2.5"].join(" ")}>
        <span className={["grid h-7 w-7 shrink-0 place-items-center rounded-lg", visual.bg, visual.text].join(" ")}>
          <Icon className="h-4 w-4" />
        </span>
        {!clipped && (
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold text-slate-900">{d.label}</div>
            <div className={["truncate text-[10px] font-medium uppercase tracking-wide", visual.text].join(" ")}>{d.category}</div>
          </div>
        )}
        {clipped && (
          <span className="max-w-[110px] truncate text-[11px] font-semibold text-slate-900">{d.label}</span>
        )}
        {visual.gated && (
          <span title="Gated — never auto-runs" className="shrink-0 rounded-md bg-red-100 p-1 text-red-600">
            <Lock className="h-3 w-3" />
          </span>
        )}
      </div>

      {/* Badges row */}
      {!clipped && (d.requiresApproval || d.blocked) && (
        <div className="flex flex-wrap gap-1 px-3 pb-2">
          {d.requiresApproval && (
            <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[9px] font-semibold uppercase text-teal-700">Approval</span>
          )}
          {d.blocked && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-semibold uppercase text-red-700">Blocked auto-run</span>
          )}
        </div>
      )}

      {/* Source handle (all but ends) */}
      {!isEnd && (
        <Handle
          type="source"
          position={Position.Right}
          className="!h-3 !w-3 !border-2 !border-white !bg-[var(--brand)]"
        />
      )}
    </div>
  )
}

export const FlowNode = memo(FlowNodeInner)
