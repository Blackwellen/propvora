"use client"

/**
 * Relocated from src/app/(app)/app/workspace-settings/email/TemplateEditor.tsx
 * Canonical location: src/features/workspace-settings/components/sections/EmailTemplateEditor.tsx
 */

import React, { useState } from "react"
import DOMPurify from "isomorphic-dompurify"
import { X } from "lucide-react"

export interface TemplateDef {
  id: string
  name: string
  subject: string
  body: string
  tokens: string[]
  sampleValues: Record<string, string>
}

export interface TemplateContent {
  subject: string
  body: string
}

export interface EmailTemplateEditorProps {
  def: TemplateDef
  initial: TemplateContent | null
  onClose: () => void
  onSave: (content: TemplateContent) => void
}

function renderPreview(template: string, sampleValues: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, token) => sampleValues[token] ?? `{{${token}}}`)
}

export function EmailTemplateEditor({ def, initial, onClose, onSave }: EmailTemplateEditorProps) {
  const [tab, setTab] = useState<"editor" | "preview">("editor")
  const [subject, setSubject] = useState(initial?.subject ?? def.subject)
  const [body, setBody] = useState(initial?.body ?? def.body)

  function insertToken(token: string) {
    setBody((b) => b + `{{${token}}}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-[15px] font-bold text-slate-900">{def.name}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-slate-100 px-6">
          {(["editor", "preview"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-[13px] font-medium transition-colors border-b-2 -mb-px ${
                tab === t
                  ? "border-[#2563EB] text-[#2563EB]"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {t === "editor" ? "Editor" : "Preview"}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === "editor" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">Subject line</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
                />
              </div>
              <div>
                <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">Body</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={10}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all resize-none font-mono"
                />
              </div>
              {def.tokens.length > 0 && (
                <div>
                  <p className="text-[12px] font-semibold text-slate-500 mb-2">Available tokens</p>
                  <div className="flex flex-wrap gap-2">
                    {def.tokens.map((token) => (
                      <button
                        key={token}
                        type="button"
                        onClick={() => insertToken(token)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-[11.5px] font-mono text-slate-600 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                      >
                        {`{{${token}}}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                <p className="text-[12px] font-semibold text-slate-500">
                  Subject: {renderPreview(subject, def.sampleValues)}
                </p>
              </div>
              <div
                className="p-5 text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderPreview(body, def.sampleValues).replace(/\n/g, "<br />")) }}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => onSave({ subject, body })}
            className="px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] transition-colors"
          >
            Save template
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
