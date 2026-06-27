"use client"

/**
 * ComplianceRequirementsEditor — lets a workspace customise its compliance
 * requirement pack on top of the built-in per-jurisdiction defaults:
 *   - toggle built-in requirements on/off (persists a disable marker)
 *   - add bespoke requirements (label, helper, type, criticality, icon)
 *   - edit / delete custom requirements
 *
 * Fully wired to `workspace_compliance_requirements` (RLS: owner/admin/manager
 * write). Changes flow to the Add-Certificate wizard via useComplianceRequirements.
 */

import React, { useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Plus, Trash2, Pencil, Globe, ShieldCheck, X, Loader2, AlertTriangle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"
import { getComplianceJurisdiction } from "@/lib/compliance/requirements"
import { useComplianceRequirements } from "@/lib/compliance/useComplianceRequirements"
import {
  upsertCustomRequirement,
  setBuiltInDisabled,
  deleteCustomRequirement,
  KIND_KEYS,
  ICON_KEYS,
} from "@/lib/compliance/customRequirements"
import type { ComplianceKind, ComplianceIconKey } from "@/lib/compliance/requirements"

const KIND_LABEL: Record<ComplianceKind, string> = {
  gas_safety: "Gas safety",
  eicr: "Electrical (EICR)",
  epc: "Energy (EPC)",
  fire_alarm: "Fire / alarm",
  hmo_licence: "HMO licence",
  insurance: "Insurance",
  pat: "PAT",
  other: "Other",
}

function slugify(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 48) || "custom"
}

interface DraftState {
  label: string
  helper: string
  kind: ComplianceKind
  icon: ComplianceIconKey
  critical: boolean
}

const EMPTY_DRAFT: DraftState = { label: "", helper: "", kind: "other", icon: "file", critical: false }

export function ComplianceRequirementsEditor() {
  const qc = useQueryClient()
  const { workspace } = useWorkspace()
  const { requirements, note, customRows, loading } = useComplianceRequirements()

  // Built-in set for THIS jurisdiction (to show enable/disable toggles).
  const builtIn = useMemo(() => {
    const code = workspace?.business_country_code || (workspace?.settings as { countryCode?: string } | null)?.countryCode
    const region = (workspace?.settings as { region?: string } | null)?.region
    return getComplianceJurisdiction(code, region).reqs
  }, [workspace])

  const disabledKeys = useMemo(
    () => new Set(customRows.filter((r) => r.disabled).map((r) => r.req_key)),
    [customRows]
  )
  const customDefs = useMemo(() => customRows.filter((r) => r.is_custom && !r.disabled), [customRows])

  const [showAdd, setShowAdd] = useState(false)
  const [draft, setDraft] = useState<DraftState>(EMPTY_DRAFT)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const invalidate = () => qc.invalidateQueries({ queryKey: ["compliance-custom-requirements", workspace?.id] })

  async function toggleBuiltIn(reqKey: string, currentlyDisabled: boolean) {
    if (!workspace?.id) return
    setError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await setBuiltInDisabled(supabase, workspace.id, reqKey, !currentlyDisabled, user?.id)
    if (error) setError(error)
    else invalidate()
  }

  async function saveDraft() {
    if (!workspace?.id) return
    if (!draft.label.trim()) { setError("Requirement name is required."); return }
    setBusy(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const reqKey = editingKey ?? `custom_${slugify(draft.label)}`
      const { error } = await upsertCustomRequirement(supabase, {
        workspaceId: workspace.id,
        reqKey,
        label: draft.label.trim(),
        helper: draft.helper.trim() || undefined,
        critical: draft.critical,
        kind: draft.kind,
        icon: draft.icon,
        sortOrder: customDefs.length,
        createdBy: user?.id,
      })
      if (error) { setError(error); return }
      setShowAdd(false)
      setEditingKey(null)
      setDraft(EMPTY_DRAFT)
      invalidate()
    } finally {
      setBusy(false)
    }
  }

  async function removeCustom(reqKey: string) {
    if (!workspace?.id) return
    setError(null)
    const { error } = await deleteCustomRequirement(createClient(), workspace.id, reqKey)
    if (error) setError(error)
    else invalidate()
  }

  function startEdit(reqKey: string) {
    const row = customRows.find((r) => r.req_key === reqKey)
    if (!row) return
    setDraft({
      label: row.label || "",
      helper: row.helper || "",
      kind: row.kind,
      icon: row.icon,
      critical: row.critical,
    })
    setEditingKey(reqKey)
    setShowAdd(true)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 md:col-span-2">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-[var(--color-brand-100)]">
            <Globe className="w-4 h-4 text-[var(--brand)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Jurisdiction compliance requirements</p>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
              Active set for <span className="font-medium text-slate-700">{note.regionName}</span>
              {note.reviewed && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                  <ShieldCheck className="w-2.5 h-2.5" /> Reviewed pack
                </span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={() => { setShowAdd((v) => !v); setEditingKey(null); setDraft(EMPTY_DRAFT) }}
          className="flex items-center gap-1.5 bg-[var(--brand)] hover:bg-[var(--brand-strong)] text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add requirement
        </button>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}
        </div>
      )}

      {/* Add / edit form */}
      {showAdd && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-700">{editingKey ? "Edit requirement" : "New requirement"}</p>
            <button onClick={() => { setShowAdd(false); setEditingKey(null); setDraft(EMPTY_DRAFT) }} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Requirement name <span className="text-red-500">*</span></label>
              <input value={draft.label} onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))} placeholder="e.g. Selective Licence" className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--color-brand-400)]" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Description</label>
              <input value={draft.helper} onChange={(e) => setDraft((d) => ({ ...d, helper: e.target.value }))} placeholder="Short description of the document" className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--color-brand-400)]" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Type</label>
              <select value={draft.kind} onChange={(e) => setDraft((d) => ({ ...d, kind: e.target.value as ComplianceKind }))} className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--color-brand-400)]">
                {KIND_KEYS.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Icon</label>
              <select value={draft.icon} onChange={(e) => setDraft((d) => ({ ...d, icon: e.target.value as ComplianceIconKey }))} className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--color-brand-400)]">
                {ICON_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2 flex items-center gap-2">
              <input id="crit" type="checkbox" checked={draft.critical} onChange={(e) => setDraft((d) => ({ ...d, critical: e.target.checked }))} className="w-4 h-4 rounded border-slate-300 text-[var(--brand)] focus:ring-[var(--brand)]" />
              <label htmlFor="crit" className="text-xs text-slate-600">Statutory / critical requirement</label>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => { setShowAdd(false); setEditingKey(null); setDraft(EMPTY_DRAFT) }} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-white">Cancel</button>
            <button onClick={saveDraft} disabled={busy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--brand)] hover:bg-[var(--brand-strong)] text-white text-xs font-medium disabled:opacity-60">
              {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} {editingKey ? "Save changes" : "Add requirement"}
            </button>
          </div>
        </div>
      )}

      {/* Requirement list */}
      <div className="mt-4">
        {loading ? (
          <p className="text-xs text-slate-400 py-6 text-center">Loading requirements…</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {builtIn.map((r) => {
              const off = disabledKeys.has(r.key)
              return (
                <div key={r.key} className="flex items-center gap-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${off ? "text-slate-400 line-through" : "text-slate-800"}`}>{r.label}</p>
                    <p className="text-[11px] text-slate-400 truncate">{r.helper}</p>
                  </div>
                  {r.critical && !off && <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 shrink-0">Critical</span>}
                  <span className="text-[10px] text-slate-400 shrink-0">Built-in</span>
                  <button
                    onClick={() => toggleBuiltIn(r.key, off)}
                    className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors shrink-0 ${off ? "border-slate-200 text-slate-500 hover:bg-slate-50" : "border-[var(--color-brand-100)] text-[var(--brand)] bg-[var(--brand-soft)] hover:bg-[var(--color-brand-100)]"}`}
                  >
                    {off ? "Enable" : "Disable"}
                  </button>
                </div>
              )
            })}
            {customDefs.map((r) => (
              <div key={r.req_key} className="flex items-center gap-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{r.label}</p>
                  <p className="text-[11px] text-slate-400 truncate">{r.helper || "Custom compliance requirement"}</p>
                </div>
                {r.critical && <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 shrink-0">Critical</span>}
                <span className="text-[10px] text-[var(--brand)] bg-[var(--brand-soft)] px-1.5 py-0.5 rounded border border-[var(--color-brand-100)] shrink-0">Custom</span>
                <button onClick={() => startEdit(r.req_key)} className="p-1 text-slate-400 hover:text-[var(--brand)] shrink-0"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => removeCustom(r.req_key)} className="p-1 text-slate-400 hover:text-red-500 shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        )}
        <p className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-50">
          These requirements drive the Add-Certificate wizard. Custom requirements you add here are workspace-specific. {note.disclaimer}
        </p>
      </div>
    </div>
  )
}
