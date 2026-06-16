"use client"

// Canvas Lite client — a visual trigger → conditions → action flow.
//  - Desktop: node/edge canvas (DesktopCanvas) with a side inspector.
//  - Mobile: vertical ordered step list (MobileStepList) with a sheet inspector.
// Save goes through the definitions API with source:"canvas" (Canvas Lite gate).
// Extras: fullscreen toggle, JSON export/import, 8 pre-built canvas templates.

import React, { useRef, useState } from "react"
import Link from "next/link"
import {
  LayoutTemplate, ArrowLeft, Check, AlertCircle, Wand2, X,
  Maximize2, Minimize2, Download, Upload, Layers,
  Bell, Shield, Wrench, CalendarCheck, FileText, Clock, AlertTriangle, MessageSquare,
  ChevronRight,
} from "lucide-react"
import {
  TRIGGER_CATALOGUE,
  ACTION_CATALOGUE,
  triggerDef,
  actionDef,
} from "@/lib/automation/catalogue"
import type { ActionType, TriggerType } from "@/lib/automation/types"
import { useIsBelowDesktop } from "@/components/mobile"
import { DesktopCanvas, MobileStepList, type CanvasSelection } from "@/components/automations-builder/CanvasFlow"
import DryRunPanel from "@/components/automations-builder/DryRunPanel"
import { BuilderHeader, ReviewFirstBanner, fieldClass, labelClass } from "@/components/automations-builder/shared"
import { dryRunDefinition, saveDefinition, isApiError } from "@/components/automations-builder/api"
import { emptyDefinition, type AutomationDefinition, type DryRunResponse, type DefinitionCondition } from "@/components/automations-builder/types"

// ── Canvas templates (8 operator-focused) ────────────────────────────────────
interface CanvasTemplate {
  id: string
  name: string
  description: string
  icon: React.ElementType
  definition: Partial<AutomationDefinition>
}

const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: "rent-due-reminder",
    name: "Rent due reminder",
    description: "3 days before rent is due → draft email + SMS to tenant.",
    icon: Bell,
    definition: {
      name: "Rent due reminder",
      trigger_type: "rent_overdue" as TriggerType,
      trigger_config: { min_days_overdue: -3, min_amount: 0 },
      conditions: [],
      action_type: "draft_message" as ActionType,
      action_config: {
        subject: "Reminder: Rent due in 3 days",
        body: "Hi {{tenant_name}},\n\nThis is a friendly reminder that your rent of {{amount}} is due in 3 days. Please ensure payment is made on time.\n\nThank you.",
      },
      review_required: true,
    },
  },
  {
    id: "cert-expiry-alert",
    name: "Certificate expiry alert",
    description: "30 days before a certificate expires → notify operator.",
    icon: Shield,
    definition: {
      name: "Certificate expiry alert",
      trigger_type: "compliance_due_soon" as TriggerType,
      trigger_config: { within_days: 30 },
      conditions: [],
      action_type: "create_notification" as ActionType,
      action_config: {
        title: "Certificate expiring: {{summary}}",
        body: "A certificate is expiring within 30 days. Please arrange renewal.",
        severity: "warning",
      },
      review_required: false,
    },
  },
  {
    id: "new-maintenance-request",
    name: "New maintenance request",
    description: "On maintenance job created → assign supplier + notify.",
    icon: Wrench,
    definition: {
      name: "New maintenance request",
      trigger_type: "job_completed" as TriggerType,
      trigger_config: { within_days: 1 },
      conditions: [],
      action_type: "create_task" as ActionType,
      action_config: {
        title: "Assign supplier for: {{summary}}",
        description: "A new maintenance request has been created. Assign a supplier and schedule the work.",
        priority: "high",
        due_in_days: "1",
      },
      review_required: true,
    },
  },
  {
    id: "booking-confirmed-welcome",
    name: "Booking confirmed",
    description: "On booking status=confirmed → send guest welcome email.",
    icon: CalendarCheck,
    definition: {
      name: "Booking confirmed — guest welcome",
      trigger_type: "job_completed" as TriggerType,
      trigger_config: { within_days: 1 },
      conditions: [],
      action_type: "draft_message" as ActionType,
      action_config: {
        subject: "Welcome — your booking is confirmed",
        body: "Dear Guest,\n\nYour booking has been confirmed. We look forward to welcoming you.\n\nPlease don't hesitate to contact us if you have any questions.",
      },
      review_required: true,
    },
  },
  {
    id: "job-completed-invoice",
    name: "Job completed → invoice",
    description: "On job status=completed → create invoice draft.",
    icon: FileText,
    definition: {
      name: "Job completed — create invoice",
      trigger_type: "job_completed" as TriggerType,
      trigger_config: { within_days: 7 },
      conditions: [],
      action_type: "create_task" as ActionType,
      action_config: {
        title: "Create invoice for: {{summary}}",
        description: "Job has been completed. Create and send the invoice to the client.",
        priority: "normal",
        due_in_days: "2",
      },
      review_required: true,
    },
  },
  {
    id: "lease-ending-renewal",
    name: "Lease ending soon",
    description: "60 days before tenancy ends → notify + start renewal.",
    icon: Clock,
    definition: {
      name: "Lease ending soon — renewal prompt",
      trigger_type: "tenancy_ending" as TriggerType,
      trigger_config: { within_days: 60 },
      conditions: [],
      action_type: "create_task" as ActionType,
      action_config: {
        title: "Tenancy renewal: {{summary}}",
        description: "Tenancy ending in 60 days. Contact tenant to discuss renewal or re-let.",
        priority: "high",
        due_in_days: "7",
      },
      review_required: true,
    },
  },
  {
    id: "supplier-job-overdue",
    name: "Supplier job overdue",
    description: "Past due_date, job not completed → escalate.",
    icon: AlertTriangle,
    definition: {
      name: "Supplier job overdue — escalate",
      trigger_type: "job_completed" as TriggerType,
      trigger_config: { within_days: 0 },
      conditions: [],
      action_type: "flag_record" as ActionType,
      action_config: {
        reason: "Job is overdue and not completed: {{summary}}",
      },
      review_required: false,
    },
  },
  {
    id: "new-portal-message",
    name: "New portal message",
    description: "On portal message received → notify workspace member.",
    icon: MessageSquare,
    definition: {
      name: "New portal message — notify team",
      trigger_type: "compliance_overdue" as TriggerType,
      trigger_config: { min_days_overdue: 0 },
      conditions: [],
      action_type: "create_notification" as ActionType,
      action_config: {
        title: "New portal message",
        body: "A new message has arrived in the tenant/landlord portal: {{summary}}",
        severity: "info",
      },
      review_required: false,
    },
  },
]

interface Props {
  workspaceId?: string
}

export default function CanvasClient({ workspaceId }: Props) {
  const isMobile = useIsBelowDesktop()
  const [definition, setDefinition] = useState<AutomationDefinition>(() =>
    emptyDefinition(TRIGGER_CATALOGUE[0].type, ACTION_CATALOGUE[0].type)
  )
  const [selection, setSelection] = useState<CanvasSelection>({ kind: "trigger" })
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)

  const [dry, setDry] = useState<DryRunResponse | null>(null)
  const [dryLoading, setDryLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const importRef = useRef<HTMLInputElement>(null)

  function patch(p: Partial<AutomationDefinition>) {
    setDefinition((d) => ({ ...d, ...p }))
    setDry(null)
    setSaved(null)
  }

  function select(s: CanvasSelection) {
    setSelection(s)
    setInspectorOpen(true)
  }

  function addCondition() {
    const firstKey = triggerDef(definition.trigger_type)?.configFields[0]?.key ?? ""
    const next: DefinitionCondition = { key: firstKey, op: "lte", value: "" }
    const conditions = [...definition.conditions, next]
    patch({ conditions })
    select({ kind: "condition", index: conditions.length - 1 })
  }
  function removeCondition(i: number) {
    patch({ conditions: definition.conditions.filter((_, idx) => idx !== i) })
    setSelection({ kind: "trigger" })
  }

  async function runPreview() {
    setDryLoading(true)
    setError(null)
    try {
      const res = await dryRunDefinition(definition, workspaceId)
      if (isApiError(res)) { setError(res.error); setDry(null); return }
      setDry(res)
    } catch {
      setError("Couldn't run the preview. Please try again.")
    } finally {
      setDryLoading(false)
    }
  }

  async function onSave() {
    if (!definition.name.trim()) { setError("Give your automation a name before saving."); select({ kind: "trigger" }); return }
    setSaving(true)
    setError(null)
    try {
      const res = await saveDefinition(definition, { workspaceId, source: "canvas" })
      if (isApiError(res)) { setError(res.error); return }
      setSaved(res.id)
      setDefinition((d) => ({ ...d, id: res.id }))
    } catch {
      setError("Couldn't save the automation. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  // JSON export: downloads current definition as a .json file
  function onExport() {
    const blob = new Blob([JSON.stringify(definition, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${definition.name.trim().replace(/\s+/g, "-").toLowerCase() || "automation"}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // JSON import: reads a .json file and loads it into the builder
  function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result ?? ""))
        if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
          setDefinition((d) => ({
            ...d,
            ...parsed,
            // Preserve current id if no id in import (treat as new)
            id: parsed.id ?? d.id,
          }))
          setDry(null)
          setSaved(null)
          setError(null)
        } else {
          setError("Invalid JSON file — expected an automation definition object.")
        }
      } catch {
        setError("Couldn't parse the JSON file. Please check its format.")
      }
    }
    reader.readAsText(file)
    // Reset so same file can be re-imported
    e.target.value = ""
  }

  // Load a canvas template
  function loadTemplate(tmpl: CanvasTemplate) {
    setDefinition((d) => ({
      ...emptyDefinition(TRIGGER_CATALOGUE[0].type, ACTION_CATALOGUE[0].type),
      ...tmpl.definition,
      id: d.id, // preserve existing id for update path
    }))
    setDry(null)
    setSaved(null)
    setError(null)
    setShowTemplates(false)
    setSelection({ kind: "trigger" })
  }

  const inspector = (
    <Inspector
      definition={definition}
      selection={selection}
      onPatch={patch}
      onClose={() => setInspectorOpen(false)}
      showClose={isMobile}
    />
  )

  const toolbarRow = (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-3 py-2.5 bg-white">
      {/* Templates */}
      <button
        onClick={() => setShowTemplates((v) => !v)}
        title="Templates"
        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${showTemplates ? "border-violet-300 bg-violet-50 text-violet-700" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
      >
        <Layers className="h-3.5 w-3.5" /> Templates
      </button>
      {/* JSON import (hidden input) */}
      <input ref={importRef} type="file" accept=".json,application/json" className="hidden" onChange={onImportFile} />
      <button
        onClick={() => importRef.current?.click()}
        title="Import JSON definition"
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
      >
        <Upload className="h-3.5 w-3.5" /> Import
      </button>
      {/* JSON export */}
      <button
        onClick={onExport}
        title="Export definition as JSON"
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
      >
        <Download className="h-3.5 w-3.5" /> Export
      </button>
      <div className="ml-auto flex items-center gap-2">
        <Link href="/property-manager/automations/ai-builder" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
          <Wand2 className="h-3.5 w-3.5" /> AI Builder
        </Link>
        <Link href="/property-manager/automations" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
          <ArrowLeft className="h-3.5 w-3.5" /> All rules
        </Link>
        <button
          onClick={() => setFullscreen((v) => !v)}
          title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
          className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
        >
          {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )

  const canvasContent = (
    <div className={fullscreen ? "fixed inset-0 z-[60] flex flex-col bg-slate-50 overflow-y-auto" : "space-y-5"}>
      {fullscreen && toolbarRow}

      {/* Templates panel */}
      {showTemplates && (
        <div className={fullscreen ? "border-b border-slate-200 bg-white px-4 py-3" : "rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Canvas templates</h3>
            <button onClick={() => setShowTemplates(false)} className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CANVAS_TEMPLATES.map((t) => {
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  onClick={() => loadTemplate(t)}
                  className="flex flex-col items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left hover:border-violet-300 hover:bg-violet-50 transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-violet-100 text-violet-600">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-xs font-semibold text-slate-900">{t.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{t.description}</p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-violet-600">
                    Load template <ChevronRight className="h-3 w-3" />
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {!fullscreen && (
        <>
          <BuilderHeader
            title="Automation canvas"
            subtitle="Build a visual trigger → conditions → action flow, preview it, then save."
            icon={LayoutTemplate}
            actions={
              <>
                <Link href="/property-manager/automations/ai-builder" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
                  <Wand2 className="h-4 w-4" /> Describe instead
                </Link>
                <Link href="/property-manager/automations" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
                  <ArrowLeft className="h-4 w-4" /> All rules
                </Link>
              </>
            }
          />
          <ReviewFirstBanner />
        </>
      )}

      {/* Name strip */}
      <div className={fullscreen ? "bg-white border-b border-slate-200 px-4 py-3" : "rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"}>
        <label className={labelClass}>Automation name</label>
        <input
          value={definition.name}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder="e.g. Tenancy ending → renewal task"
          className={fieldClass}
        />
      </div>

      {/* Canvas + inspector */}
      <div className={fullscreen ? "flex-1 overflow-auto px-4 py-4" : ""}>
        {isMobile ? (
          <>
            <MobileStepList
              definition={definition}
              selection={selection}
              onSelect={select}
              onAddCondition={addCondition}
              onRemoveCondition={removeCondition}
            />
            {inspectorOpen && (
              <div className="fixed inset-0 z-50 flex items-end bg-slate-900/40 backdrop-blur-sm" onClick={() => setInspectorOpen(false)}>
                <div
                  className="max-h-[80vh] w-full overflow-y-auto rounded-t-2xl bg-white p-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] shadow-[0_-12px_40px_rgba(0,0,0,0.20)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {inspector}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <DesktopCanvas
              definition={definition}
              selection={selection}
              onSelect={select}
              onAddCondition={addCondition}
              onRemoveCondition={removeCondition}
            />
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              {inspector}
            </div>
          </div>
        )}
      </div>

      {/* Preview + save */}
      <div className={fullscreen ? "border-t border-slate-200 bg-white px-4 py-3" : "grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]"}>
        <DryRunPanel result={dry} loading={dryLoading} onRun={runPreview} canRun />
        <div className={fullscreen ? "mt-3" : "rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"}>
          {error && (
            <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          {saved && (
            <div className="mb-3 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800">
              <Check className="mt-0.5 h-4 w-4 shrink-0" /> Saved.{" "}
              <Link href="/property-manager/automations" className="font-medium underline">View all</Link>
            </div>
          )}
          <button
            onClick={onSave}
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-[0_2px_8px_rgba(37,99,235,0.30)] hover:bg-blue-700 disabled:opacity-50"
          >
            <Check className="h-4 w-4" /> {saving ? "Saving…" : definition.id ? "Update automation" : "Save automation"}
          </button>
          <p className="mt-2 text-center text-[11px] text-slate-400">Saving creates a review-first rule. Nothing runs until you approve each match.</p>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {!fullscreen && (
        <div className="space-y-5">
          {toolbarRow}
          {canvasContent}
        </div>
      )}
      {fullscreen && canvasContent}
    </>
  )
}

/* ── Inspector: edits the selected node ── */
function Inspector({
  definition,
  selection,
  onPatch,
  onClose,
  showClose,
}: {
  definition: AutomationDefinition
  selection: CanvasSelection
  onPatch: (p: Partial<AutomationDefinition>) => void
  onClose: () => void
  showClose: boolean
}) {
  const header = (label: string) => (
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-sm font-semibold text-slate-900">{label}</h3>
      {showClose && (
        <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )

  if (selection.kind === "trigger") {
    const tDef = triggerDef(definition.trigger_type)
    return (
      <div>
        {header("Trigger")}
        <label className={labelClass}>When this happens</label>
        <select
          value={definition.trigger_type}
          onChange={(e) => {
            const t = e.target.value as TriggerType
            const def = triggerDef(t)
            const cfg: Record<string, string | number> = {}
            def?.configFields.forEach((f) => { cfg[f.key] = f.default ?? (f.kind === "number" ? 0 : "") })
            const allowed = new Set(def?.configFields.map((f) => f.key))
            onPatch({ trigger_type: t, trigger_config: cfg, conditions: definition.conditions.filter((c) => allowed.has(c.key)) })
          }}
          className={fieldClass}
        >
          {TRIGGER_CATALOGUE.map((t) => <option key={t.type} value={t.type}>{t.label}</option>)}
        </select>
        <p className="mt-1 text-[11px] text-slate-400">{tDef?.description}</p>
        {tDef && tDef.configFields.length > 0 && (
          <div className="mt-4 space-y-3">
            {tDef.configFields.map((f) => (
              <div key={f.key}>
                <label className={labelClass}>{f.label}{f.suffix ? ` (${f.suffix})` : ""}</label>
                <input
                  type={f.kind === "number" ? "number" : "text"}
                  value={String(definition.trigger_config[f.key] ?? "")}
                  onChange={(e) => onPatch({ trigger_config: { ...definition.trigger_config, [f.key]: f.kind === "number" ? Number(e.target.value) : e.target.value } })}
                  className={fieldClass}
                />
                {f.help && <p className="mt-1 text-[11px] text-slate-400">{f.help}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (selection.kind === "condition") {
    const c = definition.conditions[selection.index]
    const tDef = triggerDef(definition.trigger_type)
    if (!c) return <div>{header("Condition")}<p className="text-xs text-slate-400">This condition was removed.</p></div>
    const update = (p: Partial<DefinitionCondition>) =>
      onPatch({ conditions: definition.conditions.map((x, i) => (i === selection.index ? { ...x, ...p } : x)) })
    return (
      <div>
        {header("Condition")}
        <label className={labelClass}>Only continue if</label>
        <select value={c.key} onChange={(e) => update({ key: e.target.value })} className={`${fieldClass} mb-2`}>
          {tDef?.configFields.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
        </select>
        <select value={c.op} onChange={(e) => update({ op: e.target.value as DefinitionCondition["op"] })} className={`${fieldClass} mb-2`}>
          <option value="lte">is at most (≤)</option>
          <option value="gte">is at least (≥)</option>
          <option value="eq">equals (=)</option>
        </select>
        <input value={c.value} onChange={(e) => update({ value: e.target.value })} placeholder="value" className={fieldClass} />
      </div>
    )
  }

  // action
  const aDef = actionDef(definition.action_type)
  return (
    <div>
      {header("Action")}
      <label className={labelClass}>Then do this</label>
      <select
        value={definition.action_type}
        onChange={(e) => {
          const a = e.target.value as ActionType
          const def = actionDef(a)
          const cfg: Record<string, string> = {}
          def?.configFields.forEach((f) => { cfg[f.key] = String(f.default ?? "") })
          onPatch({ action_type: a, action_config: cfg })
        }}
        className={fieldClass}
      >
        {ACTION_CATALOGUE.map((a) => <option key={a.type} value={a.type}>{a.label}</option>)}
      </select>
      <p className="mt-1 text-[11px] text-slate-400">{aDef?.description}</p>
      {aDef && (
        <div className="mt-4 space-y-3">
          {aDef.configFields.map((f) => (
            <div key={f.key}>
              <label className={labelClass}>{f.label}</label>
              {f.kind === "textarea" ? (
                <textarea rows={2} value={definition.action_config[f.key] ?? ""} onChange={(e) => onPatch({ action_config: { ...definition.action_config, [f.key]: e.target.value } })} className={fieldClass} />
              ) : (
                <input value={definition.action_config[f.key] ?? ""} onChange={(e) => onPatch({ action_config: { ...definition.action_config, [f.key]: e.target.value } })} className={fieldClass} />
              )}
              {f.supportsTokens && <p className="mt-1 text-[11px] text-slate-400">Tokens: {"{{summary}}"} and trigger facts.</p>}
            </div>
          ))}
        </div>
      )}
      <label className={`mt-4 flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 ${definition.review_required ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200 bg-white"}`}>
        <input type="checkbox" checked={definition.review_required} onChange={(e) => onPatch({ review_required: e.target.checked })} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-400" />
        <span className="text-xs text-slate-600">Require human review before acting (recommended).</span>
      </label>
    </div>
  )
}
