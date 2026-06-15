"use client"

// Editable trigger → conditions → action form for an AutomationDefinition.
// Shared by the NL builder (post-draft) and reused conceptually by the canvas.
// Pure controlled component — the parent owns the definition + persistence.

import React from "react"
import { Zap, Filter, Sparkles, Plus, Trash2, ShieldCheck } from "lucide-react"
import { TRIGGER_CATALOGUE, ACTION_CATALOGUE, triggerDef, actionDef } from "@/lib/automation/catalogue"
import type { ActionType, TriggerType } from "@/lib/automation/types"
import type { AutomationDefinition, DefinitionCondition } from "./types"
import { fieldClass, labelClass } from "./shared"

interface Props {
  definition: AutomationDefinition
  onChange: (next: AutomationDefinition) => void
}

export default function DefinitionForm({ definition, onChange }: Props) {
  const tDef = triggerDef(definition.trigger_type)
  const aDef = actionDef(definition.action_type)

  function patch(p: Partial<AutomationDefinition>) {
    onChange({ ...definition, ...p })
  }

  function selectTrigger(t: TriggerType) {
    const def = triggerDef(t)
    const cfg: Record<string, string | number> = {}
    def?.configFields.forEach((f) => { cfg[f.key] = f.default ?? (f.kind === "number" ? 0 : "") })
    // Drop conditions that no longer apply to the new trigger.
    const allowed = new Set(def?.configFields.map((f) => f.key))
    patch({ trigger_type: t, trigger_config: cfg, conditions: definition.conditions.filter((c) => allowed.has(c.key)) })
  }

  function selectAction(a: ActionType) {
    const def = actionDef(a)
    const cfg: Record<string, string> = {}
    def?.configFields.forEach((f) => { cfg[f.key] = String(f.default ?? "") })
    patch({ action_type: a, action_config: cfg })
  }

  function addCondition() {
    const firstKey = tDef?.configFields[0]?.key ?? ""
    const next: DefinitionCondition = { key: firstKey, op: "lte", value: "" }
    patch({ conditions: [...definition.conditions, next] })
  }
  function updateCondition(i: number, p: Partial<DefinitionCondition>) {
    const conditions = definition.conditions.map((c, idx) => (idx === i ? { ...c, ...p } : c))
    patch({ conditions })
  }
  function removeCondition(i: number) {
    patch({ conditions: definition.conditions.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="space-y-6">
      {/* Name + description */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass}>Automation name</label>
          <input
            value={definition.name}
            onChange={(e) => patch({ name: e.target.value })}
            placeholder="e.g. Gas safety due soon → book renewal"
            className={fieldClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Description (optional)</label>
          <input
            value={definition.description ?? ""}
            onChange={(e) => patch({ description: e.target.value })}
            placeholder="What does this automation do?"
            className={fieldClass}
          />
        </div>
      </div>

      {/* Trigger */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-blue-50 text-blue-600"><Zap className="h-3.5 w-3.5" /></span>
          When this happens
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {TRIGGER_CATALOGUE.map((t) => (
            <button
              key={t.type}
              type="button"
              onClick={() => selectTrigger(t.type)}
              className={`rounded-xl border p-3 text-left transition ${
                definition.trigger_type === t.type
                  ? "border-blue-300 bg-blue-50/60 ring-2 ring-blue-100"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className="text-sm font-semibold text-slate-800">{t.label}</div>
              <div className="mt-0.5 text-xs text-slate-500">{t.description}</div>
            </button>
          ))}
        </div>
        {tDef && tDef.configFields.length > 0 && (
          <div className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 sm:grid-cols-2">
            {tDef.configFields.map((f) => (
              <div key={f.key}>
                <label className={labelClass}>{f.label}{f.suffix ? ` (${f.suffix})` : ""}</label>
                <input
                  type={f.kind === "number" ? "number" : "text"}
                  value={String(definition.trigger_config[f.key] ?? "")}
                  onChange={(e) =>
                    patch({
                      trigger_config: {
                        ...definition.trigger_config,
                        [f.key]: f.kind === "number" ? Number(e.target.value) : e.target.value,
                      },
                    })
                  }
                  className={fieldClass}
                />
                {f.help && <p className="mt-1 text-[11px] text-slate-400">{f.help}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Conditions */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-amber-50 text-amber-600"><Filter className="h-3.5 w-3.5" /></span>
            Only continue if (optional)
          </div>
          <button
            type="button"
            onClick={addCondition}
            disabled={!tDef || tDef.configFields.length === 0}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" /> Add condition
          </button>
        </div>
        {definition.conditions.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/40 px-3 py-2.5 text-xs text-slate-400">
            No extra conditions. The trigger threshold above decides which records match.
          </p>
        ) : (
          <div className="space-y-2">
            {definition.conditions.map((c, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-2.5">
                <select
                  value={c.key}
                  onChange={(e) => updateCondition(i, { key: e.target.value })}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-400 focus:bg-white"
                >
                  {tDef?.configFields.map((f) => (
                    <option key={f.key} value={f.key}>{f.label}</option>
                  ))}
                </select>
                <select
                  value={c.op}
                  onChange={(e) => updateCondition(i, { op: e.target.value as DefinitionCondition["op"] })}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-400 focus:bg-white"
                >
                  <option value="lte">is at most (≤)</option>
                  <option value="gte">is at least (≥)</option>
                  <option value="eq">equals (=)</option>
                </select>
                <input
                  value={c.value}
                  onChange={(e) => updateCondition(i, { value: e.target.value })}
                  placeholder="value"
                  className="w-24 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-400 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => removeCondition(i)}
                  aria-label="Remove condition"
                  className="ml-auto grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Action */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-violet-50 text-violet-600"><Sparkles className="h-3.5 w-3.5" /></span>
          Then do this
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {ACTION_CATALOGUE.map((a) => (
            <button
              key={a.type}
              type="button"
              onClick={() => selectAction(a.type)}
              className={`rounded-xl border p-3 text-left transition ${
                definition.action_type === a.type
                  ? "border-violet-300 bg-violet-50/60 ring-2 ring-violet-100"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className="text-sm font-semibold text-slate-800">{a.label}</div>
              <div className="mt-0.5 text-xs text-slate-500">{a.description}</div>
            </button>
          ))}
        </div>
        {aDef && (
          <div className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 sm:grid-cols-2">
            {aDef.configFields.map((f) => (
              <div key={f.key} className={f.kind === "textarea" ? "sm:col-span-2" : ""}>
                <label className={labelClass}>{f.label}</label>
                {f.kind === "textarea" ? (
                  <textarea
                    rows={2}
                    value={definition.action_config[f.key] ?? ""}
                    onChange={(e) => patch({ action_config: { ...definition.action_config, [f.key]: e.target.value } })}
                    className={fieldClass}
                  />
                ) : (
                  <input
                    value={definition.action_config[f.key] ?? ""}
                    onChange={(e) => patch({ action_config: { ...definition.action_config, [f.key]: e.target.value } })}
                    className={fieldClass}
                  />
                )}
                {f.supportsTokens && <p className="mt-1 text-[11px] text-slate-400">Tokens: {"{{summary}}"} and trigger facts.</p>}
                {f.help && !f.supportsTokens && <p className="mt-1 text-[11px] text-slate-400">{f.help}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Review-first toggle */}
      <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${definition.review_required ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200 bg-white"}`}>
        <input
          type="checkbox"
          checked={definition.review_required}
          onChange={(e) => patch({ review_required: e.target.checked })}
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
    </div>
  )
}
