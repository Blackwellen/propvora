"use client"

import React, { useState } from "react"
import { Download, Database, ClipboardList } from "lucide-react"

const MODULE_EXPORTS = [
  { key: "portfolio",  label: "Portfolio" },
  { key: "contacts",   label: "Contacts" },
  { key: "money",      label: "Money" },
  { key: "work",       label: "Work" },
  { key: "compliance", label: "Compliance" },
  { key: "calendar",   label: "Calendar" },
]

export default function DataPage() {
  const [archivePolicy, setArchivePolicy]   = useState("never")
  const [documentPolicy, setDocumentPolicy] = useState("forever")
  const [requestSent, setRequestSent]       = useState(false)
  const [exportingModule, setExportingModule] = useState<string | null>(null)
  const [toast, setToast]                   = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function handleFullExport() {
    setRequestSent(true)
    showToast("Export requested. You will receive a download link by email.")
  }

  function handleModuleExport(key: string) {
    setExportingModule(key)
    setTimeout(() => {
      setExportingModule(null)
      showToast(`${MODULE_EXPORTS.find((m) => m.key === key)?.label} data exported`)
    }, 1500)
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[20px] font-bold text-slate-900">Data & Exports</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">
          Export workspace data, manage retention and archives
        </p>
      </div>

      {/* Full workspace export */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-4">
        <div className="flex items-center gap-3 mb-2">
          <div style={{ color: "#2563EB" }}>
            <Database className="w-5 h-5" />
          </div>
          <h3 className="text-[14px] font-bold text-slate-900">Full Workspace Export</h3>
        </div>
        <p className="text-[13px] text-slate-500 mb-4">
          Download a complete export of all workspace data in JSON and CSV format.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={handleFullExport}
            disabled={requestSent}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            {requestSent ? "Request sent" : "Request export"}
          </button>
          <p className="text-[11px] text-slate-400">
            You will receive a download link by email within 24 hours.
          </p>
        </div>
      </div>

      {/* Module exports */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-4">
        <h3 className="text-[14px] font-bold text-slate-900 mb-1">Module Exports</h3>
        <p className="text-[12.5px] text-slate-500 mb-5">
          Export individual module data as CSV files
        </p>
        <div className="grid grid-cols-2 gap-3">
          {MODULE_EXPORTS.map((mod) => (
            <div
              key={mod.key}
              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
            >
              <p className="text-[13px] font-medium text-slate-800">{mod.label}</p>
              <button
                onClick={() => handleModuleExport(mod.key)}
                disabled={exportingModule === mod.key}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40"
              >
                {exportingModule === mod.key ? (
                  <span className="w-3 h-3 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                ) : (
                  <Download className="w-3 h-3" />
                )}
                Export CSV
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Audit log export */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div style={{ color: "#64748B" }}>
            <ClipboardList className="w-5 h-5" />
          </div>
          <h3 className="text-[14px] font-bold text-slate-900">Audit Log Export</h3>
        </div>
        <p className="text-[13px] text-slate-500 mb-4">
          Export the full workspace audit trail in CSV format.
        </p>
        <button
          onClick={() => showToast("Audit log export started")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export audit log
        </button>
      </div>

      {/* Data retention */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-[14px] font-bold text-slate-900 mb-1">Data Retention</h3>
        <p className="text-[12.5px] text-slate-500 mb-5">
          Configure how long inactive data is retained before archiving
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
              Archive inactive records
            </label>
            <select
              value={archivePolicy}
              onChange={(e) => setArchivePolicy(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white focus:outline-none focus:border-[#2563EB] transition-all"
            >
              <option value="never">Never</option>
              <option value="6m">After 6 months</option>
              <option value="1y">After 1 year</option>
              <option value="2y">After 2 years</option>
            </select>
          </div>
          <div>
            <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
              Document retention
            </label>
            <select
              value={documentPolicy}
              onChange={(e) => setDocumentPolicy(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white focus:outline-none focus:border-[#2563EB] transition-all"
            >
              <option value="forever">Keep forever</option>
              <option value="2y">2 years</option>
              <option value="5y">5 years</option>
            </select>
          </div>
        </div>
        <p className="text-[11.5px] text-slate-400 mt-4">
          Destructive data operations require owner permission and are permanently audit logged.
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-[13px] font-medium px-5 py-3 rounded-2xl shadow-xl">
          {toast}
        </div>
      )}
    </div>
  )
}
