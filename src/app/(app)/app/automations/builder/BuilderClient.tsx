"use client"

// Premium NL + form automation builder.
// Flow: describe in words → AI draft (review-only) → edit trigger/conditions/
// action → dry-run preview → save. Nothing is auto-saved or auto-run.

import React, { useState } from "react"
import Link from "next/link"
import { Sparkles, ArrowLeft, Check, AlertCircle, Info, LayoutTemplate } from "lucide-react"
import { TRIGGER_CATALOGUE, ACTION_CATALOGUE } from "@/lib/automation/catalogue"
import NlComposer from "@/components/automations-builder/NlComposer"
import DefinitionForm from "@/components/automations-builder/DefinitionForm"
import DryRunPanel from "@/components/automations-builder/DryRunPanel"
import { BuilderHeader, ReviewFirstBanner } from "@/components/automations-builder/shared"
import { dryRunDefinition, saveDefinition, isApiError } from "@/components/automations-builder/api"
import { emptyDefinition, type AutomationDefinition, type DryRunResponse } from "@/components/automations-builder/types"

interface Props {
  workspaceId?: string
  aiEnabled: boolean
}

export default function BuilderClient({ workspaceId, aiEnabled }: Props) {
  const [definition, setDefinition] = useState<AutomationDefinition>(() =>
    emptyDefinition(TRIGGER_CATALOGUE[0].type, ACTION_CATALOGUE[0].type)
  )
  const [hasDraft, setHasDraft] = useState(false)
  const [explanation, setExplanation] = useState<string>("")
  const [draftNotes, setDraftNotes] = useState<string[]>([])

  const [dry, setDry] = useState<DryRunResponse | null>(null)
  const [dryLoading, setDryLoading] = useState(false)

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function applyDraft(draft: AutomationDefinition, exp: string, notes: string[]) {
    setDefinition(draft)
    setExplanation(exp)
    setDraftNotes(notes)
    setHasDraft(true)
    setDry(null)
    setSaved(null)
    setError(null)
  }

  function startManual() {
    setHasDraft(true)
    setExplanation("")
    setDraftNotes([])
  }

  function changeDefinition(next: AutomationDefinition) {
    setDefinition(next)
    setDry(null) // any edit invalidates the previous preview
    setSaved(null)
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
    if (!definition.name.trim()) { setError("Give your automation a name before saving."); return }
    setSaving(true)
    setError(null)
    try {
      const res = await saveDefinition(definition, { workspaceId, source: "builder" })
      if (isApiError(res)) { setError(res.error); return }
      setSaved(res.id)
      setDefinition((d) => ({ ...d, id: res.id }))
    } catch {
      setError("Couldn't save the automation. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <BuilderHeader
        title="Automation builder"
        subtitle="Describe what you want in plain English, review the draft, preview it, then save."
        icon={Sparkles}
        actions={
          <>
            <Link href="/property-manager/automations/canvas" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
              <LayoutTemplate className="h-4 w-4" /> Canvas
            </Link>
            <Link href="/property-manager/automations" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
              <ArrowLeft className="h-4 w-4" /> All rules
            </Link>
          </>
        }
      />

      <ReviewFirstBanner ai />

      {!aiEnabled && (
        <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          The plain-English assistant needs the AI add-on on your plan. You can still build the automation manually below.
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Left: composer + form */}
        <div className="space-y-5">
          {aiEnabled && <NlComposer workspaceId={workspaceId} onDraft={applyDraft} />}

          {!hasDraft ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
              <p className="text-sm text-slate-500">
                {aiEnabled
                  ? "Draft an automation above, or "
                  : ""}
                <button onClick={startManual} className="font-medium text-blue-600 hover:underline">
                  {aiEnabled ? "build one manually" : "Start building manually"}
                </button>
                {aiEnabled ? "." : "."}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              {(explanation || draftNotes.length > 0) && (
                <div className="mb-4 rounded-xl border border-violet-100 bg-violet-50/40 px-4 py-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-700">
                    <Sparkles className="h-3.5 w-3.5" /> Proposed draft — review and edit before saving
                  </div>
                  {explanation && <p className="mt-1 text-sm text-slate-700">{explanation}</p>}
                  {draftNotes.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {draftNotes.map((n, i) => (
                        <li key={i} className="flex items-start gap-2 text-[11px] text-slate-500"><Info className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" /> {n}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              <DefinitionForm definition={definition} onChange={changeDefinition} />
            </div>
          )}
        </div>

        {/* Right: preview + save */}
        <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <DryRunPanel result={dry} loading={dryLoading} onRun={runPreview} canRun={hasDraft} />

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            {error && (
              <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
              </div>
            )}
            {saved && (
              <div className="mb-3 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800">
                <Check className="mt-0.5 h-4 w-4 shrink-0" /> Saved. It appears in your rules and stays review-first.{" "}
                <Link href="/property-manager/automations" className="font-medium underline">View</Link>
              </div>
            )}
            <button
              onClick={onSave}
              disabled={!hasDraft || saving}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-[0_2px_8px_rgba(37,99,235,0.30)] hover:bg-blue-700 disabled:opacity-50"
            >
              <Check className="h-4 w-4" /> {saving ? "Saving…" : definition.id ? "Update automation" : "Save automation"}
            </button>
            <p className="mt-2 text-center text-[11px] text-slate-400">
              Saving creates a review-first rule. Nothing runs until you approve each match.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
