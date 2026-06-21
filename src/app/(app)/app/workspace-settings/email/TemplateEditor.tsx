"use client"

import React, { useState } from "react"
import { X, Eye, Code2, Loader2, RotateCcw, Save, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

export interface TemplateContent { subject: string; body: string }

export interface TemplateDef {
  key: string
  name: string
  tokens: string[]
  default: TemplateContent
}

/** Replace {{token}} placeholders with sample values for the live preview. */
function renderPreview(text: string, tokens: string[]): string {
  let out = text
  const samples: Record<string, string> = {
    tenant_name: "Your Tenant",
    contact_name: "Your Contact",
    workspace_name: "Your Property Portfolio",
    property_address: "Your Property Address",
    amount: "£1,250.00",
    due_date: "30 Jun 2026",
    invoice_number: "INV-2026-XXXX",
    certificate_type: "Gas Safety (CP12)",
    expiry_date: "12 Aug 2026",
    supplier_name: "Your Supplier",
    invite_link: "https://app.propvora.com/register?invite=…",
    sender_name: "Your property manager",
  }
  for (const t of tokens) {
    out = out.replaceAll(`{{${t}}}`, samples[t] ?? `[${t}]`)
  }
  return out
}

export function TemplateEditor({
  def,
  initial,
  onClose,
  onSave,
}: {
  def: TemplateDef
  initial: TemplateContent | null
  onClose: () => void
  onSave: (content: TemplateContent) => Promise<{ ok: boolean; error?: string }>
}) {
  const start = initial ?? def.default
  const [subject, setSubject] = useState(start.subject)
  const [body, setBody] = useState(start.body)
  const [view, setView] = useState<"edit" | "preview">("edit")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dirty = subject !== start.subject || body !== start.body

  async function handleSave() {
    if (!subject.trim()) { setError("A subject line is required"); return }
    setSaving(true)
    setError(null)
    const res = await onSave({ subject: subject.trim(), body })
    setSaving(false)
    if (!res.ok) { setError(res.error ?? "Could not save template"); return }
    onClose()
  }

  function insertToken(token: string) {
    setBody((b) => `${b}{{${token}}}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Edit template — {def.name}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Customise the subject and body. Tokens are replaced with real values when sent.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-5 pt-3 shrink-0">
          {([["edit", "Editor", Code2], ["preview", "Preview", Eye]] as const).map(([v, label, Icon]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold transition-colors",
                view === v ? "bg-[#EFF6FF] text-[#2563EB]" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {view === "edit" ? (
            <>
              <div className="space-y-1.5">
                <label className="text-[12.5px] font-semibold text-slate-700">Subject line</label>
                <input
                  value={subject}
                  onChange={(e) => { setSubject(e.target.value); setError(null) }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:border-[#2563EB] transition-all"
                  placeholder="e.g. Your invoice {{invoice_number}} is ready"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[12.5px] font-semibold text-slate-700">Body</label>
                <textarea
                  value={body}
                  onChange={(e) => { setBody(e.target.value); setError(null) }}
                  rows={10}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:border-[#2563EB] transition-all resize-none font-mono leading-relaxed"
                  placeholder="Hi {{tenant_name}},&#10;&#10;…"
                />
              </div>
              {def.tokens.length > 0 && (
                <div className="space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                  <p className="text-[12px] font-semibold text-slate-700">Insert a variable</p>
                  <p className="text-[11px] text-slate-400 -mt-0.5">Click a chip to append it where it&apos;s needed — it&apos;s replaced with real data when sent.</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {def.tokens.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => insertToken(t)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 bg-white text-[11px] font-mono text-slate-600 hover:border-[#2563EB] hover:text-[#2563EB] transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            // Email-style device frame preview
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 border-b border-slate-200">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="ml-2 text-[11px] font-medium text-slate-400">New message · preview</span>
              </div>
              <div className="px-5 py-3.5 bg-white border-b border-slate-100">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Subject</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{renderPreview(subject, def.tokens) || "(no subject)"}</p>
              </div>
              <div className="px-5 py-5 bg-white">
                <p className="text-[13px] text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {renderPreview(body, def.tokens) || "(empty body)"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 shrink-0 space-y-2">
          {error && <p className="text-[12px] text-red-600">{error}</p>}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !dirty}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving…" : "Save template"}
            </button>
            <button
              onClick={() => { setSubject(def.default.subject); setBody(def.default.body); setError(null) }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
