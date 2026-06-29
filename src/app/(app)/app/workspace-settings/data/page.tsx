"use client"

import React, { useEffect, useState } from "react"
import { Download, Database, ClipboardList, Loader2 } from "lucide-react"
import { useWorkspace } from "@/providers/AuthProvider"
import { createClient } from "@/lib/supabase/client"
import { downloadCsv, type CsvColumn } from "@/lib/export/csv"
import { getWorkspaceSettings, saveWorkspaceSettings } from "@/lib/actions/settings"

// Each module maps to its primary live table (workspace-scoped, RLS-safe).
const MODULE_EXPORTS: { key: string; label: string; table: string }[] = [
  { key: "portfolio",  label: "Portfolio",  table: "properties" },
  { key: "contacts",   label: "Contacts",   table: "contacts" },
  { key: "money",      label: "Money",      table: "invoices" },
  { key: "work",       label: "Work",       table: "tasks" },
  { key: "compliance", label: "Compliance", table: "compliance_items" },
  { key: "calendar",   label: "Calendar",   table: "calendar_events" },
]

/** Build CSV columns from the row shape (skips heavy jsonb/embedding cols). */
function autoColumns<T extends Record<string, unknown>>(rows: T[]): CsvColumn<T>[] {
  if (!rows.length) return []
  return Object.keys(rows[0])
    .filter((k) => k !== "embedding" && k !== "search_vector")
    .map((k) => ({
      key: k,
      label: k,
      format: (row: T) => {
        const v = row[k]
        if (v == null) return ""
        if (typeof v === "object") return JSON.stringify(v)
        return v as string | number
      },
    }))
}

export default function DataPage() {
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id
  const supabase = createClient()

  const [archivePolicy, setArchivePolicy]   = useState("never")
  const [documentPolicy, setDocumentPolicy] = useState("forever")
  const [retentionDirty, setRetentionDirty] = useState(false)
  const [savingRetention, setSavingRetention] = useState(false)
  const [busy, setBusy]                     = useState<string | null>(null)
  const [toast, setToast]                   = useState<string | null>(null)

  useEffect(() => {
    getWorkspaceSettings().then(({ settings: s }) => {
      if (s) {
        if (typeof s.data_archive_policy === "string") setArchivePolicy(s.data_archive_policy)
        if (typeof s.data_document_policy === "string") setDocumentPolicy(s.data_document_policy)
      }
    })
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  async function fetchModule(table: string): Promise<Record<string, unknown>[]> {
    if (!workspaceId) return []
    const { data, error } = await supabase.from(table).select("*").eq("workspace_id", workspaceId).limit(5000)
    if (error) throw error
    return (data ?? []) as Record<string, unknown>[]
  }

  async function handleModuleExport(key: string, table: string, label: string) {
    if (!workspaceId) return
    setBusy(key)
    try {
      const rows = await fetchModule(table)
      if (!rows.length) { showToast(`No ${label} data to export.`); return }
      downloadCsv(key, rows, autoColumns(rows))
      showToast(`${label} exported (${rows.length} rows).`)
    } catch {
      showToast(`Couldn't export ${label}.`)
    } finally {
      setBusy(null)
    }
  }

  async function handleFullExport() {
    if (!workspaceId) return
    setBusy("full")
    try {
      const result: Record<string, unknown[]> = {}
      for (const m of MODULE_EXPORTS) {
        try { result[m.key] = await fetchModule(m.table) } catch { result[m.key] = [] }
      }
      const blob = new Blob([JSON.stringify({ workspace: workspace?.name ?? null, exportedAt: new Date().toISOString(), data: result }, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `propvora-workspace-export-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
      showToast("Full workspace export downloaded.")
    } catch {
      showToast("Couldn't generate the full export.")
    } finally {
      setBusy(null)
    }
  }

  async function handleAuditExport() {
    if (!workspaceId) return
    setBusy("audit")
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("created_at, action, resource_type, resource_id, user_id, metadata")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(5000)
      if (error) throw error
      const rows = (data ?? []) as Record<string, unknown>[]
      if (!rows.length) { showToast("No audit entries to export."); return }
      downloadCsv("audit-log", rows, autoColumns(rows))
      showToast(`Audit log exported (${rows.length} rows).`)
    } catch {
      showToast("Couldn't export the audit log.")
    } finally {
      setBusy(null)
    }
  }

  async function saveRetention() {
    setSavingRetention(true)
    const res = await saveWorkspaceSettings({ data_archive_policy: archivePolicy, data_document_policy: documentPolicy })
    setSavingRetention(false)
    if (res.ok) { setRetentionDirty(false); showToast("Retention settings saved.") }
    else showToast(res.unavailable ? "Settings storage not configured." : (res.error ?? "Couldn't save."))
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] font-bold text-slate-900">Data & Exports</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">Export workspace data, manage retention and archives</p>
      </div>

      {/* Full workspace export */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-4">
        <div className="flex items-center gap-3 mb-2">
          <div style={{ color: "#2563EB" }}><Database className="w-5 h-5" /></div>
          <h3 className="text-[14px] font-bold text-slate-900">Full Workspace Export</h3>
        </div>
        <p className="text-[13px] text-slate-500 mb-4">Download a complete JSON export of all workspace data.</p>
        <button
          onClick={handleFullExport}
          disabled={busy === "full" || !workspaceId}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          {busy === "full" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {busy === "full" ? "Preparing…" : "Download full export"}
        </button>
      </div>

      {/* Module exports */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-4">
        <h3 className="text-[14px] font-bold text-slate-900 mb-1">Module Exports</h3>
        <p className="text-[12.5px] text-slate-500 mb-5">Export individual module data as CSV files</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MODULE_EXPORTS.map((mod) => (
            <div key={mod.key} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
              <p className="text-[13px] font-medium text-slate-800">{mod.label}</p>
              <button
                onClick={() => handleModuleExport(mod.key, mod.table, mod.label)}
                disabled={busy === mod.key || !workspaceId}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                {busy === mod.key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                Export CSV
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Audit log export */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div style={{ color: "var(--text-muted)" }}><ClipboardList className="w-5 h-5" /></div>
          <h3 className="text-[14px] font-bold text-slate-900">Audit Log Export</h3>
        </div>
        <p className="text-[13px] text-slate-500 mb-4">Export the full workspace audit trail as CSV.</p>
        <button
          onClick={handleAuditExport}
          disabled={busy === "audit" || !workspaceId}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          {busy === "audit" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Export audit log
        </button>
      </div>

      {/* Data retention */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-[14px] font-bold text-slate-900 mb-1">Data Retention</h3>
        <p className="text-[12.5px] text-slate-500 mb-5">Configure how long inactive data is retained before archiving</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="data-archive-policy" className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">Archive inactive records</label>
            <select
              id="data-archive-policy"
              value={archivePolicy}
              onChange={(e) => { setArchivePolicy(e.target.value); setRetentionDirty(true) }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white focus:outline-none focus:border-[var(--brand)] transition-all"
            >
              <option value="never">Never</option>
              <option value="6m">After 6 months</option>
              <option value="1y">After 1 year</option>
              <option value="2y">After 2 years</option>
            </select>
          </div>
          <div>
            <label htmlFor="data-document-policy" className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">Document retention</label>
            <select
              id="data-document-policy"
              value={documentPolicy}
              onChange={(e) => { setDocumentPolicy(e.target.value); setRetentionDirty(true) }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white focus:outline-none focus:border-[var(--brand)] transition-all"
            >
              <option value="forever">Keep forever</option>
              <option value="2y">2 years</option>
              <option value="5y">5 years</option>
            </select>
          </div>
        </div>
        {retentionDirty && (
          <button
            onClick={saveRetention}
            disabled={savingRetention}
            className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--brand)] text-white text-[12.5px] font-semibold hover:bg-[var(--brand-strong)] transition-colors disabled:opacity-60"
          >
            {savingRetention && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save retention settings
          </button>
        )}
        <p className="text-[11.5px] text-slate-400 mt-4">Destructive data operations require owner permission and are permanently audit logged.</p>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-[13px] font-medium px-5 py-3 rounded-2xl shadow-xl">
          {toast}
        </div>
      )}
    </div>
  )
}
