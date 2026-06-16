"use client"

import React, { useMemo, useState } from "react"
import { X, ArrowRight, Zap, Filter, Sparkles, ShieldCheck } from "lucide-react"
import { TRIGGER_CATALOGUE, ACTION_CATALOGUE } from "@/lib/automation/catalogue"
import { createRule, type RuleInput } from "@/lib/automation/actions"
import type { ActionType, TriggerType } from "@/lib/automation/types"

interface Props {
  onClose: () => void
  onCreated: () => void
}

export default function RuleBuilder({ onClose, onCreated }: Props) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState("")
  const [triggerType, setTriggerType] = useState<TriggerType>(TRIGGER_CATALOGUE[0].type)
  const [triggerCfg, setTriggerCfg] = useState<Record<string, string>>({})
  const [actionType, setActionType] = useState<ActionType>(ACTION_CATALOGUE[0].type)
  const [actionCfg, setActionCfg] = useState<Record<string, string>>({})
  const [reviewRequired, setReviewRequired] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trigger = useMemo(() => TRIGGER_CATALOGUE.find((t) => t.type === triggerType)!, [triggerType])
  const action = useMemo(() => ACTION_CATALOGUE.find((a) => a.type === actionType)!, [actionType])

  function selectTrigger(t: TriggerType) {
    setTriggerType(t)
    const def = TRIGGER_CATALOGUE.find((x) => x.type === t)!
    const next: Record<string, string> = {}
    def.configFields.forEach((f) => { next[f.key] = String(f.default ?? "") })
    setTriggerCfg(next)
  }
  function selectAction(a: ActionType) {
    setActionType(a)
    const def = ACTION_CATALOGUE.find((x) => x.type === a)!
    const next: Record<string, string> = {}
    def.configFields.forEach((f) => { next[f.key] = String(f.default ?? "") })
    setActionCfg(next)
  }

  // Initialise config defaults on mount
  React.useEffect(() => {
    selectTrigger(triggerType)
    selectAction(actionType)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm sm:p-8">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-[0_24px_64px_rgba(0,0,0,0.20)] ring-1 ring-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-600"><Sparkles className="h-4.5 w-4.5" /></div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">New automation</h2>
              <p className="text-xs text-slate-500">Trigger → condition → action. Review-first by default.</p>
            </div>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-4 w-4" /></button>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-100 px-4 py-3 sm:px-6 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <button onClick={() => setStep(i)} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium ${i === step ? "bg-blue-600 text-white shadow-[0_2px_8px_rgba(37,99,235,0.30)]" : i < step ? "bg-blue-50 text-blue-700" : "bg-slate-50 text-slate-500"}`}>
                <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${i === step ? "bg-white/20" : "bg-white"}`}>{i + 1}</span>
                {s}
              </button>
              {i < steps.length - 1 && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />}
            </React.Fragment>
          ))}
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Rule name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Gas safety due in 30 days" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100" />
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700"><Zap className="h-4 w-4 text-blue-500" /> When this happens</div>
              <div className="grid gap-2 sm:grid-cols-2">
                {TRIGGER_CATALOGUE.map((t) => (
                  <button key={t.type} onClick={() => selectTrigger(t.type)} className={`rounded-xl border p-3 text-left transition ${triggerType === t.type ? "border-blue-300 bg-blue-50/60 ring-2 ring-blue-100" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"}`}>
                    <div className="text-sm font-semibold text-slate-800">{t.label}</div>
                    <div className="mt-0.5 text-xs text-slate-500">{t.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700"><Filter className="h-4 w-4 text-blue-500" /> Conditions</div>
              <p className="text-xs text-slate-500">Tune the trigger threshold. These define exactly which records match.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {trigger.configFields.map((f) => (
                  <div key={f.key}>
                    <label className="mb-1 block text-xs font-medium text-slate-600">{f.label}{f.suffix ? ` (${f.suffix})` : ""}</label>
                    <input value={triggerCfg[f.key] ?? ""} onChange={(e) => setTriggerCfg((c) => ({ ...c, [f.key]: e.target.value }))} type={f.kind === "number" ? "number" : "text"} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100" />
                    {f.help && <p className="mt-1 text-[11px] text-slate-400">{f.help}</p>}
                  </div>
                ))}
                {trigger.configFields.length === 0 && <p className="text-sm text-slate-400">No conditions for this trigger.</p>}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700"><Sparkles className="h-4 w-4 text-blue-500" /> Do this</div>
              <div className="grid gap-2 sm:grid-cols-2">
                {ACTION_CATALOGUE.map((a) => (
                  <button key={a.type} onClick={() => selectAction(a.type)} className={`rounded-xl border p-3 text-left transition ${actionType === a.type ? "border-blue-300 bg-blue-50/60 ring-2 ring-blue-100" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"}`}>
                    <div className="text-sm font-semibold text-slate-800">{a.label}</div>
                    <div className="mt-0.5 text-xs text-slate-500">{a.description}</div>
                  </button>
                ))}
              </div>
              <div className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
                {action.configFields.map((f) => (
                  <div key={f.key} className={f.kind === "textarea" ? "sm:col-span-2" : ""}>
                    <label className="mb-1 block text-xs font-medium text-slate-600">{f.label}</label>
                    {f.kind === "textarea" ? (
                      <textarea value={actionCfg[f.key] ?? ""} onChange={(e) => setActionCfg((c) => ({ ...c, [f.key]: e.target.value }))} rows={2} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100" />
                    ) : (
                      <input value={actionCfg[f.key] ?? ""} onChange={(e) => setActionCfg((c) => ({ ...c, [f.key]: e.target.value }))} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100" />
                    )}
                    {f.supportsTokens && <p className="mt-1 text-[11px] text-slate-400">Tokens: {"{{summary}}"} and trigger facts.</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="text-xs font-medium uppercase text-slate-400">Summary</div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-700">
                  <span className="font-semibold">{name || "Untitled rule"}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">When: {trigger.label}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
                  <span className="rounded-md bg-violet-50 px-2 py-1 text-xs font-medium text-violet-700">Then: {action.label}</span>
                </div>
              </div>
              <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${reviewRequired ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200 bg-white"}`}>
                <input type="checkbox" checked={reviewRequired} onChange={(e) => setReviewRequired(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-400" />
                <div>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-slate-800"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Require human review before acting</div>
                  <p className="mt-0.5 text-xs text-slate-500">Recommended. Matches create a pending-review item you approve. Turn off only for safe, reversible actions you trust to run automatically.</p>
                </div>
              </label>
              {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
          <button onClick={() => (step === 0 ? onClose() : setStep((s) => s - 1))} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">{step === 0 ? "Cancel" : "Back"}</button>
          {step < 3 ? (
            <button onClick={() => setStep((s) => s + 1)} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-[0_2px_8px_rgba(37,99,235,0.30)] hover:bg-blue-700">Continue <ArrowRight className="h-4 w-4" /></button>
          ) : (
            <button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-[0_2px_8px_rgba(37,99,235,0.30)] hover:bg-blue-700 disabled:opacity-60">{saving ? "Creating…" : "Create rule"}</button>
          )}
        </div>
      </div>
    </div>
  )
}
