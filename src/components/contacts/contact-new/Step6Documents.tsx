"use client"

import React from "react"
import { FileText, Upload, Check } from "lucide-react"
import type { WizardState, DocumentSlot } from "./types"

export default function Step6Documents({
  state,
  setState,
}: {
  state: WizardState
  setState: React.Dispatch<React.SetStateAction<WizardState>>
}) {
  const updateDoc = (index: number, field: keyof DocumentSlot, value: string | File | null) => {
    setState((s) => {
      const docs = [...s.documents]
      docs[index] = { ...docs[index], [field]: value }
      return { ...s, documents: docs }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Documents</h2>
        <p className="text-sm text-slate-500">Upload relevant documents for this contact. You can do this after saving too.</p>
      </div>

      {state.documents.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center">
          <div style={{ color: "var(--color-border-strong, #CBD5E1)" }} className="flex justify-center mb-2">
            <FileText className="w-8 h-8" />
          </div>
          <p className="text-sm text-slate-400">No document slots defined for this contact type.</p>
        </div>
      )}

      {state.documents.map((doc, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">{doc.name}</p>
            {doc.file && (
              <div style={{ color: "var(--color-success)" }}><Check className="w-4 h-4" /></div>
            )}
          </div>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-xs text-slate-500 mb-1 block">Upload file</label>
              <label className="flex items-center gap-2 rounded-lg border border-dashed border-slate-200 px-3 py-2 cursor-pointer hover:bg-slate-50 transition">
                <div style={{ color: "var(--text-disabled)" }}><Upload className="w-4 h-4" /></div>
                <span className="text-xs text-slate-500 truncate">
                  {doc.file ? doc.file.name : "Choose file…"}
                </span>
                <input
                  type="file"
                  className="sr-only"
                  onChange={(e) => updateDoc(i, "file", e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Expiry date</label>
              <input
                type="date"
                value={doc.expiry}
                onChange={(e) => updateDoc(i, "expiry", e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      ))}

      <p className="text-xs text-slate-400">
        You can upload documents after saving this contact from the contact detail page.
      </p>
    </div>
  )
}
