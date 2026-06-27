"use client"

// Top compact enterprise workflow header.
// Inline-editable name, status pill, version, undo/redo, zoom controls,
// view mode selector, save draft, publish for review, maximise.

import React, { useRef, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft, Undo2, Redo2, ZoomIn, ZoomOut, Maximize2, Minimize2,
  Save, SendHorizonal, Pencil, Check, ChevronDown,
} from "lucide-react"
import { useSectionLink } from "@/components/sections/SectionBasePath"
import type { ViewMode } from "./types"
import type { FlowMeta } from "../hooks/useAutomationFlow"

const STATUS_PILL: Record<FlowMeta["status"], { label: string; cls: string }> = {
  draft:          { label: "Draft",          cls: "bg-slate-100 text-slate-600" },
  pending_review: { label: "Pending review", cls: "bg-amber-100 text-amber-700" },
  active:         { label: "Active",         cls: "bg-emerald-100 text-emerald-700" },
  archived:       { label: "Archived",       cls: "bg-slate-100 text-slate-400" },
}

const VERSIONS = ["1.0.0", "1.1.0", "2.0.0"]

interface Props {
  meta: FlowMeta
  onPatchMeta: (p: Partial<FlowMeta>) => void
  viewMode: ViewMode
  onViewModeChange: (m: ViewMode) => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onFitView: () => void
  maximised: boolean
  onToggleMaximise: () => void
  saving: boolean
  saved: boolean
  onSave: () => void
  onPublish: () => void
}

function InlineEditName({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  function startEdit() {
    setDraft(value)
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  function commit() {
    if (draft.trim()) onChange(draft.trim())
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit()
          if (e.key === "Escape") { setDraft(value); setEditing(false) }
        }}
        className="w-48 rounded-md border border-[var(--color-brand-400)] bg-white px-2 py-1 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-100)]"
        autoFocus
      />
    )
  }

  return (
    <button
      onClick={startEdit}
      className="group flex max-w-[200px] items-center gap-1.5 rounded-md px-2 py-1 hover:bg-slate-100 transition"
    >
      <span className="truncate text-sm font-semibold text-slate-900">{value}</span>
      <Pencil className="h-3.5 w-3.5 shrink-0 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
    </button>
  )
}

export function AutomationWorkflowHeader({
  meta,
  onPatchMeta,
  viewMode,
  onViewModeChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomIn,
  onZoomOut,
  onFitView,
  maximised,
  onToggleMaximise,
  saving,
  saved,
  onSave,
  onPublish,
}: Props) {
  const statusConfig = STATUS_PILL[meta.status] ?? STATUS_PILL.draft
  const sectionLink = useSectionLink()

  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 py-2">
      {/* Back */}
      <Link
        href={sectionLink("/property-manager/automations")}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
        title="Back to automations"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>

      <div className="mx-1 h-5 w-px bg-slate-200" />

      {/* Inline name */}
      <InlineEditName value={meta.name} onChange={(v) => onPatchMeta({ name: v })} />

      {/* Status pill */}
      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusConfig.cls}`}>
        {statusConfig.label}
      </span>

      {/* Version selector */}
      <div className="relative flex items-center">
        <select
          value={meta.version}
          onChange={(e) => onPatchMeta({ version: e.target.value })}
          className="appearance-none rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-2.5 pr-6 text-[11px] text-slate-600 focus:border-[var(--color-brand-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-100)] transition"
        >
          {VERSIONS.map((v) => (
            <option key={v} value={v}>v{v}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-1.5 h-3 w-3 text-slate-400" />
      </div>

      <div className="mx-1 h-5 w-px bg-slate-200" />

      {/* Undo/redo */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition"
        >
          <Redo2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mx-1 h-5 w-px bg-slate-200" />

      {/* Zoom controls */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={onZoomOut}
          title="Zoom out"
          className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 transition"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          onClick={onFitView}
          className="rounded-lg px-2 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 transition tabular-nums min-w-[44px] text-center"
          title="Fit to screen"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={onZoomIn}
          title="Zoom in"
          className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 transition"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
      </div>

      <div className="mx-1 h-5 w-px bg-slate-200" />

      {/* View mode selector */}
      <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
        {(["visual", "json", "code"] as ViewMode[]).map((m) => (
          <button
            key={m}
            onClick={() => onViewModeChange(m)}
            className={[
              "rounded-md px-2.5 py-1 text-[11px] font-semibold capitalize transition",
              viewMode === m
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700",
            ].join(" ")}
          >
            {m === "visual" ? "Visual" : m === "json" ? "JSON" : "Code"}
          </button>
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Save draft */}
      <button
        onClick={onSave}
        disabled={saving}
        className={[
          "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition",
          saved
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
          saving ? "opacity-60" : "",
        ].join(" ")}
      >
        {saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
        {saving ? "Saving…" : saved ? "Saved" : "Save draft"}
      </button>

      {/* Publish for review */}
      <button
        onClick={onPublish}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-3 py-1.5 text-[12px] font-semibold text-white shadow-[0_1px_6px_rgba(37,99,235,0.25)] hover:bg-[var(--brand-strong)] transition"
      >
        <SendHorizonal className="h-3.5 w-3.5" />
        Publish for review
      </button>

      {/* Maximise */}
      <button
        onClick={onToggleMaximise}
        title={maximised ? "Exit maximised mode" : "Maximise"}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
      >
        {maximised ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </button>
    </div>
  )
}
