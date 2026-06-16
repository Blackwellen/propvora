"use client"

// Canvas Lite — a simple, readable trigger → conditions → action flow.
//
// Desktop (lg+): a horizontal node/edge canvas with connecting arrows. Nodes are
// selectable; selecting one opens the inspector (handled by the parent).
// Mobile (< lg): a vertical, ordered step list (MobileStepList) — a usable,
// thumb-friendly editor instead of a free-form canvas.

import React from "react"
import { Zap, Filter, Sparkles, ChevronRight, Plus, Trash2, ArrowDown } from "lucide-react"
import { triggerDef, actionDef } from "@/lib/automation/catalogue"
import type { AutomationDefinition } from "./types"

export type CanvasSelection =
  | { kind: "trigger" }
  | { kind: "condition"; index: number }
  | { kind: "action" }

const NODE_META = {
  trigger: { icon: Zap, label: "Trigger", cls: "from-blue-500 to-blue-600", ring: "ring-blue-200", chip: "bg-blue-50 text-blue-700" },
  condition: { icon: Filter, label: "Condition", cls: "from-amber-500 to-amber-600", ring: "ring-amber-200", chip: "bg-amber-50 text-amber-700" },
  action: { icon: Sparkles, label: "Action", cls: "from-violet-500 to-violet-600", ring: "ring-violet-200", chip: "bg-violet-50 text-violet-700" },
} as const

function triggerSummary(def: AutomationDefinition): string {
  const t = triggerDef(def.trigger_type)
  if (!t) return def.trigger_type
  const cfg = t.configFields
    .map((f) => `${f.label}: ${def.trigger_config[f.key] ?? f.default ?? "—"}`)
    .join(" · ")
  return cfg || t.description
}
function actionSummary(def: AutomationDefinition): string {
  const a = actionDef(def.action_type)
  if (!a) return def.action_type
  const first = a.configFields[0]
  return first ? `${first.label}: ${def.action_config[first.key] || "—"}` : a.description
}

/* ── Desktop node ── */
function Node({
  kind,
  title,
  subtitle,
  selected,
  onClick,
  onRemove,
}: {
  kind: keyof typeof NODE_META
  title: string
  subtitle: string
  selected: boolean
  onClick: () => void
  onRemove?: () => void
}) {
  const meta = NODE_META[kind]
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-56 shrink-0 rounded-2xl border bg-white p-4 text-left shadow-[0_2px_10px_rgba(15,23,42,0.06)] transition ${
        selected ? `border-transparent ring-2 ${meta.ring}` : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className={`grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br ${meta.cls} text-white shadow-sm`}>
          <meta.icon className="h-4 w-4" />
        </span>
        <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${meta.chip}`}>{meta.label}</span>
        {onRemove && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Remove node"
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onRemove() } }}
            className="ml-auto grid h-6 w-6 place-items-center rounded-md text-slate-300 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <div className="mt-2.5 truncate text-sm font-semibold text-slate-800">{title}</div>
      <div className="mt-0.5 line-clamp-2 text-xs text-slate-500">{subtitle}</div>
    </button>
  )
}

function Connector() {
  return (
    <div className="flex shrink-0 items-center px-1 text-slate-300">
      <div className="h-px w-6 bg-slate-200" />
      <ChevronRight className="h-4 w-4" />
    </div>
  )
}

/* ── Desktop canvas ── */
export function DesktopCanvas({
  definition,
  selection,
  onSelect,
  onAddCondition,
  onRemoveCondition,
}: {
  definition: AutomationDefinition
  selection: CanvasSelection
  onSelect: (s: CanvasSelection) => void
  onAddCondition: () => void
  onRemoveCondition: (i: number) => void
}) {
  const tName = triggerDef(definition.trigger_type)?.label ?? definition.trigger_type
  const aName = actionDef(definition.action_type)?.label ?? definition.action_type
  const canAddCondition = (triggerDef(definition.trigger_type)?.configFields.length ?? 0) > 0

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.18)_1px,transparent_0)] [background-size:20px_20px] p-6">
      <div className="flex min-w-max items-center gap-0">
        <Node
          kind="trigger"
          title={tName}
          subtitle={triggerSummary(definition)}
          selected={selection.kind === "trigger"}
          onClick={() => onSelect({ kind: "trigger" })}
        />
        <Connector />

        {definition.conditions.map((c, i) => (
          <React.Fragment key={i}>
            <Node
              kind="condition"
              title={`If ${c.key || "—"}`}
              subtitle={`${c.op === "lte" ? "≤" : c.op === "gte" ? "≥" : "="} ${c.value || "…"}`}
              selected={selection.kind === "condition" && selection.index === i}
              onClick={() => onSelect({ kind: "condition", index: i })}
              onRemove={() => onRemoveCondition(i)}
            />
            <Connector />
          </React.Fragment>
        ))}

        {canAddCondition && (
          <>
            <button
              type="button"
              onClick={onAddCondition}
              className="flex h-[104px] w-12 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-slate-300 text-slate-400 transition hover:border-blue-300 hover:text-blue-500"
              aria-label="Add condition"
            >
              <Plus className="h-4 w-4" />
            </button>
            <Connector />
          </>
        )}

        <Node
          kind="action"
          title={aName}
          subtitle={actionSummary(definition)}
          selected={selection.kind === "action"}
          onClick={() => onSelect({ kind: "action" })}
        />
      </div>
    </div>
  )
}

/* ── Mobile vertical step list ── */
export function MobileStepList({
  definition,
  selection,
  onSelect,
  onAddCondition,
  onRemoveCondition,
}: {
  definition: AutomationDefinition
  selection: CanvasSelection
  onSelect: (s: CanvasSelection) => void
  onAddCondition: () => void
  onRemoveCondition: (i: number) => void
}) {
  const tName = triggerDef(definition.trigger_type)?.label ?? definition.trigger_type
  const aName = actionDef(definition.action_type)?.label ?? definition.action_type
  const canAddCondition = (triggerDef(definition.trigger_type)?.configFields.length ?? 0) > 0

  function Row({
    kind,
    title,
    subtitle,
    active,
    onClick,
    onRemove,
  }: {
    kind: keyof typeof NODE_META
    title: string
    subtitle: string
    active: boolean
    onClick: () => void
    onRemove?: () => void
  }) {
    const meta = NODE_META[kind]
    return (
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center gap-3 rounded-2xl border bg-white p-3.5 text-left shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition ${
          active ? `border-transparent ring-2 ${meta.ring}` : "border-slate-200"
        }`}
      >
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${meta.cls} text-white`}>
          <meta.icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase ${meta.chip}`}>{meta.label}</span>
            <span className="truncate text-sm font-semibold text-slate-800">{title}</span>
          </div>
          <div className="mt-0.5 truncate text-xs text-slate-500">{subtitle}</div>
        </div>
        {onRemove && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Remove step"
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onRemove() } }}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </span>
        )}
      </button>
    )
  }

  function Arrow() {
    return (
      <div className="flex justify-center py-1.5 text-slate-300">
        <ArrowDown className="h-4 w-4" />
      </div>
    )
  }

  return (
    <div>
      <Row
        kind="trigger"
        title={tName}
        subtitle={triggerSummary(definition)}
        active={selection.kind === "trigger"}
        onClick={() => onSelect({ kind: "trigger" })}
      />
      <Arrow />

      {definition.conditions.map((c, i) => (
        <React.Fragment key={i}>
          <Row
            kind="condition"
            title={`If ${c.key || "—"}`}
            subtitle={`${c.op === "lte" ? "≤" : c.op === "gte" ? "≥" : "="} ${c.value || "…"}`}
            active={selection.kind === "condition" && selection.index === i}
            onClick={() => onSelect({ kind: "condition", index: i })}
            onRemove={() => onRemoveCondition(i)}
          />
          <Arrow />
        </React.Fragment>
      ))}

      {canAddCondition && (
        <>
          <button
            type="button"
            onClick={onAddCondition}
            className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-slate-300 bg-white/60 py-3 text-xs font-medium text-slate-500 hover:border-blue-300 hover:text-blue-600"
          >
            <Plus className="h-4 w-4" /> Add condition
          </button>
          <Arrow />
        </>
      )}

      <Row
        kind="action"
        title={aName}
        subtitle={actionSummary(definition)}
        active={selection.kind === "action"}
        onClick={() => onSelect({ kind: "action" })}
      />
    </div>
  )
}
