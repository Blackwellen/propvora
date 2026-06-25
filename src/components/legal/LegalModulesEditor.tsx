"use client"

/**
 * LegalModulesEditor — lets a workspace customise its legal jurisdiction pack on
 * top of the built-in catalogue (src/lib/legal/jurisdiction.ts):
 *   - override a built-in module's label + guidance note
 *   - disable a built-in module (hide its Overview card)
 *   - add a bespoke informational module for a local regime
 *
 * Parity with ComplianceRequirementsEditor. Fully wired to
 * `workspace_legal_modules` (RLS: owner/admin/manager write). Changes flow into
 * the Legal section gate + Overview via useLegalJurisdiction.
 *
 * SAFETY: customisations are informational only — they never unlock England &
 * Wales statutory tooling for a non-reviewed jurisdiction.
 */

import React, { useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Plus, Trash2, Pencil, Scale, ShieldCheck, X, Loader2, AlertTriangle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"
import { useLegalJurisdiction } from "@/hooks/useLegalJurisdiction"
import {
  upsertLegalModule,
  setLegalModuleDisabled,
  deleteCustomLegalModule,
} from "@/lib/legal/customModules"
import type { LegalModuleKey } from "@/lib/legal/jurisdiction"

const BUILT_IN_ORDER: LegalModuleKey[] = ["possession", "hmo", "epc", "rra"]

function slugify(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 48) || "custom"
}

interface DraftState {
  label: string
  note: string
}
const EMPTY_DRAFT: DraftState = { label: "", note: "" }

export function LegalModulesEditor() {
  const qc = useQueryClient()
  const { workspace } = useWorkspace()
  const { jurisdiction: jur, customRows, loading } = useLegalJurisdiction()

  const disabledKeys = useMemo(
    () => new Set(customRows.filter((r) => r.disabled && !r.is_custom).map((r) => r.module_key)),
    [customRows]
  )
  const customDefs = useMemo(() => customRows.filter((r) => r.is_custom && !r.disabled), [customRows])

  const [showAdd, setShowAdd] = useState(false)
  const [draft, setDraft] = useState<DraftState>(EMPTY_DRAFT)
  // editingKey: a built-in module key (override) or a custom_* key
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editingCustom, setEditingCustom] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const invalidate = () => qc.invalidateQueries({ queryKey: ["legal-custom-modules", workspace?.id] })

  async function toggleBuiltIn(moduleKey: string, currentlyDisabled: boolean) {
    if (!workspace?.id) return
    setError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await setLegalModuleDisabled(supabase, workspace.id, moduleKey, !currentlyDisabled, user?.id)
    if (error) setError(error)
    else invalidate()
  }

  async function saveDraft() {
    if (!workspace?.id) return
    if (!draft.label.trim()) { setError("A name is required."); return }
    setBusy(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const moduleKey = editingKey ?? `custom_${slugify(draft.label)}`
      const { error } = await upsertLegalModule(supabase, {
        workspaceId: workspace.id,
        moduleKey,
        label: draft.label.trim(),
        note: draft.note.trim() || undefined,
        isCustom: editingKey ? editingCustom : true,
        sortOrder: customDefs.length,
        createdBy: user?.id,
      })
      if (error) { setError(error); return }
      setShowAdd(false); setEditingKey(null); setEditingCustom(false); setDraft(EMPTY_DRAFT)
      invalidate()
    } finally {
      setBusy(false)
    }
  }

  async function removeCustom(moduleKey: string) {
    if (!workspace?.id) return
    setError(null)
    const { error } = await deleteCustomLegalModule(createClient(), workspace.id, moduleKey)
    if (error) setError(error)
    else invalidate()
  }

  function startEditBuiltIn(key: LegalModuleKey) {
    const m = jur.modules[key]
    setDraft({ label: m.label, note: m.note })
    setEditingKey(key); setEditingCustom(false); setShowAdd(true)
  }
  function startEditCustom(moduleKey: string) {
    const row = customRows.find((r) => r.module_key === moduleKey)
    if (!row) return
    setDraft({ label: row.label || "", note: row.note || "" })
    setEditingKey(moduleKey); setEditingCustom(true); setShowAdd(true)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 md:col-span-2">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-purple-100">
            <Scale className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Legal jurisdiction modules</p>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
              Active jurisdiction <span className="font-medium text-slate-700">{jur.regionName}</span>
              {jur.reviewed ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                  <ShieldCheck className="w-2.5 h-2.5" /> Reviewed (England &amp; Wales)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                  Research-only
                </span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={() => { setShowAdd((v) => !v); setEditingKey(null); setEditingCustom(false); setDraft(EMPTY_DRAFT) }}
          className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add legal note
        </button>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}
        </div>
      )}

      {showAdd && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-700">
              {editingKey ? (editingCustom ? "Edit legal note" : `Edit guidance — ${editingKey}`) : "New legal note"}
            </p>
            <button onClick={() => { setShowAdd(false); setEditingKey(null); setEditingCustom(false); setDraft(EMPTY_DRAFT) }} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Title <span className="text-red-500">*</span></label>
              <input value={draft.label} onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))} placeholder="e.g. Possession / Eviction (Germany)" className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Guidance / note</label>
              <textarea value={draft.note} onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))} rows={3} placeholder="Your local legal/regulatory guidance for this jurisdiction." className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => { setShowAdd(false); setEditingKey(null); setEditingCustom(false); setDraft(EMPTY_DRAFT) }} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-white">Cancel</button>
            <button onClick={saveDraft} disabled={busy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium disabled:opacity-60">
              {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} {editingKey ? "Save changes" : "Add note"}
            </button>
          </div>
        </div>
      )}

      <div className="mt-4">
        {loading ? (
          <p className="text-xs text-slate-400 py-6 text-center">Loading legal modules…</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {BUILT_IN_ORDER.map((key) => {
              const m = jur.modules[key]
              const off = disabledKeys.has(key)
              return (
                <div key={key} className="flex items-center gap-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${off ? "text-slate-400 line-through" : "text-slate-800"}`}>{m.label}</p>
                    <p className="text-[11px] text-slate-400 truncate">{m.note}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">Built-in</span>
                  <button onClick={() => startEditBuiltIn(key)} className="p-1 text-slate-400 hover:text-purple-600 shrink-0" title="Edit guidance"><Pencil className="w-3.5 h-3.5" /></button>
                  <button
                    onClick={() => toggleBuiltIn(key, off)}
                    className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors shrink-0 ${off ? "border-slate-200 text-slate-500 hover:bg-slate-50" : "border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100"}`}
                  >
                    {off ? "Enable" : "Disable"}
                  </button>
                </div>
              )
            })}
            {customDefs.map((r) => (
              <div key={r.module_key} className="flex items-center gap-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{r.label}</p>
                  <p className="text-[11px] text-slate-400 truncate">{r.note || "Workspace legal note"}</p>
                </div>
                <span className="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 shrink-0">Custom</span>
                <button onClick={() => startEditCustom(r.module_key)} className="p-1 text-slate-400 hover:text-purple-600 shrink-0"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => removeCustom(r.module_key)} className="p-1 text-slate-400 hover:text-red-500 shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        )}
        <p className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-50">
          Custom legal notes are workspace-specific and informational only — they never unlock England &amp; Wales statutory tooling for another jurisdiction. {jur.legalDisclaimer}
        </p>
      </div>
    </div>
  )
}

export default LegalModulesEditor
