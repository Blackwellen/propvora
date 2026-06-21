"use client"

// Custom ReactFlow node component for all automation node types.
// Each category gets a distinct colour header, icon, and risk badge.
// @xyflow/react v12 — NodeProps passes data as unknown; we cast it explicitly.

import React, { memo } from "react"
import { Handle, Position } from "@xyflow/react"
import type { NodeProps } from "@xyflow/react"
import {
  Zap, GitBranch, Play, ShieldCheck, MessageSquare, Flag,
  Clock, Search, Sparkles, Lock, Scale, Plug, Wrench,
  AlertTriangle, MoreHorizontal, CheckCircle, AlertCircle,
  XCircle, Split, Webhook,
} from "lucide-react"
import type { CanvasFlowNodeData } from "./types"
import type { AutomationNodeCategory } from "@/lib/automation/node-registry"
import { nodeConfigComplete } from "@/lib/automation/node-registry"

// ── Category → visual config ────────────────────────────────────────────────

interface CategoryStyle {
  headerBg: string
  headerText: string
  icon: React.ElementType
  borderColor: string
}

const CATEGORY_STYLES: Record<AutomationNodeCategory, CategoryStyle> = {
  trigger:       { headerBg: "bg-emerald-600",  headerText: "text-white",  icon: Zap,           borderColor: "border-emerald-300" },
  condition:     { headerBg: "bg-amber-500",    headerText: "text-white",  icon: GitBranch,     borderColor: "border-amber-300" },
  branch:        { headerBg: "bg-orange-500",   headerText: "text-white",  icon: Split,         borderColor: "border-orange-300" },
  delay:         { headerBg: "bg-sky-500",      headerText: "text-white",  icon: Clock,         borderColor: "border-sky-300" },
  lookup:        { headerBg: "bg-cyan-500",     headerText: "text-white",  icon: Search,        borderColor: "border-cyan-300" },
  ai:            { headerBg: "bg-violet-600",   headerText: "text-white",  icon: Sparkles,      borderColor: "border-violet-300" },
  action:        { headerBg: "bg-blue-600",     headerText: "text-white",  icon: Play,          borderColor: "border-blue-300" },
  communication: { headerBg: "bg-indigo-600",   headerText: "text-white",  icon: MessageSquare, borderColor: "border-indigo-300" },
  payment:       { headerBg: "bg-red-600",      headerText: "text-white",  icon: Lock,          borderColor: "border-red-300" },
  approval:      { headerBg: "bg-violet-700",   headerText: "text-white",  icon: ShieldCheck,   borderColor: "border-violet-400" },
  legal:         { headerBg: "bg-rose-600",     headerText: "text-white",  icon: Scale,         borderColor: "border-rose-300" },
  integration:   { headerBg: "bg-fuchsia-600",  headerText: "text-white",  icon: Plug,          borderColor: "border-fuchsia-300" },
  webhook:       { headerBg: "bg-purple-600",   headerText: "text-white",  icon: Webhook,       borderColor: "border-purple-300" },
  utility:       { headerBg: "bg-slate-500",    headerText: "text-white",  icon: Wrench,        borderColor: "border-slate-300" },
  error:         { headerBg: "bg-rose-500",     headerText: "text-white",  icon: AlertTriangle, borderColor: "border-rose-300" },
  end:           { headerBg: "bg-slate-600",    headerText: "text-white",  icon: Flag,          borderColor: "border-slate-400" },
}

function ValidationIcon({ status }: { status: CanvasFlowNodeData["validationStatus"] }) {
  if (status === "valid") return <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
  if (status === "warning") return <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
  if (status === "error") return <XCircle className="h-3.5 w-3.5 text-red-500" />
  return <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-300 bg-white" />
}

function RiskBadge({ risk }: { risk: CanvasFlowNodeData["risk"] }) {
  if (risk === "low") return null
  const map: Record<string, string> = {
    medium: "bg-amber-100 text-amber-700",
    high: "bg-orange-100 text-orange-700",
    critical: "bg-red-100 text-red-700 font-semibold",
    restricted: "bg-rose-100 text-rose-700 font-semibold",
  }
  return (
    <span className={`rounded-full px-1.5 py-0.5 text-[9px] uppercase tracking-wide ${map[risk] ?? ""}`}>
      {risk}
    </span>
  )
}

// v12 NodeProps exposes `data` as the generic param; we cast safely.
export const AutomationNodeCard = memo(function AutomationNodeCard(
  props: NodeProps
) {
  const data = props.data as CanvasFlowNodeData
  const selected = props.selected
  const style = CATEGORY_STYLES[data.category] ?? CATEGORY_STYLES.utility
  const Icon = style.icon
  const isTerminal = data.category === "end"
  const isTrigger = data.category === "trigger"
  // Config complete check: show warning badge if required fields are missing
  const configComplete = nodeConfigComplete(data.nodeType, data.config ?? {})

  return (
    <div
      className={[
        "relative w-[220px] rounded-2xl border bg-white shadow-[0_2px_12px_rgba(15,23,42,0.08)] transition-all duration-150",
        style.borderColor,
        selected
          ? "ring-2 ring-blue-500 ring-offset-1 shadow-[0_4px_20px_rgba(59,130,246,0.20)]"
          : "hover:shadow-[0_4px_16px_rgba(15,23,42,0.12)]",
      ].join(" ")}
    >
      {/* Top handle — hidden on triggers */}
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Top}
          className="!h-3 !w-3 !rounded-full !border-2 !border-white !bg-slate-400 !shadow-sm"
        />
      )}

      {/* Colour header */}
      <div className={`flex items-center gap-2 rounded-t-2xl px-3 py-2.5 ${style.headerBg}`}>
        <Icon className={`h-4 w-4 shrink-0 ${style.headerText}`} />
        <span className={`text-[11px] font-semibold uppercase tracking-wide ${style.headerText}`}>
          {data.category}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <RiskBadge risk={data.risk} />
          {data.requiresApproval && (
            <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-white tracking-wide">
              review
            </span>
          )}
          <button
            className="grid h-5 w-5 place-items-center rounded text-white/70 hover:bg-white/20 transition"
            onClick={(e) => e.stopPropagation()}
            aria-label="Node options"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-3 py-2.5">
        <div className="flex items-start justify-between gap-1.5">
          <p className="text-[13px] font-semibold leading-snug text-slate-900 line-clamp-2">
            {data.label}
          </p>
          <ValidationIcon status={data.validationStatus} />
        </div>
        {data.description && (
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500 line-clamp-2">
            {data.description}
          </p>
        )}
        {/* Config required warning badge */}
        {!configComplete && data.category !== "trigger" && data.category !== "end" && (
          <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5">
            <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
            <span className="text-[10px] font-semibold text-red-600">Configuration required</span>
          </div>
        )}
      </div>

      {/* Bottom handle — hidden on end nodes */}
      {!isTerminal && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!h-3 !w-3 !rounded-full !border-2 !border-white !bg-slate-400 !shadow-sm"
        />
      )}
    </div>
  )
})

AutomationNodeCard.displayName = "AutomationNodeCard"
