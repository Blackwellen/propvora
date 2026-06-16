"use client"

import React, { useMemo, useRef, useState } from "react"
import {
  X, ArrowRight, Zap, Filter, Sparkles, ShieldCheck,
  Maximize2, Minimize2, Download, Upload, LayoutTemplate, ChevronRight,
} from "lucide-react"
import { TRIGGER_CATALOGUE, ACTION_CATALOGUE } from "@/lib/automation/catalogue"
import { RULE_TEMPLATES } from "@/lib/automation/templates"
import { createRule, type RuleInput } from "@/lib/automation/actions"
import type { ActionType, TriggerType } from "@/lib/automation/types"

interface Props {
  onClose: () => void
  onCreated: () => void
}

/* ─── Builder-level template definitions ─────────────────────────────────────
   These extend the installer templates with the scenarios requested for the
   builder flow. They are client-side only and never saved until the operator
   clicks "Create rule".
──────────────────────────────────────────────────────────────────────────── */
interface BuilderTemplate {
  id: string
  name: string
  description: string
  category: string
  trigger_type: TriggerType
  trigger_config: Record<string, string>
  action_type: ActionType
  action_config: Record<string, string>
  review_required: boolean
}

const BUILDER_TEMPLATES: BuilderTemplate[] = [
  {
    id: "rent-due-reminder",
    name: "Rent due reminder",
    description: "3 days before rent is due — draft SMS/email to tenant for review.",
    category: "Finance",
    trigger_type: "rent_overdue",
    trigger_config: { min_days_overdue: "0", min_amount: "0" },
    action_type: "draft_message",
    action_config: {
      subject: "Rent reminder — {{summary}}",
      body: "Hi, this is a friendly reminder that your rent payment is due shortly. Please ensure payment is made on time. Thank you.",
    },
    review_required: true,
  },
  {
    id: "cert-expiry-alert",
    name: "Certificate expiry alert",
    description: "30 days before a compliance certificate expires — notify the operator.",
    category: "Compliance",
    trigger_type: "compliance_due_soon",
    trigger_config: { within_days: "30" },
    action_type: "create_notification",
    action_config: {
      title: "Certificate expiring: {{summary}}",
      body: "A compliance certificate is due within 30 days. Book renewal now.",
      severity: "warning",
    },
    review_required: true,
  },
  {
    id: "new-maintenance-request",
    name: "New maintenance request",
    description: "When a job is created — assign to supplier and notify operator.",
    category: "Maintenance",
    trigger_type: "job_completed",
    trigger_config: { within_days: "1" },
    action_type: "create_task",
    action_config: {
      title: "Assign supplier: {{summary}}",
      description: "New maintenance request received. Assign to a supplier and confirm ETA with tenant.",
      priority: "normal",
      due_in_days: "1",
    },
    review_required: true,
  },
  {
    id: "booking-confirmed",
    name: "Booking confirmed",
    description: "When a booking is confirmed — draft a guest welcome email for review.",
    category: "Tenancy",
    trigger_type: "tenancy_ending",
    trigger_config: { within_days: "1" },
    action_type: "draft_message",
    action_config: {
      subject: "Welcome — your booking is confirmed",
      body: "Hi, we are delighted to confirm your booking. Please find your check-in details below. We look forward to welcoming you.",
    },
    review_required: true,
  },
  {
    id: "job-completed-invoice",
    name: "Job completed — create invoice reminder",
    description: "When a job is marked complete — create a task to raise the invoice.",
    category: "Maintenance",
    trigger_type: "job_completed",
    trigger_config: { within_days: "7" },
    action_type: "create_task",
    action_config: {
      title: "Raise invoice: {{summary}}",
      description: "Job is complete. Raise the invoice and arrange inspection if required.",
      priority: "normal",
      due_in_days: "2",
    },
    review_required: true,
  },
  {
    id: "lease-ending-soon",
    name: "Lease ending soon",
    description: "60 days before a tenancy ends — notify operator and start renewal flow.",
    category: "Tenancy",
    trigger_type: "tenancy_ending",
    trigger_config: { within_days: "60" },
    action_type: "create_task",
    action_config: {
      title: "Renewal decision: {{summary}}",
      description: "Lease ends in 60 days. Decide renew vs re-let and contact the tenant to agree next steps.",
      priority: "high",
      due_in_days: "14",
    },
    review_required: true,
  },
  {
    id: "supplier-job-overdue",
    name: "Supplier job overdue",
    description: "When a job is past its due date and not completed — escalate an alert.",
    category: "Maintenance",
    trigger_type: "job_completed",
    trigger_config: { within_days: "0" },
    action_type: "create_notification",
    action_config: {
      title: "Overdue job: {{summary}}",
      body: "A supplier job is past its due date and has not been marked complete. Escalate immediately.",
      severity: "critical",
    },
    review_required: true,
  },
  {
    id: "new-portal-message",
    name: "New portal message",
    description: "When a portal message is received — notify workspace member.",
    category: "Tenancy",
    trigger_type: "tenancy_ending",
    trigger_config: { within_days: "365" },
    action_type: "create_notification",
    action_config: {
      title: "New portal message: {{summary}}",
      body: "A new message has arrived via the tenant portal. Please review and respond promptly.",
      severity: "info",
    },
    review_required: true,
  },
]

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function defaultTriggerCfg(type: TriggerType): Record<string, string> {
  const def = TRIGGER_CATALOGUE.find((t) => t.type === type)
  if (!def) return {}
  const cfg: Record<string, string> = {}
  def.configFields.forEach((f) => { cfg[f.key] = String(f.default ?? "") })
  return cfg
}

function defaultActionCfg(type: ActionType): Record<string, string> {
  const def = ACTION_CATALOGUE.find((a) => a.type === type)
  if (!def) return {}
  const cfg: Record<string, string> = {}
  def.configFields.forEach((f) => { cfg[f.key] = String(f.default ?? "") })
  return cfg
}

/* ─── Component ───────────────────────────────────────────────────────────── */

export default function RuleBuilder({ onClose, onCreated }: Props) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState("")
  const [triggerType, setTriggerType] = useState<TriggerType>(TRIGGER_CATALOGUE[0].type)
  const [triggerCfg, setTriggerCfg] = useState<Record<string, string>>(defaultTriggerCfg(TRIGGER_CATALOGUE[0].type))
  const [actionType, setActionType] = useState<ActionType>(ACTION_CATALOGUE[0].type)
  const [actionCfg, setActionCfg] = useState<Record<string, string>>(defaultActionCfg(ACTION_CATALOGUE[0].type))
  const [reviewRequired, setReviewRequired] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* UI state */
  const [fullscreen, setFullscreen] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)

  const trigger = useMemo(() => TRIGGER_CATALOGUE.find((t) => t.type === triggerType)!, [triggerType])
  const action = useMemo(() => ACTION_CATALOGUE.find((a) => a.type === actionType)!, [actionType])

  function selectTrigger(t: TriggerType) {
    setTriggerType(t)
    setTriggerCfg(defaultTriggerCfg(t))
  }
  function selectAction(a: ActionType) {
    setActionType(a)
    setActionCfg(defaultActionCfg(a))
  }

  /* ── Templates ─────────────────────────────────────────────────────────── */
  const templateCats = Array.from(new Set(BUILDER_TEMPLATES.map((t) => t.category)))

  function loadTemplate(tpl: BuilderTemplate) {
    setName(tpl.name)
    setTriggerType(tpl.trigger_type)
    setTriggerCfg({ ...defaultTriggerCfg(tpl.trigger_type), ...tpl.trigger_config })
    setActionType(tpl.action_type)
    setActionCfg({ ...defaultActionCfg(tpl.action_type), ...tpl.action_config })
    setReviewRequired(tpl.review_required)
    setShowTemplates(false)
    setStep(0)
  }

  /* ── Export JSON ────────────────────────────────────────────────────────── */
  function exportJson() {
    const def = {
      name: name || "Untitled rule",
      trigger_type: triggerType,
      trigger_config: triggerCfg,
      action_type: actionType,
      action_config: actionCfg,
      review_required: reviewRequired,
    }
    const blob = new Blob([JSON.stringify(def, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${(def.name).replace(/\s+/g, "-").toLowerCase()}.automation.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  /* ── Import JSON ────────────────────────────────────────────────────────── */
  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const def = JSON.parse(ev.target?.result as string)
        if (def.name) setName(def.name)
        if (def.trigger_type && TRIGGER_CATALOGUE.find((t) => t.type === def.trigger_type)) {
          setTriggerType(def.trigger_type as TriggerType)
          setTriggerCfg({ ...defaultTriggerCfg(def.trigger_type as TriggerType), ...(def.trigger_config ?? {}) })
        }
        if (def.action_type && ACTION_CATALOGUE.find((a) => a.type === def.action_type)) {
          setActionType(def.action_type as ActionType)
          setActionCfg({ ...defaultActionCfg(def.action_type as ActionType), ...(def.action_config ?? {}) })
        }
        if (typeof def.review_required === "boolean") setReviewRequired(def.review_required)
        setStep(0)
        setError(null)
      } catch {
        setError("Invalid JSON file. Please export a valid automation definition.")
      }
    }
    reader.readAsText(file)
    // reset input so same file can be re-imported
    e.target.value = ""
  }

  /* ── Save ───────────────────────────────────────────────────────────────── */
  async function save() {
    setError(null)
    if (!name.trim()) { setError("Give your rule a name."); setStep(0); return }
    setSaving(true)
    try {
      const triggerConfig: Record<string, unknown> = {}
      trigger.configFields.forEach((f) => {
        const raw = triggerCfg[f.key]
        triggerConfig[f.key] = f.kind === "number" ? Number(raw) : raw
      })
      const actionConfig: Record<string, unknown> = {}
      action.configFields.forEach((f) => { actionConfig[f.key] = actionCfg[f.key] })

      const input: RuleInput = {
        name: name.trim(),
        trigger_type: triggerType,
        trigger_config: triggerConfig,
        action_type: actionType,
        action_config: actionConfig,
        review_required: reviewRequired,
        enabled: true,
      }
      await createRule(input)
      onCreated()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create rule")
    } finally {
      setSaving(false)
    }
  }

  const steps = ["Trigger", "Condition", "Action", "Review"]

  /* ── Layout ─────────────────────────────────────────────────────────────── */
  const backdropCls = "fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 backdrop-blur-sm"
  const dialogCls = fullscreen
    ? "fixed inset-0 z-[51] flex flex-col bg-white"
    : "relative my-4 w-full max-w-3xl flex flex-col rounded-2xl bg-white shadow-[0_24px_64px_rgba(0,0,0,0.20)] ring-1 ring-slate-200 sm:my-8"

  return (
    <>
      {/* Hidden file input for import */}
      <input ref={importRef} type="file" accept="application/json,.json" className="hidden" onChange={handleImport} />

      {/* Backdrop (only shown when not fullscreen — fullscreen covers it anyway) */}
      {!fullscreen && (
        <div className={backdropCls} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
          <div className={dialogCls} onClick={(e) => e.stopPropagation()}>
            <BuilderContent
              steps={steps} step={step} setStep={setStep}
              name={name} setName={setName}
              triggerType={triggerType} selectTrigger={selectTrigger}
              trigger={trigger} triggerCfg={triggerCfg} setTriggerCfg={setTriggerCfg}
              actionType={actionType} selectAction={selectAction}
              action={action} actionCfg={actionCfg} setActionCfg={setActionCfg}
              reviewRequired={reviewRequired} setReviewRequired={setReviewRequired}
              saving={saving} error={error}
              fullscreen={fullscreen} setFullscreen={setFullscreen}
              showTemplates={showTemplates} setShowTemplates={setShowTemplates}
              templateCats={templateCats} loadTemplate={loadTemplate}
              exportJson={exportJson} importRef={importRef}
              onClose={onClose} save={save}
            />
          </div>
        </div>
      )}

      {/* Fullscreen overlay */}
      {fullscreen && (
        <div className={dialogCls}>
          <BuilderContent
            steps={steps} step={step} setStep={setStep}
            name={name} setName={setName}
            triggerType={triggerType} selectTrigger={selectTrigger}
            trigger={trigger} triggerCfg={triggerCfg} setTriggerCfg={setTriggerCfg}
            actionType={actionType} selectAction={selectAction}
            action={action} actionCfg={actionCfg} setActionCfg={setActionCfg}
            reviewRequired={reviewRequired} setReviewRequired={setReviewRequired}
            saving={saving} error={error}
            fullscreen={fullscreen} setFullscreen={setFullscreen}
            showTemplates={showTemplates} setShowTemplates={setShowTemplates}
            templateCats={templateCats} loadTemplate={loadTemplate}
            exportJson={exportJson} importRef={importRef}
            onClose={onClose} save={save}
          />
        </div>
      )}
    </>
  )
}

/* ─── BuilderContent (shared between windowed and fullscreen modes) ─────── */

interface ContentProps {
  steps: string[]
  step: number
  setStep: (n: number) => void
  name: string
  setName: (v: string) => void
  triggerType: TriggerType
  selectTrigger: (t: TriggerType) => void
  trigger: ReturnType<typeof TRIGGER_CATALOGUE.find> & object
  triggerCfg: Record<string, string>
  setTriggerCfg: React.Dispatch<React.SetStateAction<Record<string, string>>>
  actionType: ActionType
  selectAction: (a: ActionType) => void
  action: ReturnType<typeof ACTION_CATALOGUE.find> & object
  actionCfg: Record<string, string>
  setActionCfg: React.Dispatch<React.SetStateAction<Record<string, string>>>
  reviewRequired: boolean
  setReviewRequired: (v: boolean) => void
  saving: boolean
  error: string | null
  fullscreen: boolean
  setFullscreen: (v: boolean) => void
  showTemplates: boolean
  setShowTemplates: (v: boolean) => void
  templateCats: string[]
  loadTemplate: (t: BuilderTemplate) => void
  exportJson: () => void
  importRef: React.RefObject<HTMLInputElement | null>
  onClose: () => void
  save: () => void
}

function BuilderContent({
  steps, step, setStep,
  name, setName,
  triggerType, selectTrigger,
  trigger, triggerCfg, setTriggerCfg,
  actionType, selectAction,
  action, actionCfg, setActionCfg,
  reviewRequired, setReviewRequired,
  saving, error,
  fullscreen, setFullscreen,
  showTemplates, setShowTemplates,
  templateCats, loadTemplate,
  exportJson, importRef,
  onClose, save,
}: ContentProps) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-600">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">New Smart Rule</h2>
            <p className="text-xs text-slate-500">Trigger → condition → action. Review-first by default.</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Templates button */}
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            title="Load a template"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <LayoutTemplate className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Templates</span>
          </button>
          {/* Import JSON */}
          <button
            onClick={() => importRef.current?.click()}
            title="Import JSON definition"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <Upload className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Import</span>
          </button>
          {/* Export JSON */}
          <button
            onClick={exportJson}
            title="Export JSON definition"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
          {/* Fullscreen toggle */}
          <button
            onClick={() => setFullscreen(!fullscreen)}
            title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          {/* Close */}
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Templates panel */}
      {showTemplates && (
        <div className="border-b border-slate-200 bg-slate-50/60 px-6 py-4 shrink-0 overflow-y-auto max-h-72">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Starter templates — click to load into the builder
            </span>
            <button onClick={() => setShowTemplates(false)} className="grid h-6 w-6 place-items-center rounded text-slate-400 hover:text-slate-700">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {templateCats.map((cat) => (
            <div key={cat} className="mb-4">
              <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">{cat}</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {BUILDER_TEMPLATES.filter((t) => t.category === cat).map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => loadTemplate(tpl)}
                    className="flex flex-col rounded-xl border border-slate-200 bg-white p-3 text-left shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-blue-300 hover:bg-blue-50/30 transition"
                  >
                    <span className="text-xs font-semibold text-slate-800">{tpl.name}</span>
                    <span className="mt-0.5 text-[11px] text-slate-500 leading-tight">{tpl.description}</span>
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-400">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5">{tpl.trigger_type}</span>
                      <ChevronRight className="h-3 w-3" />
                      <span className="rounded bg-slate-100 px-1.5 py-0.5">{tpl.action_type}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stepper */}
      <div
        className="flex items-center gap-2 overflow-x-auto border-b border-slate-100 px-4 py-3 shrink-0 sm:px-6 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        {steps.map((s, i) => (
          <React.Fragment key={s}>
            <button
              onClick={() => setStep(i)}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium ${
                i === step
                  ? "bg-blue-600 text-white shadow-[0_2px_8px_rgba(37,99,235,0.30)]"
                  : i < step
                  ? "bg-blue-50 text-blue-700"
                  : "bg-slate-50 text-slate-500"
              }`}
            >
              <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${i === step ? "bg-white/20" : "bg-white"}`}>
                {i + 1}
              </span>
              {s}
            </button>
            {i < steps.length - 1 && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />}
          </React.Fragment>
        ))}
      </div>

      {/* Step content — flex-1 min-h-0 so it fills remaining height in fullscreen */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Rule name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Gas safety due in 30 days"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Zap className="h-4 w-4 text-blue-500" /> When this happens
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {TRIGGER_CATALOGUE.map((t) => (
                <button
                  key={t.type}
                  onClick={() => selectTrigger(t.type)}
                  className={`rounded-xl border p-3 text-left transition ${
                    triggerType === t.type
                      ? "border-blue-300 bg-blue-50/60 ring-2 ring-blue-100"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="text-sm font-semibold text-slate-800">{t.label}</div>
                  <div className="mt-0.5 text-xs text-slate-500">{t.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Filter className="h-4 w-4 text-blue-500" /> Conditions
            </div>
            <p className="text-xs text-slate-500">Tune the trigger threshold. These define exactly which records match.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {(trigger as typeof TRIGGER_CATALOGUE[0]).configFields.map((f) => (
                <div key={f.key}>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    {f.label}{f.suffix ? ` (${f.suffix})` : ""}
                  </label>
                  <input
                    value={triggerCfg[f.key] ?? ""}
                    onChange={(e) => setTriggerCfg((c) => ({ ...c, [f.key]: e.target.value }))}
                    type={f.kind === "number" ? "number" : "text"}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                  {f.help && <p className="mt-1 text-[11px] text-slate-400">{f.help}</p>}
                </div>
              ))}
              {(trigger as typeof TRIGGER_CATALOGUE[0]).configFields.length === 0 && (
                <p className="text-sm text-slate-400">No conditions for this trigger.</p>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Sparkles className="h-4 w-4 text-blue-500" /> Do this
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {ACTION_CATALOGUE.map((a) => (
                <button
                  key={a.type}
                  onClick={() => selectAction(a.type)}
                  className={`rounded-xl border p-3 text-left transition ${
                    actionType === a.type
                      ? "border-blue-300 bg-blue-50/60 ring-2 ring-blue-100"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="text-sm font-semibold text-slate-800">{a.label}</div>
                  <div className="mt-0.5 text-xs text-slate-500">{a.description}</div>
                </button>
              ))}
            </div>
            <div className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
              {(action as typeof ACTION_CATALOGUE[0]).configFields.map((f) => (
                <div key={f.key} className={f.kind === "textarea" ? "sm:col-span-2" : ""}>
                  <label className="mb-1 block text-xs font-medium text-slate-600">{f.label}</label>
                  {f.kind === "textarea" ? (
                    <textarea
                      value={actionCfg[f.key] ?? ""}
                      onChange={(e) => setActionCfg((c) => ({ ...c, [f.key]: e.target.value }))}
                      rows={2}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                  ) : (
                    <input
                      value={actionCfg[f.key] ?? ""}
                      onChange={(e) => setActionCfg((c) => ({ ...c, [f.key]: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                  )}
                  {f.supportsTokens && (
                    <p className="mt-1 text-[11px] text-slate-400">{"Tokens: {{summary}} and trigger facts."}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Summary</div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-700">
                <span className="font-semibold">{name || "Untitled rule"}</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                  When: {(trigger as typeof TRIGGER_CATALOGUE[0]).label}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
                <span className="rounded-md bg-violet-50 px-2 py-1 text-xs font-medium text-violet-700">
                  Then: {(action as typeof ACTION_CATALOGUE[0]).label}
                </span>
              </div>
            </div>
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${
                reviewRequired ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200 bg-white"
              }`}
            >
              <input
                type="checkbox"
                checked={reviewRequired}
                onChange={(e) => setReviewRequired(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-400"
              />
              <div>
                <div className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" /> Require human review before acting
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  Recommended. Matches create a pending-review item you approve. Turn off only for safe, reversible actions you trust to run automatically.
                </p>
              </div>
            </label>
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 shrink-0">
        <button
          onClick={() => (step === 0 ? onClose() : setStep(step - 1))}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          {step === 0 ? "Cancel" : "Back"}
        </button>
        {step < 3 ? (
          <button
            onClick={() => setStep(step + 1)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-[0_2px_8px_rgba(37,99,235,0.30)] hover:bg-blue-700"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-[0_2px_8px_rgba(37,99,235,0.30)] hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Creating…" : "Create rule"}
          </button>
        )}
      </div>
    </>
  )
}
