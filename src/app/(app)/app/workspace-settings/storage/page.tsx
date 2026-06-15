"use client"

import React, { useState } from "react"
import { HardDrive, Database, CheckSquare, Square } from "lucide-react"
import { cn } from "@/lib/utils"

const BREAKDOWN = [
  { type: "Documents", size: "1.2 GB", colour: "#2563EB", pct: 57 },
  { type: "Images",    size: "0.6 GB", colour: "#7C3AED", pct: 29 },
  { type: "Other",     size: "0.3 GB", colour: "#D97706", pct: 14 },
]

const FILE_TYPES = [
  { key: "pdf",   label: "PDF documents" },
  { key: "image", label: "Images (JPG, PNG, WEBP)" },
  { key: "word",  label: "Word documents (DOCX)" },
  { key: "excel", label: "Excel spreadsheets (XLSX)" },
]

export default function StoragePage() {
  const [fileSizeLimit, setFileSizeLimit]       = useState("10")
  const [allowedTypes, setAllowedTypes]         = useState<string[]>(["pdf", "image", "word", "excel"])
  const [retentionPolicy, setRetentionPolicy]   = useState("forever")
  const [isDirty, setIsDirty]                   = useState(false)

  function toggleFileType(key: string) {
    setAllowedTypes((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
    setIsDirty(true)
  }

  return (
    <div className="relative pb-20">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[20px] font-bold text-slate-900">Storage</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">
          Manage file storage, providers, limits and retention policies
        </p>
      </div>

      {/* Storage Usage */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-bold text-slate-900">Storage Usage</h3>
          <span className="text-[12px] font-semibold text-slate-500">2.1 GB / 10 GB used</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-[#2563EB] rounded-full" style={{ width: "21%" }} />
        </div>
        {BREAKDOWN.map((item) => (
          <div
            key={item.type}
            className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0"
          >
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: item.colour }}
            />
            <p className="text-[12.5px] text-slate-700 flex-1">{item.type}</p>
            <p className="text-[12px] text-slate-500">{item.size}</p>
            <p className="text-[11px] text-slate-400 w-8 text-right">{item.pct}%</p>
          </div>
        ))}
      </div>

      {/* Storage providers */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h3 className="text-[14px] font-bold text-slate-900 mb-4">Storage Providers</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border-2 border-[#2563EB] bg-blue-50">
            <div className="flex items-center gap-2.5 mb-2">
              <div style={{ color: "#3ECF8E" }}>
                <Database className="w-4 h-4" />
              </div>
              <p className="text-[13px] font-bold text-slate-900">Supabase Storage</p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 ml-auto">
                Active
              </span>
            </div>
            <p className="text-[12px] text-slate-500">Default managed storage. No additional configuration required.</p>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center gap-2.5 mb-2">
              <div style={{ color: "#F38020" }}>
                <HardDrive className="w-4 h-4" />
              </div>
              <p className="text-[13px] font-bold text-slate-900">Cloudflare R2</p>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 ml-auto">
                Not configured
              </span>
            </div>
            <p className="text-[12px] text-slate-500 mb-3">S3-compatible object storage for large document libraries.</p>
            <button className="w-full py-2 rounded-xl border border-[#2563EB] text-[#2563EB] text-[12px] font-semibold hover:bg-blue-50 transition-colors">
              Configure R2
            </button>
          </div>
        </div>
      </div>

      {/* File limits */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h3 className="text-[14px] font-bold text-slate-900 mb-5">Upload Limits</h3>
        <div className="mb-5">
          <label htmlFor="ws-max-file-size" className="block text-[12.5px] font-semibold text-slate-700 mb-2">
            Maximum file size
          </label>
          <select
            id="ws-max-file-size"
            value={fileSizeLimit}
            onChange={(e) => { setFileSizeLimit(e.target.value); setIsDirty(true) }}
            className="w-full max-w-[240px] px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white focus:outline-none focus:border-[#2563EB] transition-all"
          >
            <option value="5">5 MB</option>
            <option value="10">10 MB</option>
            <option value="25">25 MB</option>
            <option value="50">50 MB</option>
          </select>
        </div>
        <div>
          <label className="block text-[12.5px] font-semibold text-slate-700 mb-2">
            Allowed file types
          </label>
          <div className="space-y-2">
            {FILE_TYPES.map((ft) => {
              const checked = allowedTypes.includes(ft.key)
              return (
                <button
                  key={ft.key}
                  onClick={() => toggleFileType(ft.key)}
                  className="flex items-center gap-3 w-full text-left py-2 hover:bg-slate-50 rounded-xl px-2 transition-colors"
                >
                  <div style={{ color: checked ? "#2563EB" : "#94A3B8" }}>
                    {checked ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </div>
                  <span className="text-[13px] text-slate-700">{ft.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Retention policy */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-[14px] font-bold text-slate-900 mb-5">Retention Policy</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="ws-archive-policy" className="block text-[12.5px] font-semibold text-slate-700 mb-2">
              Archive inactive records
            </label>
            <select
              id="ws-archive-policy"
              value={retentionPolicy}
              onChange={(e) => { setRetentionPolicy(e.target.value); setIsDirty(true) }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white focus:outline-none focus:border-[#2563EB] transition-all"
            >
              <option value="never">Never</option>
              <option value="6m">After 6 months</option>
              <option value="1y">After 1 year</option>
              <option value="2y">After 2 years</option>
            </select>
          </div>
          <div>
            <label htmlFor="ws-doc-retention" className="block text-[12.5px] font-semibold text-slate-700 mb-2">
              Document retention
            </label>
            <select
              id="ws-doc-retention"
              onChange={() => setIsDirty(true)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white focus:outline-none focus:border-[#2563EB] transition-all"
            >
              <option value="forever">Keep forever</option>
              <option value="2y">2 years</option>
              <option value="5y">5 years</option>
            </select>
          </div>
        </div>
        <p className="text-[11.5px] text-slate-400 mt-4">
          Note: Destructive data operations require owner permission and are audit logged.
        </p>
        {isDirty && (
          <div className="flex items-center gap-3 mt-5 pt-4 border-t border-slate-100">
            <button
              onClick={() => setIsDirty(false)}
              className="px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] transition-colors"
            >
              Save changes
            </button>
            <button
              onClick={() => setIsDirty(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
